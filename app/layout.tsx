import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
