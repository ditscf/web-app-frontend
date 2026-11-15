'use client';

import {
  CalendarDays,
  ClipboardCheck,
  ContactRound,
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
import { StatusBadge } from '@/components/dashboard/status-badge';
import {
  Sidebar as AppSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  canViewEvents,
  canViewMemberDirectory,
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
    href: '/dashboard/members',
    label: 'Members',
    icon: ContactRound,
    isVisible: canViewMemberDirectory,
  },
  {
    href: '/dashboard/events',
    label: 'Events',
    icon: CalendarDays,
    isVisible: canViewEvents,
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

const WORK_HREFS = new Set([
  '/dashboard/home',
  '/dashboard/ministries',
  '/dashboard/members',
  '/dashboard/events',
  '/dashboard/applications',
]);

function currentPageLabel(pathname: string): string {
  const match = [...NAV_ITEMS]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => isActivePath(pathname, item.href));
  return match?.label ?? 'Dashboard';
}

function DashboardNavMenu({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  function handleNavigate() {
    setOpenMobile(false);
  }

  return (
    <SidebarMenu>
      {items.map(({ href, label, icon: Icon }) => {
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
  const pathname = usePathname();
  const actor = useCurrentActor();
  const visibleItems = NAV_ITEMS.filter((item) => item.isVisible(actor));
  const workItems = visibleItems.filter((item) => WORK_HREFS.has(item.href));
  const accountItems = visibleItems.filter((item) => !WORK_HREFS.has(item.href));
  const operativeYear = actor.operativeYear;
  const pageLabel = currentPageLabel(pathname);

  return (
    <>
      <AppSidebar collapsible="offcanvas">
        <SidebarHeader>
          <DashboardBrand />
        </SidebarHeader>
        <SidebarContent>
          {workItems.length > 0 ? (
            <SidebarGroup>
              <SidebarGroupLabel>Work</SidebarGroupLabel>
              <SidebarGroupContent>
                <DashboardNavMenu items={workItems} />
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
          {accountItems.length > 0 ? (
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <DashboardNavMenu items={accountItems} />
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
        </SidebarContent>
      </AppSidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{pageLabel}</p>
            <p className="truncate text-xs text-muted-foreground">
              {operativeYear
                ? `Fellowship year ${operativeYear.label}`
                : 'No open fellowship year'}
            </p>
          </div>
          {operativeYear ? (
            <StatusBadge
              className="hidden sm:inline-flex"
              tone={operativeYear.status === 'OPEN' ? 'success' : 'warning'}
            >
              {YEAR_STATUS_LABELS[operativeYear.status]}
            </StatusBadge>
          ) : null}
          <DashboardNavUser surface="header" />
        </header>
        <div className="flex flex-1 flex-col py-6 lg:py-8">
          <div className={`${DASHBOARD_CONTENT_CLASS} px-4 sm:px-6`}>{children}</div>
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
