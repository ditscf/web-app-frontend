'use client';

import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import { cn } from '@/lib/utils';

function InputOTP({
  length,
  className,
  slotClassName,
  ...props
}: Omit<OTPField.Root.Props, 'children'> & { slotClassName?: string }) {
  return (
    <OTPField.Root
      data-slot="input-otp"
      length={length}
      className={cn('flex w-full gap-1.5 sm:gap-2', className)}
      {...props}
    >
      {Array.from({ length }, (_, index) => (
        <OTPField.Input
          key={index}
          aria-label={index === 0 ? undefined : `Digit ${index + 1} of ${length}`}
          className={cn(
            'h-14 w-full min-w-0 max-w-14 flex-1 rounded-2xl border border-slate-200 bg-white text-center text-xl font-black text-navy outline-none transition focus:border-royal disabled:cursor-not-allowed disabled:opacity-50 data-[filled]:border-royal/40',
            slotClassName,
          )}
        />
      ))}
    </OTPField.Root>
  );
}

export { InputOTP };
