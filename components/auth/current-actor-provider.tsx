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

interface CurrentActorContextValue {
  actor: ActorProfile;
  refresh: () => Promise<void>;
}

const CurrentActorContext = createContext<CurrentActorContextValue | null>(null);

function useCurrentActorContext(): CurrentActorContextValue {
  const context = useContext(CurrentActorContext);
  if (!context) throw new Error('useCurrentActor must be used inside CurrentActorProvider.');
  return context;
}

export function useCurrentActor(): ActorProfile {
  return useCurrentActorContext().actor;
}

/**
 * Reloads `/auth/me` after an in-dashboard change that affects it, keeping the current profile on screen
 * meanwhile. Rejects with the API error so the caller decides what to show; a `401` still signs out.
 */
export function useRefreshCurrentActor(): () => Promise<void> {
  return useCurrentActorContext().refresh;
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

  async function refresh() {
    const actor = await getCurrentActor();
    setState({ status: 'authenticated', actor });
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

  return <CurrentActorContext.Provider value={{ actor: state.actor, refresh }}>
    {children}
  </CurrentActorContext.Provider>;
}
