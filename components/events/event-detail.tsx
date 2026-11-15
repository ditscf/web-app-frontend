'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  useCurrentActor,
  useRefreshCurrentActor,
} from '@/components/auth/current-actor-provider';
import { ErrorState, LoadingState } from '@/components/dashboard/async-state';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
import { NoAccess } from '@/components/dashboard/no-access';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge, type StatusTone } from '@/components/dashboard/status-badge';
import { AppointCommitteeDialog } from '@/components/events/appoint-committee-dialog';
import { EventSessions } from '@/components/events/event-sessions';
import { FellowshipIdField } from '@/components/ministries/fellowship-id-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import {
  addEventParticipant,
  archiveEvent,
  closeEvent,
  listEventParticipants,
  listEvents,
  lookupEventParticipant,
  removeEventParticipant,
  updateEvent,
  type EventParticipantLookup,
  type EventParticipants,
  type EventRole,
  type EventSummary,
} from '@/lib/api/events';
import {
  canAppointEventCommittee,
  canCloseEvent,
  canCorrectOrArchiveEvent,
  canManageEventAttendance,
  canOperateEvent,
  canViewEvents,
} from '@/lib/auth/access';
import { FELLOWSHIP_ID_LENGTH, fellowshipIdSchema } from '@/lib/validation';

const EVENT_ROLE_LABELS: Record<EventRole, string> = {
  EVENT_CHAIRMAN: 'Event Chairman',
  EVENT_TREASURER: 'Event Treasurer',
  EVENT_SECRETARY: 'Event Secretary',
};

const COMMITTEE_ROLES: EventRole[] = [
  'EVENT_CHAIRMAN',
  'EVENT_TREASURER',
  'EVENT_SECRETARY',
];

interface EventDetailProps {
  eventId: string;
}

function eventStatusTone(status: EventSummary['status']): StatusTone {
  if (status === 'ACTIVE') return 'success';
  if (status === 'CLOSED') return 'warning';
  return 'neutral';
}

export function EventDetail({ eventId }: EventDetailProps) {
  const actor = useCurrentActor();
  const refreshActor = useRefreshCurrentActor();
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [participants, setParticipants] = useState<EventParticipants | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appointRole, setAppointRole] = useState<EventRole | null>(null);
  const [fellowshipId, setFellowshipId] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirmCandidate, setConfirmCandidate] = useState<EventParticipantLookup | null>(
    null,
  );
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    fellowshipId: string;
    name: string;
  } | null>(null);
  const [venueDraft, setVenueDraft] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const canView = canViewEvents(actor);
  const canOperate = canOperateEvent(actor, eventId);
  const canCorrect = canCorrectOrArchiveEvent(actor);
  const canAppoint = canAppointEventCommittee(actor);
  const canClose = canCloseEvent(actor, eventId);

  const canMutateParticipants = useMemo(() => {
    if (!summary) return false;
    if (summary.status === 'ACTIVE') return canOperate;
    if (summary.status === 'CLOSED') return canCorrect;
    return false;
  }, [summary, canOperate, canCorrect]);

  const canMutateAttendance = useMemo(() => {
    if (!summary) return false;
    if (summary.status === 'ACTIVE') return canManageEventAttendance(actor, eventId);
    if (summary.status === 'CLOSED') return canCorrect;
    return false;
  }, [summary, actor, eventId, canCorrect]);

  const canEditDetails = canMutateParticipants;

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [list, participantList] = await Promise.all([
        listEvents(),
        listEventParticipants(eventId),
      ]);
      const found = list.events.find((item) => item.id === eventId) ?? null;
      if (!found) {
        setIsForbidden(true);
        return;
      }
      setSummary(found);
      setParticipants(participantList);
      setNameDraft(found.name);
      setVenueDraft(found.venue ?? '');
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (apiError.kind === 'forbidden') {
        setIsForbidden(true);
        return;
      }
      setLoadError(getUserFacingMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!canView) return;
    void reload();
  }, [canView, reload]);

  async function handleLookupParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = fellowshipIdSchema.safeParse(fellowshipId);
    if (!parsed.success) {
      setFieldError(
        parsed.error.issues[0]?.message ??
          `A Fellowship ID has ${FELLOWSHIP_ID_LENGTH} digits.`,
      );
      return;
    }

    setIsLookingUp(true);
    setFieldError(null);
    try {
      const lookedUp = await lookupEventParticipant(eventId, parsed.data);
      setConfirmCandidate(lookedUp);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (
        apiError.kind === 'validation' ||
        apiError.kind === 'not_found' ||
        apiError.kind === 'conflict'
      ) {
        setFieldError(apiError.message);
        return;
      }
      toast.error("We couldn't confirm that Fellowship ID", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleConfirmAdd() {
    if (!confirmCandidate || isAdding) return;
    setIsAdding(true);
    try {
      await addEventParticipant(eventId, confirmCandidate.fellowshipId);
      toast.success(
        `${confirmCandidate.firstName} ${confirmCandidate.lastName} joined the event`,
      );
      setConfirmCandidate(null);
      setFellowshipId('');
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (
        apiError.kind === 'validation' ||
        apiError.kind === 'not_found' ||
        apiError.kind === 'conflict'
      ) {
        setFieldError(apiError.message);
        setConfirmCandidate(null);
        return;
      }
      toast.error("We couldn't add that participant", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    try {
      await removeEventParticipant(eventId, removeTarget.fellowshipId);
      toast.success(`${removeTarget.name} was removed`);
      setRemoveTarget(null);
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't remove that participant", {
        description: getUserFacingMessage(error),
      });
    }
  }

  async function handleSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!summary) return;
    const name = nameDraft.trim();
    if (!name) {
      toast.error('Enter the event name.');
      return;
    }
    setIsSavingDetails(true);
    try {
      await updateEvent(eventId, {
        name,
        venue: venueDraft.trim() === '' ? null : venueDraft.trim(),
      });
      toast.success('Event details saved');
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't save the event", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function handleClose() {
    try {
      await closeEvent(eventId);
      toast.success('Event closed');
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't close the event", {
        description: getUserFacingMessage(error),
      });
    }
  }

  async function handleArchive() {
    try {
      await archiveEvent(eventId);
      toast.success('Event archived');
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't archive the event", {
        description: getUserFacingMessage(error),
      });
    }
  }

  if (!canView || isForbidden) return <NoAccess />;

  if (isLoading) {
    return (
      <DashboardPage>
        <LoadingState label="Loading event" />
      </DashboardPage>
    );
  }

  if (loadError || !summary || !participants) {
    return (
      <DashboardPage>
        <ErrorState message={loadError ?? 'Event not found.'} onRetry={() => void reload()} />
      </DashboardPage>
    );
  }

  const holderByRole = new Map(
    summary.committee.map((member) => [member.role, member]),
  );

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Event"
        title={summary.name}
        description={
          <>
            <Link href="/dashboard/events" className="font-semibold text-accent hover:underline">
              Back to events
            </Link>
            <span className="mt-2 block">{summary.venue ?? 'Venue not set'}</span>
          </>
        }
        actions={
          <>
            <StatusBadge tone={eventStatusTone(summary.status)}>
              {summary.status === 'ACTIVE'
                ? 'Active'
                : summary.status === 'CLOSED'
                  ? 'Closed'
                  : 'Archived'}
            </StatusBadge>
            {canClose && summary.status === 'ACTIVE' ? (
              <Button type="button" variant="outline" onClick={() => void handleClose()}>
                Close event
              </Button>
            ) : null}
            {canCorrect && summary.status === 'CLOSED' ? (
              <Button type="button" onClick={() => void handleArchive()}>
                Archive event
              </Button>
            ) : null}
          </>
        }
      />

      {canEditDetails ? (
        <Card className={dashboardCardClassName}>
          <CardHeader>
            <CardTitle className="font-semibold tracking-normal normal-case">Event details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid max-w-xl gap-4" onSubmit={handleSaveDetails}>
              <div className="grid gap-2">
                <Label htmlFor="detail-name">Name</Label>
                <Input
                  id="detail-name"
                  value={nameDraft}
                  onChange={(change) => setNameDraft(change.target.value)}
                  disabled={isSavingDetails}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="detail-venue">Venue</Label>
                <Input
                  id="detail-venue"
                  value={venueDraft}
                  onChange={(change) => setVenueDraft(change.target.value)}
                  disabled={isSavingDetails}
                />
              </div>
              <Button type="submit" disabled={isSavingDetails} className="w-fit">
                {isSavingDetails ? 'Saving…' : 'Save details'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className={dashboardCardClassName}>
        <CardHeader>
          <CardTitle className="font-semibold tracking-normal normal-case">Committee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {COMMITTEE_ROLES.map((role) => {
            const holder = holderByRole.get(role);
            return (
              <div
                key={role}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{EVENT_ROLE_LABELS[role]}</p>
                  <p className="text-sm text-muted-foreground">
                    {holder
                      ? `${holder.firstName} ${holder.lastName} · ${holder.fellowshipId}`
                      : 'Not appointed'}
                  </p>
                </div>
                {canAppoint && summary.status === 'ACTIVE' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAppointRole(role)}
                  >
                    {holder ? 'Replace' : 'Appoint'}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <EventSessions
        eventId={eventId}
        eventStatus={summary.status}
        canMutate={canMutateAttendance}
      />

      <Card className={dashboardCardClassName}>
        <CardHeader>
          <CardTitle className="font-semibold tracking-normal normal-case">Participants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {canMutateParticipants ? (
            <form className="grid max-w-md gap-3" onSubmit={handleLookupParticipant}>
              <FellowshipIdField
                id="event-participant-fellowship-id"
                value={fellowshipId}
                onValueChange={(value) => {
                  setFellowshipId(value);
                  setFieldError(null);
                }}
                error={fieldError}
                disabled={isLookingUp || isAdding}
              />
              <Button type="submit" disabled={isLookingUp || isAdding} className="w-fit">
                {isLookingUp ? 'Looking up…' : 'Continue'}
              </Button>
            </form>
          ) : null}

          {participants.participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No participants yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {participants.participants.map((person) => (
                <li
                  key={person.personId}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {person.firstName} {person.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {person.fellowshipId} · {person.membershipStatus}
                    </p>
                  </div>
                  {canMutateParticipants ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setRemoveTarget({
                          fellowshipId: person.fellowshipId,
                          name: `${person.firstName} ${person.lastName}`,
                        })
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AppointCommitteeDialog
        eventId={eventId}
        eventName={summary.name}
        role={appointRole}
        currentHolder={
          appointRole ? (holderByRole.get(appointRole) ?? null) : null
        }
        onClose={() => setAppointRole(null)}
        onAppointed={async () => {
          setAppointRole(null);
          await refreshActor();
          await reload();
        }}
      />

      <AlertDialog
        open={confirmCandidate !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isAdding) setConfirmCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Add participant?</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmCandidate
              ? `Add ${confirmCandidate.firstName} ${confirmCandidate.lastName} (${confirmCandidate.fellowshipId}, ${confirmCandidate.membershipStatus}) to this event?`
              : null}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAdding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isAdding}
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                void handleConfirmAdd();
              }}
            >
              {isAdding ? 'Adding…' : 'Add'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Remove participant?</AlertDialogTitle>
          <AlertDialogDescription>
            {removeTarget
              ? `${removeTarget.name} will leave this event.`
              : null}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRemoveConfirm()}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPage>
  );
}
