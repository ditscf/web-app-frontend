'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { SessionAttendanceRoll } from '@/components/events/session-attendance-roll';
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
import { dashboardCardClassName } from '@/components/dashboard/dashboard-page';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import {
  createEventSession,
  listEventSessions,
  removeEventSession,
  type EventSessionView,
  type EventStatus,
} from '@/lib/api/events';

interface EventSessionsProps {
  eventId: string;
  eventStatus: EventStatus;
  canMutate: boolean;
}

export function EventSessions({
  eventId,
  eventStatus,
  canMutate,
}: EventSessionsProps) {
  const [sessions, setSessions] = useState<EventSessionView[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [heldOn, setHeldOn] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<EventSessionView | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await listEventSessions(eventId);
      setSessions(data.sessions);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      setLoadError(getUserFacingMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Enter the session name.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(heldOn)) {
      toast.error('Enter the session date as YYYY-MM-DD.');
      return;
    }

    setIsCreating(true);
    try {
      const created = await createEventSession(eventId, {
        name: trimmedName,
        heldOn,
      });
      toast.success(`${created.session.name} is ready`);
      setName('');
      setHeldOn('');
      await reload();
      setOpenSessionId(created.session.id);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't create that session", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    try {
      await removeEventSession(eventId, removeTarget.id);
      toast.success(`${removeTarget.name} was removed`);
      if (openSessionId === removeTarget.id) setOpenSessionId(null);
      setRemoveTarget(null);
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't remove that session", {
        description: getUserFacingMessage(error),
      });
    }
  }

  const openSession = sessions.find((session) => session.id === openSessionId) ?? null;

  return (
    <>
      <Card className={dashboardCardClassName}>
        <CardHeader>
          <CardTitle className="font-semibold tracking-normal normal-case">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {canMutate ? (
            <form className="grid max-w-xl gap-3 sm:grid-cols-2" onSubmit={handleCreate}>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="session-name">Session name</Label>
                <Input
                  id="session-name"
                  value={name}
                  onChange={(change) => setName(change.target.value)}
                  disabled={isCreating}
                  placeholder="Day 1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="session-held-on">Date</Label>
                <Input
                  id="session-held-on"
                  type="date"
                  value={heldOn}
                  onChange={(change) => setHeldOn(change.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating…' : 'Add session'}
                </Button>
              </div>
            </form>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-muted-foreground" role="status">
              Loading sessions…
            </p>
          ) : null}

          {loadError ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
                Try again
              </Button>
            </div>
          ) : null}

          {!isLoading && !loadError && sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {canMutate
                ? 'No sessions yet. Add the first activity for this event.'
                : 'No sessions are listed for this event yet.'}
            </p>
          ) : null}

          {sessions.length > 0 ? (
            <ul className="divide-y divide-border">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium">{session.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.heldOn} · {session.presentCount} present
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenSessionId(session.id)}
                    >
                      Open roll
                    </Button>
                    {canMutate ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRemoveTarget(session)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {eventStatus === 'ARCHIVED' ? (
            <p className="text-sm text-muted-foreground">
              This event is archived. Attendance is read-only.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {openSession ? (
        <SessionAttendanceRoll
          eventId={eventId}
          session={openSession}
          canMutate={canMutate}
          onClose={() => setOpenSessionId(null)}
          onChanged={async () => {
            await reload();
          }}
        />
      ) : null}

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Remove session?</AlertDialogTitle>
          <AlertDialogDescription>
            {removeTarget
              ? `${removeTarget.name} and its attendance marks will be deleted.`
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
    </>
  );
}
