'use client';

import { CalendarDays, Crown, UserRound, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useCurrentActor,
  useRefreshCurrentActor,
} from '@/components/auth/current-actor-provider';
import { EmptyState, ErrorState } from '@/components/dashboard/async-state';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
import { NoAccess } from '@/components/dashboard/no-access';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { AppointLeaderDialog } from '@/components/ministries/appoint-leader-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import {
  listMinistryLeaders,
  listOwnMinistries,
  type LeaderAppointment,
  type MinistryLeaders,
  type MinistryWithLeader,
} from '@/lib/api/ministries';
import {
  canAppointMinistryLeaders,
  canViewMinistryLeaders,
  canViewMinistryMembers,
} from '@/lib/auth/access';
import { YEAR_STATUS_LABELS } from '@/lib/auth/responsibility-labels';
import { cn } from '@/lib/utils';

type LeadersState =
  | { status: 'loading' }
  | { status: 'ready'; data: MinistryLeaders }
  | { status: 'forbidden'; message: string }
  | { status: 'error'; message: string };

const sinceFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

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
    <Card className={cn('p-5', dashboardCardClassName)}>
      <div className="flex gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center bg-accent/10 text-accent">
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

function MinistryCardSkeleton() {
  return (
    <Card className={cn('h-full p-5', dashboardCardClassName)}>
      <div className="mb-3 h-0.5 w-10 animate-pulse bg-muted" />
      <div className="h-5 w-2/3 animate-pulse bg-muted" />
      <div className="mt-3 h-4 w-full animate-pulse bg-muted" />
      <div className="mt-2 h-4 w-4/5 animate-pulse bg-muted" />
    </Card>
  );
}

function getAppointedMessage({
  ministry,
  leader,
  replaced,
  joinedMinistry,
}: LeaderAppointment) {
  const details = [
    replaced
      ? `They replace ${replaced.firstName} ${replaced.lastName}, who stays a member.`
      : null,
    joinedMinistry ? `They are now also a member of ${ministry.name}.` : null,
  ].filter((detail) => detail !== null);

  return {
    title: `${leader.firstName} ${leader.lastName} now leads ${ministry.name}`,
    description: details.length > 0 ? details.join(' ') : undefined,
  };
}

export function MinistriesOverview() {
  const actor = useCurrentActor();
  const refreshActor = useRefreshCurrentActor();
  const isAllowed = canViewMinistryLeaders(actor);
  const canAppoint = canAppointMinistryLeaders(actor);
  const leadsAMinistry = actor.responsibilities.ministryLeadership !== null;
  const ministriesGridHint = canAppoint
    ? 'Open a ministry you oversee to manage members, or appoint a leader where needed.'
    : leadsAMinistry
      ? 'Open your ministry to manage members and see who serves with you.'
      : 'See who leads each ministry this fellowship year.';
  const [leadersState, setLeadersState] = useState<LeadersState>({
    status: 'loading',
  });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [ownMinistryIds, setOwnMinistryIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [appointTarget, setAppointTarget] = useState<MinistryWithLeader | null>(
    null,
  );

  useEffect(() => {
    if (!isAllowed) return;
    let isActive = true;

    listOwnMinistries()
      .then(({ ministries }) => {
        if (isActive)
          setOwnMinistryIds(
            new Set(ministries.map((item) => item.ministry.id)),
          );
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        if (toApiError(error).kind === 'unauthenticated') return;
        setOwnMinistryIds(new Set());
      });

    listMinistryLeaders()
      .then((data) => {
        if (isActive) setLeadersState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const apiError = toApiError(error);
        if (apiError.kind === 'unauthenticated') return;
        if (apiError.kind === 'forbidden') {
          setLeadersState({ status: 'forbidden', message: apiError.message });
          return;
        }
        setLeadersState({
          status: 'error',
          message: getUserFacingMessage(error),
        });
      });

    return () => {
      isActive = false;
    };
  }, [isAllowed, loadAttempt]);

  const ministries =
    leadersState.status === 'ready' ? leadersState.data.ministries : [];
  const operativeYear =
    leadersState.status === 'ready' ? leadersState.data.operativeYear : null;
  const yearIsOpen = operativeYear?.status === 'OPEN';

  const leaderCounts = useMemo(() => {
    const withLeader = ministries.filter((item) => item.leader !== null).length;
    return {
      total: ministries.length,
      withLeader,
      withoutLeader: ministries.length - withLeader,
    };
  }, [ministries]);

  function reloadLeaders() {
    setLoadAttempt((attempt) => attempt + 1);
  }

  function handleRetry() {
    setLeadersState({ status: 'loading' });
    reloadLeaders();
  }

  function handleAppointed(appointment: LeaderAppointment) {
    setAppointTarget(null);
    const { title, description } = getAppointedMessage(appointment);
    toast.success(title, { description });
    reloadLeaders();

    if (appointment.leader.personId !== actor.personId) return;
    refreshActor().catch((error: unknown) => {
      if (toApiError(error).kind === 'unauthenticated') return;
      toast.info(
        'Reload the page to see your new responsibility across the dashboard.',
      );
    });
  }

  function handleRefused() {
    setAppointTarget(null);
    reloadLeaders();
  }

  if (!isAllowed) return <NoAccess />;
  if (leadersState.status === 'forbidden')
    return <NoAccess message={leadersState.message} />;

  const subtitle =
    leadersState.status !== 'ready'
      ? 'The fellowship ministries and their leaders.'
      : operativeYear
        ? `Ministry leaders for ${operativeYear.label}.`
        : 'No fellowship year is open, so no ministry leaders are listed.';

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Ministries"
        title="Fellowship ministries"
        description={subtitle}
        actions={
          operativeYear ? (
            <StatusBadge tone={yearIsOpen ? 'success' : 'warning'}>
              {YEAR_STATUS_LABELS[operativeYear.status]}
            </StatusBadge>
          ) : null
        }
      />

      {leadersState.status === 'ready' && ministries.length > 0 ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryStat
            icon={UsersRound}
            label="Ministries"
            value={String(leaderCounts.total)}
            hint="Teams across the fellowship"
          />
          <SummaryStat
            icon={Crown}
            label="With a leader"
            value={String(leaderCounts.withLeader)}
            hint={
              leaderCounts.withLeader === 1
                ? '1 ministry is led this year'
                : `${leaderCounts.withLeader} ministries are led this year`
            }
          />
          <SummaryStat
            icon={UserRound}
            label="Needs a leader"
            value={String(leaderCounts.withoutLeader)}
            hint={
              yearIsOpen
                ? 'Appoint when the year is open'
                : 'Appointments resume when the year opens'
            }
          />
        </div>
      ) : null}

      {leadersState.status === 'loading' ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status">
          {Array.from({ length: 6 }).map((_, index) => (
            <MinistryCardSkeleton key={index} />
          ))}
          <span className="sr-only">Loading ministries…</span>
        </div>
      ) : null}

      {leadersState.status === 'error' ? (
        <ErrorState message={leadersState.message} onRetry={handleRetry} />
      ) : null}

      {leadersState.status === 'ready' ? (
        <section aria-labelledby="ministries-grid-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="ministries-grid-heading"
                className="text-lg font-bold text-foreground"
              >
                All ministries
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{ministriesGridHint}</p>
            </div>
            {operativeYear ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays size={16} className="text-accent" aria-hidden />
                <span>{operativeYear.label}</span>
              </p>
            ) : null}
          </div>

          {ministries.length > 0 ? (
            <ul className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ministries.map((item) => {
                const canOpenMembers = canViewMinistryMembers(
                  actor,
                  item.ministry.id,
                  ownMinistryIds,
                );
                const hasLeader = item.leader !== null;

                return (
                  <li key={item.ministry.id}>
                    <Card
                      className={cn(
                        'flex h-full flex-col p-5',
                        dashboardCardClassName,
                        !hasLeader && yearIsOpen && 'border-warning/40',
                      )}
                    >
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-foreground">
                            {canOpenMembers ? (
                              <Link
                                href={`/dashboard/ministries/${item.ministry.id}`}
                                className="hover:text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                              >
                                {item.ministry.name}
                              </Link>
                            ) : (
                              item.ministry.name
                            )}
                          </h3>
                          {!hasLeader && yearIsOpen ? (
                            <StatusBadge tone="warning">Vacant</StatusBadge>
                          ) : null}
                        </div>

                        {hasLeader && item.leader ? (
                          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                            <p>
                              Led by{' '}
                              <span className="font-semibold text-foreground">
                                {item.leader.firstName} {item.leader.lastName}
                              </span>
                            </p>
                            <p>
                              {item.leader.fellowshipId} · since{' '}
                              {sinceFormat.format(new Date(item.leader.since))}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">
                            No leader appointed for this year yet.
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
                          {canOpenMembers ? (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="normal-case tracking-normal"
                            >
                              <Link href={`/dashboard/ministries/${item.ministry.id}`}>
                                View members
                              </Link>
                            </Button>
                          ) : null}
                          {canAppoint && operativeYear && yearIsOpen ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="tracking-normal text-accent normal-case hover:bg-accent/10 hover:text-accent"
                              onClick={() => setAppointTarget(item)}
                            >
                              {hasLeader ? 'Replace leader' : 'Appoint leader'}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title="No ministries listed"
              description="When a fellowship year opens, ministry leadership will appear here."
            />
          )}
        </section>
      ) : null}

      <AppointLeaderDialog
        key={appointTarget?.ministry.id ?? 'closed'}
        target={appointTarget}
        yearLabel={operativeYear?.label ?? ''}
        onClose={() => setAppointTarget(null)}
        onAppointed={handleAppointed}
        onRefused={handleRefused}
      />
    </DashboardPage>
  );
}
