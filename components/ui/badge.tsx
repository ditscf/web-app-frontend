import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full', {
  variants: {
    variant: {
      default: 'bg-royal/8 px-3 py-1 text-xs font-bold text-royal',
      gold: 'bg-gold px-4 py-2 text-sm font-black text-navy',
      soft: 'bg-gold/20 px-3 py-1 text-xs font-bold text-navy',
      live: 'bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
