import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TONE_CLASS = {
  neutral: 'bg-muted px-2.5 py-1 text-muted-foreground',
  success: 'bg-success/12 px-2.5 py-1 text-success',
  warning: 'bg-warning/12 px-2.5 py-1 text-warning',
  info: 'bg-info/12 px-2.5 py-1 text-info',
  accent: 'bg-accent/10 px-2.5 py-1 text-accent',
} as const;

export type StatusTone = keyof typeof TONE_CLASS;

export function StatusBadge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: StatusTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Badge className={cn('tracking-wide', TONE_CLASS[tone], className)}>{children}</Badge>
  );
}
