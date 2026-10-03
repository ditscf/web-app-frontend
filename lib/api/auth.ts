import { z } from 'zod';
import { apiClient, parseResponse } from '@/lib/api/client';

const fellowshipOfficeSchema = z.enum([
  'CHAIRMAN',
  'VICE_CHAIRMAN',
  'GENERAL_SECRETARY',
  'VICE_GENERAL_SECRETARY',
  'TREASURER',
]);

const eventRoleSchema = z.enum(['EVENT_CHAIRMAN', 'EVENT_TREASURER', 'EVENT_SECRETARY']);

const actorEventRoleSchema = z.object({
  role: eventRoleSchema,
  event: z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(['ACTIVE', 'CLOSED']),
  }),
});

const actorProfileSchema = z.object({
  accountId: z.string(),
  personId: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fellowshipId: z.string(),
  membershipStatus: z.enum(['ACTIVE', 'ASSOCIATE']),
  onboardingCompleted: z.boolean(),
  operativeYear: z
    .object({
      id: z.string(),
      label: z.string(),
      status: z.enum(['OPEN', 'CLOSED']),
    })
    .nullable(),
  responsibilities: z.object({
    offices: z.array(fellowshipOfficeSchema),
    ministryLeadership: z
      .object({ ministry: z.object({ id: z.string(), name: z.string() }) })
      .nullable(),
    eventRoles: z.array(actorEventRoleSchema),
  }),
});

export type FellowshipOffice = z.infer<typeof fellowshipOfficeSchema>;
export type EventRole = z.infer<typeof eventRoleSchema>;
export type ActorEventRole = z.infer<typeof actorEventRoleSchema>;
export type ActorProfile = z.infer<typeof actorProfileSchema>;

const loginCodeRequestResponseSchema = z.object({ message: z.string() });

export async function requestLoginCode(email: string): Promise<string> {
  const { data } = await apiClient.post('/v1/auth/login', { email });
  return parseResponse(loginCodeRequestResponseSchema, data).message;
}

export async function verifyLoginCode(email: string, code: string): Promise<ActorProfile> {
  const { data } = await apiClient.post('/v1/auth/login/verify', { email, code }, { skipUnauthenticatedHandler: true });
  return parseResponse(actorProfileSchema, data);
}

export async function getCurrentActor(): Promise<ActorProfile> {
  const { data } = await apiClient.get('/v1/auth/me');
  return parseResponse(actorProfileSchema, data);
}

export async function logout(): Promise<void> {
  await apiClient.post('/v1/auth/logout', undefined, { skipUnauthenticatedHandler: true });
}
