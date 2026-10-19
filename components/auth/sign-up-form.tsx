'use client';

import { ArrowLeft, ArrowRight, CalendarIcon, Check, PencilLine } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  useEffect,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { registerApplication } from '@/lib/api/applications';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import {
  getCoursesForStudyClass,
  studyClasses,
  yearsOfStudy,
} from '@/lib/onboarding-options';
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
    description:
      'Make sure everything is correct before you submit your application.',
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

// Match the API's length limits for these fields.
const NAME_MAX_LENGTH = 80;
const PHONE_MAX_LENGTH = 32;

const INPUT_CLASS =
  'placeholder:font-semibold placeholder:text-muted-foreground';

function getTodayIsoDate(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function parseIsoDate(isoDate: string): Date | undefined {
  if (!isoDate) return undefined;
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

function getFieldError(
  field: SignUpField,
  data: SignUpData,
): string | undefined {
  switch (field) {
    case 'firstName':
      return data.firstName ? undefined : 'Enter your first name.';
    case 'lastName':
      return data.lastName ? undefined : 'Enter your last name.';
    case 'dateOfBirth':
      if (!data.dateOfBirth) return 'Enter your date of birth.';
      return data.dateOfBirth > getTodayIsoDate()
        ? "Date of birth can't be in the future."
        : undefined;
    case 'email':
      if (!data.email) return 'Enter your email address.';
      return isValidEmail(data.email)
        ? undefined
        : 'Enter a valid email address, like name@example.com.';
    case 'phone':
      if (!data.phone) return 'Enter your phone number.';
      return isValidPhone(data.phone)
        ? undefined
        : 'Enter a valid phone number, like +255 745 000 000.';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isLocked = isSubmitting || isSubmitted;
  const step = STEPS[stepIndex];
  const isReviewStep = step.id === 'review';
  const courses = getCoursesForStudyClass(data.studyClass);

  useEffect(() => {
    if (step.focusId) document.getElementById(step.focusId)?.focus();
  }, [step.focusId]);

  function updateField<Field extends SignUpField>(
    field: Field,
    value: SignUpData[Field],
  ) {
    setData((current) => ({ ...current, [field]: value }));
    if (errors[field])
      setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleStudyClassChange(studyClass: string) {
    setData((current) => ({
      ...current,
      studyClass,
      course: getCoursesForStudyClass(studyClass).includes(current.course)
        ? current.course
        : '',
    }));
    if (errors.studyClass)
      setErrors((current) => ({ ...current, studyClass: undefined }));
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

  async function submitApplication() {
    if (isLocked) return;

    setIsSubmitting(true);
    try {
      await registerApplication(data);
    } catch (error) {
      const apiError = toApiError(error);
      const description =
        apiError.kind === 'validation'
          ? apiError.messages.join(' ')
          : getUserFacingMessage(error);
      toast.error("We couldn't submit your application", { description });
      return;
    } finally {
      setIsSubmitting(false);
    }

    setIsSubmitted(true);
    toast.success('Application received', {
      description:
        "Your application is under review. We'll email you once it's accepted.",
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isReviewStep) {
      void submitApplication();
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
    <div className='w-full max-w-lg'>
      <StepProgress currentIndex={stepIndex} />
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <AuthCard
          eyebrow={step.eyebrow}
          title={step.title}
          description={step.description}
        >
          <form noValidate onSubmit={handleSubmit} className='space-y-5'>
            {step.id === 'basic' ? (
              <>
                <div className='grid gap-5 sm:grid-cols-2'>
                  <TextField
                    field='firstName'
                    label='First name'
                    error={errors.firstName}
                    autoComplete='given-name'
                    maxLength={NAME_MAX_LENGTH}
                    placeholder='Johnson'
                    value={data.firstName}
                    onChange={(event) =>
                      updateField('firstName', event.target.value)
                    }
                  />
                  <TextField
                    field='lastName'
                    label='Last name'
                    error={errors.lastName}
                    autoComplete='family-name'
                    maxLength={NAME_MAX_LENGTH}
                    placeholder='Rutabangwa'
                    value={data.lastName}
                    onChange={(event) =>
                      updateField('lastName', event.target.value)
                    }
                  />
                </div>
                <DateOfBirthField
                  value={data.dateOfBirth}
                  error={errors.dateOfBirth}
                  disabled={isLocked}
                  onChange={(value) => updateField('dateOfBirth', value)}
                />
              </>
            ) : null}

            {step.id === 'contact' ? (
              <>
                <TextField
                  field='email'
                  label='Email address'
                  error={errors.email}
                  type='email'
                  inputMode='email'
                  autoComplete='email'
                  placeholder='you@example.com'
                  value={data.email}
                  onChange={(event) => updateField('email', event.target.value)}
                />
                <TextField
                  field='phone'
                  label='Phone number'
                  error={errors.phone}
                  type='tel'
                  inputMode='tel'
                  autoComplete='tel'
                  maxLength={PHONE_MAX_LENGTH}
                  placeholder='+255 745 123 607'
                  value={data.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </>
            ) : null}

            {step.id === 'education' ? (
              <>
                <FormField
                  id='studyClass'
                  label='Class'
                  error={errors.studyClass}
                >
                  <Select
                    name='studyClass'
                    value={data.studyClass}
                    onValueChange={handleStudyClassChange}
                  >
                    <SelectTrigger
                      id='studyClass'
                      {...getErrorProps('studyClass', errors.studyClass)}
                    >
                      <SelectValue placeholder='Choose your class' />
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
                <FormField id='course' label='Course' error={errors.course}>
                  <Select
                    name='course'
                    value={data.course}
                    onValueChange={(value) => updateField('course', value)}
                    disabled={!data.studyClass}
                  >
                    <SelectTrigger
                      id='course'
                      {...getErrorProps('course', errors.course)}
                    >
                      <SelectValue
                        placeholder={
                          data.studyClass
                            ? 'Choose your course'
                            : 'Choose your class first'
                        }
                      />
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
                <FormField
                  id='yearOfStudy'
                  label='Year of study'
                  error={errors.yearOfStudy}
                >
                  <Select
                    name='yearOfStudy'
                    value={data.yearOfStudy}
                    onValueChange={(value) => updateField('yearOfStudy', value)}
                  >
                    <SelectTrigger
                      id='yearOfStudy'
                      {...getErrorProps('yearOfStudy', errors.yearOfStudy)}
                    >
                      <SelectValue placeholder='Choose an academic year' />
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
              <div className='divide-y divide-border border border-border'>
                <ReviewSection
                  title='Basic information'
                  isEditDisabled={isLocked}
                  onEdit={() => handleEditStep('basic')}
                >
                  <ReviewItem label='First name' value={data.firstName} />
                  <ReviewItem label='Last name' value={data.lastName} />
                  <ReviewItem
                    label='Date of birth'
                    value={formatDate(data.dateOfBirth)}
                  />
                </ReviewSection>
                <ReviewSection
                  title='Contact details'
                  isEditDisabled={isLocked}
                  onEdit={() => handleEditStep('contact')}
                >
                  <ReviewItem
                    label='Email address'
                    value={data.email}
                    className='sm:col-span-2'
                    valueClassName='break-all'
                  />
                  <ReviewItem label='Phone number' value={data.phone} />
                </ReviewSection>
                <ReviewSection
                  title='Education'
                  isEditDisabled={isLocked}
                  onEdit={() => handleEditStep('education')}
                >
                  <ReviewItem label='Class' value={data.studyClass} />
                  <ReviewItem label='Year of study' value={data.yearOfStudy} />
                  <ReviewItem
                    label='Course'
                    value={data.course}
                    className='sm:col-span-2'
                  />
                </ReviewSection>
              </div>
            ) : null}

            <div className='flex items-center gap-3 pt-1'>
              {stepIndex > 0 ? (
                <Button
                  type='button'
                  variant='ghost'
                  size='lg'
                  onClick={handleBack}
                  disabled={isLocked}
                >
                  <ArrowLeft size={18} /> Back
                </Button>
              ) : null}
              <Button
                type='submit'
                size='lg'
                className='flex-1'
                disabled={isLocked}
              >
                {isReviewStep ? (
                  isSubmitted ? (
                    <>
                      Application submitted <Check size={18} />
                    </>
                  ) : isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      Submit application <ArrowRight size={18} />
                    </>
                  )
                ) : (
                  <>
                    {isReturningToReview ? 'Back to review' : 'Continue'}{' '}
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </div>
          </form>
          {stepIndex === 0 ? (
            <p className='mt-6 text-center text-sm text-muted-foreground'>
              Already have an account?{' '}
              <Link
                href='/auth/signin'
                className='font-bold text-accent hover:underline'
              >
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
    <div className='mb-5'>
      <div className='flex items-center justify-between gap-3 text-sm font-semibold'>
        <p className='text-sidebar-foreground'>Create your account</p>
        <p className='text-sidebar-foreground/70' aria-live='polite'>
          Step {currentIndex + 1} of {STEPS.length}
        </p>
      </div>
      <div className='mt-3 flex gap-1.5' aria-hidden='true'>
        {STEPS.map((step, index) => (
          <span
            key={step.id}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              index <= currentIndex
                ? 'bg-sidebar-primary'
                : 'bg-sidebar-primary/20',
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
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role='alert' className='text-sm font-semibold text-destructive'>
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
        className={cn(INPUT_CLASS, className)}
        {...props}
      />
    </FormField>
  );
}

function DateOfBirthField({
  value,
  error,
  disabled,
  onChange,
}: {
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);

  return (
    <FormField id='dateOfBirth' label='Date of birth' error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id='dateOfBirth'
            type='button'
            variant='ghost'
            disabled={disabled}
            {...getErrorProps('dateOfBirth', error)}
            className={cn(
              'h-10 w-full justify-between rounded-none border border-transparent border-b-input px-0 py-1 text-base font-normal normal-case tracking-normal hover:bg-transparent focus-visible:border-b-ring md:text-sm',
              !value && 'font-semibold text-muted-foreground',
              error && 'border-b-destructive',
            )}
          >
            <span className='flex items-center gap-2'>
              <CalendarIcon className='size-4 shrink-0' data-icon='inline-start' />
              {value ? formatDate(value) : 'Pick a date'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            captionLayout='dropdown'
            selected={selected}
            defaultMonth={selected ?? new Date(2000, 0)}
            startMonth={new Date(1920, 0)}
            endMonth={new Date()}
            disabled={{ after: new Date() }}
            onSelect={(date) => {
              if (!date) return;
              onChange(toIsoDate(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
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
    <section className='p-4 sm:p-5'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-sm font-bold text-foreground'>{title}</h2>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='-mr-2 text-accent'
          aria-label={`Edit ${title.toLowerCase()}`}
          disabled={isEditDisabled}
          onClick={onEdit}
        >
          <PencilLine size={14} /> Edit
        </Button>
      </div>
      <dl className='mt-2 grid gap-x-4 gap-y-3 sm:grid-cols-2'>{children}</dl>
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
      <dt className='text-xs font-semibold text-muted-foreground'>{label}</dt>
      <dd
        className={cn(
          'mt-0.5 wrap-break-word font-bold text-foreground',
          valueClassName,
        )}
      >
        {value}
      </dd>
    </div>
  );
}
