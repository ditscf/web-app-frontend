'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'sonner';
import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { DASHBOARD_HOME_PATH, ONBOARDING_PATH } from '@/constants/constant';
import { getCurrentActor, requestLoginCode, verifyLoginCode, type ActorProfile } from '@/lib/api/auth';
import { getUserFacingMessage, isApiError, toApiError } from '@/lib/api/errors';
import { isOnboardingRequired } from '@/lib/auth/access';
import { toSessionUser } from '@/lib/auth/session-user';
import { cn } from '@/lib/utils';
import { LOGIN_CODE_LENGTH, loginCodeSchema, loginEmailSchema } from '@/lib/validation';

const CODE_INPUT_ID = 'verification-code';
const SESSION_NOT_KEPT_MESSAGE =
  "Your browser didn't keep the sign-in session. Allow cookies for this site and try again.";
const FRONTEND_SESSION_ERROR_MESSAGE = "We couldn't finish signing you in. Please try again.";

type SignInStep = 'email' | 'code';

type SignInResult = { status: 'signed_in'; actor: ActorProfile } | { status: 'failed'; message: string };

async function completeSignIn(email: string, code: string): Promise<SignInResult> {
  try {
    await verifyLoginCode(email, code);
  } catch (error) {
    return { status: 'failed', message: getUserFacingMessage(error) };
  }

  let actor;
  try {
    actor = await getCurrentActor();
  } catch (error) {
    if (isApiError(error) && error.kind === 'unauthenticated') {
      return { status: 'failed', message: SESSION_NOT_KEPT_MESSAGE };
    }
    return { status: 'failed', message: getUserFacingMessage(error) };
  }

  try {
    const result = await signIn('credentials', { ...toSessionUser(actor), redirect: false });
    if (result.ok && !result.error) return { status: 'signed_in', actor };
    return { status: 'failed', message: FRONTEND_SESSION_ERROR_MESSAGE };
  } catch {
    return { status: 'failed', message: FRONTEND_SESSION_ERROR_MESSAGE };
  }
}

export function SignInForm() {
  const router = useRouter();
  const [step, setStep] = useState<SignInStep>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const canVerify = loginCodeSchema.safeParse(code).success && !isSigningIn;

  useEffect(() => {
    if (step === 'code') document.getElementById(CODE_INPUT_ID)?.focus();
  }, [step]);

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    if (emailError) setEmailError(null);
  }

  function handleCodeChange(value: string) {
    setCode(value);
    if (codeError) setCodeError(null);
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRequestingCode) return;

    const parsedEmail = loginEmailSchema.safeParse(email);
    if (!parsedEmail.success) {
      setEmailError(parsedEmail.error.issues[0]?.message ?? 'Enter a valid email address.');
      return;
    }

    setIsRequestingCode(true);
    try {
      await requestLoginCode(parsedEmail.data);
      setEmail(parsedEmail.data);
      setCode('');
      setCodeError(null);
      setStep('code');
    } catch (error) {
      if (toApiError(error).kind === 'validation') {
        setEmailError(getUserFacingMessage(error));
      } else {
        toast.error("We couldn't send your code", { description: getUserFacingMessage(error) });
      }
    } finally {
      setIsRequestingCode(false);
    }
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canVerify) return;

    setIsSigningIn(true);
    setCodeError(null);
    const result = await completeSignIn(email, code);
    if (result.status === 'failed') {
      setCodeError(result.message);
      setIsSigningIn(false);
      return;
    }

    toast.success('Signed in successfully', { description: 'Welcome back to DITSCF.' });
    router.replace(isOnboardingRequired(result.actor) ? ONBOARDING_PATH : DASHBOARD_HOME_PATH);
  }

  async function handleResendCode() {
    if (isRequestingCode) return;

    setIsRequestingCode(true);
    setCode('');
    setCodeError(null);
    try {
      await requestLoginCode(email);
      toast.info('A new code is on its way', {
        description: `Check ${email} for a fresh ${LOGIN_CODE_LENGTH}-digit code.`,
      });
    } catch (error) {
      toast.error("We couldn't send a new code", { description: getUserFacingMessage(error) });
    } finally {
      setIsRequestingCode(false);
      document.getElementById(CODE_INPUT_ID)?.focus();
    }
  }

  function handleChangeEmail() {
    setCode('');
    setCodeError(null);
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
                  'placeholder:font-semibold placeholder:text-muted-foreground',
                  emailError && 'border-destructive focus:border-destructive',
                )}
              />
              {emailError ? (
                <p id="email-error" role="alert" className="text-sm font-semibold text-destructive">
                  {emailError}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={isRequestingCode}>
              {isRequestingCode ? 'Sending code...' : 'Continue'} <ArrowRight size={18} />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to DITSCF?{' '}
            <Link href="/auth/signup" className="font-bold text-accent hover:underline">
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
              We sent a 6-digit code to <strong className="break-all font-bold text-foreground">{email}</strong>.
              If that email exists, enter the code sent to it to sign in.
            </>
          }
        >
          <form onSubmit={handleCodeSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor={CODE_INPUT_ID}>Verification code</Label>
              <InputOTP id={CODE_INPUT_ID} maxLength={LOGIN_CODE_LENGTH} value={code} onChange={handleCodeChange}>
                <InputOTPGroup>
                  {Array.from({ length: LOGIN_CODE_LENGTH }, (_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {codeError ? (
                <p id="code-error" role="alert" className="text-sm font-semibold text-destructive">
                  {codeError}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={!canVerify}>
              {isSigningIn ? 'Signing in...' : 'Verify and sign in'} <ArrowRight size={18} />
            </Button>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Button type="button" variant="ghost" size="sm" className="-ml-4" onClick={handleChangeEmail}>
              <ArrowLeft size={16} /> Use a different email
            </Button>
            <p className="text-muted-foreground">
              Didn&apos;t get it?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isRequestingCode || isSigningIn}
                className="rounded-full disabled:opacity-50 font-bold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
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
