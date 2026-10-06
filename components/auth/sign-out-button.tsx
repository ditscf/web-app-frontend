'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SIGN_IN_PATH } from '@/constants/constant';
import { logout } from '@/lib/api/auth';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await logout();
    } catch (error) {
      // A 401 means the API session is already gone, so only the Auth.js session is left to clear.
      if (toApiError(error).kind !== 'unauthenticated') {
        toast.error("We couldn't sign you out", { description: getUserFacingMessage(error) });
        setIsSigningOut(false);
        return;
      }
    }

    await signOut({ redirectTo: SIGN_IN_PATH });
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
      <LogOut size={18} aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
    </Button>
  );
}
