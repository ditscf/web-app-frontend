import { z } from 'zod';
import { apiClient, parseResponse } from '@/lib/api/client';

const memberLookupSchema = z.object({
  personId: z.string(),
  fellowshipId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  membershipStatus: z.enum(['ACTIVE', 'ASSOCIATE']),
  onboarded: z.boolean(),
});

export type MemberLookup = z.infer<typeof memberLookupSchema>;

/** Confirms who a Fellowship ID belongs to. Names and status only; no email, phone, or date of birth. */
export async function lookupMember(fellowshipId: string): Promise<MemberLookup> {
  const { data } = await apiClient.get(`/v1/members/lookup/${encodeURIComponent(fellowshipId)}`);
  return parseResponse(memberLookupSchema, data);
}

/** Matches the add and appoint refusals, so the caller can stop before those requests. */
export function getLookupActionBlocker(
  member: MemberLookup,
  action: 'appoint' | 'add' | 'appointEvent',
): string | null {
  if (member.membershipStatus !== 'ACTIVE') {
    if (action === 'appoint') return 'Only an Active Member can lead a ministry.';
    if (action === 'appointEvent') {
      return 'Only an Active Member can hold an event committee role.';
    }
    return 'Only an Active Member can be added to a ministry.';
  }
  if (!member.onboarded) return 'This member has not finished onboarding.';
  return null;
}

export type MemberDirectoryStatus = 'ACTIVE' | 'ASSOCIATE';
export type MemberDirectoryOnboarded = 'true' | 'false';

export interface MemberDirectoryFilters {
  q?: string;
  status?: MemberDirectoryStatus;
  onboarded?: MemberDirectoryOnboarded;
}

const directoryRowSchema = z.object({
  personId: z.string(),
  fellowshipId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

const directoryListSchema = z.object({
  members: z.array(directoryRowSchema),
});

export type MemberDirectoryList = z.infer<typeof directoryListSchema>;

const directorySummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.array(
    z.object({
      status: z.enum(['ACTIVE', 'ASSOCIATE']),
      count: z.number().int().nonnegative(),
    }),
  ),
  byOnboarded: z.array(
    z.object({
      onboarded: z.boolean(),
      count: z.number().int().nonnegative(),
    }),
  ),
  byYearOfStudy: z.array(
    z.object({
      yearOfStudy: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
});

export type MemberDirectorySummary = z.infer<typeof directorySummarySchema>;

function toQueryParams(filters: MemberDirectoryFilters): Record<string, string> {
  const params: Record<string, string> = {};
  const q = filters.q?.trim();
  if (q) params.q = q;
  if (filters.status) params.status = filters.status;
  if (filters.onboarded) params.onboarded = filters.onboarded;
  return params;
}

export async function listMembers(
  filters: MemberDirectoryFilters = {},
): Promise<MemberDirectoryList> {
  const { data } = await apiClient.get('/v1/members/list', {
    params: toQueryParams(filters),
  });
  return parseResponse(directoryListSchema, data);
}

export async function getMemberSummary(
  filters: MemberDirectoryFilters = {},
): Promise<MemberDirectorySummary> {
  const { data } = await apiClient.get('/v1/members/summary', {
    params: toQueryParams(filters),
  });
  return parseResponse(directorySummarySchema, data);
}
