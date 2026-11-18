'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  useCurrentActor,
  useRefreshCurrentActor,
} from '@/components/auth/current-actor-provider';
import { ErrorState, LoadingState } from '@/components/dashboard/async-state';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
import { NoAccess } from '@/components/dashboard/no-access';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge, type StatusTone } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import {
  archiveFellowshipYear,
  cancelYearClosure,
  confirmYearClosure,
  getYearClosureStatus,
  requestYearClosure,
  type YearClosureStatus,
} from '@/lib/api/year-closure';
import {
  canArchiveYear,
  canConfirmYearClosure,
  canRequestYearClosure,
  canViewYearClosure,
} from '@/lib/auth/access';

function yearStatusTone(status: YearClosureStatus['year']['status']): StatusTone {
  if (status === 'OPEN') return 'success';
  if (status === 'CLOSED') return 'warning';
  return 'neutral';
}

function formatCountdown(remainingSeconds: number | null): string {
  if (remainingSeconds === null) return '';
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function YearClosurePage() {
  const actor = useCurrentActor();
  const refreshActor = useRefreshCurrentActor();
  const canView = canViewYearClosure(actor);
  const canRequest = canRequestYearClosure(actor);
  const canConfirm = canConfirmYearClosure(actor);
  const canArchive = canArchiveYear(actor);

  const [status, setStatus] = useState<YearClosureStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'request' | 'cancel' | 'confirm' | 'archive' | null
  >(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getYearClosureStatus();
      setStatus(data);
      setRemainingSeconds(data.pendingRequest?.remainingSeconds ?? null);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (apiError.kind === 'forbidden') {
        setIsForbidden(true);
        return;
      }
      setLoadError(getUserFacingMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) return;
    void reload();
  }, [canView, reload]);

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null || current <= 1) {
          window.clearInterval(timer);
          void reload();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remainingSeconds, reload]);

  if (!canView || isForbidden) {
    return <NoAccess />;
  }

  async function runAction(action: 'request' | 'cancel' | 'confirm' | 'archive') {
    setIsActing(true);
    try {
      if (action === 'request') await requestYearClosure();
      if (action === 'cancel') await cancelYearClosure();
      if (action === 'confirm') await confirmYearClosure();
      if (action === 'archive') await archiveFellowshipYear();
      toast.success(
        action === 'request'
          ? 'Closure requested'
          : action === 'cancel'
            ? 'Request cancelled'
            : action === 'confirm'
              ? 'Year closed'
              : 'Year archived',
      );
      setConfirmAction(null);
      await refreshActor();
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't complete that action", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsActing(false);
    }
  }

  const pending = status?.pendingRequest ?? null;
  const blockers = status?.blockers;
  const canConfirmNow =
    canConfirm && pending !== null && (blockers?.activeEventCount ?? 0) === 0;
  const canArchiveNow =
    canArchive && (blockers?.nonArchivedEventCount ?? 0) === 0;

  return (
    <DashboardPage>
      <PageHeader
        title="Year closure"
        description="Request, confirm, or archive the operative fellowship year."
      />

      {isLoading ? (
        <LoadingState label="Loading year closure…" />
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={() => void reload()} />
      ) : status ? (
        <div className="space-y-6">
          <Card className={dashboardCardClassName}>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle className="font-semibold tracking-normal normal-case">
                {status.year.label}
              </CardTitle>
              <StatusBadge tone={yearStatusTone(status.year.status)}>
                {status.year.status}
              </StatusBadge>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Active events: {status.blockers.activeEventCount}. Events not yet
                archived: {status.blockers.nonArchivedEventCount}.
              </p>
              <Button asChild variant="outline" size="sm" className="w-fit">
                <Link href="/dashboard/events">Open events</Link>
              </Button>
            </CardContent>
          </Card>

          {status.year.status === 'OPEN' ? (
            <Card className={dashboardCardClassName}>
              <CardHeader>
                <CardTitle className="font-semibold tracking-normal normal-case">
                  Closure request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pending ? (
                  <>
                    <p className="text-sm">
                      Pending request expires in{' '}
                      <span className="font-medium text-foreground">
                        {formatCountdown(remainingSeconds)}
                      </span>
                      .
                    </p>
                    {status.blockers.activeEventCount > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Confirm is blocked until all active events are closed or
                        archived.
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {canRequest ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isActing}
                          onClick={() => setConfirmAction('cancel')}
                        >
                          Cancel request
                        </Button>
                      ) : null}
                      {canConfirm ? (
                        <Button
                          type="button"
                          disabled={isActing || !canConfirmNow}
                          onClick={() => setConfirmAction('confirm')}
                        >
                          Confirm close
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      The General Secretary may request closure. The request stays
                      pending for 12 hours until the Chairman confirms.
                    </p>
                    {canRequest ? (
                      <Button
                        type="button"
                        disabled={isActing}
                        onClick={() => setConfirmAction('request')}
                      >
                        Request closure
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Waiting for the General Secretary to request closure.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}

          {status.year.status === 'CLOSED' ? (
            <Card className={dashboardCardClassName}>
              <CardHeader>
                <CardTitle className="font-semibold tracking-normal normal-case">
                  Archive year
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Archive only after every event is archived. This ends current
                  offices and leadership for the year.
                </p>
                {status.blockers.nonArchivedEventCount > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {status.blockers.nonArchivedEventCount} event(s) still need
                    archiving.
                  </p>
                ) : null}
                {canArchive ? (
                  <Button
                    type="button"
                    disabled={isActing || !canArchiveNow}
                    onClick={() => setConfirmAction('archive')}
                  >
                    Archive year
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isActing) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {confirmAction === 'request'
              ? 'Request closure?'
              : confirmAction === 'cancel'
                ? 'Cancel request?'
                : confirmAction === 'confirm'
                  ? 'Close the year?'
                  : 'Archive the year?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirmAction === 'request'
              ? 'The Chairman will have 12 hours to confirm. The year will not close by itself.'
              : confirmAction === 'cancel'
                ? 'The pending closure request will be withdrawn.'
                : confirmAction === 'confirm'
                  ? 'Ministry and event leader operations will stop. Registration and approval continue.'
                  : 'Nobody will be able to change this year’s records after archive.'}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActing}>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={isActing || confirmAction === null}
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                if (confirmAction) void runAction(confirmAction);
              }}
            >
              {isActing ? 'Working…' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPage>
  );
}
