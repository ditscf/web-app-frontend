'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { AssistedRegistrationForm } from '@/components/applications/assisted-registration-form';
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

type ListState =
  | { status: 'loading' }
  | { status: 'ready'; applications: PendingApplication[] }
  | { status: 'forbidden'; message: string }
  | { status: 'error'; message: string };

// The queue may have changed under these outcomes, so the list is reloaded after them.
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

  return (
    <div className='mx-auto grid max-w-4xl gap-6'>
      <header className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h1 className='text-3xl font-bold text-foreground'>Applications</h1>
          <p className='mt-1 text-muted-foreground'>
            {isRegistering
              ? 'Register someone who cannot submit the public form themselves.'
              : 'Registrations waiting for approval. Self registrations need the General Secretary, then the Vice General Secretary. Applications registered by the General Secretary wait only for the Vice General Secretary. They expire 48 hours after submission.'}
          </p>
        </div>
        {canRegister && !isRegistering ? (
          <Button
            type='button'
            size='sm'
            onClick={() => setIsRegistering(true)}
          >
            Register a member
          </Button>
        ) : null}
      </header>

      {isRegistering ? (
        <AssistedRegistrationForm
          onCancel={() => setIsRegistering(false)}
          onRegistered={handleRegistered}
        />
      ) : null}

      {!isRegistering && listState.status === 'loading' ? (
        <p
          role='status'
          className='text-sm font-semibold text-muted-foreground'
        >
          Loading applications...
        </p>
      ) : null}

      {!isRegistering && listState.status === 'error' ? (
        <Card role='alert' className='p-6 shadow-none'>
          <p className='font-bold text-foreground'>
            We couldn&apos;t load the applications.
          </p>
          <p className='mt-1 text-sm text-muted-foreground'>
            {listState.message}
          </p>
          <Button
            type='button'
            size='sm'
            className='mt-4'
            onClick={handleRetry}
          >
            Try again
          </Button>
        </Card>
      ) : null}

      {!isRegistering &&
      listState.status === 'ready' &&
      listState.applications.length === 0 ? (
        <Card className='p-6 shadow-none'>
          <p className='text-muted-foreground'>
            No applications are waiting for approval.
          </p>
        </Card>
      ) : null}

      {!isRegistering &&
      listState.status === 'ready' &&
      listState.applications.length > 0 ? (
        <ul className='grid gap-4'>
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
                  type='button'
                  size='sm'
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
    </div>
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

  return (
    <Card className='p-6 shadow-none'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-lg font-bold text-foreground'>
              {getFullName(application)}
            </h2>
            {isAssisted ? (
              <span className='text-xs font-semibold text-primary'>
                Registered by GS
              </span>
            ) : null}
          </div>
          <p className='break-all text-sm text-muted-foreground'>
            {applicant.email}
          </p>
        </div>
        <p className='text-sm font-semibold text-muted-foreground'>
          {formatTimeLeft(application.expiresAt)}
        </p>
      </div>

      <dl className='mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2'>
        <Detail label='Phone' value={applicant.phone} />
        <Detail
          label='Date of birth'
          value={birthDateFormat.format(
            new Date(`${applicant.dateOfBirth}T00:00:00Z`),
          )}
        />
        <Detail label='Class' value={applicant.class} />
        <Detail label='Year of study' value={applicant.yearOfStudy} />
        <Detail label='Course' value={applicant.course} />
        <Detail
          label='Submitted'
          value={submittedFormat.format(new Date(application.submittedAt))}
        />
      </dl>

      <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4'>
        <p className='text-sm text-muted-foreground'>
          {getStatusLine(application)}
        </p>
        {isAlreadyApprovedByGs ? (
          <p className='text-sm font-semibold text-foreground'>
            Waiting for the Vice General Secretary
          </p>
        ) : (
          <Button
            type='button'
            size='sm'
            onClick={onApprove}
            disabled={isWaitingForGs}
          >
            Approve
          </Button>
        )}
      </div>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className='text-xs font-semibold text-muted-foreground'>{label}</dt>
      <dd className='mt-0.5 wrap-break-word font-bold text-foreground'>
        {value}
      </dd>
    </div>
  );
}
