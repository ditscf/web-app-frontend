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
export function getLookupActionBlocker(member: MemberLookup, action: 'appoint' | 'add'): string | null {
  if (member.membershipStatus !== 'ACTIVE') {
    return action === 'appoint'
      ? 'Only an Active Member can lead a ministry.'
      : 'Only an Active Member can be added to a ministry.';
  }
  if (!member.onboarded) return 'This member has not finished onboarding.';
  return null;
}
