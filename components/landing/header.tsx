'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandLockup } from '@/components/landing/brand-lockup';
import { Button } from '@/components/ui/button';
import { navItems } from '@/lib/site-content';
import { cn } from '@/lib/utils';

const SECTION_IDS = navItems.map((item) => item.toLowerCase());

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(SECTION_IDS[0]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (section): section is HTMLElement => section !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0.15, 0.4] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function handleToggleMenu() {
    setIsMenuOpen((open) => !open);
  }

  function handleCloseMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto w-full max-w-6xl px-4 pt-3 md:pt-4">
        <div className="flex items-center justify-between border border-sidebar-foreground/15 bg-sidebar/90 px-4 py-2.5 text-sidebar-foreground shadow-overlay backdrop-blur-md md:px-5">
          <BrandLockup href="/#home" className="min-w-0" />
          <nav className="hidden items-center gap-1 text-sm font-semibold lg:flex">
            {navItems.map((item) => {
              const id = item.toLowerCase();
              const isActive = activeSection === id;
              return (
                <a
                  key={item}
                  href={`#${id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'px-3 py-2 transition-colors',
                    isActive
                      ? 'text-sidebar-primary'
                      : 'text-sidebar-foreground/75 hover:text-sidebar-foreground',
                  )}
                >
                  {item}
                </a>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/auth/signin">Join Fellowship</Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              className="border-sidebar-foreground/25 bg-sidebar-foreground/10 text-sidebar-foreground hover:bg-sidebar-foreground/15 hover:text-sidebar-foreground lg:hidden"
              onClick={handleToggleMenu}
            >
              {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </Button>
          </div>
        </div>
        {isMenuOpen ? (
          <nav className="mt-px grid border border-sidebar-foreground/15 bg-sidebar p-2 text-sm font-semibold text-sidebar-foreground lg:hidden">
            {navItems.map((item) => {
              const id = item.toLowerCase();
              const isActive = activeSection === id;
              return (
                <a
                  key={item}
                  href={`#${id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'px-3 py-2.5',
                    isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/80',
                  )}
                  onClick={handleCloseMenu}
                >
                  {item}
                </a>
              );
            })}
            <Button asChild className="mt-2 sm:hidden">
              <Link href="/auth/signin" onClick={handleCloseMenu}>
                Join Fellowship
              </Link>
            </Button>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
