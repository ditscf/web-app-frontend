import { z } from 'zod';
import { apiClient, parseResponse } from '@/lib/api/client';
import { RegistrationRequest } from '@/interfaces/interface';


const registrationResultSchema = z.object({
  applicationId: z.string(),
  status: z.literal('PENDING'),
  submittedAt: z.string(),
  expiresAt: z.string(),
});

export type RegistrationResult = z.infer<typeof registrationResultSchema>;

const pendingApplicationSchema = z.object({
  applicationId: z.string(),
  submittedAt: z.string(),
  expiresAt: z.string(),
  gsApprovalRecorded: z.boolean(),
  applicant: z.object({
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    class: z.string(),
    course: z.string(),
    yearOfStudy: z.string(),
    dateOfBirth: z.string(),
  }),
});

const pendingApplicationsSchema = z.object({ applications: z.array(pendingApplicationSchema) });

const approvalResultSchema = z.object({
  applicationId: z.string(),
  status: z.enum(['PENDING', 'APPROVED']),
  fellowshipId: z.string().nullable(),
});

export type PendingApplication = z.infer<typeof pendingApplicationSchema>;
export type ApprovalResult = z.infer<typeof approvalResultSchema>;

export async function registerApplication(request: RegistrationRequest): Promise<RegistrationResult> {
  const { studyClass, ...profile } = request;
  // The API rejects unknown fields and names the class field `class`.
  const { data } = await apiClient.post('/v1/applications/new', { ...profile, class: studyClass });
  return parseResponse(registrationResultSchema, data);
}

export const PENDING_APPLICATIONS_LIMIT = 100;

/** Oldest first. The API returns at most `PENDING_APPLICATIONS_LIMIT`. */
export async function listPendingApplications(): Promise<PendingApplication[]> {
  const { data } = await apiClient.get('/v1/applications/list');
  return parseResponse(pendingApplicationsSchema, data).applications;
}

/** Records the caller's step. The second step creates the member and sends the activation email. */
export async function approveApplication(applicationId: string): Promise<ApprovalResult> {
  const { data } = await apiClient.post(`/v1/applications/${encodeURIComponent(applicationId)}/approval`);
  return parseResponse(approvalResultSchema, data);
}
