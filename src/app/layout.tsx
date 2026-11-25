import type { Metadata } from 'next';
import { MotionProvider } from '@/components/MotionPrimitives';
import {
  Inter,
  Geist,
  IBM_Plex_Mono,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
  Space_Grotesk,
  DM_Sans,
  Newsreader,
  Syne,
  Outfit,
} from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://gridwise-studio-2026.web.app'
  ),
  title: {
    default: 'GridWise — Modern Timetable UI Studio',
    template: '%s | GridWise',
  },
  description:
    'Enter your subjects and weekly timings, preview 12 handcrafted preset templates, resolve overlaps, and export print-ready PNG, PDF, .ICS, and daily poster schedules.',
  keywords: [
    'timetable generator',
    'class schedule maker',
    'weekly timetable builder',
    'student schedule planner',
    'AI timetable import',
    'GridWise',
  ],
  openGraph: {
    type: 'website',
    siteName: 'GridWise',
    title: 'GridWise — Modern Timetable UI Studio',
    description:
      'Build conflict-free weekly timetables with 12 architectural themes, AI schedule import, and instant PNG, PDF, and .ICS exports.',
    images: [{ url: '/gridwise-oauth-logo.png', width: 120, height: 120, alt: 'GridWise Logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'GridWise — Modern Timetable UI Studio',
    description:
      'Build conflict-free weekly timetables with 12 architectural themes, AI import, and instant PNG, PDF, and .ICS exports.',
    images: ['/gridwise-oauth-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geist.variable} ${ibmPlexMono.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${dmSans.variable} ${newsreader.variable} ${syne.variable} ${outfit.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-[#09090B] text-zinc-100 font-sans selection:bg-white/15 selection:text-white">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
