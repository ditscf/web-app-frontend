'use client';

import { CalendarDays, IdCard, Sparkles } from 'lucide-react';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
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

export function HomeOverview() {
  const actor = useCurrentActor();
  const { operativeYear } = actor;
  const responsibilityItems = toResponsibilityItems(actor);
  const yearIsOpen = operativeYear?.status === 'OPEN';

  return (
    <DashboardPage>
      <header className="relative isolate overflow-hidden border border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0 bg-brand-radial opacity-50"
          aria-hidden
        />
        <div className="relative border-b border-primary/25 bg-linear-to-r from-primary/12 via-primary/5 to-transparent px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Home
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {actor.firstName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Your fellowship overview for{' '}
            {operativeYear ? (
              <span className="font-semibold text-foreground">{operativeYear.label}</span>
            ) : (
              'the current season'
            )}
            .
          </p>
        </div>
      </header>

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

        {responsibilityItems.length > 0 ? (
          <ul className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {responsibilityItems.map((item) => (
              <li key={item.key}>
                <Card
                  className={cn(
                    'h-full p-5 transition-colors hover:border-primary/30 hover:bg-primary/5',
                    dashboardCardClassName,
                  )}
                >
                  <div className="mb-3 h-0.5 w-10 bg-primary" aria-hidden />
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card className={cn('p-6', dashboardCardClassName)}>
            <p className="text-muted-foreground">
              You don&apos;t hold any responsibilities this year. When you&apos;re
              appointed to a role, it will show up here.
            </p>
          </Card>
        )}
      </section>
    </DashboardPage>
  );
}
