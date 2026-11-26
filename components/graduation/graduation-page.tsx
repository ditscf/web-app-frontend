'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
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
import { FellowshipIdField } from '@/components/ministries/fellowship-id-field';
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
  applyForGraduation,
  appointGraduationChairman,
  cancelGraduationApplication,
  confirmGraduationApplication,
  getGraduationChairman,
  getGraduationMe,
  listPendingGraduationApplications,
  rejectGraduationApplication,
  type GraduationApplication,
  type GraduationChairmanResult,
  type GraduationMe,
} from '@/lib/api/graduation';
import { lookupMember, type MemberLookup } from '@/lib/api/members';
import {
  canAppointGraduationChairman,
  canDecideGraduation,
  canViewGraduation,
} from '@/lib/auth/access';
import { FELLOWSHIP_ID_LENGTH, fellowshipIdSchema } from '@/lib/validation';

export function GraduationPage() {
  const actor = useCurrentActor();
  const refreshActor = useRefreshCurrentActor();
  const canView = canViewGraduation(actor);
  const canAppoint = canAppointGraduationChairman(actor);
  const canDecide = canDecideGraduation(actor);

  const [chairman, setChairman] = useState<GraduationChairmanResult | null>(null);
  const [me, setMe] = useState<GraduationMe | null>(null);
  const [pending, setPending] = useState<GraduationApplication[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  const [fellowshipId, setFellowshipId] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [lookupCandidate, setLookupCandidate] = useState<MemberLookup | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [decideTarget, setDecideTarget] = useState<{
    id: string;
    name: string;
    action: 'confirm' | 'reject';
  } | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [chairmanData, meData] = await Promise.all([
        getGraduationChairman(),
        getGraduationMe(),
      ]);
      setChairman(chairmanData);
      setMe(meData);
      if (canDecide) {
        const pendingData = await listPendingGraduationApplications();
        setPending(pendingData.applications);
      } else {
        setPending([]);
      }
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
  }, [canDecide]);

  useEffect(() => {
    if (!canView) return;
    void reload();
  }, [canView, reload]);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = fellowshipIdSchema.safeParse(fellowshipId);
    if (!parsed.success) {
      setFieldError(
        parsed.error.issues[0]?.message ??
          `A Fellowship ID has ${FELLOWSHIP_ID_LENGTH} digits.`,
      );
      return;
    }
    setIsLookingUp(true);
    setFieldError(null);
    try {
      const lookedUp = await lookupMember(parsed.data);
      setLookupCandidate(lookedUp);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (
        apiError.kind === 'validation' ||
        apiError.kind === 'not_found' ||
        apiError.kind === 'conflict'
      ) {
        setFieldError(apiError.message);
        return;
      }
      toast.error("We couldn't confirm that Fellowship ID", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleAppoint() {
    if (!lookupCandidate || isActing) return;
    setIsActing(true);
    try {
      const result = await appointGraduationChairman(lookupCandidate.fellowshipId);
      setChairman(result);
      setLookupCandidate(null);
      setFellowshipId('');
      toast.success('Graduation Chairman appointed');
      await refreshActor();
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't appoint the Graduation Chairman", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsActing(false);
    }
  }

  async function handleApply() {
    setIsActing(true);
    try {
      await applyForGraduation();
      toast.success('Graduation application submitted');
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't submit your application", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsActing(false);
    }
  }

  async function handleCancelOwn() {
    if (!me?.application) return;
    setIsActing(true);
    try {
      await cancelGraduationApplication(me.application.id);
      toast.success('Application cancelled');
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't cancel the application", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsActing(false);
    }
  }

  async function handleDecide() {
    if (!decideTarget || isActing) return;
    setIsActing(true);
    try {
      if (decideTarget.action === 'confirm') {
        await confirmGraduationApplication(decideTarget.id);
        toast.success(`${decideTarget.name} is now an Associate`);
      } else {
        await rejectGraduationApplication(decideTarget.id);
        toast.success(`Application for ${decideTarget.name} was rejected`);
      }
      setDecideTarget(null);
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't update that application", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsActing(false);
    }
  }

  if (!canView || isForbidden) return <NoAccess />;

  if (isLoading) {
    return (
      <DashboardPage>
        <LoadingState label="Loading graduation" />
      </DashboardPage>
    );
  }

  if (loadError || !me) {
    return (
      <DashboardPage>
        <ErrorState message={loadError ?? 'Could not load graduation.'} onRetry={() => void reload()} />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Membership"
        title="Graduation"
        description={
          me.operativeYear
            ? `Fellowship year ${me.operativeYear.label} (${me.operativeYear.status}).`
            : 'No operative fellowship year.'
        }
      />

      <Card className={dashboardCardClassName}>
        <CardHeader>
          <CardTitle className="font-semibold tracking-normal normal-case">
            Graduation Chairman
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {chairman?.chairman
              ? `${chairman.chairman.firstName} ${chairman.chairman.lastName} · ${chairman.chairman.fellowshipId}`
              : 'Not appointed yet.'}
          </p>
          {canAppoint ? (
            <form className="grid max-w-md gap-3" onSubmit={handleLookup}>
              <FellowshipIdField
                id="graduation-chairman-fellowship-id"
                value={fellowshipId}
                onValueChange={(value) => {
                  setFellowshipId(value);
                  setFieldError(null);
                }}
                error={fieldError}
                disabled={isLookingUp || isActing}
              />
              <Button type="submit" disabled={isLookingUp || isActing} className="w-fit">
                {isLookingUp ? 'Looking up…' : 'Continue'}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card className={dashboardCardClassName}>
        <CardHeader>
          <CardTitle className="font-semibold tracking-normal normal-case">
            Your application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {me.application ? (
            <>
              <p className="text-sm text-muted-foreground">
                Status: {me.application.status}. Applied{' '}
                {new Date(me.application.appliedAt).toLocaleString()}.
              </p>
              {me.application.status === 'PENDING' ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isActing}
                  onClick={() => void handleCancelOwn()}
                >
                  Cancel application
                </Button>
              ) : null}
            </>
          ) : me.eligible ? (
            <>
              <p className="text-sm text-muted-foreground">
                You may apply for graduation. The Graduation Chairman will confirm or reject.
              </p>
              <Button type="button" disabled={isActing} onClick={() => void handleApply()}>
                Apply for graduation
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {!me.chairmanAppointed
                ? 'Applications open after the Graduation Chairman is appointed.'
                : 'You are not eligible to apply right now.'}
            </p>
          )}
        </CardContent>
      </Card>

      {canDecide ? (
        <Card className={dashboardCardClassName}>
          <CardHeader>
            <CardTitle className="font-semibold tracking-normal normal-case">
              Pending applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending applications.</p>
            ) : (
              <ul className="divide-y divide-border">
                {pending.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-medium">
                        {row.firstName} {row.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {row.fellowshipId} · {row.yearOfStudy}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isActing}
                        onClick={() =>
                          setDecideTarget({
                            id: row.id,
                            name: `${row.firstName} ${row.lastName}`,
                            action: 'confirm',
                          })
                        }
                      >
                        Confirm
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isActing}
                        onClick={() =>
                          setDecideTarget({
                            id: row.id,
                            name: `${row.firstName} ${row.lastName}`,
                            action: 'reject',
                          })
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog
        open={lookupCandidate !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isActing) setLookupCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Appoint Graduation Chairman?</AlertDialogTitle>
          <AlertDialogDescription>
            {lookupCandidate
              ? `Appoint ${lookupCandidate.firstName} ${lookupCandidate.lastName} (${lookupCandidate.fellowshipId}) as Graduation Chairman?`
              : null}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isActing}
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                void handleAppoint();
              }}
            >
              {isActing ? 'Appointing…' : 'Appoint'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={decideTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isActing) setDecideTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {decideTarget?.action === 'confirm'
              ? 'Confirm graduation?'
              : 'Reject application?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {decideTarget?.action === 'confirm'
              ? `${decideTarget.name} will become an Associate and their account will be disabled.`
              : decideTarget
                ? `${decideTarget.name}'s application will be rejected.`
                : null}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isActing}
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                void handleDecide();
              }}
            >
              {isActing
                ? 'Saving…'
                : decideTarget?.action === 'confirm'
                  ? 'Confirm'
                  : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPage>
  );
}
