import { z } from 'zod';
import { apiClient, parseResponse } from '@/lib/api/client';

const profileSchema = z.object({
  personId: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  class: z.string(),
  course: z.string(),
  yearOfStudy: z.string(),
  /** `YYYY-MM-DD`. Shown only to the member; nobody can change it. */
  dateOfBirth: z.string(),
  fellowshipId: z.string(),
  membershipStatus: z.enum(['ACTIVE', 'ASSOCIATE']),
});

export type Profile = z.infer<typeof profileSchema>;

export type EditableProfileField = 'firstName' | 'lastName' | 'phone' | 'class' | 'course' | 'yearOfStudy';

export type ProfileChanges = Partial<Pick<Profile, EditableProfileField>>;

export async function getProfile(): Promise<Profile> {
  const { data } = await apiClient.get('/v1/profile/view');
  return parseResponse(profileSchema, data);
}

/** Send only changed fields. The API refuses an empty body and any field outside `EditableProfileField`. */
export async function updateProfile(changes: ProfileChanges): Promise<Profile> {
  const { data } = await apiClient.patch('/v1/profile/update', changes);
  return parseResponse(profileSchema, data);
}

const emailChangeRequestedSchema = z.object({
  message: z.string(),
  expiresAt: z.string(),
});

export type EmailChangeRequested = z.infer<typeof emailChangeRequestedSchema>;

/** Sends a 6-digit code to the new address and ends any earlier pending request. */
export async function requestEmailChange(newEmail: string): Promise<EmailChangeRequested> {
  const { data } = await apiClient.post('/v1/profile/email/request', { newEmail });
  return parseResponse(emailChangeRequestedSchema, data);
}

/** Applies the change and returns the updated profile. Sessions stay valid; the next sign-in uses the new address. */
export async function confirmEmailChange(code: string): Promise<Profile> {
  const { data } = await apiClient.post('/v1/profile/email/confirm', { code });
  return parseResponse(profileSchema, data);
}
