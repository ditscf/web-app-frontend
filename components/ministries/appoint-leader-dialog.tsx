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
import { getLookupActionBlocker, lookupMember } from '@/lib/api/members';
import { appointMinistryLeader, type LeaderAppointment, type MinistryWithLeader } from '@/lib/api/ministries';
import { FELLOWSHIP_ID_LENGTH, fellowshipIdSchema } from '@/lib/validation';

type DialogStage =
  | { stage: 'enter' }
  | { stage: 'confirm'; member: { fellowshipId: string; firstName: string; lastName: string } };

const FELLOWSHIP_ID_INPUT_ID = 'leader-fellowship-id';
/** Refusals about the person entered: shown under the field so the Chairman can correct the ID. */
const FIELD_ERROR_KINDS: readonly ApiErrorKind[] = ['validation', 'not_found', 'conflict'];

interface AppointLeaderDialogProps {
  target: MinistryWithLeader | null;
  yearLabel: string;
  onClose: () => void;
  onAppointed: (appointment: LeaderAppointment) => void;
  onRefused: () => void;
}

/** Render with `key` set to the target ministry so each opening starts empty. */
export function AppointLeaderDialog({ target, yearLabel, onClose, onAppointed, onRefused }: AppointLeaderDialogProps) {
  const [dialogStage, setDialogStage] = useState<DialogStage>({ stage: 'enter' });
  const [fellowshipId, setFellowshipId] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isAppointing, setIsAppointing] = useState(false);
  const currentLeader = target?.leader ?? null;
  const isBusy = isLookingUp || isAppointing;

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && !isBusy) onClose();
  }

  async function handleEnterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = fellowshipIdSchema.safeParse(fellowshipId);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? `A Fellowship ID has ${FELLOWSHIP_ID_LENGTH} digits.`);
      return;
    }

    setIsLookingUp(true);
    try {
      const member = await lookupMember(parsed.data);
      const blocker = getLookupActionBlocker(member, 'appoint');
      if (blocker) {
        setFieldError(blocker);
        return;
      }
      setDialogStage({
        stage: 'confirm',
        member: { fellowshipId: member.fellowshipId, firstName: member.firstName, lastName: member.lastName },
      });
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (FIELD_ERROR_KINDS.includes(apiError.kind)) {
        setFieldError(apiError.message);
        return;
      }
      toast.error("We couldn't confirm that Fellowship ID", { description: getUserFacingMessage(error) });
      if (apiError.kind === 'forbidden') onRefused();
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleConfirm() {
    if (!target || dialogStage.stage !== 'confirm' || isAppointing) return;

    setIsAppointing(true);
    try {
      const appointment = await appointMinistryLeader(target.ministry.id, dialogStage.member.fellowshipId);
      onAppointed(appointment);
    } catch (error) {
      const apiError = toApiError(error);
      setIsAppointing(false);
      if (apiError.kind === 'unauthenticated') return;
      if (FIELD_ERROR_KINDS.includes(apiError.kind)) {
        setFieldError(apiError.message);
        setDialogStage({ stage: 'enter' });
        return;
      }
      toast.error("We couldn't appoint the leader", { description: getUserFacingMessage(error) });
      if (apiError.kind === 'forbidden') onRefused();
    }
  }

  return (
    <AlertDialog open={target !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        {target ? (
          <>
            <AlertDialogTitle>
              {currentLeader ? `Replace the leader of ${target.ministry.name}` : `Appoint a leader for ${target.ministry.name}`}
            </AlertDialogTitle>

            {dialogStage.stage === 'enter' ? (
              <form noValidate onSubmit={handleEnterSubmit} className="grid gap-4">
                <AlertDialogDescription>
                  {currentLeader
                    ? `${currentLeader.firstName} ${currentLeader.lastName} leads ${target.ministry.name} now. The member you appoint replaces them for ${yearLabel}.`
                    : `The member you appoint leads ${target.ministry.name} for ${yearLabel}.`}
                </AlertDialogDescription>
                <FellowshipIdField
                  id={FELLOWSHIP_ID_INPUT_ID}
                  autoFocus
                  value={fellowshipId}
                  error={fieldError}
                  disabled={isLookingUp}
                  onValueChange={(value) => {
                    setFellowshipId(value);
                    if (fieldError) setFieldError(null);
                  }}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLookingUp}>Cancel</AlertDialogCancel>
                  <Button type="submit" size="sm" disabled={isLookingUp}>
                    {isLookingUp ? 'Checking...' : 'Continue'}
                  </Button>
                </AlertDialogFooter>
              </form>
            ) : (
              <>
                <AlertDialogDescription>
                  Appoint{' '}
                  <strong className="font-bold text-foreground">
                    {dialogStage.member.firstName} {dialogStage.member.lastName}
                  </strong>{' '}
                  ({dialogStage.member.fellowshipId}) as leader of {target.ministry.name} for {yearLabel}?
                  {currentLeader
                    ? ` This replaces ${currentLeader.firstName} ${currentLeader.lastName} (${currentLeader.fellowshipId}).`
                    : null}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogStage({ stage: 'enter' })}
                    disabled={isAppointing}
                  >
                    Back
                  </Button>
                  <Button type="button" size="sm" onClick={handleConfirm} disabled={isAppointing}>
                    {isAppointing ? 'Appointing...' : currentLeader ? 'Replace leader' : 'Appoint leader'}
                  </Button>
                </AlertDialogFooter>
              </>
            )}
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
