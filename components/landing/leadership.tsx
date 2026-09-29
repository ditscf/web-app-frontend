'use client';

import Image from 'next/image';
import { SectionHeader } from '@/components/landing/section-header';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { leaders } from '@/lib/site-content';

export function Leadership() {
  return (
    <section className="section-shell py-24">
      <SectionHeader
        center
        eyebrow="Leadership Team"
        title="Servant leadership with accountability, prayer, and excellence."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {leaders.map((leader) => (
          <Card key={leader.role} className="overflow-hidden rounded-[2rem] text-center">
            <div className="relative h-44">
              <Image
                src={leader.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 220px, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <p className="mt-1 font-bold text-royal">{leader.name}</p>
              <CardTitle>{leader.role}</CardTitle>
              <CardDescription className="mt-3 text-sm leading-6">{leader.text}</CardDescription>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
