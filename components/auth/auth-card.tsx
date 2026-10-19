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
      <p className='text-sm font-bold uppercase tracking-[0.18em] text-accent'>
        {eyebrow}
      </p>
      <h1 className='mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl'>
        {title}
      </h1>
      {description ? (
        <div className='mt-3 leading-7 text-muted-foreground'>
          {description}
        </div>
      ) : null}
      <div className='mt-8'>{children}</div>
    </section>
  );
}
