'use client';

import { CalendarDays, Crown, UserRound, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useCurrentActor,
  useRefreshCurrentActor,
} from '@/components/auth/current-actor-provider';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
import { NoAccess } from '@/components/dashboard/no-access';
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
      <header className="relative isolate overflow-hidden border border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0 bg-brand-radial opacity-50"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-primary/25 bg-linear-to-r from-primary/12 via-primary/5 to-transparent px-6 py-8 sm:px-8">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              Ministries
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Fellowship ministries
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          </div>
          {operativeYear ? (
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 text-xs font-semibold tracking-wide uppercase',
                yearIsOpen
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {YEAR_STATUS_LABELS[operativeYear.status]}
            </span>
          ) : null}
        </div>
      </header>

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
              We couldn&apos;t load the ministries.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {leadersState.message}
            </p>
            <Button type="button" size="sm" className="mt-4" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        </Card>
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
                <CalendarDays size={16} className="text-primary" aria-hidden />
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
                        'relative flex h-full flex-col overflow-hidden p-5 transition-colors',
                        dashboardCardClassName,
                        !hasLeader && yearIsOpen
                          ? 'border-primary/30 bg-primary/5'
                          : 'hover:border-primary/30 hover:bg-primary/5',
                      )}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 bg-brand-radial opacity-0 transition-opacity hover:opacity-20"
                        aria-hidden
                      />
                      <div className="relative flex flex-1 flex-col">
                        <div className="mb-3 h-0.5 w-10 bg-primary" aria-hidden />
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-foreground">
                            {canOpenMembers ? (
                              <Link
                                href={`/dashboard/ministries/${item.ministry.id}`}
                                className="hover:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {item.ministry.name}
                              </Link>
                            ) : (
                              item.ministry.name
                            )}
                          </h3>
                          {!hasLeader && yearIsOpen ? (
                            <span className="shrink-0 bg-primary/15 px-2 py-0.5 text-[0.625rem] font-semibold tracking-widest text-primary uppercase">
                              Vacant
                            </span>
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
                              className="normal-case tracking-normal text-primary hover:bg-primary/10 hover:text-primary"
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
            <Card className={cn('p-6', dashboardCardClassName)}>
              <p className="text-muted-foreground">
                No ministries are listed right now. When a fellowship year opens,
                ministry leadership will appear here.
              </p>
            </Card>
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
