'use client';

import {
  ClipboardCheck,
  House,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { DASHBOARD_CONTENT_CLASS } from '@/components/dashboard/dashboard-page';
import { DashboardNavUser } from '@/components/dashboard/nav-user';
import {
  Sidebar as AppSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ActorProfile } from '@/lib/api/auth';
import {
  canManageOwnProfile,
  canReviewApplications,
  canViewMinistryLeaders,
} from '@/lib/auth/access';
import { YEAR_STATUS_LABELS } from '@/lib/auth/responsibility-labels';
import { ditscfLogoImage } from '@/lib/site-content';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isVisible: (actor: ActorProfile) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard/home',
    label: 'Home',
    icon: House,
    isVisible: () => true,
  },
  {
    href: '/dashboard/ministries',
    label: 'Ministries',
    icon: UsersRound,
    isVisible: canViewMinistryLeaders,
  },
  {
    href: '/dashboard/applications',
    label: 'Applications',
    icon: ClipboardCheck,
    isVisible: canReviewApplications,
  },
  {
    href: '/dashboard/profile',
    label: 'My profile',
    icon: UserRound,
    isVisible: canManageOwnProfile,
  },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DashboardBrand() {
  return (
    <Link href="/dashboard/home" className="flex items-center gap-3 px-2 py-1">
      <Image
        src={ditscfLogoImage}
        alt=""
        className="h-9 w-auto object-contain"
        priority
      />
    </Link>
  );
}

function DashboardNavMenu() {
  const pathname = usePathname();
  const actor = useCurrentActor();
  const { setOpenMobile } = useSidebar();
  const visibleItems = NAV_ITEMS.filter((item) => item.isVisible(actor));

  function handleNavigate() {
    setOpenMobile(false);
  }

  return (
    <SidebarMenu>
      {visibleItems.map(({ href, label, icon: Icon }) => {
        const isActive = isActivePath(pathname, href);
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
              <Link href={href} onClick={handleNavigate} aria-current={isActive ? 'page' : undefined}>
                <Icon />
                <span>{label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const actor = useCurrentActor();
  const yearSummary = actor.operativeYear
    ? `Fellowship year ${actor.operativeYear.label} · ${YEAR_STATUS_LABELS[actor.operativeYear.status]}`
    : 'No open fellowship year';

  return (
    <>
      <AppSidebar collapsible="offcanvas">
        <SidebarHeader>
          <DashboardBrand />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <DashboardNavMenu />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <DashboardNavUser />
        </SidebarFooter>
      </AppSidebar>
      <SidebarInset className="bg-muted">
        <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-card">
          <div
            className={`${DASHBOARD_CONTENT_CLASS} flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-10`}
          >
            <SidebarTrigger className="-ml-1" />
            <p className="min-w-0 truncate text-sm text-muted-foreground">{yearSummary}</p>
          </div>
        </header>
        <div className="flex flex-1 flex-col py-6 lg:py-8">
          <div className={`${DASHBOARD_CONTENT_CLASS} px-4 sm:px-6 lg:px-10`}>
            {children}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <DashboardShell>{children}</DashboardShell>
      </SidebarProvider>
    </TooltipProvider>
  );
}
