'use client';

import { AnimatedNumber } from '@/components/landing/animated-number';
import { SectionHeader } from '@/components/landing/section-header';
import { Card } from '@/components/ui/card';
import { impactStats } from '@/lib/site-content';

export function Impact() {
  return (
    <section className="section-shell py-24">
      <SectionHeader
        center
        eyebrow="Impact"
        title="The fruit of consistent worship, discipleship, and service."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {impactStats.map((stat) => (
          <Card key={stat.label} className="rounded-[2rem] p-8 text-center">
            <strong className="block text-5xl font-black text-royal">
              <AnimatedNumber value={stat.value} />
            </strong>
            <span className="mt-3 block font-bold text-slate-600">{stat.label}</span>
          </Card>
        ))}
      </div>
    </section>
  );
}
