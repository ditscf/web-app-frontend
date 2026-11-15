'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FellowshipIdField } from '@/components/ministries/fellowship-id-field';
import { Button } from '@/components/ui/button';
import { getUserFacingMessage, toApiError, type ApiErrorKind } from '@/lib/api/errors';
import {
  appointEventCommittee,
  type EventRole,
} from '@/lib/api/events';
import { getLookupActionBlocker, lookupMember } from '@/lib/api/members';
import { FELLOWSHIP_ID_LENGTH, fellowshipIdSchema } from '@/lib/validation';

const ROLE_LABELS: Record<EventRole, string> = {
  EVENT_CHAIRMAN: 'Event Chairman',
  EVENT_TREASURER: 'Event Treasurer',
  EVENT_SECRETARY: 'Event Secretary',
};

const FIELD_ERROR_KINDS: readonly ApiErrorKind[] = [
  'validation',
  'not_found',
  'conflict',
];

interface AppointCommitteeDialogProps {
  eventId: string;
  eventName: string;
  role: EventRole | null;
  currentHolder: {
    firstName: string;
    lastName: string;
    fellowshipId: string;
  } | null;
  onClose: () => void;
  onAppointed: () => void | Promise<void>;
}

export function AppointCommitteeDialog({
  eventId,
  eventName,
  role,
  currentHolder,
  onClose,
  onAppointed,
}: AppointCommitteeDialogProps) {
  const [stage, setStage] = useState<
    | { stage: 'enter' }
    | {
        stage: 'confirm';
        member: { fellowshipId: string; firstName: string; lastName: string };
      }
  >({ stage: 'enter' });
  const [fellowshipId, setFellowshipId] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isAppointing, setIsAppointing] = useState(false);
  const isBusy = isLookingUp || isAppointing;

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && !isBusy) {
      setStage({ stage: 'enter' });
      setFellowshipId('');
      setFieldError(null);
      onClose();
    }
  }

  async function handleEnterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!role) return;
    const parsed = fellowshipIdSchema.safeParse(fellowshipId);
    if (!parsed.success) {
      setFieldError(
        parsed.error.issues[0]?.message ??
          `A Fellowship ID has ${FELLOWSHIP_ID_LENGTH} digits.`,
      );
      return;
    }

    setIsLookingUp(true);
    try {
      const member = await lookupMember(parsed.data);
      const blocker = getLookupActionBlocker(member, 'appointEvent');
      if (blocker) {
        setFieldError(blocker);
        return;
      }
      setStage({
        stage: 'confirm',
        member: {
          fellowshipId: member.fellowshipId,
          firstName: member.firstName,
          lastName: member.lastName,
        },
      });
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (FIELD_ERROR_KINDS.includes(apiError.kind)) {
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

  async function handleConfirm() {
    if (!role || stage.stage !== 'confirm' || isAppointing) return;
    setIsAppointing(true);
    try {
      const appointment = await appointEventCommittee(
        eventId,
        role,
        stage.member.fellowshipId,
      );
      toast.success(
        `${appointment.holder.firstName} ${appointment.holder.lastName} is now ${ROLE_LABELS[role]}`,
      );
      setStage({ stage: 'enter' });
      setFellowshipId('');
      await onAppointed();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (FIELD_ERROR_KINDS.includes(apiError.kind)) {
        setFieldError(apiError.message);
        setStage({ stage: 'enter' });
        return;
      }
      toast.error("We couldn't appoint that committee role", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsAppointing(false);
    }
  }

  return (
    <AlertDialog open={role !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>
          {role ? ROLE_LABELS[role] : 'Committee'}
        </AlertDialogTitle>
        <AlertDialogDescription>
          Appoint an Active Member for {eventName}
          {currentHolder
            ? `. This replaces ${currentHolder.firstName} ${currentHolder.lastName}.`
            : '.'}
        </AlertDialogDescription>

        {stage.stage === 'enter' ? (
          <form className="grid gap-4" onSubmit={handleEnterSubmit}>
            <FellowshipIdField
              id="committee-fellowship-id"
              value={fellowshipId}
              onValueChange={(value) => {
                setFellowshipId(value);
                setFieldError(null);
              }}
              error={fieldError}
              disabled={isBusy}
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
              <Button type="submit" disabled={isBusy}>
                {isLookingUp ? 'Looking up…' : 'Continue'}
              </Button>
            </AlertDialogFooter>
          </form>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm">
              Appoint{' '}
              <strong>
                {stage.member.firstName} {stage.member.lastName}
              </strong>{' '}
              ({stage.member.fellowshipId}) as {role ? ROLE_LABELS[role] : ''}?
            </p>
            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => setStage({ stage: 'enter' })}
              >
                Back
              </Button>
              <Button type="button" disabled={isBusy} onClick={() => void handleConfirm()}>
                {isAppointing ? 'Appointing…' : 'Confirm'}
              </Button>
            </AlertDialogFooter>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
