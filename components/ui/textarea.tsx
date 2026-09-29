import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-navy outline-none transition focus:border-royal',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
