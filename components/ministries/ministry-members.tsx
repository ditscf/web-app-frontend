'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { NoAccess } from '@/components/dashboard/no-access';
import { FellowshipIdField } from '@/components/ministries/fellowship-id-field';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getUserFacingMessage, toApiError, type ApiErrorKind } from '@/lib/api/errors';
import { getLookupActionBlocker, lookupMember } from '@/lib/api/members';
import {
  addMinistryMember,
  listMinistryLeaders,
  listMinistryMembers,
  removeMinistryMember,
  type MinistryMembers as MinistryMembersData,
  type MinistryPerson,
} from '@/lib/api/ministries';
import { canLookupMember, canManageMinistryMembers, canOverseeMinistryMembers } from '@/lib/auth/access';
import { FELLOWSHIP_ID_LENGTH, fellowshipIdSchema } from '@/lib/validation';

type MembersState =
  | { status: 'loading' }
  | { status: 'ready'; data: MinistryMembersData; leader: MinistryPerson | null }
  | { status: 'forbidden'; message: string }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

type PendingAction =
  | { type: 'add'; member: { fellowshipId: string; firstName: string; lastName: string } }
  | { type: 'remove'; member: MinistryPerson };

const MINISTRIES_PATH = '/dashboard/ministries';
const ADD_INPUT_ID = 'add-member-fellowship-id';
/** Refusals about the person entered: shown under the field so the ID can be corrected. */
const ADD_FIELD_ERROR_KINDS: readonly ApiErrorKind[] = ['validation', 'not_found', 'conflict'];
/** The list changed or the action is no longer allowed, so reload it. */
const LIST_CHANGED_KINDS: readonly ApiErrorKind[] = ['forbidden', 'not_found', 'conflict'];

const sinceFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

function getFullName(person: Pick<MinistryPerson, 'firstName' | 'lastName'>): string {
  return `${person.firstName} ${person.lastName}`;
}

function formatMemberCount(count: number): string {
  return count === 1 ? '1 member' : `${count} members`;
}

export function MinistryMembers({ ministryId }: { ministryId: string }) {
  const actor = useCurrentActor();
  const canManage = canManageMinistryMembers(actor, ministryId);
  const isYearClosedForManagers =
    canOverseeMinistryMembers(actor, ministryId) && actor.operativeYear?.status === 'CLOSED';
  const [membersState, setMembersState] = useState<MembersState>({ status: 'loading' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [fellowshipId, setFellowshipId] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    let isActive = true;

    Promise.all([listMinistryMembers(ministryId), listMinistryLeaders()])
      .then(([data, leaders]) => {
        if (!isActive) return;
        const leader = leaders.ministries.find((item) => item.ministry.id === ministryId)?.leader ?? null;
        setMembersState({ status: 'ready', data, leader });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const apiError = toApiError(error);
        if (apiError.kind === 'unauthenticated') return;
        if (apiError.kind === 'forbidden') {
          setMembersState({ status: 'forbidden', message: apiError.message });
          return;
        }
        // An id that isn't a UUID is refused with 400, which is the same as an unknown ministry here.
        if (apiError.kind === 'not_found' || apiError.kind === 'validation') {
          setMembersState({ status: 'not_found' });
          return;
        }
        setMembersState({ status: 'error', message: getUserFacingMessage(error) });
      });

    return () => {
      isActive = false;
    };
  }, [ministryId, loadAttempt]);

  function reloadMembers() {
    setLoadAttempt((attempt) => attempt + 1);
  }

  function handleRetry() {
    setMembersState({ status: 'loading' });
    reloadMembers();
  }

  function handleDialogOpenChange(isOpen: boolean) {
    if (!isOpen && !isWorking) setPendingAction(null);
  }

  async function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = fellowshipIdSchema.safeParse(fellowshipId);
    if (!parsed.success) {
      setAddError(parsed.error.issues[0]?.message ?? `A Fellowship ID has ${FELLOWSHIP_ID_LENGTH} digits.`);
      return;
    }

    setIsLookingUp(true);
    try {
      const member = await lookupMember(parsed.data);
      const blocker = getLookupActionBlocker(member, 'add');
      if (blocker) {
        setAddError(blocker);
        return;
      }
      setPendingAction({
        type: 'add',
        member: { fellowshipId: member.fellowshipId, firstName: member.firstName, lastName: member.lastName },
      });
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (ADD_FIELD_ERROR_KINDS.includes(apiError.kind)) {
        setAddError(apiError.message);
        return;
      }
      toast.error("We couldn't confirm that Fellowship ID", { description: getUserFacingMessage(error) });
      if (apiError.kind === 'forbidden') reloadMembers();
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleConfirm() {
    if (!pendingAction || isWorking) return;

    setIsWorking(true);
    try {
      if (pendingAction.type === 'add') {
        const { ministry, member } = await addMinistryMember(ministryId, pendingAction.member.fellowshipId);
        setFellowshipId('');
        toast.success(`${getFullName(member)} is now in ${ministry.name}`, {
          description: `Fellowship ID ${member.fellowshipId}`,
        });
      } else {
        const { ministry, member } = await removeMinistryMember(ministryId, pendingAction.member.fellowshipId);
        toast.success(`${getFullName(member)} is no longer in ${ministry.name}`);
      }
      reloadMembers();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (pendingAction.type === 'add' && ADD_FIELD_ERROR_KINDS.includes(apiError.kind)) {
        setAddError(apiError.message);
        return;
      }
      toast.error(
        pendingAction.type === 'add' ? "We couldn't add the member" : "We couldn't remove the member",
        { description: getUserFacingMessage(error) },
      );
      if (LIST_CHANGED_KINDS.includes(apiError.kind)) reloadMembers();
    } finally {
      setIsWorking(false);
      setPendingAction(null);
    }
  }

  if (membersState.status === 'forbidden') return <NoAccess message={membersState.message} />;

  const ministryName = membersState.status === 'ready' ? membersState.data.ministry.name : null;

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <header>
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-royal">
          <Link href={MINISTRIES_PATH}>
            <ArrowLeft size={16} aria-hidden="true" /> Ministries
          </Link>
        </Button>
        <h1 className="mt-2 text-3xl font-black text-navy">{ministryName ?? 'Ministry members'}</h1>
        {membersState.status === 'ready' ? (
          <p className="mt-1 text-slate-600">
            {formatMemberCount(membersState.data.members.length)} ·{' '}
            {membersState.leader ? (
              <>
                Led by <span className="font-semibold text-navy">{getFullName(membersState.leader)}</span>
              </>
            ) : (
              'No leader yet'
            )}
          </p>
        ) : null}
        {membersState.status === 'ready' && isYearClosedForManagers ? (
          <p className="mt-1 text-sm text-slate-600">
            The fellowship year is closed, so members can&apos;t be added or removed.
          </p>
        ) : null}
      </header>

      {membersState.status === 'loading' ? (
        <p role="status" className="text-sm font-semibold text-slate-600">
          Loading members...
        </p>
      ) : null}

      {membersState.status === 'not_found' ? (
        <Card className="rounded-2xl p-6 shadow-none">
          <p className="font-bold text-navy">We couldn&apos;t find that ministry.</p>
          <p className="mt-1 text-sm text-slate-600">Choose a ministry from the list.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href={MINISTRIES_PATH}>Back to ministries</Link>
          </Button>
        </Card>
      ) : null}

      {membersState.status === 'error' ? (
        <Card role="alert" className="rounded-2xl p-6 shadow-none">
          <p className="font-bold text-navy">We couldn&apos;t load the members.</p>
          <p className="mt-1 text-sm text-slate-600">{membersState.message}</p>
          <Button type="button" size="sm" className="mt-4" onClick={handleRetry}>
            Try again
          </Button>
        </Card>
      ) : null}

      {membersState.status === 'ready' && canManage && canLookupMember(actor) ? (
        <Card className="rounded-2xl p-6 shadow-none">
          <h2 className="text-lg font-black text-navy">Add a member</h2>
          <p className="mt-1 text-sm text-slate-600">
            The member must be an Active Member who has finished onboarding.
          </p>
          <form noValidate onSubmit={handleAddSubmit} className="mt-4 flex flex-wrap items-start gap-3">
            <div className="min-w-48 flex-1">
              <FellowshipIdField
                id={ADD_INPUT_ID}
                value={fellowshipId}
                error={addError}
                disabled={isWorking || isLookingUp}
                onValueChange={(value) => {
                  setFellowshipId(value);
                  if (addError) setAddError(null);
                }}
              />
            </div>
            <Button type="submit" className="sm:mt-7" disabled={isWorking || isLookingUp}>
              {isLookingUp ? 'Checking...' : 'Add member'}
            </Button>
          </form>
        </Card>
      ) : null}

      {membersState.status === 'ready' ? (
        <Card className="rounded-2xl px-6 py-2 shadow-none">
          {membersState.data.members.length === 0 ? (
            <p className="py-4 text-slate-600">No one is in this ministry yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {membersState.data.members.map((member) => {
                const isLeader = member.personId === membersState.leader?.personId;
                return (
                  <li key={member.personId} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="font-bold text-navy">
                        {getFullName(member)}
                        {isLeader ? <span className="ml-2 text-sm font-semibold text-royal">Leader</span> : null}
                      </p>
                      <p className="text-sm text-slate-600">
                        {member.fellowshipId} · since {sinceFormat.format(new Date(member.since))}
                      </p>
                    </div>
                    {canManage && !isLeader ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={isWorking}
                        onClick={() => setPendingAction({ type: 'remove', member })}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ) : null}

      <AlertDialog open={pendingAction !== null} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent>
          {pendingAction?.type === 'add' ? (
            <>
              <AlertDialogTitle>Add this member to {ministryName}?</AlertDialogTitle>
              <AlertDialogDescription>
                Add{' '}
                <strong className="font-bold text-navy">
                  {getFullName(pendingAction.member)}</strong>{' '}
                ({pendingAction.member.fellowshipId}) to {ministryName}? Check
                the ID carefully.
              </AlertDialogDescription>
            </>
          ) : null}
          {pendingAction?.type === 'remove' ? (
            <>
              <AlertDialogTitle>
                Remove {getFullName(pendingAction.member)} from {ministryName}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Their membership of {ministryName} ends now. They can be added again later.
              </AlertDialogDescription>
            </>
          ) : null}
          {pendingAction ? (
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                size="sm"
                className={pendingAction.type === 'remove' ? 'bg-red-600 hover:bg-red-700' : undefined}
                onClick={handleConfirm}
                disabled={isWorking}
              >
                {pendingAction.type === 'add'
                  ? isWorking
                    ? 'Adding...'
                    : 'Add member'
                  : isWorking
                    ? 'Removing...'
                    : 'Remove member'}
              </Button>
            </AlertDialogFooter>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
