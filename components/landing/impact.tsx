'use client';

import { AnimatedNumber } from '@/components/landing/animated-number';
import { SectionHeader } from '@/components/landing/section-header';
import { Card } from '@/components/ui/card';
import { impactStats } from '@/lib/site-content';

export function Impact() {
  return (
    <section className='mx-auto w-full max-w-6xl px-4 py-20'>
      <SectionHeader
        center
        eyebrow='Impact'
        title='The fruit of consistent worship, discipleship, and service.'
      />
      <div className='mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3'>
        {impactStats.map((stat) => (
          <Card key={stat.label} className='p-6 text-left shadow-none ring-0'>
            <strong className='block text-4xl font-bold text-accent'>
              <AnimatedNumber value={stat.value} />
            </strong>
            <span className='mt-3 block font-bold text-muted-foreground'>
              {stat.label}
            </span>
          </Card>
        ))}
      </div>
    </section>
  );
}
