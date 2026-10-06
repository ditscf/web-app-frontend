'use client';

import { useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import { updateProfile, type EditableProfileField, type Profile, type ProfileChanges } from '@/lib/api/profile';
import { getCoursesForStudyClass, studyClasses, yearsOfStudy } from '@/lib/onboarding-options';
import { isValidPhone } from '@/lib/validation';

type ProfileFormValues = Pick<Profile, EditableProfileField>;
type ProfileFormErrors = Partial<Record<EditableProfileField, string>>;

const EDITABLE_FIELDS: readonly EditableProfileField[] = [
  'firstName',
  'lastName',
  'phone',
  'class',
  'course',
  'yearOfStudy',
];

// Match the API's length limits for these fields.
const NAME_MAX_LENGTH = 80;
const PHONE_MAX_LENGTH = 32;

const FORM_ERROR_ID = 'profile-form-error';

function toFormValues(profile: Profile): ProfileFormValues {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    class: profile.class,
    course: profile.course,
    yearOfStudy: profile.yearOfStudy,
  };
}

function getChanges(values: ProfileFormValues, profile: Profile): ProfileChanges {
  const changes: ProfileChanges = {};
  for (const field of EDITABLE_FIELDS) {
    const value = values[field].trim();
    if (value !== profile[field]) changes[field] = value;
  }
  return changes;
}

/** Only changed values are checked against the form rules, so older stored values don't block other edits. */
function validateChanges(changes: ProfileChanges): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  if (changes.firstName === '') errors.firstName = 'Enter your first name.';
  if (changes.lastName === '') errors.lastName = 'Enter your last name.';
  if (changes.phone !== undefined) {
    if (!changes.phone) errors.phone = 'Enter your phone number.';
    else if (!isValidPhone(changes.phone)) errors.phone = 'Enter a valid phone number, like +255 745 000 000.';
  }
  if (changes.course === '') errors.course = 'Choose your course.';
  return errors;
}

/** Keeps a stored value that is not in the option list selectable, so the member isn't forced to change it. */
function withSavedOption(options: readonly string[], savedValue: string, isApplicable = true): readonly string[] {
  return isApplicable && savedValue && !options.includes(savedValue) ? [savedValue, ...options] : options;
}

function getCourseOptions(studyClass: string, profile: Profile): readonly string[] {
  return withSavedOption(getCoursesForStudyClass(studyClass), profile.course, studyClass === profile.class);
}

function getErrorProps(field: EditableProfileField, error: string | undefined) {
  return {
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${field}-error` : undefined,
  };
}

interface ProfileDetailsFormProps {
  profile: Profile;
  onSaved: (profile: Profile, changes: ProfileChanges) => void;
  onCancel: () => void;
}

export function ProfileDetailsForm({ profile, onSaved, onCancel }: ProfileDetailsFormProps) {
  const [values, setValues] = useState<ProfileFormValues>(() => toFormValues(profile));
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = Object.keys(getChanges(values, profile)).length > 0;
  const classOptions = withSavedOption(studyClasses, profile.class);
  const courseOptions = getCourseOptions(values.class, profile);
  const yearOptions = withSavedOption(yearsOfStudy, profile.yearOfStudy);

  function updateField(field: EditableProfileField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (formError) setFormError(null);
  }

  function handleClassChange(studyClass: string) {
    setValues((current) => ({
      ...current,
      class: studyClass,
      course: getCourseOptions(studyClass, profile).includes(current.course) ? current.course : '',
    }));
    setErrors((current) => ({ ...current, class: undefined, course: undefined }));
    if (formError) setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const changes = getChanges(values, profile);
    if (Object.keys(changes).length === 0) return;

    const nextErrors = validateChanges(changes);
    setErrors(nextErrors);
    const firstInvalidField = EDITABLE_FIELDS.find((field) => nextErrors[field]);
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateProfile(changes);
      onSaved(updated, changes);
    } catch (error) {
      const apiError = toApiError(error);
      setIsSaving(false);
      if (apiError.kind === 'unauthenticated') return;
      if (apiError.kind === 'validation') {
        setFormError(apiError.messages.join(' '));
        return;
      }
      toast.error("We couldn't save your profile", { description: getUserFacingMessage(error) });
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-describedby={formError ? FORM_ERROR_ID : undefined} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          field="firstName"
          label="First name"
          error={errors.firstName}
          autoComplete="given-name"
          maxLength={NAME_MAX_LENGTH}
          value={values.firstName}
          disabled={isSaving}
          onChange={(event) => updateField('firstName', event.target.value)}
        />
        <TextField
          field="lastName"
          label="Last name"
          error={errors.lastName}
          autoComplete="family-name"
          maxLength={NAME_MAX_LENGTH}
          value={values.lastName}
          disabled={isSaving}
          onChange={(event) => updateField('lastName', event.target.value)}
        />
      </div>

      <TextField
        field="phone"
        label="Phone number"
        error={errors.phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={PHONE_MAX_LENGTH}
        value={values.phone}
        disabled={isSaving}
        onChange={(event) => updateField('phone', event.target.value)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="class" label="Class" error={errors.class}>
          <Select name="class" value={values.class} onValueChange={handleClassChange} disabled={isSaving}>
            <SelectTrigger id="class" {...getErrorProps('class', errors.class)}>
              <SelectValue placeholder="Choose your class" />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField id="yearOfStudy" label="Year of study" error={errors.yearOfStudy}>
          <Select
            name="yearOfStudy"
            value={values.yearOfStudy}
            onValueChange={(value) => updateField('yearOfStudy', value)}
            disabled={isSaving}
          >
            <SelectTrigger
              id="yearOfStudy"
              {...getErrorProps('yearOfStudy', errors.yearOfStudy)}
            >
              <SelectValue placeholder="Choose an academic year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField id="course" label="Course" error={errors.course}>
        <Select
          name="course"
          value={values.course}
          onValueChange={(value) => updateField('course', value)}
          disabled={isSaving || courseOptions.length === 0}
        >
          <SelectTrigger id="course" {...getErrorProps('course', errors.course)}>
            <SelectValue placeholder="Choose your course" />
          </SelectTrigger>
          <SelectContent>
            {courseOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {formError ? (
        <p id={FORM_ERROR_ID} role="alert" className="text-sm font-semibold text-red-600">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={!hasChanges || isSaving}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function FormField({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  field,
  label,
  error,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'id' | 'name'> & { field: EditableProfileField; label: string; error?: string }) {
  return (
    <FormField id={field} label={label} error={error}>
      <Input
        id={field}
        name={field}
        {...getErrorProps(field, error)}
        className={className}
        {...props}
      />
    </FormField>
  );
}
