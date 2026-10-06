import { z } from 'zod';
import { apiClient, parseResponse } from '@/lib/api/client';

const ministrySchema = z.object({ id: z.string(), name: z.string() });

const ministryListSchema = z.object({ ministries: z.array(ministrySchema) });

export type Ministry = z.infer<typeof ministrySchema>;

/** Sorted by name. Available before onboarding is complete. */
export async function listMinistries(): Promise<Ministry[]> {
  const { data } = await apiClient.get('/v1/ministries/list');
  return parseResponse(ministryListSchema, data).ministries;
}

/** Names and Fellowship IDs only; the API never returns contact details or date of birth here. */
const ministryPersonSchema = z.object({
  personId: z.string(),
  fellowshipId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  since: z.string(),
});

const ministryLeadersSchema = z.object({
  operativeYear: z
    .object({ id: z.string(), label: z.string(), status: z.enum(['OPEN', 'CLOSED']) })
    .nullable(),
  ministries: z.array(z.object({ ministry: ministrySchema, leader: ministryPersonSchema.nullable() })),
});

const leaderAppointmentSchema = z.object({
  ministry: ministrySchema,
  fellowshipYear: z.object({ id: z.string(), label: z.string() }),
  leader: ministryPersonSchema,
  replaced: ministryPersonSchema.omit({ since: true }).nullable(),
  /** True when the appointment also made the leader a member of the ministry. */
  joinedMinistry: z.boolean(),
});

export type MinistryPerson = z.infer<typeof ministryPersonSchema>;
export type MinistryLeaders = z.infer<typeof ministryLeadersSchema>;
export type MinistryWithLeader = MinistryLeaders['ministries'][number];
export type LeaderAppointment = z.infer<typeof leaderAppointmentSchema>;

/** Every ministry with its leader for the operative year. With no operative year, every leader is null. */
export async function listMinistryLeaders(): Promise<MinistryLeaders> {
  const { data } = await apiClient.get('/v1/ministries/leaders');
  return parseResponse(ministryLeadersSchema, data);
}

/** Appoints the member as the ministry's leader for the operative year, replacing the current leader if any. */
export async function appointMinistryLeader(ministryId: string, fellowshipId: string): Promise<LeaderAppointment> {
  const { data } = await apiClient.post(`/v1/ministries/${encodeURIComponent(ministryId)}/leader`, { fellowshipId });
  return parseResponse(leaderAppointmentSchema, data);
}

const ministryMembersSchema = z.object({
  ministry: ministrySchema,
  members: z.array(ministryPersonSchema),
});

const memberAddedSchema = z.object({
  ministry: ministrySchema,
  member: ministryPersonSchema,
});

const memberRemovedSchema = z.object({
  ministry: ministrySchema,
  member: ministryPersonSchema.omit({ since: true }),
  removedAt: z.string(),
});

export type MinistryMembers = z.infer<typeof ministryMembersSchema>;
export type MinistryMemberAdded = z.infer<typeof memberAddedSchema>;
export type MinistryMemberRemoved = z.infer<typeof memberRemovedSchema>;

function ministryMembersPath(ministryId: string): string {
  return `/v1/ministries/${encodeURIComponent(ministryId)}/members`;
}

/** Current members, ordered by last name. Allowed for the Chairman, the ministry's leader, and the ministry's members. */
export async function listMinistryMembers(ministryId: string): Promise<MinistryMembers> {
  const { data } = await apiClient.get(`${ministryMembersPath(ministryId)}/list`);
  return parseResponse(ministryMembersSchema, data);
}

/** Only an onboarded Active Member can be added. */
export async function addMinistryMember(ministryId: string, fellowshipId: string): Promise<MinistryMemberAdded> {
  const { data } = await apiClient.post(`${ministryMembersPath(ministryId)}/add`, { fellowshipId });
  return parseResponse(memberAddedSchema, data);
}

/** Ends the membership. Removing a member from their last ministry is allowed; removing the current leader is not. */
export async function removeMinistryMember(ministryId: string, fellowshipId: string): Promise<MinistryMemberRemoved> {
  const { data } = await apiClient.post(`${ministryMembersPath(ministryId)}/remove`, { fellowshipId });
  return parseResponse(memberRemovedSchema, data);
}
