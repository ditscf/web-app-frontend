'use client';

import { ArrowLeft, Mail, PencilLine } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { dashboardCardClassName } from '@/components/dashboard/dashboard-page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import {
  getUserFacingMessage,
  toApiError,
  type ApiError,
} from '@/lib/api/errors';
import {
  confirmEmailChange,
  requestEmailChange,
  type Profile,
} from '@/lib/api/profile';
import { cn } from '@/lib/utils';
import {
  LOGIN_CODE_LENGTH,
  loginCodeSchema,
  loginEmailSchema,
} from '@/lib/validation';

type EmailChangeStep =
  | { step: 'idle' }
  | { step: 'email' }
  | { step: 'code'; newEmail: string; expiresAt: string };

const NEW_EMAIL_INPUT_ID = 'new-email';
const CODE_INPUT_ID = 'email-change-code';
const SERVICE_UNAVAILABLE_STATUS = 503;

function formatExpiryTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeStyle: 'short' }).format(
    new Date(isoDateTime),
  );
}

/** The API's 503 here means the code email could not be sent, which the member can act on. */
function getRequestErrorMessage(apiError: ApiError): string {
  if (apiError.status === SERVICE_UNAVAILABLE_STATUS) return apiError.message;
  return getUserFacingMessage(apiError);
}

interface EmailChangeCardProps {
  email: string;
  onChanged: (profile: Profile) => void;
}

export function EmailChangeCard({ email, onChanged }: EmailChangeCardProps) {
  const [state, setState] = useState<EmailChangeStep>({ step: 'idle' });
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const canConfirm =
    loginCodeSchema.safeParse(code).success && !isConfirming && !isSending;

  function handleStart() {
    setNewEmail('');
    setEmailError(null);
    setState({ step: 'email' });
  }

  function handleCancel() {
    setCode('');
    setCodeError(null);
    setEmailError(null);
    setState({ step: 'idle' });
  }

  function handleUseDifferentEmail() {
    setCode('');
    setCodeError(null);
    setState({ step: 'email' });
  }

  function handleCodeChange(value: string) {
    setCode(value);
    if (codeError) setCodeError(null);
  }

  async function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;

    const parsedEmail = loginEmailSchema.safeParse(newEmail);
    if (!parsedEmail.success) {
      setEmailError(
        parsedEmail.error.issues[0]?.message ?? 'Enter a valid email address.',
      );
      return;
    }
    if (parsedEmail.data.toLowerCase() === email.toLowerCase()) {
      setEmailError('This is already your email.');
      return;
    }

    setIsSending(true);
    try {
      const { expiresAt } = await requestEmailChange(parsedEmail.data);
      setNewEmail(parsedEmail.data);
      setCode('');
      setCodeError(null);
      setState({ step: 'code', newEmail: parsedEmail.data, expiresAt });
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      setEmailError(getRequestErrorMessage(apiError));
    } finally {
      setIsSending(false);
    }
  }

  async function handleResendCode() {
    if (state.step !== 'code' || isSending) return;

    setIsSending(true);
    setCode('');
    setCodeError(null);
    try {
      const { expiresAt } = await requestEmailChange(state.newEmail);
      setState({ step: 'code', newEmail: state.newEmail, expiresAt });
      toast.info('A new code is on its way', {
        description: `Check ${state.newEmail} for a fresh code.`,
      });
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't send a new code", {
        description: getRequestErrorMessage(apiError),
      });
    } finally {
      setIsSending(false);
      document.getElementById(CODE_INPUT_ID)?.focus();
    }
  }

  async function handleConfirmSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canConfirm) return;

    setIsConfirming(true);
    try {
      const profile = await confirmEmailChange(code);
      setCode('');
      setState({ step: 'idle' });
      onChanged(profile);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (apiError.kind === 'validation' || apiError.kind === 'conflict') {
        setCode('');
        setCodeError(apiError.message);
        return;
      }
      toast.error("We couldn't change your email", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <Card className={cn('relative overflow-hidden p-6', dashboardCardClassName)}>
      <div
        className='pointer-events-none absolute inset-0 bg-brand-radial opacity-20'
        aria-hidden
      />
      <div className='relative'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-start gap-3'>
            <div className='flex size-10 shrink-0 items-center justify-center bg-primary/15 text-primary'>
              <Mail size={20} aria-hidden />
            </div>
            <h2 className='pt-2 text-lg font-bold text-foreground'>
              Email address
            </h2>
          </div>
          {state.step === 'idle' ? (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='shrink-0 normal-case tracking-normal text-primary'
              onClick={handleStart}
            >
              <PencilLine size={14} aria-hidden='true' /> Change email
            </Button>
          ) : null}
        </div>

        {state.step === 'idle' ? (
          <div className='mt-5 border border-border bg-muted/40 p-4'>
            <p className='break-all text-sm font-semibold text-foreground'>
              {email}
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              You sign in with this email.
            </p>
          </div>
        ) : null}
      </div>

      {state.step === 'email' ? (
        <form
          noValidate
          onSubmit={handleRequestSubmit}
          className='relative mt-5 grid gap-5 border-t border-border pt-5'
        >
          <p className='text-sm text-muted-foreground'>
            We&apos;ll send a {LOGIN_CODE_LENGTH}-digit code to the new address.
            Your email changes only after you enter it.
          </p>
          <div className='space-y-2'>
            <Label htmlFor={NEW_EMAIL_INPUT_ID}>New email address</Label>
            <Input
              id={NEW_EMAIL_INPUT_ID}
              name='newEmail'
              type='email'
              inputMode='email'
              autoComplete='email'
              placeholder='you@example.com'
              autoFocus
              value={newEmail}
              disabled={isSending}
              onChange={(event) => {
                setNewEmail(event.target.value);
                if (emailError) setEmailError(null);
              }}
              aria-invalid={Boolean(emailError)}
              aria-describedby={
                emailError ? `${NEW_EMAIL_INPUT_ID}-error` : undefined
              }
              className={cn(
                'placeholder:font-semibold placeholder:text-muted-foreground',
                emailError && 'border-destructive focus:border-destructive',
              )}
            />
            {emailError ? (
              <p
                id={`${NEW_EMAIL_INPUT_ID}-error`}
                role='alert'
                className='text-sm font-semibold text-destructive'
              >
                {emailError}
              </p>
            ) : null}
          </div>
          <div className='flex flex-wrap items-center justify-end gap-3'>
            <Button
              type='button'
              variant='ghost'
              onClick={handleCancel}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSending}>
              {isSending ? 'Sending code...' : 'Send code'}
            </Button>
          </div>
        </form>
      ) : null}

      {state.step === 'code' ? (
        <div className='relative mt-5 grid gap-5 border-t border-border pt-5'>
          <p className='text-sm text-muted-foreground'>
            We sent a {LOGIN_CODE_LENGTH}-digit code to{' '}
            <strong className='break-all font-bold text-foreground'>
              {state.newEmail}
            </strong>
            . It expires at {formatExpiryTime(state.expiresAt)}.
          </p>
          <form onSubmit={handleConfirmSubmit} className='grid gap-5'>
            <div className='space-y-2'>
              <Label htmlFor={CODE_INPUT_ID}>Confirmation code</Label>
              <InputOTP
                id={CODE_INPUT_ID}
                maxLength={LOGIN_CODE_LENGTH}
                value={code}
                onChange={handleCodeChange}
                disabled={isConfirming}
                autoFocus
              >
                <InputOTPGroup>
                  {Array.from({ length: LOGIN_CODE_LENGTH }, (_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {codeError ? (
                <p
                  role='alert'
                  className='text-sm font-semibold text-destructive'
                >
                  {codeError}
                </p>
              ) : null}
            </div>
            <div className='flex flex-wrap items-center justify-end gap-3'>
              <Button
                type='button'
                variant='ghost'
                onClick={handleCancel}
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={!canConfirm}>
                {isConfirming ? 'Confirming...' : 'Confirm new email'}
              </Button>
            </div>
          </form>
          <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='-ml-3'
              onClick={handleUseDifferentEmail}
              disabled={isConfirming || isSending}
            >
              <ArrowLeft size={16} aria-hidden='true' /> Use a different email
            </Button>
            <p className='text-muted-foreground'>
              Didn&apos;t get it?{' '}
              <button
                type='button'
                onClick={handleResendCode}
                disabled={isSending || isConfirming}
                className='rounded-full font-bold text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
              >
                {isSending ? 'Sending...' : 'Resend code'}
              </button>
            </p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
