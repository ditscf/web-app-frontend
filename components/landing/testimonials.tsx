'use client';

import { MessageCircleHeart } from 'lucide-react';
import { SectionHeader } from '@/components/landing/section-header';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { testimonials } from '@/lib/site-content';

export function Testimonials() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="section-shell">
        <SectionHeader center eyebrow="Testimonials" title="Stories from students and associates." />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.name} className="rounded-[2rem] p-7">
              <MessageCircleHeart className="text-gold" size={34} />
              <p className="mt-6 text-lg leading-8 text-slate-700">“{item.quote}”</p>
              <Separator className="mt-7" />
              <div className="pt-5">
                <strong className="block text-navy">{item.name}</strong>
                <span className="text-sm font-semibold text-slate-500">{item.role}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
