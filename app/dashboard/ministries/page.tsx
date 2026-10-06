import type { Metadata } from 'next';
import { MinistriesOverview } from '@/components/ministries/ministries-overview';

export const metadata: Metadata = {
  title: 'Ministries | DITSCF',
};

export default function MinistriesPage() {
  return <MinistriesOverview />;
}
