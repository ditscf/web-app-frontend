import type { ActorProfile, FellowshipOffice } from '@/lib/api/auth';

// These rules only decide what the UI shows. The API decides every action, so each rule names
// the backend policy action it mirrors and must stay in step with it. `/auth/me` only reports
// offices and ministry leadership for the operative year, so the rules do not repeat that check.

export type ApprovalStep = Extract<FellowshipOffice, 'GENERAL_SECRETARY' | 'VICE_GENERAL_SECRETARY'>;

export function isOnboardingRequired(actor: ActorProfile): boolean {
  return !actor.onboardingCompleted;
}

/**
 * Mirrors `member.approveAsGs` and `member.approveAsVgs`. `/auth/me` only returns offices for an
 * OPEN or CLOSED operative year, which are the year states that allow approval.
 */
export function getApprovalStep(actor: ActorProfile): ApprovalStep | null {
  if (!actor.operativeYear) return null;

  const { offices } = actor.responsibilities;
  if (offices.includes('GENERAL_SECRETARY')) return 'GENERAL_SECRETARY';
  if (offices.includes('VICE_GENERAL_SECRETARY')) return 'VICE_GENERAL_SECRETARY';
  return null;
}

/** Mirrors `member.reviewApplications`, plus the API's onboarding requirement on that route. */
export function canReviewApplications(actor: ActorProfile): boolean {
  return actor.onboardingCompleted && getApprovalStep(actor) !== null;
}

/** Mirrors `member.registerAssisted`: the General Secretary, while the year is OPEN. */
export function canRegisterAssisted(actor: ActorProfile): boolean {
  return (
    actor.onboardingCompleted &&
    isYearOpen(actor) &&
    actor.responsibilities.offices.includes('GENERAL_SECRETARY')
  );
}

/** Mirrors `member.viewOwn` and `member.editOwnProfile`, plus the API's onboarding requirement. */
export function canManageOwnProfile(actor: ActorProfile): boolean {
  return actor.onboardingCompleted && actor.membershipStatus === 'ACTIVE';
}

/** The leader list has no policy action: the API lets any onboarded member read it. */
export function canViewMinistryLeaders(actor: ActorProfile): boolean {
  return actor.onboardingCompleted;
}

/** Mirrors `ministry.appointLeader`: the Chairman, while the year is OPEN. */
export function canAppointMinistryLeaders(actor: ActorProfile): boolean {
  return actor.onboardingCompleted && isYearOpen(actor) && isChairman(actor);
}

/** Mirrors `ministry.manageMembership`: the Chairman in any ministry, or that ministry's leader, while the year is OPEN. */
export function canManageMinistryMembers(actor: ActorProfile, ministryId: string): boolean {
  return actor.onboardingCompleted && isYearOpen(actor) && (isChairman(actor) || leadsMinistry(actor, ministryId));
}

/**
 * Mirrors `ministry.viewMembership` for the Chairman (any ministry) and that ministry's leader, while the
 * year is OPEN or CLOSED. Ordinary members are covered by `canViewMinistryMembers` using `GET /ministries/mine`.
 */
export function canOverseeMinistryMembers(actor: ActorProfile, ministryId: string): boolean {
  return (
    actor.onboardingCompleted &&
    actor.operativeYear !== null &&
    (isChairman(actor) || leadsMinistry(actor, ministryId))
  );
}

/**
 * Mirrors `ministry.viewMembership` for a link on the ministries page: oversee, or a ministry returned by
 * `GET /ministries/mine`, while there is an operative year.
 */
export function canViewMinistryMembers(
  actor: ActorProfile,
  ministryId: string,
  ownMinistryIds: ReadonlySet<string>,
): boolean {
  return canOverseeMinistryMembers(actor, ministryId) || (actor.operativeYear !== null && ownMinistryIds.has(ministryId));
}

/** Mirrors `member.lookup`: the Chairman, GS, VGS, or a Ministry Leader, while the year is OPEN or CLOSED. */
export function canLookupMember(actor: ActorProfile): boolean {
  return (
    actor.onboardingCompleted &&
    actor.operativeYear !== null &&
    (isChairman(actor) ||
      actor.responsibilities.offices.includes('GENERAL_SECRETARY') ||
      actor.responsibilities.offices.includes('VICE_GENERAL_SECRETARY') ||
      leadsAMinistry(actor))
  );
}

function isYearOpen(actor: ActorProfile): boolean {
  return actor.operativeYear?.status === 'OPEN';
}

function isChairman(actor: ActorProfile): boolean {
  return actor.responsibilities.offices.includes('CHAIRMAN');
}

function leadsMinistry(actor: ActorProfile, ministryId: string): boolean {
  return actor.responsibilities.ministryLeadership?.ministry.id === ministryId;
}

function leadsAMinistry(actor: ActorProfile): boolean {
  return actor.responsibilities.ministryLeadership !== null;
}
