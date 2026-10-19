import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'w-full bg-card/80 p-5 text-foreground shadow-lg ring-1 ring-foreground/5 backdrop-blur-xl sm:p-8',
        className,
      )}
    >
      <p className='text-xs font-semibold uppercase tracking-widest text-accent'>
        {eyebrow}
      </p>
      <h1 className='mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl'>
        {title}
      </h1>
      {description ? (
        <div className='mt-2 text-sm leading-6 text-muted-foreground'>
          {description}
        </div>
      ) : null}
      <div className='mt-6'>{children}</div>
    </section>
  );
}
