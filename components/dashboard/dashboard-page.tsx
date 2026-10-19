import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Shared max width for dashboard header + page body (see `sidebar.tsx`). */
export const DASHBOARD_CONTENT_CLASS = 'mx-auto w-full min-w-0 max-w-6xl';

/** Default dashboard card: flat surface without Sera ring shadow bleed. */
export const dashboardCardClassName = 'shadow-none ring-0';

export function DashboardPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid w-full min-w-0 gap-6', className)}>{children}</div>
  );
}
