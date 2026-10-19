'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SIGN_IN_PATH } from '@/constants/constant';
import { logout } from '@/lib/api/auth';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';

export async function performSignOut(): Promise<boolean> {
  try {
    await logout();
  } catch (error) {
    // A 401 means the API session is already gone, so only the Auth.js session is left to clear.
    if (toApiError(error).kind !== 'unauthenticated') {
      toast.error("We couldn't sign you out", { description: getUserFacingMessage(error) });
      return false;
    }
  }

  await signOut({ redirectTo: SIGN_IN_PATH });
  return true;
}

export function SignOutButton({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const didSignOut = await performSignOut();
    if (!didSignOut) {
      setIsSigningOut(false);
    }
  }

  const label = isSigningOut ? 'Signing out...' : 'Sign out';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={className}
    >
      <LogOut size={18} aria-hidden="true" />
      {showLabel ? (
        <span>{label}</span>
      ) : (
        <span className="sr-only sm:not-sr-only">{label}</span>
      )}
    </Button>
  );
}
