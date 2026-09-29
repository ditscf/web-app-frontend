import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy outline-none transition focus:border-royal',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
