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
      <p
        className={cn(
          'mb-3 text-xs font-semibold uppercase tracking-widest',
          tone === 'dark' ? 'text-sidebar-primary' : 'text-accent',
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          'text-3xl font-bold leading-tight tracking-tight md:text-4xl',
          tone === 'dark' ? 'text-sidebar-foreground' : 'text-foreground',
        )}
      >
        {title}
      </h2>
      {text ? (
        <p
          className={cn(
            'mt-4 max-w-2xl text-base leading-7',
            tone === 'dark' ? 'text-sidebar-foreground/70' : 'text-muted-foreground',
            center && 'mx-auto',
          )}
        >
          {text}
        </p>
      ) : null}
    </motion.div>
  );
}
