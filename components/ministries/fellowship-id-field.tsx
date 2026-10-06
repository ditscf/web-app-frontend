'use client';

import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FELLOWSHIP_ID_LENGTH } from '@/lib/validation';

interface FellowshipIdFieldProps
  extends Omit<ComponentProps<'input'>, 'id' | 'value' | 'onChange' | 'type' | 'inputMode' | 'maxLength'> {
  id: string;
  label?: string;
  value: string;
  error: string | null;
  onValueChange: (value: string) => void;
}

export function FellowshipIdField({
  id,
  label = "Member's Fellowship ID",
  value,
  error,
  onValueChange,
  className,
  ...props
}: FellowshipIdFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name="fellowshipId"
        inputMode="numeric"
        autoComplete="off"
        maxLength={FELLOWSHIP_ID_LENGTH}
        placeholder={`${FELLOWSHIP_ID_LENGTH} digits`}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'placeholder:font-semibold placeholder:text-slate-400',
          error && 'border-red-500 focus:border-red-500',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
