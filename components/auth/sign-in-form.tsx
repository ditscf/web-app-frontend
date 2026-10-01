'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'sonner';
import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isValidEmail } from '@/lib/validation';

const CODE_LENGTH = 6;
const CODE_INPUT_ID = 'verification-code';

type SignInStep = 'email' | 'code';

export function SignInForm() {
  const router = useRouter();
  const [step, setStep] = useState<SignInStep>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const canVerify = code.length === CODE_LENGTH && !isSigningIn;

  useEffect(() => {
    if (step === 'code') document.getElementById(CODE_INPUT_ID)?.focus();
  }, [step]);

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    if (emailError) setEmailError(null);
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Enter your email address.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Enter a valid email address, like name@example.com.');
      return;
    }

    setEmail(trimmedEmail);
    setCode('');
    setStep('code');
  }

  function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canVerify) return;

    setIsSigningIn(true);
    toast.success('Signed in successfully', { description: 'Welcome back to DITSCF.' });
    router.push('/dashboard/home');
  }

  function handleResendCode() {
    setCode('');
    toast.info('A new code is on its way', { description: `Check ${email} for a fresh 6-digit code.` });
    document.getElementById(CODE_INPUT_ID)?.focus();
  }

  function handleChangeEmail() {
    setCode('');
    setStep('email');
  }

  return (
    <motion.div
      key={step}
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {step === 'email' ? (
        <AuthCard
          eyebrow="Member sign in"
          title="Welcome back."
          description="Enter the email you registered with and we'll send you a 6-digit verification code."
        >
          <form noValidate onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                autoFocus
                value={email}
                onChange={handleEmailChange}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
                className={cn(
                  'placeholder:font-semibold placeholder:text-slate-400',
                  emailError && 'border-red-500 focus:border-red-500',
                )}
              />
              {emailError ? (
                <p id="email-error" role="alert" className="text-sm font-semibold text-red-600">
                  {emailError}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" className="w-full">
              Continue <ArrowRight size={18} />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            New to DITSCF?{' '}
            <Link href="/auth/signup" className="font-bold text-royal hover:underline">
              Create an account
            </Link>
          </p>
        </AuthCard>
      ) : (
        <AuthCard
          eyebrow="Verify your email"
          title="Check your inbox."
          description={
            <>
              We sent a 6-digit code to <strong className="break-all font-bold text-navy">{email}</strong>.
              If that email exists, enter the code sent to it to sign in.
            </>
          }
        >
          <form onSubmit={handleCodeSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor={CODE_INPUT_ID}>Verification code</Label>
              <InputOTP id={CODE_INPUT_ID} length={CODE_LENGTH} value={code} onValueChange={setCode} />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={!canVerify}>
              Verify and sign in <ArrowRight size={18} />
            </Button>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Button type="button" variant="ghost" size="sm" className="-ml-4" onClick={handleChangeEmail}>
              <ArrowLeft size={16} /> Use a different email
            </Button>
            <p className="text-slate-600">
              Didn&apos;t get it?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                className="rounded-full font-bold text-royal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Resend code
              </button>
            </p>
          </div>
        </AuthCard>
      )}
    </motion.div>
  );
}
