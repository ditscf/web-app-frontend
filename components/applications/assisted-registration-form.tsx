'use client';

import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { registerAssistedApplication } from '@/lib/api/applications';
import {
  getUserFacingMessage,
  toApiError,
  type ApiErrorKind,
} from '@/lib/api/errors';
import {
  getCoursesForStudyClass,
  studyClasses,
  yearsOfStudy,
} from '@/lib/onboarding-options';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface AssistedRegistrationFormProps {
  onCancel: () => void;
  onRegistered: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  studyClass: string;
  course: string;
  yearOfStudy: string;
}

type FormField = keyof FormData;
type FormErrors = Partial<Record<FormField, string>>;

const INITIAL_DATA: FormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  studyClass: '',
  course: '',
  yearOfStudy: '',
};

const NAME_MAX_LENGTH = 80;
const PHONE_MAX_LENGTH = 32;
const FIELD_ERROR_KINDS: readonly ApiErrorKind[] = ['validation', 'conflict'];
const INPUT_CLASS =
  'placeholder:font-semibold placeholder:text-muted-foreground';

function getTodayIsoDate(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function getFieldError(field: FormField, data: FormData): string | undefined {
  switch (field) {
    case 'firstName':
      return data.firstName ? undefined : 'Enter the first name.';
    case 'lastName':
      return data.lastName ? undefined : 'Enter the last name.';
    case 'dateOfBirth':
      if (!data.dateOfBirth) return 'Enter the date of birth.';
      return data.dateOfBirth > getTodayIsoDate()
        ? "Date of birth can't be in the future."
        : undefined;
    case 'email':
      if (!data.email) return 'Enter the email address.';
      return isValidEmail(data.email)
        ? undefined
        : 'Enter a valid email address, like name@example.com.';
    case 'phone':
      if (!data.phone) return 'Enter the phone number.';
      return isValidPhone(data.phone)
        ? undefined
        : 'Enter a valid phone number, like +255 745 000 000.';
    case 'studyClass':
      return data.studyClass ? undefined : 'Choose the class.';
    case 'course':
      return data.course ? undefined : 'Choose the course.';
    case 'yearOfStudy':
      return data.yearOfStudy ? undefined : 'Choose the year of study.';
  }
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  for (const field of Object.keys(data) as FormField[]) {
    const error = getFieldError(field, data);
    if (error) errors[field] = error;
  }
  return errors;
}

function trimTextFields(data: FormData): FormData {
  return {
    ...data,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
  };
}

/** Shown on the applications page when the General Secretary registers someone on their behalf. */
export function AssistedRegistrationForm({
  onCancel,
  onRegistered,
}: AssistedRegistrationFormProps) {
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const courses = getCoursesForStudyClass(data.studyClass);

  function updateField<Field extends FormField>(
    field: Field,
    value: FormData[Field],
  ) {
    setData((current) => ({ ...current, [field]: value }));
    if (errors[field])
      setErrors((current) => ({ ...current, [field]: undefined }));
    if (formError) setFormError(null);
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
    if (formError) setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmed = trimTextFields(data);
    setData(trimmed);
    const nextErrors = validateForm(trimmed);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await registerAssistedApplication(trimmed);
      toast.success(
        `Registration submitted for ${trimmed.firstName} ${trimmed.lastName}`,
        {
          description:
            'It is waiting for the Vice General Secretary to approve.',
        },
      );
      onRegistered();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      if (FIELD_ERROR_KINDS.includes(apiError.kind)) {
        setFormError(apiError.message);
        return;
      }
      toast.error("We couldn't submit the registration", {
        description: getUserFacingMessage(error),
      });
      if (apiError.kind === 'forbidden') onCancel();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className='p-6 shadow-none'>
      <h2 className='text-lg font-bold text-foreground'>Register a member</h2>
      <p className='mt-1 text-sm text-muted-foreground'>
        Enter their details. This counts as your approval step; the Vice General
        Secretary must still approve before they become a member. The
        registration expires in 48 hours if it is not completed.
      </p>

      <form
        noValidate
        onSubmit={handleSubmit}
        className='mt-6 grid gap-4 sm:grid-cols-2'
      >
        <TextField
          id='assisted-firstName'
          label='First name'
          error={errors.firstName}
          maxLength={NAME_MAX_LENGTH}
          autoComplete='off'
          value={data.firstName}
          disabled={isSubmitting}
          onChange={(value) => updateField('firstName', value)}
        />
        <TextField
          id='assisted-lastName'
          label='Last name'
          error={errors.lastName}
          maxLength={NAME_MAX_LENGTH}
          autoComplete='off'
          value={data.lastName}
          disabled={isSubmitting}
          onChange={(value) => updateField('lastName', value)}
        />
        <TextField
          id='assisted-dateOfBirth'
          label='Date of birth'
          error={errors.dateOfBirth}
          type='date'
          max={getTodayIsoDate()}
          value={data.dateOfBirth}
          disabled={isSubmitting}
          onChange={(value) => updateField('dateOfBirth', value)}
        />
        <TextField
          id='assisted-phone'
          label='Phone number'
          error={errors.phone}
          type='tel'
          inputMode='tel'
          maxLength={PHONE_MAX_LENGTH}
          placeholder='+255 745 123 607'
          value={data.phone}
          disabled={isSubmitting}
          onChange={(value) => updateField('phone', value)}
        />
        <TextField
          id='assisted-email'
          label='Email address'
          error={errors.email}
          type='email'
          inputMode='email'
          autoComplete='off'
          placeholder='name@example.com'
          className='sm:col-span-2'
          value={data.email}
          disabled={isSubmitting}
          onChange={(value) => updateField('email', value)}
        />

        <SelectField
          id='assisted-studyClass'
          label='Class'
          error={errors.studyClass}
          value={data.studyClass}
          placeholder='Choose class'
          disabled={isSubmitting}
          onValueChange={handleStudyClassChange}
          options={studyClasses}
        />
        <SelectField
          id='assisted-yearOfStudy'
          label='Year of study'
          error={errors.yearOfStudy}
          value={data.yearOfStudy}
          placeholder='Choose year'
          disabled={isSubmitting}
          onValueChange={(value) => updateField('yearOfStudy', value)}
          options={yearsOfStudy}
        />
        <SelectField
          id='assisted-course'
          label='Course'
          error={errors.course}
          value={data.course}
          placeholder={data.studyClass ? 'Choose course' : 'Choose class first'}
          disabled={isSubmitting || !data.studyClass}
          onValueChange={(value) => updateField('course', value)}
          options={courses}
          className='sm:col-span-2'
        />

        {formError ? (
          <p
            role='alert'
            className='text-sm font-semibold text-destructive sm:col-span-2'
          >
            {formError}
          </p>
        ) : null}

        <div className='flex flex-wrap gap-3 sm:col-span-2'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' size='sm' disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit registration'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function TextField({
  id,
  label,
  error,
  className,
  onChange,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  value: string;
  disabled?: boolean;
  type?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  maxLength?: number;
  max?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          INPUT_CLASS,
          error && 'border-destructive focus:border-destructive',
        )}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      {error ? (
        <p
          id={errorId}
          role='alert'
          className='text-sm font-semibold text-destructive'
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  error,
  value,
  placeholder,
  disabled,
  options,
  onValueChange,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  options: readonly string[];
  onValueChange: (value: string) => void;
  className?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        name={id}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(error && 'border-destructive')}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p
          id={errorId}
          role='alert'
          className='text-sm font-semibold text-destructive'
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
