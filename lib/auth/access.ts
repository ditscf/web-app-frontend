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

/** Mirrors `member.viewDirectory`: Chairman, Vice Chairman, GS, or VGS, while the year is OPEN or CLOSED. */
export function canViewMemberDirectory(actor: ActorProfile): boolean {
  if (!actor.onboardingCompleted || actor.operativeYear === null) return false;
  const { offices } = actor.responsibilities;
  return (
    isChairman(actor) ||
    offices.includes('VICE_CHAIRMAN') ||
    offices.includes('GENERAL_SECRETARY') ||
    offices.includes('VICE_GENERAL_SECRETARY')
  );
}

/** Mirrors `offering.view`: five top officers while the year is OPEN or CLOSED. */
export function canViewOfferings(actor: ActorProfile): boolean {
  if (!actor.onboardingCompleted || actor.operativeYear === null) return false;
  const { offices } = actor.responsibilities;
  return (
    isChairman(actor) ||
    offices.includes('VICE_CHAIRMAN') ||
    offices.includes('GENERAL_SECRETARY') ||
    offices.includes('VICE_GENERAL_SECRETARY') ||
    offices.includes('TREASURER')
  );
}

/** Mirrors `offering.manage`: Treasurer while the year is OPEN. */
export function canManageOfferings(actor: ActorProfile): boolean {
  return (
    actor.onboardingCompleted &&
    isYearOpen(actor) &&
    actor.responsibilities.offices.includes('TREASURER')
  );
}

/** Chairman correcting offerings while the year is CLOSED (`fellowshipYear.correctClosed`). */
export function canCorrectClosedYearOfferings(actor: ActorProfile): boolean {
  return (
    actor.onboardingCompleted &&
    actor.operativeYear?.status === 'CLOSED' &&
    isChairman(actor)
  );
}

/** GS or Chairman may open the year-closure page while there is an operative year. */
export function canViewYearClosure(actor: ActorProfile): boolean {
  return (
    actor.onboardingCompleted &&
    actor.operativeYear !== null &&
    (isChairman(actor) ||
      actor.responsibilities.offices.includes('GENERAL_SECRETARY'))
  );
}

/** Mirrors `fellowshipYear.requestClosure`. */
export function canRequestYearClosure(actor: ActorProfile): boolean {
  return (
    actor.onboardingCompleted &&
    isYearOpen(actor) &&
    actor.responsibilities.offices.includes('GENERAL_SECRETARY')
  );
}

/** Mirrors `fellowshipYear.confirmClosure`. */
export function canConfirmYearClosure(actor: ActorProfile): boolean {
  return actor.onboardingCompleted && isYearOpen(actor) && isChairman(actor);
}

/** Mirrors `fellowshipYear.archive`. */
export function canArchiveYear(actor: ActorProfile): boolean {
  return (
    actor.onboardingCompleted &&
    actor.operativeYear?.status === 'CLOSED' &&
    isChairman(actor)
  );
}

/** Mirrors `graduation.appointChairman`. */
export function canAppointGraduationChairman(actor: ActorProfile): boolean {
  return actor.onboardingCompleted && isYearOpen(actor) && isChairman(actor);
}

/** Graduation Chairman from `/auth/me`. */
export function canDecideGraduation(actor: ActorProfile): boolean {
  return (
    actor.onboardingCompleted &&
    actor.operativeYear !== null &&
    actor.responsibilities.isGraduationChairman
  );
}

/**
 * Graduation page: Chairman (appoint), Graduation Chairman (queue), or any onboarded
 * member with an operative year (apply / own status via `/graduation/me`).
 */
export function canViewGraduation(actor: ActorProfile): boolean {
  return actor.onboardingCompleted && actor.operativeYear !== null;
}

/** Event list has no policy action: any onboarded member may read the operative-year list. */
export function canViewEvents(actor: ActorProfile): boolean {
  return actor.onboardingCompleted;
}

/** Mirrors `event.create` and `event.appointCommittee`. */
export function canCreateEvents(actor: ActorProfile): boolean {
  return actor.onboardingCompleted && isYearOpen(actor) && isChairman(actor);
}

export function canAppointEventCommittee(actor: ActorProfile): boolean {
  return canCreateEvents(actor);
}

/** Mirrors `event.manageOperations` for a specific event. */
export function canOperateEvent(actor: ActorProfile, eventId: string): boolean {
  return (
    actor.onboardingCompleted &&
    isYearOpen(actor) &&
    holdsEventRole(actor, eventId, 'EVENT_CHAIRMAN')
  );
}

/** Mirrors `event.join`: Active onboarded member, year OPEN (event ACTIVE checked in UI). */
export function canJoinEvents(actor: ActorProfile): boolean {
  return (
    actor.onboardingCompleted &&
    isYearOpen(actor) &&
    actor.membershipStatus === 'ACTIVE'
  );
}

/** Mirrors `event.close`. */
export function canCloseEvent(actor: ActorProfile, eventId: string): boolean {
  return canOperateEvent(actor, eventId);
}

/** Mirrors `event.manageAttendance` for a specific event. */
export function canManageEventAttendance(actor: ActorProfile, eventId: string): boolean {
  return (
    actor.onboardingCompleted &&
    isYearOpen(actor) &&
    (holdsEventRole(actor, eventId, 'EVENT_CHAIRMAN') ||
      holdsEventRole(actor, eventId, 'EVENT_SECRETARY'))
  );
}

/** Mirrors `event.viewFinances` for a specific event (committee while year is operative). */
export function canViewEventFinances(actor: ActorProfile, eventId: string): boolean {
  return (
    actor.onboardingCompleted &&
    actor.operativeYear !== null &&
    (holdsEventRole(actor, eventId, 'EVENT_CHAIRMAN') ||
      holdsEventRole(actor, eventId, 'EVENT_TREASURER') ||
      holdsEventRole(actor, eventId, 'EVENT_SECRETARY'))
  );
}

/** Mirrors `event.manageFinances` for a specific event. */
export function canManageEventFinances(actor: ActorProfile, eventId: string): boolean {
  return (
    actor.onboardingCompleted &&
    isYearOpen(actor) &&
    holdsEventRole(actor, eventId, 'EVENT_TREASURER')
  );
}

/** Mirrors `event.correctClosed` and `event.archive`. */
export function canCorrectOrArchiveEvent(actor: ActorProfile): boolean {
  return (
    actor.onboardingCompleted &&
    actor.operativeYear !== null &&
    actor.responsibilities.offices.includes('VICE_CHAIRMAN')
  );
}

function isYearOpen(actor: ActorProfile): boolean {
  return actor.operativeYear?.status === 'OPEN';
}

function isChairman(actor: ActorProfile): boolean {
  return actor.responsibilities.offices.includes('CHAIRMAN');
}

function holdsEventRole(
  actor: ActorProfile,
  eventId: string,
  role: ActorProfile['responsibilities']['eventRoles'][number]['role'],
): boolean {
  return actor.responsibilities.eventRoles.some(
    (assignment) => assignment.event.id === eventId && assignment.role === role,
  );
}

function leadsMinistry(actor: ActorProfile, ministryId: string): boolean {
  return actor.responsibilities.ministryLeadership?.ministry.id === ministryId;
}

function leadsAMinistry(actor: ActorProfile): boolean {
  return actor.responsibilities.ministryLeadership !== null;
}
