'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DASHBOARD_HOME_PATH } from '@/constants/constant';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import { listMinistries, type Ministry } from '@/lib/api/ministries';
import { completeOnboarding } from '@/lib/api/onboarding';
import { isOnboardingRequired } from '@/lib/auth/access';

type MinistriesState =
  | { status: 'loading' }
  | { status: 'ready'; ministries: Ministry[] }
  | { status: 'error'; message: string };

const SELECTION_ERROR_ID = 'ministries-error';
const NO_SELECTION_MESSAGE = 'Choose at least one ministry.';

export function OnboardingForm() {
  const router = useRouter();
  const actor = useCurrentActor();
  const isRequired = isOnboardingRequired(actor);
  const [ministriesState, setMinistriesState] = useState<MinistriesState>({
    status: 'loading',
  });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isRequired) router.replace(DASHBOARD_HOME_PATH);
  }, [isRequired, router]);

  useEffect(() => {
    if (!isRequired) return;
    let isActive = true;

    listMinistries()
      .then((ministries) => {
        if (isActive) setMinistriesState({ status: 'ready', ministries });
      })
      .catch((error: unknown) => {
        if (!isActive || toApiError(error).kind === 'unauthenticated') return;
        setMinistriesState({
          status: 'error',
          message: getUserFacingMessage(error),
        });
      });

    return () => {
      isActive = false;
    };
  }, [isRequired, loadAttempt]);

  function handleRetry() {
    setMinistriesState({ status: 'loading' });
    setLoadAttempt((attempt) => attempt + 1);
  }

  function handleToggleMinistry(ministryId: string) {
    setSelectedIds((current) =>
      current.includes(ministryId)
        ? current.filter((id) => id !== ministryId)
        : [...current, ministryId],
    );
    if (selectionError) setSelectionError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (selectedIds.length === 0) {
      setSelectionError(NO_SELECTION_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding(selectedIds);
    } catch (error) {
      const apiError = toApiError(error);
      setIsSubmitting(false);
      if (apiError.kind === 'unauthenticated') return;
      if (apiError.kind === 'conflict') {
        router.replace(DASHBOARD_HOME_PATH);
        return;
      }
      if (apiError.kind === 'validation') {
        setSelectionError(apiError.messages.join(' '));
        return;
      }
      toast.error("We couldn't save your ministries", {
        description: getUserFacingMessage(error),
      });
      return;
    }

    toast.success("You're all set", {
      description: 'Your ministries are saved. Welcome to DITSCF.',
    });
    router.replace(DASHBOARD_HOME_PATH);
  }

  if (!isRequired) return null;

  return (
    <div className='mx-auto grid max-w-2xl gap-6'>
      <header>
        <h1 className='text-3xl font-bold text-foreground'>
          Welcome to DITSCF, {actor.firstName}
        </h1>
        <p className='mt-2 text-muted-foreground'>
          Before you continue, choose the ministries you will serve in. You can
          choose more than one.
        </p>
      </header>

      <Card className='p-6 shadow-none'>
        {ministriesState.status === 'loading' ? (
          <p
            role='status'
            className='text-sm font-semibold text-muted-foreground'
          >
            Loading ministries...
          </p>
        ) : null}

        {ministriesState.status === 'error' ? (
          <div role='alert'>
            <p className='font-bold text-foreground'>
              We couldn&apos;t load the ministries.
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {ministriesState.message}
            </p>
            <Button
              type='button'
              size='sm'
              className='mt-4'
              onClick={handleRetry}
            >
              Try again
            </Button>
          </div>
        ) : null}

        {ministriesState.status === 'ready' ? (
          <form noValidate onSubmit={handleSubmit} className='grid gap-5'>
            <fieldset
              aria-invalid={Boolean(selectionError)}
              aria-describedby={selectionError ? SELECTION_ERROR_ID : undefined}
            >
              <legend className='text-lg font-bold text-foreground'>
                Your ministries
              </legend>
              <div className='mt-3 grid gap-2 sm:grid-cols-2'>
                {ministriesState.ministries.map((ministry) => (
                  <label
                    key={ministry.id}
                    className='flex cursor-pointer items-center gap-3 border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring'
                  >
                    <input
                      type='checkbox'
                      name='ministryIds'
                      value={ministry.id}
                      checked={selectedIds.includes(ministry.id)}
                      onChange={() => handleToggleMinistry(ministry.id)}
                      disabled={isSubmitting}
                      className='h-4 w-4 accent-primary focus:outline-hidden'
                    />
                    {ministry.name}
                  </label>
                ))}
              </div>
              {selectionError ? (
                <p
                  id={SELECTION_ERROR_ID}
                  role='alert'
                  className='mt-3 text-sm font-semibold text-destructive'
                >
                  {selectionError}
                </p>
              ) : null}
            </fieldset>

            <p className='text-sm text-muted-foreground'>
              Your choice is final once you submit. Later changes to your
              ministries are made by a Ministry Leader or the Chairman.
            </p>

            <Button type='submit' size='lg' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save and continue'}
            </Button>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
