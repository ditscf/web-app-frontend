'use client';

import { ClipboardCheck, House, Menu, X, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Button } from '@/components/ui/button';
import type { ActorProfile } from '@/lib/api/auth';
import { canReviewApplications } from '@/lib/auth/access';
import { YEAR_STATUS_LABELS } from '@/lib/auth/responsibility-labels';
import { ditscfLogoImage } from '@/lib/site-content';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** A visibility rule from lib/auth/access.ts. The API still decides access to the page's data. */
  isVisible: (actor: ActorProfile) => boolean;
}

type NavTone = 'dark' | 'light';

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard/home', label: 'Home', icon: House, isVisible: () => true },
  { href: '/dashboard/applications', label: 'Applications', icon: ClipboardCheck, isVisible: canReviewApplications },
];

const MOBILE_NAV_ID = 'dashboard-mobile-nav';

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DashboardBrand() {
  return (
    <Link href="/dashboard/home" className="flex items-center gap-3">
      <Image src={ditscfLogoImage} alt="" className="h-9 w-auto object-contain" priority />
    </Link>
  );
}

function DashboardNavLinks({ tone, onNavigate }: { tone: NavTone; onNavigate?: () => void }) {
  const pathname = usePathname();
  const actor = useCurrentActor();
  const visibleItems = NAV_ITEMS.filter((item) => item.isVisible(actor));

  return (
    <ul className="grid gap-1">
      {visibleItems.map(({ href, label, icon: Icon }) => {
        const isActive = isActivePath(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive ? 'page' : undefined}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                tone === 'dark'
                  ? isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  : isActive
                    ? 'bg-royal/10 text-royal'
                    : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar({ children }: { children: ReactNode }) {
  const actor = useCurrentActor();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fullName = `${actor.firstName} ${actor.lastName}`;
  const yearSummary = actor.operativeYear
    ? `Fellowship year ${actor.operativeYear.label} · ${YEAR_STATUS_LABELS[actor.operativeYear.status]}`
    : 'No open fellowship year';

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  function handleToggleMenu() {
    setIsMenuOpen((isOpen) => !isOpen);
  }

  function handleCloseMenu() {
    setIsMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-8 bg-navy px-4 py-6 lg:flex">
        <div className="px-2">
          <DashboardBrand />
        </div>
        <nav aria-label="Dashboard">
          <DashboardNavLinks tone="dark" />
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-controls={MOBILE_NAV_ID}
                onClick={handleToggleMenu}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              <div className="lg:hidden">
                <DashboardBrand />
              </div>
              <p className="hidden truncate text-sm text-slate-600 lg:block">{yearSummary}</p>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-semibold text-navy">{fullName}</p>
              <SignOutButton />
            </div>
          </div>
          {isMenuOpen ? (
            <nav id={MOBILE_NAV_ID} aria-label="Dashboard" className="border-t border-slate-200 px-4 py-3 lg:hidden">
              <p className="px-3 pb-2 text-xs text-slate-500">{yearSummary}</p>
              <DashboardNavLinks tone="light" onNavigate={handleCloseMenu} />
            </nav>
          ) : null}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
