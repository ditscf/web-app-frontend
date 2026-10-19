'use client';

import { ChevronsUpDown, LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { performSignOut } from '@/components/auth/sign-out-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { canManageOwnProfile } from '@/lib/auth/access';

const accountMenuItemClass =
  'normal-case tracking-normal text-sm font-medium';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function UserAvatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function DashboardNavUser() {
  const actor = useCurrentActor();
  const { isMobile, setOpenMobile } = useSidebar();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const fullName = `${actor.firstName} ${actor.lastName}`;
  const initials = getInitials(actor.firstName, actor.lastName);
  const showProfile = canManageOwnProfile(actor);

  function handleCloseMobileSidebar() {
    setOpenMobile(false);
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    const didSignOut = await performSignOut();
    if (!didSignOut) {
      setIsSigningOut(false);
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
            >
              <UserAvatar initials={initials} className="size-8" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{fullName}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{actor.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal normal-case tracking-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <UserAvatar initials={initials} className="size-8" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{fullName}</span>
                  <span className="truncate text-xs text-muted-foreground">{actor.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {showProfile ? (
                <DropdownMenuItem asChild className={accountMenuItemClass}>
                  <Link href="/dashboard/profile" onClick={handleCloseMobileSidebar}>
                    <UserRound />
                    My profile
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem disabled className={accountMenuItemClass}>
                Fellowship ID · {actor.fellowshipId}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={accountMenuItemClass}
              disabled={isSigningOut}
              onSelect={(event) => {
                event.preventDefault();
                void handleSignOut();
              }}
            >
              <LogOut />
              {isSigningOut ? 'Signing out…' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
