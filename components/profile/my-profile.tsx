'use client';

import {
  IdCard,
  Mail,
  PencilLine,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  useCurrentActor,
  useRefreshCurrentActor,
} from '@/components/auth/current-actor-provider';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
import { NoAccess } from '@/components/dashboard/no-access';
import { EmailChangeCard } from '@/components/profile/email-change-card';
import { ProfileDetailsForm } from '@/components/profile/profile-details-form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import {
  getProfile,
  type Profile,
  type ProfileChanges,
} from '@/lib/api/profile';
import { canManageOwnProfile } from '@/lib/auth/access';
import { cn } from '@/lib/utils';

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

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof IdCard;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className={cn('relative overflow-hidden p-5', dashboardCardClassName)}>
      <div
        className="pointer-events-none absolute inset-0 bg-brand-radial opacity-30"
        aria-hidden
      />
      <div className="relative flex gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center bg-primary/15 text-primary">
          <Icon size={20} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 truncate text-lg font-bold text-foreground">{value}</p>
          {hint ? (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function ProfileSectionCard({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: typeof UserRound;
  action?: React.ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden p-6',
        dashboardCardClassName,
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-brand-radial opacity-20"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center bg-primary/15 text-primary">
              <Icon size={20} aria-hidden />
            </div>
            <h2 className="pt-2 text-lg font-bold text-foreground">{title}</h2>
          </div>
          {action}
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </Card>
  );
}

function ProfileCardSkeleton() {
  return (
    <Card className={cn('h-full p-6', dashboardCardClassName)}>
      <div className="flex gap-3">
        <div className="size-10 animate-pulse bg-muted" />
        <div className="h-6 w-40 animate-pulse bg-muted" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse bg-muted" />
        ))}
      </div>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 wrap-break-word text-sm font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
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

  const profile =
    profileState.status === 'ready' ? profileState.profile : null;
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : `${actor.firstName} ${actor.lastName}`;
  const initials = profile
    ? getInitials(profile.firstName, profile.lastName)
    : getInitials(actor.firstName, actor.lastName);

  return (
    <DashboardPage>
      <header className="relative isolate overflow-hidden border border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0 bg-brand-radial opacity-50"
          aria-hidden
        />
        <div className="relative border-b border-primary/25 bg-linear-to-r from-primary/12 via-primary/5 to-transparent px-6 py-8 sm:px-8">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar className="size-16 border-2 border-primary/30">
              <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                My profile
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {displayName}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Your details as the fellowship keeps them. Update contact info
                here; Fellowship ID and membership status are managed by the
                fellowship.
              </p>
            </div>
          </div>
        </div>
      </header>

      {profileState.status === 'ready' ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryStat
            icon={IdCard}
            label="Fellowship ID"
            value={profileState.profile.fellowshipId}
            hint="Your unique member identifier"
          />
          <SummaryStat
            icon={ShieldCheck}
            label="Membership"
            value={
              MEMBERSHIP_STATUS_LABELS[profileState.profile.membershipStatus]
            }
            hint={`Born ${formatDateOfBirth(profileState.profile.dateOfBirth)}`}
          />
          <SummaryStat
            icon={Mail}
            label="Sign-in email"
            value={profileState.profile.email}
            hint="Used for login codes"
          />
        </div>
      ) : null}

      {profileState.status === 'loading' ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2" role="status">
          <ProfileCardSkeleton />
          <ProfileCardSkeleton />
          <span className="sr-only">Loading your profile…</span>
        </div>
      ) : null}

      {profileState.status === 'error' ? (
        <Card
          role="alert"
          className={cn('relative overflow-hidden p-6', dashboardCardClassName)}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-brand-radial opacity-20"
            aria-hidden
          />
          <div className="relative">
            <p className="font-bold text-foreground">
              We couldn&apos;t load your profile.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {profileState.message}
            </p>
            <Button type="button" size="sm" className="mt-4" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        </Card>
      ) : null}

      {profileState.status === 'ready' ? (
        <>
          <div
            className={cn(
              'grid gap-6',
              isEditing ? 'lg:grid-cols-1' : 'lg:grid-cols-2',
            )}
          >
            <ProfileSectionCard
              title="Personal details"
              icon={UserRound}
              className={isEditing ? 'lg:col-span-1' : undefined}
              action={
                isEditing ? null : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 normal-case tracking-normal text-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    <PencilLine size={14} aria-hidden />
                    Edit
                  </Button>
                )
              }
            >
              {isEditing ? (
                <ProfileDetailsForm
                  profile={profileState.profile}
                  onSaved={handleSaved}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <dl className="grid gap-3 border border-border bg-muted/40 p-4 sm:grid-cols-2">
                  <DetailItem
                    label="First name"
                    value={profileState.profile.firstName}
                  />
                  <DetailItem
                    label="Last name"
                    value={profileState.profile.lastName}
                  />
                  <DetailItem
                    label="Phone number"
                    value={profileState.profile.phone}
                  />
                  <DetailItem label="Class" value={profileState.profile.class} />
                  <DetailItem
                    label="Course"
                    value={profileState.profile.course}
                  />
                  <DetailItem
                    label="Year of study"
                    value={profileState.profile.yearOfStudy}
                  />
                </dl>
              )}
            </ProfileSectionCard>

            {!isEditing ? (
              <ProfileSectionCard title="Membership" icon={ShieldCheck}>
                <dl className="grid gap-3 border border-border bg-muted/40 p-4 sm:grid-cols-2">
                  <DetailItem
                    label="Fellowship ID"
                    value={profileState.profile.fellowshipId}
                  />
                  <DetailItem
                    label="Membership status"
                    value={
                      MEMBERSHIP_STATUS_LABELS[
                        profileState.profile.membershipStatus
                      ]
                    }
                  />
                  <DetailItem
                    label="Date of birth"
                    value={formatDateOfBirth(profileState.profile.dateOfBirth)}
                  />
                </dl>
                <p className="mt-4 text-sm text-muted-foreground">
                  Date of birth and membership status cannot be changed here.
                  Contact fellowship leadership if something looks wrong.
                </p>
              </ProfileSectionCard>
            ) : null}
          </div>

          <EmailChangeCard
            email={profileState.profile.email}
            onChanged={handleEmailChanged}
          />
        </>
      ) : null}
    </DashboardPage>
  );
}
