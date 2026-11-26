'use client';

import { CalendarDays, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { EmptyState, ErrorState, LoadingState } from '@/components/dashboard/async-state';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
import { NoAccess } from '@/components/dashboard/no-access';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge, type StatusTone } from '@/components/dashboard/status-badge';
import { CreateEventDialog } from '@/components/events/create-event-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import { listEvents, type EventSummary, type EventsList } from '@/lib/api/events';
import { canCreateEvents, canViewEvents } from '@/lib/auth/access';
import { YEAR_STATUS_LABELS } from '@/lib/auth/responsibility-labels';

const EVENT_ROLE_LABELS: Record<string, string> = {
  EVENT_CHAIRMAN: 'Event Chairman',
  EVENT_TREASURER: 'Event Treasurer',
  EVENT_SECRETARY: 'Event Secretary',
};

const STATUS_LABELS: Record<EventSummary['status'], string> = {
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

const STATUS_TONES: Record<EventSummary['status'], StatusTone> = {
  ACTIVE: 'success',
  CLOSED: 'warning',
  ARCHIVED: 'neutral',
};

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: EventsList }
  | { status: 'error'; message: string }
  | { status: 'forbidden'; message: string };

export function EventsOverview() {
  const actor = useCurrentActor();
  const isAllowed = canViewEvents(actor);
  const canCreate = canCreateEvents(actor);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    listEvents()
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        const apiError = toApiError(error);
        if (apiError.kind === 'unauthenticated') return;
        if (apiError.kind === 'forbidden') {
          setState({ status: 'forbidden', message: apiError.message });
          return;
        }
        setState({ status: 'error', message: getUserFacingMessage(error) });
      });
  }, []);

  useEffect(() => {
    if (!isAllowed) return;
    reload();
  }, [isAllowed, reload]);

  if (!isAllowed) return <NoAccess />;
  if (state.status === 'forbidden') return <NoAccess message={state.message} />;

  const operativeYear = state.status === 'ready' ? state.data.operativeYear : null;
  const events = state.status === 'ready' ? state.data.events : [];
  const yearIsOpen = operativeYear?.status === 'OPEN';

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Events"
        title="Fellowship events"
        description={
          operativeYear
            ? `Events for ${operativeYear.label}.`
            : 'No fellowship year is open, so no events are listed.'
        }
        actions={
          <>
            {operativeYear ? (
              <StatusBadge tone={yearIsOpen ? 'success' : 'warning'}>
                {YEAR_STATUS_LABELS[operativeYear.status]}
              </StatusBadge>
            ) : null}
            {canCreate ? (
              <Button type="button" onClick={() => setIsCreateOpen(true)}>
                <Plus />
                Create event
              </Button>
            ) : null}
          </>
        }
      />

      {state.status === 'loading' ? <LoadingState label="Loading events" /> : null}

      {state.status === 'error' ? (
        <ErrorState message={state.message} onRetry={reload} />
      ) : null}

      {state.status === 'ready' && events.length === 0 ? (
        <EmptyState
          title="No events listed"
          description={
            operativeYear
              ? canCreate
                ? 'Create the first event for this fellowship year.'
                : 'No events are listed for this fellowship year yet.'
              : 'Events appear when a fellowship year is open or closed.'
          }
        />
      ) : null}

      {state.status === 'ready' && events.length > 0 ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} className={dashboardCardClassName}>
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg font-semibold tracking-normal normal-case">
                    <Link
                      href={`/dashboard/events/${event.id}`}
                      className="hover:underline"
                    >
                      {event.name}
                    </Link>
                  </CardTitle>
                  <StatusBadge tone={STATUS_TONES[event.status]}>
                    {STATUS_LABELS[event.status]}
                  </StatusBadge>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden />
                  {event.venue ?? 'Venue not set'}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.committee.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No committee yet</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {event.committee.map((member) => (
                      <li key={`${member.role}-${member.personId}`}>
                        <span className="font-medium">
                          {EVENT_ROLE_LABELS[member.role] ?? member.role}
                        </span>
                        {': '}
                        {member.firstName} {member.lastName}
                      </li>
                    ))}
                  </ul>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/events/${event.id}`}>
                    <CalendarDays />
                    Open event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <CreateEventDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(created) => {
          setIsCreateOpen(false);
          toast.success(`${created.event.name} is ready`);
          reload();
        }}
      />
    </DashboardPage>
  );
}
