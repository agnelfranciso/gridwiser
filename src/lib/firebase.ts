import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface AuthErrorInfo {
  title: string;
  message: string;
  code?: string;
}

export function formatFirebaseAuthError(err: unknown): AuthErrorInfo {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: string }).code)
      : '';

  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return {
        title: 'Sign-in cancelled',
        message: 'The Google sign-in popup was closed before completing. Please try again.',
        code,
      };
    case 'auth/popup-blocked':
      return {
        title: 'Popup blocked',
        message: 'Your browser blocked the Google sign-in window. Allow popups for this site and try again.',
        code,
      };
    case 'auth/unauthorized-domain': {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      return {
        title: 'Domain not authorized',
        message: `"${host}" is not in Firebase Auth Authorized Domains. Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`,
        code,
      };
    }
    case 'auth/network-request-failed':
      return {
        title: 'Network error',
        message: 'Could not reach Google authentication servers. Check your connection and try again.',
        code,
      };
    case 'auth/user-disabled':
      return {
        title: 'Account disabled',
        message: 'This Google account has been disabled in Firebase Authentication.',
        code,
      };
    case 'auth/operation-not-allowed':
      return {
        title: 'Provider disabled',
        message: 'Google Sign-In is not enabled for this Firebase project.',
        code,
      };
    case 'auth/too-many-requests':
      return {
        title: 'Too many attempts',
        message: 'Too many sign-in attempts in a short time. Please wait a moment and try again.',
        code,
      };
    default: {
      const rawMsg =
        err instanceof Error && err.message
          ? err.message
          : 'Google authentication failed. Please try again.';
      return {
        title: 'Sign-in failed',
        message: rawMsg,
        code: code || undefined,
      };
    }
  }
}
