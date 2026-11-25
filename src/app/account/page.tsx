import type { Metadata } from 'next';
import { AccountSettingsPage } from '@/components/AccountSettingsPage';

export const metadata: Metadata = {
  title: 'Account Settings – GridWiser',
  description: 'Manage your GridWiser profile, export saved schedules, or delete your data and account.',
};

export default function AccountRoute() {
  return <AccountSettingsPage />;
}
