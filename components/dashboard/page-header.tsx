import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  leading,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      {leading}
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
