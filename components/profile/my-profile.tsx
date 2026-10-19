'use client';

import { PencilLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  useCurrentActor,
  useRefreshCurrentActor,
} from '@/components/auth/current-actor-provider';
import { NoAccess } from '@/components/dashboard/no-access';
import { EmailChangeCard } from '@/components/profile/email-change-card';
import { ProfileDetailsForm } from '@/components/profile/profile-details-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import {
  getProfile,
  type Profile,
  type ProfileChanges,
} from '@/lib/api/profile';
import { canManageOwnProfile } from '@/lib/auth/access';

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: Profile }
  | { status: 'forbidden'; message: string }
  | { status: 'error'; message: string };

const MEMBERSHIP_STATUS_LABELS: Record<Profile['membershipStatus'], string> = {
  ACTIVE: 'Active member',
  ASSOCIATE: 'Associate',
};

function formatDateOfBirth(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export function MyProfile() {
  const actor = useCurrentActor();
  const refreshActor = useRefreshCurrentActor();
  const isAllowed = canManageOwnProfile(actor);
  const [profileState, setProfileState] = useState<ProfileState>({
    status: 'loading',
  });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isAllowed) return;
    let isActive = true;

    getProfile()
      .then((profile) => {
        if (isActive) setProfileState({ status: 'ready', profile });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const apiError = toApiError(error);
        if (apiError.kind === 'unauthenticated') return;
        if (apiError.kind === 'forbidden') {
          setProfileState({ status: 'forbidden', message: apiError.message });
          return;
        }
        setProfileState({
          status: 'error',
          message: getUserFacingMessage(error),
        });
      });

    return () => {
      isActive = false;
    };
  }, [isAllowed, loadAttempt]);

  function handleRetry() {
    setProfileState({ status: 'loading' });
    setLoadAttempt((attempt) => attempt + 1);
  }

  function syncCurrentActor() {
    refreshActor().catch((error: unknown) => {
      if (toApiError(error).kind === 'unauthenticated') return;
      toast.info(
        'Reload the page to see your latest details across the dashboard.',
      );
    });
  }

  function handleSaved(profile: Profile, changes: ProfileChanges) {
    setProfileState({ status: 'ready', profile });
    setIsEditing(false);
    toast.success('Your profile is updated');

    const isNameChanged =
      changes.firstName !== undefined || changes.lastName !== undefined;
    if (isNameChanged) syncCurrentActor();
  }

  function handleEmailChanged(profile: Profile) {
    setProfileState({ status: 'ready', profile });
    toast.success('Your email is changed', {
      description: `Use ${profile.email} the next time you sign in.`,
    });
    syncCurrentActor();
  }

  if (!isAllowed) return <NoAccess />;
  if (profileState.status === 'forbidden')
    return <NoAccess message={profileState.message} />;

  return (
    <div className='mx-auto grid max-w-4xl gap-6'>
      <header>
        <h1 className='text-3xl font-bold text-foreground'>My profile</h1>
        <p className='mt-1 text-muted-foreground'>
          Your details as the fellowship keeps them.
        </p>
      </header>

      {profileState.status === 'loading' ? (
        <p
          role='status'
          className='text-sm font-semibold text-muted-foreground'
        >
          Loading your profile...
        </p>
      ) : null}

      {profileState.status === 'error' ? (
        <Card role='alert' className='p-6 shadow-none'>
          <p className='font-bold text-foreground'>
            We couldn&apos;t load your profile.
          </p>
          <p className='mt-1 text-sm text-muted-foreground'>
            {profileState.message}
          </p>
          <Button
            type='button'
            size='sm'
            className='mt-4'
            onClick={handleRetry}
          >
            Try again
          </Button>
        </Card>
      ) : null}

      {profileState.status === 'ready' ? (
        <>
          <Card className='p-6 shadow-none'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='text-lg font-bold text-foreground'>
                Personal details
              </h2>
              {isEditing ? null : (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='-mr-2 text-primary'
                  onClick={() => setIsEditing(true)}
                >
                  <PencilLine size={14} aria-hidden='true' /> Edit
                </Button>
              )}
            </div>
            <div className='mt-4'>
              {isEditing ? (
                <ProfileDetailsForm
                  profile={profileState.profile}
                  onSaved={handleSaved}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <dl className='grid gap-x-6 gap-y-4 sm:grid-cols-2'>
                  <DetailItem
                    label='First name'
                    value={profileState.profile.firstName}
                  />
                  <DetailItem
                    label='Last name'
                    value={profileState.profile.lastName}
                  />
                  <DetailItem
                    label='Phone number'
                    value={profileState.profile.phone}
                  />
                  <DetailItem
                    label='Class'
                    value={profileState.profile.class}
                  />
                  <DetailItem
                    label='Course'
                    value={profileState.profile.course}
                  />
                  <DetailItem
                    label='Year of study'
                    value={profileState.profile.yearOfStudy}
                  />
                </dl>
              )}
            </div>
          </Card>

          <EmailChangeCard
            email={profileState.profile.email}
            onChanged={handleEmailChanged}
          />

          <Card className='p-6 shadow-none'>
            <h2 className='text-lg font-bold text-foreground'>Membership</h2>
            <dl className='mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2'>
              <DetailItem
                label='Fellowship ID'
                value={profileState.profile.fellowshipId}
              />
              <DetailItem
                label='Membership status'
                value={
                  MEMBERSHIP_STATUS_LABELS[
                    profileState.profile.membershipStatus
                  ]
                }
              />
              <DetailItem
                label='Date of birth'
                value={formatDateOfBirth(profileState.profile.dateOfBirth)}
              />
            </dl>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className='text-xs font-semibold text-muted-foreground'>{label}</dt>
      <dd className='mt-0.5 wrap-break-word font-bold text-foreground'>
        {value}
      </dd>
    </div>
  );
}
