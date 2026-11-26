import type { Metadata } from 'next';
import { EventDetail } from '@/components/events/event-detail';

export const metadata: Metadata = {
  title: 'Event | DITSCF',
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventDetail eventId={eventId} />;
}
