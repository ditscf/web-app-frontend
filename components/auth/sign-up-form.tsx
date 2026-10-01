'use client';

import { ArrowLeft, ArrowRight, Check, PencilLine } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCoursesForStudyClass, studyClasses, yearsOfStudy } from '@/lib/onboarding-options';
import { cn } from '@/lib/utils';
import { isValidEmail, isValidPhone } from '@/lib/validation';

type SignUpStep = 'basic' | 'contact' | 'education' | 'review';

interface SignUpData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  studyClass: string;
  course: string;
  yearOfStudy: string;
}

type SignUpField = keyof SignUpData;
type SignUpErrors = Partial<Record<SignUpField, string>>;

interface StepConfig {
  id: SignUpStep;
  eyebrow: string;
  title: string;
  description: string;
  fields: readonly SignUpField[];
  focusId: string | null;
}

const STEPS: readonly StepConfig[] = [
  {
    id: 'basic',
    eyebrow: 'Basic information',
    title: "Let's start with you.",
    description: 'Tell us your name and date of birth.',
    fields: ['firstName', 'lastName', 'dateOfBirth'],
    focusId: 'firstName',
  },
  {
    id: 'contact',
    eyebrow: 'Contact details',
    title: 'How can we reach you?',
    description: "You'll use this email to sign in to DITSCF.",
    fields: ['email', 'phone'],
    focusId: 'email',
  },
  {
    id: 'education',
    eyebrow: 'Education',
    title: 'Where are you studying?',
    description: 'Choose your class first, then your course and year of study.',
    fields: ['studyClass', 'course', 'yearOfStudy'],
    focusId: 'studyClass',
  },
  {
    id: 'review',
    eyebrow: 'Review',
    title: 'Check your details.',
    description: 'Make sure everything is correct before you submit your application.',
    fields: [],
    focusId: null,
  },
];

const REVIEW_STEP_INDEX = STEPS.length - 1;

const INITIAL_DATA: SignUpData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  studyClass: '',
  course: '',
  yearOfStudy: '',
};

const INPUT_CLASS = 'placeholder:font-semibold placeholder:text-slate-400';
const INPUT_ERROR_CLASS = 'border-red-500 focus:border-red-500';
const SELECT_ERROR_CLASS = 'border-red-500 focus-visible:border-red-500 data-[popup-open]:border-red-500';

function getTodayIsoDate(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

function getFieldError(field: SignUpField, data: SignUpData): string | undefined {
  switch (field) {
    case 'firstName':
      return data.firstName ? undefined : 'Enter your first name.';
    case 'lastName':
      return data.lastName ? undefined : 'Enter your last name.';
    case 'dateOfBirth':
      if (!data.dateOfBirth) return 'Enter your date of birth.';
      return data.dateOfBirth > getTodayIsoDate() ? "Date of birth can't be in the future." : undefined;
    case 'email':
      if (!data.email) return 'Enter your email address.';
      return isValidEmail(data.email) ? undefined : 'Enter a valid email address, like name@example.com.';
    case 'phone':
      if (!data.phone) return 'Enter your phone number.';
      return isValidPhone(data.phone) ? undefined : 'Enter a valid phone number, like +255 745 000 000.';
    case 'studyClass':
      return data.studyClass ? undefined : 'Choose your class.';
    case 'course':
      return data.course ? undefined : 'Choose your course.';
    case 'yearOfStudy':
      return data.yearOfStudy ? undefined : 'Choose your year of study.';
  }
}

function trimTextFields(data: SignUpData): SignUpData {
  return {
    ...data,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
  };
}

function getErrorProps(field: SignUpField, error: string | undefined) {
  return {
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${field}-error` : undefined,
  };
}

export function SignUpForm() {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<SignUpData>(INITIAL_DATA);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [isReturningToReview, setIsReturningToReview] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const step = STEPS[stepIndex];
  const isReviewStep = step.id === 'review';
  const courses = getCoursesForStudyClass(data.studyClass);

  useEffect(() => {
    if (step.focusId) document.getElementById(step.focusId)?.focus();
  }, [step.focusId]);

  function updateField<Field extends SignUpField>(field: Field, value: SignUpData[Field]) {
    setData((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleStudyClassChange(value: string | null) {
    const studyClass = value ?? '';
    setData((current) => ({
      ...current,
      studyClass,
      course: getCoursesForStudyClass(studyClass).includes(current.course) ? current.course : '',
    }));
    if (errors.studyClass) setErrors((current) => ({ ...current, studyClass: undefined }));
  }

  function goToStep(index: number) {
    setErrors({});
    setStepIndex(index);
  }

  function handleBack() {
    setIsReturningToReview(false);
    goToStep(stepIndex - 1);
  }

  function handleEditStep(stepId: SignUpStep) {
    setIsReturningToReview(true);
    goToStep(STEPS.findIndex((candidate) => candidate.id === stepId));
  }

  function submitApplication() {
    if (isSubmitted) return;

    setIsSubmitted(true);
    toast.success('Application received', {
      description: "Your application is under review. We'll email you once it's accepted.",
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isReviewStep) {
      submitApplication();
      return;
    }

    const trimmedData = trimTextFields(data);
    const stepErrors: SignUpErrors = {};
    for (const field of step.fields) {
      stepErrors[field] = getFieldError(field, trimmedData);
    }
    setData(trimmedData);

    const firstInvalidField = step.fields.find((field) => stepErrors[field]);
    if (firstInvalidField) {
      setErrors(stepErrors);
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    if (isReturningToReview) {
      setIsReturningToReview(false);
      goToStep(REVIEW_STEP_INDEX);
      return;
    }

    goToStep(stepIndex + 1);
  }

  return (
    <div className="w-full max-w-lg">
      <StepProgress currentIndex={stepIndex} />
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <AuthCard eyebrow={step.eyebrow} title={step.title} description={step.description}>
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            {step.id === 'basic' ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    field="firstName"
                    label="First name"
                    error={errors.firstName}
                    autoComplete="given-name"
                    placeholder="Johnson"
                    value={data.firstName}
                    onChange={(event) => updateField('firstName', event.target.value)}
                  />
                  <TextField
                    field="lastName"
                    label="Last name"
                    error={errors.lastName}
                    autoComplete="family-name"
                    placeholder="Rutabangwa"
                    value={data.lastName}
                    onChange={(event) => updateField('lastName', event.target.value)}
                  />
                </div>
                <TextField
                  field="dateOfBirth"
                  label="Date of birth"
                  error={errors.dateOfBirth}
                  type="date"
                  autoComplete="bday"
                  className={cn(!data.dateOfBirth && 'font-semibold text-slate-400')}
                  value={data.dateOfBirth}
                  onChange={(event) => updateField('dateOfBirth', event.target.value)}
                />
              </>
            ) : null}

            {step.id === 'contact' ? (
              <>
                <TextField
                  field="email"
                  label="Email address"
                  error={errors.email}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={data.email}
                  onChange={(event) => updateField('email', event.target.value)}
                />
                <TextField
                  field="phone"
                  label="Phone number"
                  error={errors.phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+255 745 123 607"
                  value={data.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </>
            ) : null}

            {step.id === 'education' ? (
              <>
                <FormField id="studyClass" label="Class" error={errors.studyClass}>
                  <Select
                    id="studyClass"
                    name="studyClass"
                    value={data.studyClass || null}
                    onValueChange={handleStudyClassChange}
                  >
                    <SelectTrigger
                      {...getErrorProps('studyClass', errors.studyClass)}
                      className={cn(errors.studyClass && SELECT_ERROR_CLASS)}
                    >
                      <SelectValue placeholder="Choose your class" />
                    </SelectTrigger>
                    <SelectContent>
                      {studyClasses.map((studyClass) => (
                        <SelectItem key={studyClass} value={studyClass}>
                          {studyClass}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField id="course" label="Course" error={errors.course}>
                  <Select
                    id="course"
                    name="course"
                    value={data.course || null}
                    onValueChange={(value) => updateField('course', value ?? '')}
                    disabled={!data.studyClass}
                  >
                    <SelectTrigger
                      {...getErrorProps('course', errors.course)}
                      className={cn(errors.course && SELECT_ERROR_CLASS)}
                    >
                      <SelectValue placeholder={data.studyClass ? 'Choose your course' : 'Choose your class first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField id="yearOfStudy" label="Year of study" error={errors.yearOfStudy}>
                  <Select
                    id="yearOfStudy"
                    name="yearOfStudy"
                    value={data.yearOfStudy || null}
                    onValueChange={(value) => updateField('yearOfStudy', value ?? '')}
                  >
                    <SelectTrigger
                      {...getErrorProps('yearOfStudy', errors.yearOfStudy)}
                      className={cn(errors.yearOfStudy && SELECT_ERROR_CLASS)}
                    >
                      <SelectValue placeholder="Choose an academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearsOfStudy.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </>
            ) : null}

            {isReviewStep ? (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                <ReviewSection title="Basic information" isEditDisabled={isSubmitted} onEdit={() => handleEditStep('basic')}>
                  <ReviewItem label="First name" value={data.firstName} />
                  <ReviewItem label="Last name" value={data.lastName} />
                  <ReviewItem label="Date of birth" value={formatDate(data.dateOfBirth)} />
                </ReviewSection>
                <ReviewSection title="Contact details" isEditDisabled={isSubmitted} onEdit={() => handleEditStep('contact')}>
                  <ReviewItem label="Email address" value={data.email} className="sm:col-span-2" valueClassName="break-all" />
                  <ReviewItem label="Phone number" value={data.phone} />
                </ReviewSection>
                <ReviewSection title="Education" isEditDisabled={isSubmitted} onEdit={() => handleEditStep('education')}>
                  <ReviewItem label="Class" value={data.studyClass} />
                  <ReviewItem label="Year of study" value={data.yearOfStudy} />
                  <ReviewItem label="Course" value={data.course} className="sm:col-span-2" />
                </ReviewSection>
              </div>
            ) : null}

            <div className="flex items-center gap-3 pt-1">
              {stepIndex > 0 ? (
                <Button type="button" variant="ghost" size="lg" onClick={handleBack} disabled={isSubmitted}>
                  <ArrowLeft size={18} /> Back
                </Button>
              ) : null}
              <Button type="submit" size="lg" className="flex-1" disabled={isSubmitted}>
                {isReviewStep ? (
                  isSubmitted ? (
                    <>
                      Application submitted <Check size={18} />
                    </>
                  ) : (
                    <>
                      Submit application <ArrowRight size={18} />
                    </>
                  )
                ) : (
                  <>
                    {isReturningToReview ? 'Back to review' : 'Continue'} <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </div>
          </form>
          {stepIndex === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-bold text-royal hover:underline">
                Sign in
              </Link>
            </p>
          ) : null}
        </AuthCard>
      </motion.div>
    </div>
  );
}

function StepProgress({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
        <p className="text-white">Create your account</p>
        <p className="text-white/70" aria-live="polite">
          Step {currentIndex + 1} of {STEPS.length}
        </p>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {STEPS.map((step, index) => (
          <span
            key={step.id}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              index <= currentIndex ? 'bg-gold' : 'bg-white/20',
            )}
          />
        ))}
      </div>
    </div>
  );
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-sm font-semibold text-red-600">
      {message}
    </p>
  );
}

function TextField({
  field,
  label,
  error,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'id' | 'name'> & {
  field: SignUpField;
  label: string;
  error?: string;
}) {
  return (
    <FormField id={field} label={label} error={error}>
      <Input
        id={field}
        name={field}
        {...getErrorProps(field, error)}
        className={cn(INPUT_CLASS, error && INPUT_ERROR_CLASS, className)}
        {...props}
      />
    </FormField>
  );
}

function ReviewSection({
  title,
  isEditDisabled,
  onEdit,
  children,
}: {
  title: string;
  isEditDisabled: boolean;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-navy">{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-mr-2 text-royal"
          aria-label={`Edit ${title.toLowerCase()}`}
          disabled={isEditDisabled}
          onClick={onEdit}
        >
          <PencilLine size={14} /> Edit
        </Button>
      </div>
      <dl className="mt-2 grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function ReviewItem({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className={cn('mt-0.5 break-words font-bold text-navy', valueClassName)}>{value}</dd>
    </div>
  );
}
