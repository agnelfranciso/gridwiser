import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignInPage } from '@/components/SignInPage';

export const metadata: Metadata = {
  title: 'Sign In – GridWise',
  description: 'Sign in with your Google account to access your saved timetables.',
};

export default function SignInRoute() {
  return (
    <Suspense>
      <SignInPage />
    </Suspense>
  );
}
