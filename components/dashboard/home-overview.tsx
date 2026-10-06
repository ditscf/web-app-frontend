'use client';

import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { NeedsAttention } from '@/components/dashboard/needs-attention';
import { Card } from '@/components/ui/card';
import type { ActorProfile } from '@/lib/api/auth';
import {
  EVENT_ROLE_LABELS,
  EVENT_STATUS_LABELS,
  FELLOWSHIP_OFFICE_LABELS,
  YEAR_STATUS_LABELS,
} from '@/lib/auth/responsibility-labels';
import type { ResponsibilityItem } from '@/interfaces/interface';


function toResponsibilityItems({ operativeYear, responsibilities }: ActorProfile): ResponsibilityItem[] {
  if (!operativeYear) return [];

  const officeItems = responsibilities.offices.map((office) => ({
    key: `office-${office}`,
    title: FELLOWSHIP_OFFICE_LABELS[office],
    detail: `Fellowship office, ${operativeYear.label}`,
  }));

  const { ministryLeadership } = responsibilities;
  const ministryItems = ministryLeadership
    ? [
        {
          key: `ministry-${ministryLeadership.ministry.id}`,
          title: 'Ministry Leader',
          detail: ministryLeadership.ministry.name,
        },
      ]
    : [];

  const eventItems = responsibilities.eventRoles.map(({ role, event }) => ({
    key: `event-${event.id}`,
    title: EVENT_ROLE_LABELS[role],
    detail: `${event.name} (${EVENT_STATUS_LABELS[event.status]})`,
  }));

  return [...officeItems, ...ministryItems, ...eventItems];
}

export function HomeOverview() {
  const actor = useCurrentActor();
  const { operativeYear } = actor;
  const responsibilityItems = toResponsibilityItems(actor);

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <header>
        <h1 className="text-3xl font-black text-navy">Welcome, {actor.firstName}</h1>
        <p className="mt-1 text-slate-600">
          Fellowship ID <span className="font-semibold text-navy">{actor.fellowshipId}</span>
        </p>
      </header>

      <NeedsAttention />

      <Card className="rounded-2xl p-6 shadow-none">
        <h2 className="text-lg font-black text-navy">Fellowship year</h2>
        {operativeYear ? (
          <p className="mt-2 text-slate-700">
            {operativeYear.label}, {YEAR_STATUS_LABELS[operativeYear.status].toLowerCase()}
          </p>
        ) : (
          <p className="mt-2 text-slate-600">No fellowship year is open right now.</p>
        )}
      </Card>

      <Card className="rounded-2xl p-6 shadow-none">
        <h2 className="text-lg font-black text-navy">Your responsibilities</h2>
        {responsibilityItems.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-200">
            {responsibilityItems.map((item) => (
              <li key={item.key} className="py-3">
                <p className="font-semibold text-navy">{item.title}</p>
                <p className="text-sm text-slate-600">{item.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-slate-600">You don&apos;t hold any responsibilities this year.</p>
        )}
      </Card>
    </div>
  );
}
