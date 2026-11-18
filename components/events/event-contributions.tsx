'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
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
import { dashboardCardClassName } from '@/components/dashboard/dashboard-page';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import {
  listEventContributions,
  recordEventPayment,
  removeEventPayment,
  setEventPledge,
  type ContributionRow,
  type EventStatus,
} from '@/lib/api/events';

interface EventContributionsProps {
  eventId: string;
  eventStatus: EventStatus;
  canView: boolean;
  canMutate: boolean;
}

function formatTzs(amount: number): string {
  return `${amount.toLocaleString('en-TZ')} TZS`;
}

export function EventContributionsPanel({
  eventId,
  eventStatus,
  canView,
  canMutate,
}: EventContributionsProps) {
  const [rows, setRows] = useState<ContributionRow[]>([]);
  const [totals, setTotals] = useState({
    pledgeTzs: 0,
    paidTzs: 0,
    outstandingTzs: 0,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFellowshipId, setSelectedFellowshipId] = useState<string | null>(
    null,
  );
  const [pledgeDraft, setPledgeDraft] = useState('');
  const [paymentDraft, setPaymentDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [isSavingPledge, setIsSavingPledge] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    amountTzs: number;
    name: string;
  } | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await listEventContributions(eventId);
      setRows(data.rows);
      setTotals(data.totals);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      setLoadError(getUserFacingMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!canView) return;
    void reload();
  }, [canView, reload]);

  const selected = rows.find((row) => row.fellowshipId === selectedFellowshipId) ?? null;

  useEffect(() => {
    if (!selected) {
      setPledgeDraft('');
      setPaymentDraft('');
      setNoteDraft('');
      return;
    }
    setPledgeDraft(selected.pledgeTzs > 0 ? String(selected.pledgeTzs) : '');
    setPaymentDraft('');
    setNoteDraft('');
  }, [selected]);

  if (!canView) return null;

  async function handleSavePledge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const amountTzs = Number(pledgeDraft);
    if (!Number.isInteger(amountTzs) || amountTzs < 1) {
      toast.error('Enter a whole TZS amount of at least 1.');
      return;
    }

    setIsSavingPledge(true);
    try {
      await setEventPledge(eventId, selected.fellowshipId, amountTzs);
      toast.success(`Pledge updated for ${selected.firstName}`);
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't save that pledge", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsSavingPledge(false);
    }
  }

  async function handleRecordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const amountTzs = Number(paymentDraft);
    if (!Number.isInteger(amountTzs) || amountTzs < 1) {
      toast.error('Enter a whole TZS amount of at least 1.');
      return;
    }

    setIsSavingPayment(true);
    try {
      const note = noteDraft.trim();
      await recordEventPayment(eventId, selected.fellowshipId, {
        amountTzs,
        ...(note ? { note } : {}),
      });
      toast.success(`Payment recorded for ${selected.firstName}`);
      setPaymentDraft('');
      setNoteDraft('');
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't record that payment", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsSavingPayment(false);
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    try {
      await removeEventPayment(eventId, removeTarget.id);
      toast.success('Payment removed');
      setRemoveTarget(null);
      await reload();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't remove that payment", {
        description: getUserFacingMessage(error),
      });
    }
  }

  return (
    <Card className={dashboardCardClassName}>
      <CardHeader>
        <CardTitle className="font-semibold tracking-normal normal-case">
          Contributions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading contributions…</p>
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add participants to this event before recording pledges.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Totals: pledged {formatTzs(totals.pledgeTzs)} · paid{' '}
              {formatTzs(totals.paidTzs)} · outstanding{' '}
              {formatTzs(totals.outstandingTzs)}
              {eventStatus === 'ARCHIVED' ? ' · archived (read-only)' : null}
            </p>

            <ul className="divide-y divide-border">
              {rows.map((row) => {
                const isSelected = row.fellowshipId === selectedFellowshipId;
                return (
                  <li key={row.personId} className="py-3">
                    <button
                      type="button"
                      className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                      onClick={() =>
                        setSelectedFellowshipId(
                          isSelected ? null : row.fellowshipId,
                        )
                      }
                    >
                      <div>
                        <p className="font-medium">
                          {row.firstName} {row.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {row.fellowshipId} · pledge {formatTzs(row.pledgeTzs)} ·
                          paid {formatTzs(row.paidTzs)} · outstanding{' '}
                          {formatTzs(row.outstandingTzs)}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {isSelected ? 'Hide' : 'Open'}
                      </span>
                    </button>

                    {isSelected ? (
                      <div className="mt-4 space-y-4 border-t border-border pt-4">
                        {canMutate ? (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <form className="grid gap-3" onSubmit={handleSavePledge}>
                              <div className="grid gap-2">
                                <Label htmlFor={`pledge-${row.fellowshipId}`}>
                                  Pledge (TZS)
                                </Label>
                                <Input
                                  id={`pledge-${row.fellowshipId}`}
                                  inputMode="numeric"
                                  value={pledgeDraft}
                                  onChange={(change) =>
                                    setPledgeDraft(change.target.value)
                                  }
                                  disabled={isSavingPledge}
                                />
                              </div>
                              <Button
                                type="submit"
                                size="sm"
                                className="w-fit"
                                disabled={isSavingPledge}
                              >
                                {isSavingPledge ? 'Saving…' : 'Save pledge'}
                              </Button>
                            </form>

                            <form
                              className="grid gap-3"
                              onSubmit={handleRecordPayment}
                            >
                              <div className="grid gap-2">
                                <Label htmlFor={`payment-${row.fellowshipId}`}>
                                  Payment (TZS)
                                </Label>
                                <Input
                                  id={`payment-${row.fellowshipId}`}
                                  inputMode="numeric"
                                  value={paymentDraft}
                                  onChange={(change) =>
                                    setPaymentDraft(change.target.value)
                                  }
                                  disabled={isSavingPayment}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`note-${row.fellowshipId}`}>
                                  Note (optional)
                                </Label>
                                <Input
                                  id={`note-${row.fellowshipId}`}
                                  value={noteDraft}
                                  onChange={(change) =>
                                    setNoteDraft(change.target.value)
                                  }
                                  disabled={isSavingPayment}
                                />
                              </div>
                              <Button
                                type="submit"
                                size="sm"
                                className="w-fit"
                                disabled={isSavingPayment || row.pledgeTzs < 1}
                              >
                                {isSavingPayment ? 'Recording…' : 'Record payment'}
                              </Button>
                            </form>
                          </div>
                        ) : null}

                        {row.payments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No payments yet.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {row.payments.map((payment) => (
                              <li
                                key={payment.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-sm"
                              >
                                <span>
                                  {formatTzs(payment.amountTzs)}
                                  {payment.note ? ` · ${payment.note}` : null}
                                  <span className="text-muted-foreground">
                                    {' '}
                                    ·{' '}
                                    {new Date(payment.recordedAt).toLocaleString()}
                                  </span>
                                </span>
                                {canMutate ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setRemoveTarget({
                                        id: payment.id,
                                        amountTzs: payment.amountTzs,
                                        name: `${row.firstName} ${row.lastName}`,
                                      })
                                    }
                                  >
                                    Remove
                                  </Button>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Remove payment?</AlertDialogTitle>
          <AlertDialogDescription>
            {removeTarget
              ? `Remove ${formatTzs(removeTarget.amountTzs)} recorded for ${removeTarget.name}?`
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
    </Card>
  );
}
