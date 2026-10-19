'use client';

import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ditscfLogoImage, navItems, socialLinks } from '@/lib/site-content';

export function Footer() {
  return (
    <footer className="bg-sidebar py-14 text-sidebar-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image src={ditscfLogoImage} alt="DITSCF Logo" className="h-12 w-auto object-contain" />
            <div>
              <strong className="block text-xl font-bold text-sidebar-primary">DITSCF</strong>
              <span className="text-sm text-sidebar-foreground/60">One Family For Gospel</span>
            </div>
          </div>
          <p className="mt-6 max-w-xl leading-8 text-sidebar-foreground/62">
            Dar es Salaam Institute of Technology Students Christian Fellowship exists to raise
            Christ-centered students who worship, lead, serve, and transform communities.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="font-bold text-sidebar-primary">Navigation</h3>
            <div className="mt-4 grid gap-3 text-sidebar-foreground/70">
              {navItems.map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-sidebar-foreground">
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sidebar-primary">Connect with us</h3>
            <ul className="mt-4 flex flex-col gap-4">
              <li className="flex items-center gap-3 text-sm font-semibold text-sidebar-foreground/78">
                <MapPin className="size-7 shrink-0 text-sidebar-foreground" aria-hidden />
                Dar es Salaam, Tanzania
              </li>
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.label}>
                    <Button
                      asChild
                      variant="ghost"
                      className="h-auto justify-start gap-3 p-0 text-sm font-semibold normal-case tracking-normal text-sidebar-foreground hover:bg-transparent hover:text-sidebar-foreground/70 [&_svg]:size-7!"
                    >
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        <Icon size={28} aria-hidden />
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
      <Separator className="mx-auto mt-12 w-full max-w-6xl bg-sidebar-foreground/10 px-4" />
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 text-center text-sm text-sidebar-foreground/46">
        © 2026 DIT Students Christian Fellowship. All rights reserved.
      </div>
    </footer>
  );
}
