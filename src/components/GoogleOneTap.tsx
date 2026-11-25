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

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    itp_support?: boolean;
    context?: 'signin' | 'signup' | 'use';
  }) => void;
  prompt: () => void;
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

    let cancelled = false;
    let prompted = false;

    const initAndPrompt = () => {
      if (cancelled || prompted || auth.currentUser) return;
      const gsi = window.google?.accounts?.id;
      if (!gsi) return;

      prompted = true;
      gsi.initialize({
        client_id: clientId,
        auto_select: true,
        cancel_on_tap_outside: false,
        itp_support: true,
        context,
        callback: async (response: GoogleCredentialResponse) => {
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
      gsi.prompt();
    };

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        window.google?.accounts?.id?.cancel();
        return;
      }

      if (window.google?.accounts?.id) {
        initAndPrompt();
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

      script.addEventListener('load', initAndPrompt);
    });

    return () => {
      cancelled = true;
      unsubAuth();
      const script = document.getElementById(GSI_SCRIPT_ID);
      script?.removeEventListener('load', initAndPrompt);
      window.google?.accounts?.id?.cancel();
    };
  }, [context, disabled]);

  return null;
}
