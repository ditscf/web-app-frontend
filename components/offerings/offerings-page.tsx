'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { ErrorState, LoadingState } from '@/components/dashboard/async-state';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
import { NoAccess } from '@/components/dashboard/no-access';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  listOfferings,
  removeOffering,
  upsertOffering,
  type OfferingView,
} from '@/lib/api/offerings';
import {
  canCorrectClosedYearOfferings,
  canManageOfferings,
  canViewOfferings,
} from '@/lib/auth/access';

function formatTzs(amount: number): string {
  return `${amount.toLocaleString('en-TZ')} TZS`;
}

export function OfferingsPage() {
  const actor = useCurrentActor();
  const canView = canViewOfferings(actor);
  const canMutate = useMemo(
    () => canManageOfferings(actor) || canCorrectClosedYearOfferings(actor),
    [actor],
  );

  const [offerings, setOfferings] = useState<OfferingView[]>([]);
  const [totalTzs, setTotalTzs] = useState(0);
  const [yearLabel, setYearLabel] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offeredOn, setOfferedOn] = useState('');
  const [amountDraft, setAmountDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<OfferingView | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await listOfferings();
      setOfferings(data.offerings);
      setTotalTzs(data.totalTzs);
      setYearLabel(data.operativeYear.label);
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

  if (!canView) {
    return <NoAccess />;
  }

  if (isForbidden) {
    return <NoAccess />;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(offeredOn)) {
      toast.error('Enter the offering date as YYYY-MM-DD.');
      return;
    }
    const amountTzs = Number(amountDraft);
    if (!Number.isInteger(amountTzs) || amountTzs < 1) {
      toast.error('Enter a whole TZS amount of at least 1.');
      return;
    }

    setIsSaving(true);
    try {
      await upsertOffering({ offeredOn, amountTzs });
      toast.success(`Offering saved for ${offeredOn}`);
      setAmountDraft('');
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't save that offering", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    try {
      await removeOffering(removeTarget.id);
      toast.success(`Removed offering for ${removeTarget.offeredOn}`);
      setRemoveTarget(null);
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't remove that offering", {
        description: getUserFacingMessage(error),
      });
    }
  }

  function handleEditRow(row: OfferingView) {
    setOfferedOn(row.offeredOn);
    setAmountDraft(String(row.amountTzs));
  }

  return (
    <DashboardPage>
      <PageHeader
        title="Offerings"
        description={
          yearLabel
            ? `Anonymous daily totals for ${yearLabel}.`
            : 'Anonymous daily fellowship offering totals.'
        }
      />

      {isLoading ? (
        <LoadingState label="Loading offerings…" />
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={() => void reload()} />
      ) : (
        <>
          {canMutate ? (
            <Card className={dashboardCardClassName}>
              <CardHeader>
                <CardTitle className="font-semibold tracking-normal normal-case">
                  Record offering
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid max-w-md gap-4 sm:grid-cols-2"
                  onSubmit={handleSave}
                >
                  <div className="grid gap-2 sm:col-span-1">
                    <Label htmlFor="offering-date">Date</Label>
                    <Input
                      id="offering-date"
                      type="date"
                      value={offeredOn}
                      onChange={(change) => setOfferedOn(change.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-1">
                    <Label htmlFor="offering-amount">Amount (TZS)</Label>
                    <Input
                      id="offering-amount"
                      inputMode="numeric"
                      value={amountDraft}
                      onChange={(change) => setAmountDraft(change.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <Button type="submit" disabled={isSaving} className="w-fit">
                    {isSaving ? 'Saving…' : 'Save offering'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card className={dashboardCardClassName}>
            <CardHeader>
              <CardTitle className="font-semibold tracking-normal normal-case">
                Daily totals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Total recorded: {formatTzs(totalTzs)}
              </p>
              {offerings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No offerings recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {offerings.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-medium">{row.offeredOn}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTzs(row.amountTzs)}
                        </p>
                      </div>
                      {canMutate ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRow(row)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRemoveTarget(row)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Remove offering?</AlertDialogTitle>
          <AlertDialogDescription>
            {removeTarget
              ? `Remove ${formatTzs(removeTarget.amountTzs)} recorded on ${removeTarget.offeredOn}?`
              : null}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRemoveConfirm()}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPage>
  );
}
