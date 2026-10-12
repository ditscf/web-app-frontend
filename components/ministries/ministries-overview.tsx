'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCurrentActor, useRefreshCurrentActor } from '@/components/auth/current-actor-provider';
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
import { canAppointMinistryLeaders, canViewMinistryLeaders, canViewMinistryMembers } from '@/lib/auth/access';
import { YEAR_STATUS_LABELS } from '@/lib/auth/responsibility-labels';

type LeadersState =
  | { status: 'loading' }
  | { status: 'ready'; data: MinistryLeaders }
  | { status: 'forbidden'; message: string }
  | { status: 'error'; message: string };

const sinceFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

function getAppointedMessage({ ministry, leader, replaced, joinedMinistry }: LeaderAppointment) {
  const details = [
    replaced ? `They replace ${replaced.firstName} ${replaced.lastName}, who stays a member.` : null,
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
  const [leadersState, setLeadersState] = useState<LeadersState>({ status: 'loading' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [ownMinistryIds, setOwnMinistryIds] = useState<ReadonlySet<string>>(new Set());
  const [appointTarget, setAppointTarget] = useState<MinistryWithLeader | null>(null);

  useEffect(() => {
    if (!isAllowed) return;
    let isActive = true;

    listOwnMinistries()
      .then(({ ministries }) => {
        if (isActive) setOwnMinistryIds(new Set(ministries.map((item) => item.ministry.id)));
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
        setLeadersState({ status: 'error', message: getUserFacingMessage(error) });
      });

    return () => {
      isActive = false;
    };
  }, [isAllowed, loadAttempt]);

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
      toast.info('Reload the page to see your new responsibility across the dashboard.');
    });
  }

  function handleRefused() {
    setAppointTarget(null);
    reloadLeaders();
  }

  if (!isAllowed) return <NoAccess />;
  if (leadersState.status === 'forbidden') return <NoAccess message={leadersState.message} />;

  const operativeYear = leadersState.status === 'ready' ? leadersState.data.operativeYear : null;

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <header>
        <h1 className="text-3xl font-black text-navy">Ministries</h1>
        <p className="mt-1 text-slate-600">
          {leadersState.status !== 'ready'
            ? 'The fellowship ministries and their leaders.'
            : operativeYear
              ? `Ministry leaders for ${operativeYear.label} (${YEAR_STATUS_LABELS[operativeYear.status].toLowerCase()}).`
              : 'No fellowship year is open, so no ministry leaders are listed.'}
        </p>
      </header>

      {leadersState.status === 'loading' ? (
        <p role="status" className="text-sm font-semibold text-slate-600">
          Loading ministries...
        </p>
      ) : null}

      {leadersState.status === 'error' ? (
        <Card role="alert" className="rounded-2xl p-6 shadow-none">
          <p className="font-bold text-navy">We couldn&apos;t load the ministries.</p>
          <p className="mt-1 text-sm text-slate-600">{leadersState.message}</p>
          <Button type="button" size="sm" className="mt-4" onClick={handleRetry}>
            Try again
          </Button>
        </Card>
      ) : null}

      {leadersState.status === 'ready' ? (
        <Card className="rounded-2xl px-6 py-2 shadow-none">
          <ul className="divide-y divide-slate-200">
            {leadersState.data.ministries.map((item) => (
              <li key={item.ministry.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <h2 className="font-black text-navy">
                    {canViewMinistryMembers(actor, item.ministry.id, ownMinistryIds) ? (
                      <Link
                        href={`/dashboard/ministries/${item.ministry.id}`}
                        className="rounded-sm hover:text-royal hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold"
                      >
                        {item.ministry.name}
                      </Link>
                    ) : (
                      item.ministry.name
                    )}
                  </h2>
                  {item.leader ? (
                    <p className="text-sm text-slate-600">
                      Led by{' '}
                      <span className="font-semibold text-navy">
                        {item.leader.firstName} {item.leader.lastName}
                      </span>{' '}
                      · {item.leader.fellowshipId} · since {sinceFormat.format(new Date(item.leader.since))}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-600">No leader yet</p>
                  )}
                </div>
                {canAppoint && operativeYear ? (
                  <Button type="button" variant="ghost" size="sm" className="text-royal" onClick={() => setAppointTarget(item)}>
                    {item.leader ? 'Replace leader' : 'Appoint leader'}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <AppointLeaderDialog
        key={appointTarget?.ministry.id ?? 'closed'}
        target={appointTarget}
        yearLabel={operativeYear?.label ?? ''}
        onClose={() => setAppointTarget(null)}
        onAppointed={handleAppointed}
        onRefused={handleRefused}
      />
    </div>
  );
}
