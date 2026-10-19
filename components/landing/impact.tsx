'use client';

import { AnimatedNumber } from '@/components/landing/animated-number';
import { SectionHeader } from '@/components/landing/section-header';
import { Card } from '@/components/ui/card';
import { impactStats } from '@/lib/site-content';

export function Impact() {
  return (
    <section className='mx-auto w-full max-w-6xl px-4 py-24'>
      <SectionHeader
        center
        eyebrow='Impact'
        title='The fruit of consistent worship, discipleship, and service.'
      />
      <div className='mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {impactStats.map((stat) => (
          <Card key={stat.label} className='p-8 text-center'>
            <strong className='block text-5xl font-bold text-accent'>
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
