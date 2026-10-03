'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { ONBOARDING_PATH } from '@/constants/constant';
import { isOnboardingRequired } from '@/lib/auth/access';

/** Keeps members who have not onboarded out of the dashboard. The API enforces the same rule. */
export function RequireOnboardingComplete({ children }: { children: ReactNode }) {
  const router = useRouter();
  const actor = useCurrentActor();
  const isRequired = isOnboardingRequired(actor);

  useEffect(() => {
    if (isRequired) router.replace(ONBOARDING_PATH);
  }, [isRequired, router]);

  if (isRequired) return null;
  return children;
}
