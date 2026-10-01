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
    <section className={cn('glass w-full rounded-[2rem] p-3 text-navy shadow-premium sm:p-4', className)}>
      <div className="rounded-[1.5rem] bg-white p-5 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-royal">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{title}</h1>
        {description ? <div className="mt-3 leading-7 text-slate-600">{description}</div> : null}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
