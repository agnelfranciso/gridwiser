'use client';

import { useEffect, useRef } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { upsertUserProfile } from '@/lib/firestore-timetables';

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface PromptMomentNotification {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    itp_support?: boolean;
    use_fedcm_for_prompt?: boolean;
    context?: 'signin' | 'signup' | 'use';
  }) => void;
  prompt: (momentListener?: (notification: PromptMomentNotification) => void) => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

interface GoogleOneTapProps {
  disabled?: boolean;
  context?: 'signin' | 'signup' | 'use';
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}

const GSI_SCRIPT_ID = 'google-identity-services-client';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let initializedClientId: string | null = null;
let promptInFlight = false;

export function GoogleOneTap({
  disabled = false,
  context = 'signin',
  onSuccess,
  onError,
}: GoogleOneTapProps) {
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    if (disabled || !clientId || typeof window === 'undefined') {
      return;
    }

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return;
    }

    let cancelled = false;
    let promptTimer: ReturnType<typeof setTimeout> | null = null;

    const schedulePrompt = () => {
      if (cancelled || auth.currentUser || promptInFlight) return;
      if (promptTimer) clearTimeout(promptTimer);

      // Defer slightly so React StrictMode mount/unmount cycles or rapid state
      // transitions do not start and immediately abort a FedCM credential request.
      promptTimer = setTimeout(() => {
        if (cancelled || auth.currentUser || promptInFlight) return;
        const gsi = window.google?.accounts?.id;
        if (!gsi) return;

        try {
          if (initializedClientId !== clientId) {
            gsi.initialize({
              client_id: clientId,
              auto_select: true,
              cancel_on_tap_outside: false,
              itp_support: true,
              use_fedcm_for_prompt: true,
              context,
              callback: async (response: GoogleCredentialResponse) => {
                promptInFlight = false;
                if (!response.credential) return;
                try {
                  const credential = GoogleAuthProvider.credential(response.credential);
                  const result = await signInWithCredential(auth, credential);
                  if (result.user) {
                    await upsertUserProfile(result.user);
                  }
                  onSuccessRef.current?.();
                } catch (err) {
                  onErrorRef.current?.(err);
                }
              },
            });
            initializedClientId = clientId;
          }

          promptInFlight = true;
          gsi.prompt((notification) => {
            if (
              notification.isNotDisplayed?.() ||
              notification.isSkippedMoment?.() ||
              notification.isDismissedMoment?.()
            ) {
              promptInFlight = false;
            }
          });
        } catch {
          promptInFlight = false;
        }
      }, 200);
    };

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (promptTimer) {
          clearTimeout(promptTimer);
          promptTimer = null;
        }
        return;
      }

      if (window.google?.accounts?.id) {
        schedulePrompt();
        return;
      }

      let script = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = GSI_SCRIPT_ID;
        script.src = GSI_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      script.addEventListener('load', schedulePrompt);
    });

    return () => {
      cancelled = true;
      if (promptTimer) {
        clearTimeout(promptTimer);
        promptTimer = null;
      }
      unsubAuth();
      const script = document.getElementById(GSI_SCRIPT_ID);
      script?.removeEventListener('load', schedulePrompt);
    };
  }, [context, disabled]);

  return null;
}
