'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ditscfLogoImage, navItems } from '@/lib/site-content';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  function handleToggleMenu() {
    setIsMenuOpen((open) => !open);
  }

  function handleCloseMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="section-shell relative mt-4">
        <div className="flex items-center justify-between rounded-full border border-white/20 bg-navy/80 px-4 py-3 text-white shadow-2xl shadow-navy/20 backdrop-blur-2xl md:px-6">
          <a href="#home" className="flex items-center gap-3" onClick={handleCloseMenu}>
            <Image
              src={ditscfLogoImage}
              alt="DITSCF Logo"
              className="h-10 w-auto object-contain"
              priority
            />
            <span>
              <strong className="block text-sm font-black tracking-wide text-gold">DITSCF</strong>
              <small className="hidden text-xs text-white/65 sm:block">One Family For Gospel</small>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/78 lg:flex">
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-gold">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="gold" size="sm" className="hidden sm:inline-flex">
              <Link href="/auth/signin">Join Fellowship</Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              className="lg:hidden"
              onClick={handleToggleMenu}
            >
              {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </Button>
          </div>
        </div>
        {isMenuOpen ? (
          <nav className="mt-2 grid gap-1 rounded-3xl border border-white/20 bg-navy/95 p-3 text-sm font-semibold text-white/80 shadow-2xl shadow-navy/20 backdrop-blur-2xl lg:hidden">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-2xl px-4 py-3 transition hover:bg-white/10 hover:text-gold"
                onClick={handleCloseMenu}
              >
                {item}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
