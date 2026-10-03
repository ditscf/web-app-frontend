import type { ActorEventRole, ActorProfile, EventRole, FellowshipOffice } from '@/lib/api/auth';

type OperativeYearStatus = NonNullable<ActorProfile['operativeYear']>['status'];
type CurrentEventStatus = ActorEventRole['event']['status'];

export const FELLOWSHIP_OFFICE_LABELS: Record<FellowshipOffice, string> = {
  CHAIRMAN: 'Chairman',
  VICE_CHAIRMAN: 'Vice Chairman',
  GENERAL_SECRETARY: 'General Secretary',
  VICE_GENERAL_SECRETARY: 'Vice General Secretary',
  TREASURER: 'Treasurer',
};

export const EVENT_ROLE_LABELS: Record<EventRole, string> = {
  EVENT_CHAIRMAN: 'Event Chairman',
  EVENT_TREASURER: 'Event Treasurer',
  EVENT_SECRETARY: 'Event Secretary',
};

export const YEAR_STATUS_LABELS: Record<OperativeYearStatus, string> = {
  OPEN: 'Open',
  CLOSED: 'Closed',
};

export const EVENT_STATUS_LABELS: Record<CurrentEventStatus, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Closed',
};
