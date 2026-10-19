'use client';

import {
  ClipboardCheck,
  Clock,
  Hourglass,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { AssistedRegistrationForm } from '@/components/applications/assisted-registration-form';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
import { NoAccess } from '@/components/dashboard/no-access';
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
  approveApplication,
  listPendingApplications,
  PENDING_APPLICATIONS_LIMIT,
  type ApprovalResult,
  type PendingApplication,
} from '@/lib/api/applications';
import {
  getUserFacingMessage,
  toApiError,
  type ApiErrorKind,
} from '@/lib/api/errors';
import {
  canRegisterAssisted,
  canReviewApplications,
  getApprovalStep,
  type ApprovalStep,
} from '@/lib/auth/access';
import { cn } from '@/lib/utils';

type ListState =
  | { status: 'loading' }
  | { status: 'ready'; applications: PendingApplication[] }
  | { status: 'forbidden'; message: string }
  | { status: 'error'; message: string };

const QUEUE_CHANGED_KINDS: readonly ApiErrorKind[] = [
  'forbidden',
  'not_found',
  'conflict',
];

const submittedFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const birthDateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

function getFullName(application: PendingApplication): string {
  return `${application.applicant.firstName} ${application.applicant.lastName}`;
}

function formatTimeLeft(expiresAt: string): string {
  const minutesLeft = Math.floor(
    (new Date(expiresAt).getTime() - Date.now()) / 60_000,
  );
  if (minutesLeft < 1) return 'Expiring now';
  if (minutesLeft < 60) return `Expires in ${minutesLeft} min`;
  return `Expires in ${Math.floor(minutesLeft / 60)} h`;
}

function getMinutesLeft(expiresAt: string): number {
  return Math.floor((new Date(expiresAt).getTime() - Date.now()) / 60_000);
}

function canApproveNow(
  application: PendingApplication,
  approvalStep: ApprovalStep,
): boolean {
  if (approvalStep === 'GENERAL_SECRETARY') {
    if (application.gsApprovalRecorded) return false;
    if (application.submissionSource === 'GS_ASSISTED') return false;
    return true;
  }
  if (application.submissionSource === 'GS_ASSISTED') return true;
  return application.gsApprovalRecorded;
}

function getApprovedMessage(
  application: PendingApplication,
  result: ApprovalResult,
): { title: string; description: string } {
  if (result.status === 'APPROVED') {
    return {
      title: `${getFullName(application)} is now a member`,
      description: `Fellowship ID ${result.fellowshipId ?? ''}. An activation email has been sent.`,
    };
  }
  return {
    title: 'Your approval is recorded',
    description: 'The Vice General Secretary approves next.',
  };
}

function getStatusLine(application: PendingApplication): string {
  if (application.submissionSource === 'GS_ASSISTED') {
    return 'Registered by the General Secretary. Waiting for the Vice General Secretary.';
  }
  return application.gsApprovalRecorded
    ? 'General Secretary has approved.'
    : 'Waiting for the General Secretary.';
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof ClipboardCheck;
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

function ApplicationCardSkeleton() {
  return (
    <Card className={cn('h-full p-6', dashboardCardClassName)}>
      <div className="mb-3 h-0.5 w-10 animate-pulse bg-muted" />
      <div className="h-6 w-1/2 animate-pulse bg-muted" />
      <div className="mt-2 h-4 w-2/3 animate-pulse bg-muted" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse bg-muted" />
        ))}
      </div>
    </Card>
  );
}

export function ApplicationsReview() {
  const actor = useCurrentActor();
  const approvalStep = getApprovalStep(actor);
  const isAllowed = canReviewApplications(actor);
  const canRegister = canRegisterAssisted(actor);
  const [listState, setListState] = useState<ListState>({ status: 'loading' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selected, setSelected] = useState<PendingApplication | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!isAllowed) return;
    let isActive = true;

    listPendingApplications()
      .then((applications) => {
        if (isActive) setListState({ status: 'ready', applications });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const apiError = toApiError(error);
        if (apiError.kind === 'unauthenticated') return;
        if (apiError.kind === 'forbidden') {
          setListState({ status: 'forbidden', message: apiError.message });
          return;
        }
        setListState({ status: 'error', message: getUserFacingMessage(error) });
      });

    return () => {
      isActive = false;
    };
  }, [isAllowed, loadAttempt]);

  const queueStats = useMemo(() => {
    if (listState.status !== 'ready' || !approvalStep) {
      return null;
    }
    const { applications } = listState;
    let readyForYou = 0;
    let waitingOnOthers = 0;
    let expiringSoon = 0;

    for (const application of applications) {
      if (canApproveNow(application, approvalStep)) {
        readyForYou += 1;
      } else {
        waitingOnOthers += 1;
      }
      if (getMinutesLeft(application.expiresAt) < 120) {
        expiringSoon += 1;
      }
    }

    return {
      total: applications.length,
      readyForYou,
      waitingOnOthers,
      expiringSoon,
      isAtLimit: applications.length >= PENDING_APPLICATIONS_LIMIT,
    };
  }, [listState, approvalStep]);

  function reloadList() {
    setLoadAttempt((attempt) => attempt + 1);
  }

  function handleRetry() {
    setListState({ status: 'loading' });
    reloadList();
  }

  function handleDialogOpenChange(isOpen: boolean) {
    if (!isOpen && !isApproving) setSelected(null);
  }

  function handleRegistered() {
    setIsRegistering(false);
    reloadList();
  }

  async function handleConfirmApproval() {
    if (!selected) return;
    const application = selected;

    setIsApproving(true);
    try {
      const result = await approveApplication(application.applicationId);
      const { title, description } = getApprovedMessage(application, result);
      toast.success(title, { description });
      reloadList();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't record your approval", {
        description: getUserFacingMessage(error),
      });
      if (QUEUE_CHANGED_KINDS.includes(apiError.kind)) reloadList();
    } finally {
      setIsApproving(false);
      setSelected(null);
    }
  }

  if (!isAllowed || !approvalStep) return <NoAccess />;
  if (listState.status === 'forbidden')
    return <NoAccess message={listState.message} />;

  const roleLabel =
    approvalStep === 'GENERAL_SECRETARY'
      ? 'General Secretary queue'
      : 'Vice General Secretary queue';

  return (
    <DashboardPage>
      <header className="relative isolate overflow-hidden border border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0 bg-brand-radial opacity-50"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-primary/25 bg-linear-to-r from-primary/12 via-primary/5 to-transparent px-6 py-8 sm:px-8">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              Applications
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Registration approvals
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {isRegistering ? (
                'Register someone who cannot submit the public form themselves.'
              ) : (
                <>
                  Self registrations need the General Secretary, then the Vice
                  General Secretary. GS-assisted applications skip straight to
                  the VGS. Each request expires{' '}
                  <span className="font-semibold text-foreground">
                    48 hours
                  </span>{' '}
                  after submission.
                </>
              )}
            </p>
            {!isRegistering ? (
              <p className="mt-2 text-sm font-semibold text-foreground">
                You are reviewing as{' '}
                <span className="text-primary">{roleLabel}</span>.
              </p>
            ) : null}
          </div>
          {canRegister && !isRegistering ? (
            <Button
              type="button"
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => setIsRegistering(true)}
            >
              <UserPlus size={16} aria-hidden />
              Register a member
            </Button>
          ) : null}
          {isRegistering ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 normal-case tracking-normal"
              onClick={() => setIsRegistering(false)}
            >
              Back to queue
            </Button>
          ) : null}
        </div>
      </header>

      {isRegistering ? (
        <AssistedRegistrationForm
          onCancel={() => setIsRegistering(false)}
          onRegistered={handleRegistered}
        />
      ) : null}

      {!isRegistering && listState.status === 'ready' && queueStats ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryStat
            icon={UsersRound}
            label="In queue"
            value={queueStats.isAtLimit ? `${queueStats.total}+` : String(queueStats.total)}
            hint={
              queueStats.isAtLimit
                ? `Showing the oldest ${PENDING_APPLICATIONS_LIMIT} applications`
                : 'Pending registrations'
            }
          />
          <SummaryStat
            icon={ClipboardCheck}
            label="Ready for you"
            value={String(queueStats.readyForYou)}
            hint={
              queueStats.readyForYou === 1
                ? '1 application needs your approval'
                : `${queueStats.readyForYou} applications need your approval`
            }
          />
          <SummaryStat
            icon={Hourglass}
            label="Waiting on others"
            value={String(queueStats.waitingOnOthers)}
            hint={
              queueStats.expiringSoon > 0
                ? `${queueStats.expiringSoon} expiring within 2 hours`
                : 'Earlier approval steps still in progress'
            }
          />
        </div>
      ) : null}

      {!isRegistering && listState.status === 'loading' ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2" role="status">
          {Array.from({ length: 4 }).map((_, index) => (
            <ApplicationCardSkeleton key={index} />
          ))}
          <span className="sr-only">Loading applications…</span>
        </div>
      ) : null}

      {!isRegistering && listState.status === 'error' ? (
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
              We couldn&apos;t load the applications.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {listState.message}
            </p>
            <Button type="button" size="sm" className="mt-4" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        </Card>
      ) : null}

      {!isRegistering &&
      listState.status === 'ready' &&
      listState.applications.length === 0 ? (
        <Card
          className={cn(
            'relative overflow-hidden p-8 text-center',
            dashboardCardClassName,
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-brand-radial opacity-35"
            aria-hidden
          />
          <div className="relative mx-auto max-w-md">
            <div className="mx-auto flex size-12 items-center justify-center bg-primary/15 text-primary">
              <ClipboardCheck size={24} aria-hidden />
            </div>
            <p className="mt-4 text-lg font-bold text-foreground">
              Queue is clear
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              No applications are waiting for approval right now. New sign-ups
              will appear here when they need your step.
            </p>
          </div>
        </Card>
      ) : null}

      {!isRegistering &&
      listState.status === 'ready' &&
      listState.applications.length > 0 ? (
        <section aria-labelledby="applications-queue-heading">
          <div className="mb-4">
            <h2
              id="applications-queue-heading"
              className="text-lg font-bold text-foreground"
            >
              Pending applications
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review details carefully before approving. Oldest submissions appear
              first.
            </p>
          </div>
          <ul className="grid min-w-0 gap-4 lg:grid-cols-2">
            {listState.applications.map((application) => (
              <li key={application.applicationId}>
                <ApplicationCard
                  application={application}
                  approvalStep={approvalStep}
                  onApprove={() => setSelected(application)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AlertDialog
        open={selected !== null}
        onOpenChange={handleDialogOpenChange}
      >
        <AlertDialogContent>
          {selected ? (
            <>
              <AlertDialogTitle>
                Approve {getFullName(selected)}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {approvalStep === 'GENERAL_SECRETARY'
                  ? "This records the General Secretary's approval. The Vice General Secretary approves next."
                  : `This completes the approval. ${getFullName(selected)} becomes an Active Member, receives a Fellowship ID, and is emailed an activation notice. This can't be undone.`}
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isApproving}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmApproval}
                  disabled={isApproving}
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </Button>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPage>
  );
}

function ApplicationCard({
  application,
  approvalStep,
  onApprove,
}: {
  application: PendingApplication;
  approvalStep: ApprovalStep;
  onApprove: () => void;
}) {
  const { applicant, gsApprovalRecorded, submissionSource } = application;
  const isAssisted = submissionSource === 'GS_ASSISTED';
  const isWaitingForGs =
    approvalStep === 'VICE_GENERAL_SECRETARY' && !gsApprovalRecorded;
  const isAlreadyApprovedByGs =
    approvalStep === 'GENERAL_SECRETARY' && gsApprovalRecorded;
  const canApprove = canApproveNow(application, approvalStep);
  const minutesLeft = getMinutesLeft(application.expiresAt);
  const isUrgent = minutesLeft < 120;

  return (
    <Card
      className={cn(
        'relative flex h-full flex-col overflow-hidden p-6 transition-colors',
        dashboardCardClassName,
        canApprove && 'border-primary/30 bg-primary/[0.03]',
        isUrgent && 'border-primary/40',
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-brand-radial opacity-0 transition-opacity hover:opacity-20"
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col">
        <div className="mb-3 h-0.5 w-10 bg-primary" aria-hidden />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">
                {getFullName(application)}
              </h3>
              {isAssisted ? (
                <span className="bg-primary/15 px-2 py-0.5 text-[0.625rem] font-semibold tracking-widest text-primary uppercase">
                  GS assisted
                </span>
              ) : null}
              {canApprove ? (
                <span className="bg-primary px-2 py-0.5 text-[0.625rem] font-semibold tracking-widest text-primary-foreground uppercase">
                  Your step
                </span>
              ) : null}
            </div>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              {applicant.email}
            </p>
          </div>
          <p
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-semibold',
              isUrgent ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Clock size={16} aria-hidden />
            {formatTimeLeft(application.expiresAt)}
          </p>
        </div>

        <dl className="mt-4 grid gap-3 border border-border bg-muted/40 p-4 sm:grid-cols-2">
          <Detail label="Phone" value={applicant.phone} />
          <Detail
            label="Date of birth"
            value={birthDateFormat.format(
              new Date(`${applicant.dateOfBirth}T00:00:00Z`),
            )}
          />
          <Detail label="Class" value={applicant.class} />
          <Detail label="Year of study" value={applicant.yearOfStudy} />
          <Detail label="Course" value={applicant.course} />
          <Detail
            label="Submitted"
            value={submittedFormat.format(new Date(application.submittedAt))}
          />
        </dl>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            {getStatusLine(application)}
          </p>
          {isAlreadyApprovedByGs ? (
            <p className="text-sm font-semibold text-foreground">
              Waiting for the Vice General Secretary
            </p>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={onApprove}
              disabled={isWaitingForGs}
              className={cn(canApprove && 'min-w-28')}
            >
              Approve
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 wrap-break-word text-sm font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}
