import { z } from 'zod';
import { apiClient, parseResponse } from '@/lib/api/client';

const eventRoleSchema = z.enum(['EVENT_CHAIRMAN', 'EVENT_TREASURER', 'EVENT_SECRETARY']);
const eventStatusSchema = z.enum(['ACTIVE', 'CLOSED', 'ARCHIVED']);

const committeeMemberSchema = z.object({
  role: eventRoleSchema,
  personId: z.string(),
  fellowshipId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  since: z.string(),
});

const eventSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  venue: z.string().nullable(),
  status: eventStatusSchema,
  committee: z.array(committeeMemberSchema),
});

const eventsListSchema = z.object({
  operativeYear: z
    .object({ id: z.string(), label: z.string(), status: z.enum(['OPEN', 'CLOSED']) })
    .nullable(),
  events: z.array(eventSummarySchema),
});

const createdEventSchema = z.object({
  event: z.object({
    id: z.string(),
    name: z.string(),
    venue: z.string().nullable(),
    status: eventStatusSchema,
    fellowshipYear: z.object({ id: z.string(), label: z.string() }),
  }),
});

const committeeAppointmentSchema = z.object({
  event: z.object({ id: z.string(), name: z.string(), status: eventStatusSchema }),
  role: eventRoleSchema,
  holder: z.object({
    personId: z.string(),
    fellowshipId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    since: z.string(),
  }),
  replaced: z
    .object({
      personId: z.string(),
      fellowshipId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable(),
});

const joinSourceSchema = z.enum(['SELF', 'COMMITTEE']);

const participantSchema = z.object({
  personId: z.string(),
  fellowshipId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  membershipStatus: z.enum(['ACTIVE', 'ASSOCIATE']),
  joinSource: joinSourceSchema,
  since: z.string().optional(),
});

const participantsListSchema = z.object({
  event: z.object({
    id: z.string(),
    name: z.string(),
    status: eventStatusSchema,
    venue: z.string().nullable(),
  }),
  participants: z.array(participantSchema),
});

const participantLookupSchema = z.object({
  personId: z.string(),
  fellowshipId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  membershipStatus: z.enum(['ACTIVE', 'ASSOCIATE']),
});

const participantChangedSchema = z.object({
  event: z.object({ id: z.string(), name: z.string() }),
  participant: participantSchema.partial({ since: true }),
  removedAt: z.string().optional(),
});

const updatedEventSchema = z.object({
  event: z.object({
    id: z.string(),
    name: z.string(),
    venue: z.string().nullable(),
    status: eventStatusSchema,
  }),
});

const statusChangeSchema = z.object({
  event: z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(['CLOSED', 'ARCHIVED']),
  }),
});

export type EventRole = z.infer<typeof eventRoleSchema>;
export type EventStatus = z.infer<typeof eventStatusSchema>;
export type EventSummary = z.infer<typeof eventSummarySchema>;
export type EventsList = z.infer<typeof eventsListSchema>;
export type CommitteeAppointment = z.infer<typeof committeeAppointmentSchema>;
export type EventParticipants = z.infer<typeof participantsListSchema>;
export type EventParticipantLookup = z.infer<typeof participantLookupSchema>;

export async function listEvents(): Promise<EventsList> {
  const { data } = await apiClient.get('/v1/events/list');
  return parseResponse(eventsListSchema, data);
}

export async function createEvent(input: {
  name: string;
  venue?: string;
}): Promise<z.infer<typeof createdEventSchema>> {
  const { data } = await apiClient.post('/v1/events/new', input);
  return parseResponse(createdEventSchema, data);
}

export async function appointEventCommittee(
  eventId: string,
  role: EventRole,
  fellowshipId: string,
): Promise<CommitteeAppointment> {
  const { data } = await apiClient.post(`/v1/events/${encodeURIComponent(eventId)}/committee`, {
    role,
    fellowshipId,
  });
  return parseResponse(committeeAppointmentSchema, data);
}

export async function lookupEventParticipant(
  eventId: string,
  fellowshipId: string,
): Promise<EventParticipantLookup> {
  const { data } = await apiClient.get(
    `/v1/events/${encodeURIComponent(eventId)}/participants/lookup/${encodeURIComponent(fellowshipId)}`,
  );
  return parseResponse(participantLookupSchema, data);
}

export async function listEventParticipants(eventId: string): Promise<EventParticipants> {
  const { data } = await apiClient.get(
    `/v1/events/${encodeURIComponent(eventId)}/participants/list`,
  );
  return parseResponse(participantsListSchema, data);
}

export async function joinEvent(
  eventId: string,
): Promise<z.infer<typeof participantChangedSchema>> {
  const { data } = await apiClient.post(
    `/v1/events/${encodeURIComponent(eventId)}/participants/join`,
  );
  return parseResponse(participantChangedSchema, data);
}

export async function withdrawFromEvent(
  eventId: string,
): Promise<z.infer<typeof participantChangedSchema>> {
  const { data } = await apiClient.post(
    `/v1/events/${encodeURIComponent(eventId)}/participants/withdraw`,
  );
  return parseResponse(participantChangedSchema, data);
}

export async function addEventParticipant(
  eventId: string,
  fellowshipId: string,
): Promise<z.infer<typeof participantChangedSchema>> {
  const { data } = await apiClient.post(
    `/v1/events/${encodeURIComponent(eventId)}/participants/add`,
    { fellowshipId },
  );
  return parseResponse(participantChangedSchema, data);
}

export async function removeEventParticipant(
  eventId: string,
  fellowshipId: string,
): Promise<z.infer<typeof participantChangedSchema>> {
  const { data } = await apiClient.post(
    `/v1/events/${encodeURIComponent(eventId)}/participants/remove`,
    { fellowshipId },
  );
  return parseResponse(participantChangedSchema, data);
}

export async function updateEvent(
  eventId: string,
  input: { name?: string; venue?: string | null },
): Promise<z.infer<typeof updatedEventSchema>> {
  const { data } = await apiClient.patch(`/v1/events/${encodeURIComponent(eventId)}/update`, input);
  return parseResponse(updatedEventSchema, data);
}

export async function closeEvent(eventId: string): Promise<z.infer<typeof statusChangeSchema>> {
  const { data } = await apiClient.post(`/v1/events/${encodeURIComponent(eventId)}/close`);
  return parseResponse(statusChangeSchema, data);
}

export async function archiveEvent(eventId: string): Promise<z.infer<typeof statusChangeSchema>> {
  const { data } = await apiClient.post(`/v1/events/${encodeURIComponent(eventId)}/archive`);
  return parseResponse(statusChangeSchema, data);
}

const sessionViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  heldOn: z.string(),
  presentCount: z.number().int().nonnegative(),
});

const sessionsListSchema = z.object({
  event: z.object({ id: z.string(), name: z.string(), status: eventStatusSchema }),
  sessions: z.array(sessionViewSchema),
});

const sessionChangedSchema = z.object({
  event: z.object({ id: z.string(), name: z.string(), status: eventStatusSchema }),
  session: z.object({ id: z.string(), name: z.string(), heldOn: z.string() }),
});

const sessionRemovedSchema = z.object({
  event: z.object({ id: z.string(), name: z.string() }),
  session: z.object({ id: z.string(), name: z.string() }),
  removedAt: z.string(),
});

const sessionAttendancePersonSchema = z.object({
  personId: z.string(),
  fellowshipId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  membershipStatus: z.enum(['ACTIVE', 'ASSOCIATE']),
  present: z.boolean(),
});

const sessionAttendanceSchema = z.object({
  event: z.object({ id: z.string(), name: z.string(), status: eventStatusSchema }),
  session: z.object({ id: z.string(), name: z.string(), heldOn: z.string() }),
  participants: z.array(sessionAttendancePersonSchema),
  presentCount: z.number().int().nonnegative(),
});

const attendanceMarkChangedSchema = z.object({
  event: z.object({ id: z.string(), name: z.string() }),
  session: z.object({ id: z.string(), name: z.string() }),
  person: z.object({
    personId: z.string(),
    fellowshipId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
  present: z.boolean(),
});

export type EventSessionsList = z.infer<typeof sessionsListSchema>;
export type EventSessionView = z.infer<typeof sessionViewSchema>;
export type SessionAttendance = z.infer<typeof sessionAttendanceSchema>;

export async function listEventSessions(eventId: string): Promise<EventSessionsList> {
  const { data } = await apiClient.get(
    `/v1/events/${encodeURIComponent(eventId)}/sessions/list`,
  );
  return parseResponse(sessionsListSchema, data);
}

export async function createEventSession(
  eventId: string,
  input: { name: string; heldOn: string },
): Promise<z.infer<typeof sessionChangedSchema>> {
  const { data } = await apiClient.post(
    `/v1/events/${encodeURIComponent(eventId)}/sessions/new`,
    input,
  );
  return parseResponse(sessionChangedSchema, data);
}

export async function updateEventSession(
  eventId: string,
  sessionId: string,
  input: { name?: string; heldOn?: string },
): Promise<z.infer<typeof sessionChangedSchema>> {
  const { data } = await apiClient.patch(
    `/v1/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}`,
    input,
  );
  return parseResponse(sessionChangedSchema, data);
}

export async function removeEventSession(
  eventId: string,
  sessionId: string,
): Promise<z.infer<typeof sessionRemovedSchema>> {
  const { data } = await apiClient.post(
    `/v1/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}/remove`,
  );
  return parseResponse(sessionRemovedSchema, data);
}

export async function listSessionAttendance(
  eventId: string,
  sessionId: string,
): Promise<SessionAttendance> {
  const { data } = await apiClient.get(
    `/v1/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}/attendance`,
  );
  return parseResponse(sessionAttendanceSchema, data);
}

export async function markSessionAttendance(
  eventId: string,
  sessionId: string,
  fellowshipId: string,
): Promise<z.infer<typeof attendanceMarkChangedSchema>> {
  const { data } = await apiClient.post(
    `/v1/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}/attendance/mark`,
    { fellowshipId },
  );
  return parseResponse(attendanceMarkChangedSchema, data);
}

export async function unmarkSessionAttendance(
  eventId: string,
  sessionId: string,
  fellowshipId: string,
): Promise<z.infer<typeof attendanceMarkChangedSchema>> {
  const { data } = await apiClient.post(
    `/v1/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}/attendance/unmark`,
    { fellowshipId },
  );
  return parseResponse(attendanceMarkChangedSchema, data);
}

const contributionPaymentSchema = z.object({
  id: z.string(),
  amountTzs: z.number().int(),
  note: z.string().nullable(),
  recordedAt: z.string(),
});

const contributionRowSchema = z.object({
  personId: z.string(),
  fellowshipId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  membershipStatus: z.enum(['ACTIVE', 'ASSOCIATE']),
  pledgeTzs: z.number().int(),
  paidTzs: z.number().int(),
  outstandingTzs: z.number().int(),
  payments: z.array(contributionPaymentSchema),
});

const contributionsListSchema = z.object({
  event: z.object({ id: z.string(), name: z.string(), status: eventStatusSchema }),
  rows: z.array(contributionRowSchema),
  totals: z.object({
    pledgeTzs: z.number().int(),
    paidTzs: z.number().int(),
    outstandingTzs: z.number().int(),
  }),
});

const pledgeChangedSchema = z.object({
  event: z.object({ id: z.string(), name: z.string(), status: eventStatusSchema }),
  person: z.object({
    personId: z.string(),
    fellowshipId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
  pledgeTzs: z.number().int(),
  paidTzs: z.number().int(),
  outstandingTzs: z.number().int(),
});

const paymentChangedSchema = z.object({
  event: z.object({ id: z.string(), name: z.string(), status: eventStatusSchema }),
  person: z.object({
    personId: z.string(),
    fellowshipId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
  payment: contributionPaymentSchema,
  pledgeTzs: z.number().int(),
  paidTzs: z.number().int(),
  outstandingTzs: z.number().int(),
});

const paymentRemovedSchema = z.object({
  event: z.object({ id: z.string(), name: z.string(), status: eventStatusSchema }),
  payment: z.object({
    id: z.string(),
    personId: z.string(),
    amountTzs: z.number().int(),
  }),
  removedAt: z.string(),
});

export type EventContributions = z.infer<typeof contributionsListSchema>;
export type ContributionRow = z.infer<typeof contributionRowSchema>;

export async function listEventContributions(eventId: string): Promise<EventContributions> {
  const { data } = await apiClient.get(
    `/v1/events/${encodeURIComponent(eventId)}/contributions`,
  );
  return parseResponse(contributionsListSchema, data);
}

export async function setEventPledge(
  eventId: string,
  fellowshipId: string,
  amountTzs: number,
): Promise<z.infer<typeof pledgeChangedSchema>> {
  const { data } = await apiClient.put(
    `/v1/events/${encodeURIComponent(eventId)}/contributions/${encodeURIComponent(fellowshipId)}/pledge`,
    { amountTzs },
  );
  return parseResponse(pledgeChangedSchema, data);
}

export async function recordEventPayment(
  eventId: string,
  fellowshipId: string,
  input: { amountTzs: number; note?: string },
): Promise<z.infer<typeof paymentChangedSchema>> {
  const { data } = await apiClient.post(
    `/v1/events/${encodeURIComponent(eventId)}/contributions/${encodeURIComponent(fellowshipId)}/payments`,
    input,
  );
  return parseResponse(paymentChangedSchema, data);
}

export async function removeEventPayment(
  eventId: string,
  paymentId: string,
): Promise<z.infer<typeof paymentRemovedSchema>> {
  const { data } = await apiClient.delete(
    `/v1/events/${encodeURIComponent(eventId)}/contributions/payments/${encodeURIComponent(paymentId)}`,
  );
  return parseResponse(paymentRemovedSchema, data);
}
