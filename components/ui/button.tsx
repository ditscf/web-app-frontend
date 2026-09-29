import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-royal text-white shadow-premium hover:-translate-y-0.5 hover:bg-[#0B3276]',
        gold: 'bg-gold text-navy shadow-glow hover:-translate-y-0.5 hover:bg-[#FFD15B]',
        outline:
          'border border-white/25 bg-white/10 text-white backdrop-blur hover:-translate-y-0.5 hover:bg-white/20',
        ghost: 'text-navy hover:bg-navy/5',
        light: 'bg-white text-royal shadow-lg shadow-royal/10 hover:-translate-y-0.5',
      },
      size: {
        default: 'h-12',
        sm: 'h-10 px-4',
        lg: 'h-14 px-7 text-base',
        icon: 'h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button, buttonVariants };
