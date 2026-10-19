'use client';

import { ArrowLeft, Crown, UserPlus, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
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
import {
  getUserFacingMessage,
  toApiError,
  type ApiErrorKind,
} from '@/lib/api/errors';
import { getLookupActionBlocker, lookupMember } from '@/lib/api/members';
import {
  addMinistryMember,
  listMinistryLeaders,
  listMinistryMembers,
  removeMinistryMember,
  type MinistryMembers as MinistryMembersData,
  type MinistryPerson,
} from '@/lib/api/ministries';
import {
  canLookupMember,
  canManageMinistryMembers,
  canOverseeMinistryMembers,
} from '@/lib/auth/access';
import { FELLOWSHIP_ID_LENGTH, fellowshipIdSchema } from '@/lib/validation';
import { cn } from '@/lib/utils';

type MembersState =
  | { status: 'loading' }
  | {
      status: 'ready';
      data: MinistryMembersData;
      leader: MinistryPerson | null;
    }
  | { status: 'forbidden'; message: string }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

type PendingAction =
  | {
      type: 'add';
      member: { fellowshipId: string; firstName: string; lastName: string };
    }
  | { type: 'remove'; member: MinistryPerson };

const MINISTRIES_PATH = '/dashboard/ministries';
const ADD_INPUT_ID = 'add-member-fellowship-id';
const ADD_FIELD_ERROR_KINDS: readonly ApiErrorKind[] = [
  'validation',
  'not_found',
  'conflict',
];
const LIST_CHANGED_KINDS: readonly ApiErrorKind[] = [
  'forbidden',
  'not_found',
  'conflict',
];

const sinceFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

function getFullName(
  person: Pick<MinistryPerson, 'firstName' | 'lastName'>,
): string {
  return `${person.firstName} ${person.lastName}`;
}

function formatMemberCount(count: number): string {
  return count === 1 ? '1 member' : `${count} members`;
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className={cn('relative overflow-hidden p-5', dashboardCardClassName)}>
      <div
        className="pointer-events-none absolute inset-0 bg-brand-radial opacity-30"
        aria-hidden
      />
      <div className="relative flex gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center bg-primary/15 text-primary">
          <Icon size={20} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 truncate text-lg font-bold text-foreground">{value}</p>
          {hint ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function MemberCardSkeleton() {
  return (
    <Card className={cn('h-full p-5', dashboardCardClassName)}>
      <div className="mb-3 h-0.5 w-10 animate-pulse bg-muted" />
      <div className="h-5 w-2/3 animate-pulse bg-muted" />
      <div className="mt-3 h-4 w-full animate-pulse bg-muted" />
    </Card>
  );
}

export function MinistryMembers({ ministryId }: { ministryId: string }) {
  const actor = useCurrentActor();
  const canManage = canManageMinistryMembers(actor, ministryId);
  const isYearClosedForManagers =
    canOverseeMinistryMembers(actor, ministryId) &&
    actor.operativeYear?.status === 'CLOSED';
  const [membersState, setMembersState] = useState<MembersState>({
    status: 'loading',
  });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [fellowshipId, setFellowshipId] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    let isActive = true;

    Promise.all([listMinistryMembers(ministryId), listMinistryLeaders()])
      .then(([data, leaders]) => {
        if (!isActive) return;
        const leader =
          leaders.ministries.find((item) => item.ministry.id === ministryId)
            ?.leader ?? null;
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
        if (apiError.kind === 'not_found' || apiError.kind === 'validation') {
          setMembersState({ status: 'not_found' });
          return;
        }
        setMembersState({
          status: 'error',
          message: getUserFacingMessage(error),
        });
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
      setAddError(
        parsed.error.issues[0]?.message ??
          `A Fellowship ID has ${FELLOWSHIP_ID_LENGTH} digits.`,
      );
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
        member: {
          fellowshipId: member.fellowshipId,
          firstName: member.firstName,
          lastName: member.lastName,
        },
      });
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (ADD_FIELD_ERROR_KINDS.includes(apiError.kind)) {
        setAddError(apiError.message);
        return;
      }
      toast.error("We couldn't confirm that Fellowship ID", {
        description: getUserFacingMessage(error),
      });
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
        const { ministry, member } = await addMinistryMember(
          ministryId,
          pendingAction.member.fellowshipId,
        );
        setFellowshipId('');
        toast.success(`${getFullName(member)} is now in ${ministry.name}`, {
          description: `Fellowship ID ${member.fellowshipId}`,
        });
      } else {
        const { ministry, member } = await removeMinistryMember(
          ministryId,
          pendingAction.member.fellowshipId,
        );
        toast.success(
          `${getFullName(member)} is no longer in ${ministry.name}`,
        );
      }
      reloadMembers();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (
        pendingAction.type === 'add' &&
        ADD_FIELD_ERROR_KINDS.includes(apiError.kind)
      ) {
        setAddError(apiError.message);
        return;
      }
      toast.error(
        pendingAction.type === 'add'
          ? "We couldn't add the member"
          : "We couldn't remove the member",
        { description: getUserFacingMessage(error) },
      );
      if (LIST_CHANGED_KINDS.includes(apiError.kind)) reloadMembers();
    } finally {
      setIsWorking(false);
      setPendingAction(null);
    }
  }

  if (membersState.status === 'forbidden')
    return <NoAccess message={membersState.message} />;

  const ministryName =
    membersState.status === 'ready' ? membersState.data.ministry.name : null;
  const memberCount =
    membersState.status === 'ready' ? membersState.data.members.length : 0;
  const leader =
    membersState.status === 'ready' ? membersState.leader : null;

  return (
    <DashboardPage>
      <header className="relative isolate overflow-hidden border border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0 bg-brand-radial opacity-50"
          aria-hidden
        />
        <div className="relative border-b border-primary/25 bg-linear-to-r from-primary/12 via-primary/5 to-transparent px-6 py-8 sm:px-8">
          <Link
            href={MINISTRIES_PATH}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft size={16} aria-hidden />
            Ministries
          </Link>
          <p className="mt-4 text-xs font-semibold tracking-widest text-primary uppercase">
            Members
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {ministryName ?? 'Ministry members'}
          </h1>
          {membersState.status === 'ready' ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {formatMemberCount(memberCount)} in this ministry
              {leader ? (
                <>
                  {' '}
                  · Led by{' '}
                  <span className="font-semibold text-foreground">
                    {getFullName(leader)}
                  </span>
                </>
              ) : (
                <> · No leader appointed yet</>
              )}
              .
            </p>
          ) : null}
          {membersState.status === 'ready' && isYearClosedForManagers ? (
            <p className="mt-2 text-sm text-muted-foreground">
              The fellowship year is closed, so members can&apos;t be added or
              removed.
            </p>
          ) : null}
        </div>
      </header>

      {membersState.status === 'ready' ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <SummaryStat
            icon={UsersRound}
            label="Members"
            value={String(memberCount)}
            hint={formatMemberCount(memberCount)}
          />
          <SummaryStat
            icon={Crown}
            label="Ministry leader"
            value={leader ? getFullName(leader) : 'Vacant'}
            hint={
              leader
                ? `${leader.fellowshipId} · since ${sinceFormat.format(new Date(leader.since))}`
                : 'Appoint from the ministries list'
            }
          />
        </div>
      ) : null}

      {membersState.status === 'loading' ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status">
          {Array.from({ length: 3 }).map((_, index) => (
            <MemberCardSkeleton key={index} />
          ))}
          <span className="sr-only">Loading members…</span>
        </div>
      ) : null}

      {membersState.status === 'not_found' ? (
        <Card className={cn('relative overflow-hidden p-6', dashboardCardClassName)}>
          <div
            className="pointer-events-none absolute inset-0 bg-brand-radial opacity-20"
            aria-hidden
          />
          <div className="relative">
            <p className="font-bold text-foreground">
              We couldn&apos;t find that ministry.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a ministry from the list.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href={MINISTRIES_PATH}>Back to ministries</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {membersState.status === 'error' ? (
        <Card
          role="alert"
          className={cn('relative overflow-hidden p-6', dashboardCardClassName)}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-brand-radial opacity-20"
            aria-hidden
          />
          <div className="relative">
            <p className="font-bold text-foreground">
              We couldn&apos;t load the members.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {membersState.message}
            </p>
            <Button type="button" size="sm" className="mt-4" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        </Card>
      ) : null}

      {membersState.status === 'ready' &&
      canManage &&
      canLookupMember(actor) &&
      !isYearClosedForManagers ? (
        <Card className={cn('relative overflow-hidden p-6', dashboardCardClassName)}>
          <div
            className="pointer-events-none absolute inset-0 bg-brand-radial opacity-25"
            aria-hidden
          />
          <div className="relative">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center bg-primary/15 text-primary">
                <UserPlus size={20} aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Add a member</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The member must be an Active Member who has finished onboarding.
                </p>
              </div>
            </div>
            <form
              noValidate
              onSubmit={handleAddSubmit}
              className="mt-5 flex flex-wrap items-start gap-3 border-t border-border pt-5"
            >
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
              <Button
                type="submit"
                className="sm:mt-7"
                disabled={isWorking || isLookingUp}
              >
                {isLookingUp ? 'Checking...' : 'Add member'}
              </Button>
            </form>
          </div>
        </Card>
      ) : null}

      {membersState.status === 'ready' ? (
        <section aria-labelledby="members-grid-heading">
          <div className="mb-4">
            <h2 id="members-grid-heading" className="text-lg font-bold text-foreground">
              Roster
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everyone currently serving in {ministryName}.
            </p>
          </div>

          {membersState.data.members.length === 0 ? (
            <Card className={cn('p-6', dashboardCardClassName)}>
              <p className="text-muted-foreground">
                No one is in this ministry yet. When you add members, they will
                appear here.
              </p>
            </Card>
          ) : (
            <ul className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {membersState.data.members.map((member) => {
                const isLeader =
                  member.personId === membersState.leader?.personId;
                return (
                  <li key={member.personId}>
                    <Card
                      className={cn(
                        'flex h-full flex-col p-5 transition-colors',
                        dashboardCardClassName,
                        isLeader
                          ? 'border-primary/35 bg-primary/5'
                          : 'hover:border-primary/30 hover:bg-primary/5',
                      )}
                    >
                      <div className="mb-3 h-0.5 w-10 bg-primary" aria-hidden />
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-bold text-foreground">
                          {getFullName(member)}
                        </p>
                        {isLeader ? (
                          <span className="shrink-0 bg-primary px-2 py-0.5 text-[0.625rem] font-semibold tracking-widest text-primary-foreground uppercase">
                            Leader
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {member.fellowshipId} · since{' '}
                        {sinceFormat.format(new Date(member.since))}
                      </p>
                      {canManage && !isLeader && !isYearClosedForManagers ? (
                        <div className="mt-4 border-t border-border pt-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="normal-case tracking-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={isWorking}
                            onClick={() =>
                              setPendingAction({ type: 'remove', member })
                            }
                          >
                            Remove from ministry
                          </Button>
                        </div>
                      ) : null}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={handleDialogOpenChange}
      >
        <AlertDialogContent>
          {pendingAction?.type === 'add' ? (
            <>
              <AlertDialogTitle>
                Add this member to {ministryName}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Add{' '}
                <strong className="font-bold text-foreground">
                  {getFullName(pendingAction.member)}
                </strong>{' '}
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
                Their membership of {ministryName} ends now. They can be added
                again later.
              </AlertDialogDescription>
            </>
          ) : null}
          {pendingAction ? (
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                size="sm"
                className={
                  pendingAction.type === 'remove'
                    ? 'bg-red-600 hover:bg-red-700'
                    : undefined
                }
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
    </DashboardPage>
  );
}
