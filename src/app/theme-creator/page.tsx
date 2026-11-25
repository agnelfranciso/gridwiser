import type { Metadata } from 'next';
import { ThemeCreatorStudio } from '@/components/ThemeCreatorStudio';

export const metadata: Metadata = {
  title: 'Theme Creator Studio – GridWiser',
  description:
    'Design, customize, and publish your own architectural timetable themes with live canvas preview, custom color palettes, typography, and borders.',
};

export default function ThemeCreatorPage() {
  return <ThemeCreatorStudio />;
}
