'use client';

import { MapPin } from 'lucide-react';
import { BrandLockup } from '@/components/landing/brand-lockup';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { navItems, socialLinks } from '@/lib/site-content';

export function Footer() {
  return (
    <footer className="bg-sidebar py-16 text-sidebar-foreground md:py-20">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <BrandLockup href="/#home" size="large" />
          <p className="mt-6 max-w-xl text-base leading-8 text-sidebar-foreground/70">
            Dar es Salaam Institute of Technology Students Christian Fellowship exists to raise
            Christ-centered students who worship, lead, serve, and transform communities.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-sidebar-primary uppercase">
              Navigation
            </h2>
            <div className="mt-4 grid gap-3 text-sm text-sidebar-foreground/75">
              {navItems.map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-sidebar-foreground">
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest text-sidebar-primary uppercase">
              Connect with us
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              <li className="flex items-center gap-3 text-sm font-semibold text-sidebar-foreground/80">
                <MapPin className="size-5 shrink-0" aria-hidden />
                Dar es Salaam, Tanzania
              </li>
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.label}>
                    <Button
                      asChild
                      variant="ghost"
                      className="h-auto justify-start gap-3 p-0 text-sm font-semibold tracking-normal text-sidebar-foreground normal-case hover:bg-transparent hover:text-sidebar-primary [&_svg]:size-5!"
                    >
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        <Icon size={20} aria-hidden />
                        {link.label}
                      </a>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      <Separator className="mx-auto mt-12 w-full max-w-6xl bg-sidebar-foreground/10" />
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 text-center text-sm text-sidebar-foreground/50">
        © 2026 DIT Students Christian Fellowship. All rights reserved.
      </div>
    </footer>
  );
}
