'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardCardClassName } from '@/components/dashboard/dashboard-page';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import {
  listSessionAttendance,
  markSessionAttendance,
  unmarkSessionAttendance,
  type EventSessionView,
  type SessionAttendance,
} from '@/lib/api/events';

interface SessionAttendanceRollProps {
  eventId: string;
  session: EventSessionView;
  canMutate: boolean;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}

export function SessionAttendanceRoll({
  eventId,
  session,
  canMutate,
  onClose,
  onChanged,
}: SessionAttendanceRollProps) {
  const [roll, setRoll] = useState<SessionAttendance | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await listSessionAttendance(eventId, session.id);
      setRoll(data);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      setLoadError(getUserFacingMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [eventId, session.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleToggle(person: SessionAttendance['participants'][number]) {
    if (!canMutate || pendingId) return;
    setPendingId(person.personId);
    try {
      if (person.present) {
        await unmarkSessionAttendance(eventId, session.id, person.fellowshipId);
        toast.success(`${person.firstName} ${person.lastName} unmarked`);
      } else {
        await markSessionAttendance(eventId, session.id, person.fellowshipId);
        toast.success(`${person.firstName} ${person.lastName} marked present`);
      }
      await reload();
      await onChanged();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't update attendance", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className={dashboardCardClassName}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="font-semibold tracking-normal normal-case">
            {session.name} · {session.heldOn}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {roll
              ? `${roll.presentCount} present of ${roll.participants.length} participants`
              : 'Attendance roll'}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close roll
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground" role="status">
            Loading attendance…
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

        {roll && roll.participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add participants to this event before marking attendance.
          </p>
        ) : null}

        {roll && roll.participants.length > 0 ? (
          <ul className="divide-y divide-border">
            {roll.participants.map((person) => (
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
                    {person.present ? ' · Present' : ''}
                  </p>
                </div>
                {canMutate ? (
                  <Button
                    type="button"
                    variant={person.present ? 'outline' : 'default'}
                    size="sm"
                    disabled={pendingId === person.personId}
                    onClick={() => void handleToggle(person)}
                  >
                    {pendingId === person.personId
                      ? 'Saving…'
                      : person.present
                        ? 'Unmark'
                        : 'Mark present'}
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {person.present ? 'Present' : 'Not marked'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
