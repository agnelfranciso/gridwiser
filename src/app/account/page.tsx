import type { Metadata } from 'next';
import { AccountSettingsPage } from '@/components/AccountSettingsPage';

export const metadata: Metadata = {
  title: 'Account Settings – GridWise',
  description: 'Manage your GridWise profile, export saved schedules, or delete your data and account.',
};

export default function AccountRoute() {
  return <AccountSettingsPage />;
}
