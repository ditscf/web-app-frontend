'use client';

import Image from 'next/image';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ditscfLogoImage, navItems } from '@/lib/site-content';

export function Footer() {
  function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <footer className="bg-navy py-14 text-white">
      <div className="section-shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image src={ditscfLogoImage} alt="DITSCF Logo" className="h-12 w-auto object-contain" />
            <div>
              <strong className="block text-xl font-black text-gold">DITSCF</strong>
              <span className="text-sm text-white/60">One Family For Gospel</span>
            </div>
          </div>
          <p className="mt-6 max-w-xl leading-8 text-white/62">
            Dar es Salaam Institute of Technology Students Christian Fellowship exists to raise
            Christ-centered students who worship, lead, serve, and transform communities.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="font-black text-gold">Navigation</h3>
            <div className="mt-4 grid gap-3 text-white/70">
              {navItems.map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-gold">
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-black text-gold">Newsletter</h3>
            <p className="mt-4 text-sm leading-6 text-white/62">
              Receive updates, event reminders, and ministry news.
            </p>
            <form className="mt-4 flex rounded-full bg-white p-1" onSubmit={handleNewsletterSubmit}>
              <Input
                type="email"
                autoComplete="email"
                aria-label="Email address"
                placeholder="Email address"
                className="h-10 min-w-0 flex-1 rounded-full border-0 bg-transparent px-4 font-normal shadow-none focus:border-transparent"
              />
              <Button size="sm" variant="gold" type="submit">
                Join
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Separator className="section-shell mt-12 bg-white/10" />
      <div className="section-shell pt-6 text-sm text-white/46">
        © 2026 DIT Students Christian Fellowship. All rights reserved.
      </div>
    </footer>
  );
}
