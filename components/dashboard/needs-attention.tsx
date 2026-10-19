'use client';

import {
  ChevronRight,
  ClipboardCheck,
  Hourglass,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { dashboardCardClassName } from '@/components/dashboard/dashboard-page';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  listPendingApplications,
  PENDING_APPLICATIONS_LIMIT,
} from '@/lib/api/applications';
import { listMinistryLeaders } from '@/lib/api/ministries';
import {
  canAppointMinistryLeaders,
  canReviewApplications,
  getApprovalStep,
  type ApprovalStep,
} from '@/lib/auth/access';
import { FELLOWSHIP_OFFICE_LABELS } from '@/lib/auth/responsibility-labels';
import type { ApprovalCounts } from '@/interfaces/interface';

interface AttentionItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

const APPLICATIONS_PATH = '/dashboard/applications';
const MINISTRIES_PATH = '/dashboard/ministries';

function formatCount(
  count: number,
  isAtLimit: boolean,
  waitingFor: string,
): string {
  if (count === 1 && !isAtLimit)
    return `1 application is waiting for ${waitingFor}`;
  return `${isAtLimit ? `${count}+` : count} applications are waiting for ${waitingFor}`;
}

function toAttentionItems(
  step: ApprovalStep,
  counts: ApprovalCounts,
): AttentionItem[] {
  const isGs = step === 'GENERAL_SECRETARY';
  const mine = isGs ? counts.waitingForGs : counts.waitingForVgs;
  const theirs = isGs ? counts.waitingForVgs : counts.waitingForGs;
  const otherOffice =
    FELLOWSHIP_OFFICE_LABELS[
      isGs ? 'VICE_GENERAL_SECRETARY' : 'GENERAL_SECRETARY'
    ];

  const items: AttentionItem[] = [];
  if (mine > 0) {
    items.push({
      key: 'applications-mine',
      label: formatCount(mine, counts.isAtLimit, 'your approval'),
      href: APPLICATIONS_PATH,
      icon: ClipboardCheck,
    });
  }
  if (theirs > 0) {
    items.push({
      key: 'applications-theirs',
      label: formatCount(theirs, counts.isAtLimit, `the ${otherOffice}`),
      href: APPLICATIONS_PATH,
      icon: Hourglass,
    });
  }
  return items;
}

function toLeaderlessItem(count: number): AttentionItem | null {
  if (count === 0) return null;
  return {
    key: 'ministries-without-leader',
    label:
      count === 1
        ? '1 ministry has no leader this year'
        : `${count} ministries have no leader this year`,
    href: MINISTRIES_PATH,
    icon: UsersRound,
  };
}

/**
 * Hidden when nothing needs attention. Each count loads on its own, and one that can't be loaded is
 * left out; the home page never shows an error for it.
 */
export function NeedsAttention() {
  const actor = useCurrentActor();
  const approvalStep = canReviewApplications(actor)
    ? getApprovalStep(actor)
    : null;
  const canAppointLeaders = canAppointMinistryLeaders(actor);
  const [approvalCounts, setApprovalCounts] = useState<ApprovalCounts | null>(
    null,
  );
  const [leaderlessCount, setLeaderlessCount] = useState<number | null>(null);

  useEffect(() => {
    if (!approvalStep) return;
    let isActive = true;

    listPendingApplications()
      .then((applications) => {
        if (!isActive) return;
        const waitingForVgs = applications.filter(
          (application) => application.gsApprovalRecorded,
        ).length;
        setApprovalCounts({
          waitingForGs: applications.length - waitingForVgs,
          waitingForVgs,
          isAtLimit: applications.length >= PENDING_APPLICATIONS_LIMIT,
        });
      })
      .catch(() => {
        if (isActive) setApprovalCounts(null);
      });

    return () => {
      isActive = false;
    };
  }, [approvalStep]);

  useEffect(() => {
    if (!canAppointLeaders) return;
    let isActive = true;

    listMinistryLeaders()
      .then(({ operativeYear, ministries }) => {
        if (!isActive) return;
        // Leaders can only be appointed while the year is OPEN, so the count only matters then.
        const isOpen = operativeYear?.status === 'OPEN';
        setLeaderlessCount(
          isOpen
            ? ministries.filter((item) => item.leader === null).length
            : null,
        );
      })
      .catch(() => {
        if (isActive) setLeaderlessCount(null);
      });

    return () => {
      isActive = false;
    };
  }, [canAppointLeaders]);

  const leaderlessItem =
    canAppointLeaders && leaderlessCount !== null
      ? toLeaderlessItem(leaderlessCount)
      : null;
  const items = [
    ...(approvalStep && approvalCounts
      ? toAttentionItems(approvalStep, approvalCounts)
      : []),
    ...(leaderlessItem ? [leaderlessItem] : []),
  ];
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="needs-attention-heading">
      <div className="mb-4">
        <h2 id="needs-attention-heading" className="text-lg font-bold text-foreground">
          Needs your attention
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Open an item below to review applications or ministry leadership.
        </p>
      </div>
      <ul className="grid min-w-0 gap-4 sm:grid-cols-2">
        {items.map(({ key, label, href, icon: Icon }) => (
          <li key={key}>
            <Link href={href} className="group block h-full focus-visible:outline-hidden">
              <Card
                className={cn(
                  'relative h-full overflow-hidden p-5 transition-colors group-hover:border-primary/35 group-hover:bg-primary/5 group-focus-visible:ring-2 group-focus-visible:ring-ring',
                  dashboardCardClassName,
                )}
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-brand-radial opacity-0 transition-opacity group-hover:opacity-25"
                  aria-hidden
                />
                <div className="relative flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center bg-primary/15 text-primary">
                    <Icon size={20} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="mt-1 text-xs font-semibold tracking-wide text-primary uppercase">
                      Review now
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden
                  />
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
