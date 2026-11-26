import type { Metadata } from 'next';
import { EventsOverview } from '@/components/events/events-overview';

export const metadata: Metadata = {
  title: 'Events | DITSCF',
};

export default function EventsPage() {
  return <EventsOverview />;
}
