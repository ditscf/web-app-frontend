'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export function SectionHeader({
  eyebrow,
  title,
  text,
  center,
  tone = 'light',
}: {
  eyebrow: string;
  title: string;
  text?: string;
  center?: boolean;
  tone?: 'light' | 'dark';
}) {
  return (
    <motion.div
      className={cn('max-w-3xl', center && 'mx-auto text-center')}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-100px' }}
      variants={fadeUp}
      transition={{ duration: 0.7 }}
    >
      <p className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
      <h2
        className={cn(
          'text-4xl font-black leading-[1.02] tracking-tight md:text-6xl',
          tone === 'dark' ? 'text-white' : 'text-navy',
        )}
      >
        {title}
      </h2>
      {text ? (
        <p className={cn('mt-6 text-lg leading-8', tone === 'dark' ? 'text-white/70' : 'text-slate-600')}>
          {text}
        </p>
      ) : null}
    </motion.div>
  );
}
