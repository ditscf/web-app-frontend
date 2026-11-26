'use client';

import { CalendarDays, IdCard, Sparkles } from 'lucide-react';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { EmptyState } from '@/components/dashboard/async-state';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
import { NeedsAttention } from '@/components/dashboard/needs-attention';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Card } from '@/components/ui/card';
import type { ActorProfile } from '@/lib/api/auth';
import {
  EVENT_ROLE_LABELS,
  EVENT_STATUS_LABELS,
  FELLOWSHIP_OFFICE_LABELS,
  YEAR_STATUS_LABELS,
} from '@/lib/auth/responsibility-labels';
import type { ResponsibilityItem } from '@/interfaces/interface';
import { cn } from '@/lib/utils';

function toResponsibilityItems({
  operativeYear,
  responsibilities,
}: ActorProfile): ResponsibilityItem[] {
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

function SummaryStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof IdCard;
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

export function HomeOverview() {
  const actor = useCurrentActor();
  const { operativeYear } = actor;
  const responsibilityItems = toResponsibilityItems(actor);
  const yearIsOpen = operativeYear?.status === 'OPEN';

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Home"
        title={`Welcome back, ${actor.firstName}`}
        description={
          operativeYear ? (
            <>
              Your fellowship overview for{' '}
              <span className="font-semibold text-foreground">{operativeYear.label}</span>.
            </>
          ) : (
            'Your fellowship overview for the current season.'
          )
        }
      />

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryStat
          icon={IdCard}
          label="Fellowship ID"
          value={actor.fellowshipId}
          hint={
            actor.membershipStatus === 'ACTIVE'
              ? 'Active member'
              : 'Associate member'
          }
        />
        <SummaryStat
          icon={CalendarDays}
          label="Fellowship year"
          value={operativeYear ? operativeYear.label : 'None open'}
          hint={
            operativeYear
              ? YEAR_STATUS_LABELS[operativeYear.status]
              : 'Check back when a year opens'
          }
        />
        <SummaryStat
          icon={Sparkles}
          label="Responsibilities"
          value={
            responsibilityItems.length > 0
              ? String(responsibilityItems.length)
              : 'None'
          }
          hint={
            responsibilityItems.length === 0
              ? 'No appointed roles yet'
              : responsibilityItems.length === 1
                ? '1 active role this year'
                : `${responsibilityItems.length} active roles this year`
          }
        />
      </div>

      <NeedsAttention />

      <section aria-labelledby="responsibilities-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="responsibilities-heading"
              className="text-lg font-bold text-foreground"
            >
              Your responsibilities
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Offices, ministry leadership, and event roles for this year.
            </p>
          </div>
          {operativeYear ? (
            <StatusBadge tone={yearIsOpen ? 'success' : 'warning'}>
              {YEAR_STATUS_LABELS[operativeYear.status]}
            </StatusBadge>
          ) : null}
        </div>

        {responsibilityItems.length > 0 ? (
          <ul className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {responsibilityItems.map((item) => (
              <li key={item.key}>
                <Card className={cn('h-full p-5', dashboardCardClassName)}>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No responsibilities this year"
            description="When you are appointed to a role, it will show up here."
          />
        )}
      </section>
    </DashboardPage>
  );
}
