'use client';

import { signOut } from 'next-auth/react';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { SIGN_IN_PATH } from '@/constants/constant';
import { getCurrentActor, type ActorProfile } from '@/lib/api/auth';
import { setUnauthenticatedHandler } from '@/lib/api/client';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';

type ActorState =
  | { status: 'loading' }
  | { status: 'authenticated'; actor: ActorProfile }
  | { status: 'error'; message: string };

const CurrentActorContext = createContext<ActorProfile | null>(null);

export function useCurrentActor(): ActorProfile {
  const actor = useContext(CurrentActorContext);
  if (!actor) throw new Error('useCurrentActor must be used inside CurrentActorProvider.');
  return actor;
}

export function CurrentActorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActorState>({ status: 'loading' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const isSigningOutRef = useRef(false);

  useEffect(() => {
    function handleUnauthenticated() {
      if (isSigningOutRef.current) return;
      isSigningOutRef.current = true;
      void signOut({ redirectTo: SIGN_IN_PATH });
    }

    setUnauthenticatedHandler(handleUnauthenticated);
    return () => setUnauthenticatedHandler(null);
  }, []);

  useEffect(() => {
    let isActive = true;

    getCurrentActor()
      .then((actor) => {
        if (isActive) setState({ status: 'authenticated', actor });
      })
      .catch((error: unknown) => {
        if (!isActive || toApiError(error).kind === 'unauthenticated') return;
        setState({ status: 'error', message: getUserFacingMessage(error) });
      });

    return () => {
      isActive = false;
    };
  }, [loadAttempt]);

  function handleRetry() {
    setState({ status: 'loading' });
    setLoadAttempt((attempt) => attempt + 1);
  }

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p role="status" className="text-sm font-semibold text-slate-600">
          Checking your session...
        </p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div role="alert" className="space-y-1">
          <p className="font-bold text-navy">We couldn&apos;t load your account.</p>
          <p className="text-sm text-slate-600">{state.message}</p>
        </div>
        <Button type="button" onClick={handleRetry}>
          Try again
        </Button>
      </div>
    );
  }

  return <CurrentActorContext.Provider value={state.actor}>
    {children}
  </CurrentActorContext.Provider>;
}
