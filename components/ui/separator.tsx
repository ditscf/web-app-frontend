import * as React from 'react';
import { cn } from '@/lib/utils';

function Separator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="separator"
      role="separator"
      className={cn('h-px w-full shrink-0 bg-slate-200', className)}
      {...props}
    />
  );
}

export { Separator };
