import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'DITSCF | Dar es Salaam Institute of Technology Students Christian Fellowship',
  description:
    'A premium digital home for DIT Students Christian Fellowship: worship, discipleship, outreach, leadership, events, and the future DITSCF management platform.',
  keywords: [
    'DITSCF',
    'DIT Students Christian Fellowship',
    'Dar es Salaam Institute of Technology',
    'Christian fellowship',
    'Campus ministry',
  ],
  openGraph: {
    title: 'DITSCF | Growing Together in Christ',
    description:
      'Faith, fellowship, purpose, worship, outreach, leadership, and digital transformation at DIT.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
