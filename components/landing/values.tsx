'use client';

import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { values } from '@/lib/site-content';

const MotionCard = motion.create(Card);

export function Values() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="section-shell">
        <SectionHeader
          center
          eyebrow="Mission, Vision & Core Values"
          title="Convictions that guide our worship, leadership, and service."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {values.map((value, index) => (
            <MotionCard
              key={value.title}
              className={cn('border-slate-200 p-6', index < 2 && 'md:col-span-3 lg:col-span-1')}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.04 }}
            >
              <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-gold/20 text-royal">
                <CheckCircle2 size={22} />
              </div>
              <CardTitle className="text-xl">{value.title}</CardTitle>
              <CardDescription className="mt-3">{value.text}</CardDescription>
            </MotionCard>
          ))}
        </div>
      </div>
    </section>
  );
}
