import { z } from 'zod';
import { apiClient, parseResponse } from '@/lib/api/client';

const yearStatusSchema = z.enum(['OPEN', 'CLOSED']);
const applicationStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'REJECTED',
]);

const operativeYearSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: yearStatusSchema,
});

const chairmanSchema = z.object({
  personId: z.string(),
  fellowshipId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  since: z.string(),
});

const chairmanResultSchema = z.object({
  operativeYear: operativeYearSchema.nullable(),
  chairman: chairmanSchema.nullable(),
});

const meSchema = z.object({
  operativeYear: operativeYearSchema.nullable(),
  chairmanAppointed: z.boolean(),
  eligible: z.boolean(),
  application: z
    .object({
      id: z.string(),
      status: applicationStatusSchema,
      appliedAt: z.string(),
    })
    .nullable(),
});

const applicationViewSchema = z.object({
  id: z.string(),
  personId: z.string(),
  fellowshipId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  yearOfStudy: z.string(),
  appliedAt: z.string(),
  status: applicationStatusSchema,
});

const pendingSchema = z.object({
  applications: z.array(applicationViewSchema),
});

const changedSchema = z.object({
  application: applicationViewSchema,
});

export type GraduationChairmanResult = z.infer<typeof chairmanResultSchema>;
export type GraduationMe = z.infer<typeof meSchema>;
export type GraduationApplication = z.infer<typeof applicationViewSchema>;

export async function getGraduationChairman(): Promise<GraduationChairmanResult> {
  const { data } = await apiClient.get('/v1/graduation/chairman');
  return parseResponse(chairmanResultSchema, data);
}

export async function appointGraduationChairman(
  fellowshipId: string,
): Promise<GraduationChairmanResult> {
  const { data } = await apiClient.post('/v1/graduation/chairman', { fellowshipId });
  return parseResponse(chairmanResultSchema, data);
}

export async function getGraduationMe(): Promise<GraduationMe> {
  const { data } = await apiClient.get('/v1/graduation/me');
  return parseResponse(meSchema, data);
}

export async function applyForGraduation(): Promise<z.infer<typeof changedSchema>> {
  const { data } = await apiClient.post('/v1/graduation/apply');
  return parseResponse(changedSchema, data);
}

export async function cancelGraduationApplication(
  applicationId: string,
): Promise<z.infer<typeof changedSchema>> {
  const { data } = await apiClient.post(
    `/v1/graduation/applications/${encodeURIComponent(applicationId)}/cancel`,
  );
  return parseResponse(changedSchema, data);
}

export async function listPendingGraduationApplications(): Promise<
  z.infer<typeof pendingSchema>
> {
  const { data } = await apiClient.get('/v1/graduation/applications/pending');
  return parseResponse(pendingSchema, data);
}

export async function confirmGraduationApplication(
  applicationId: string,
): Promise<z.infer<typeof changedSchema>> {
  const { data } = await apiClient.post(
    `/v1/graduation/applications/${encodeURIComponent(applicationId)}/confirm`,
  );
  return parseResponse(changedSchema, data);
}

export async function rejectGraduationApplication(
  applicationId: string,
): Promise<z.infer<typeof changedSchema>> {
  const { data } = await apiClient.post(
    `/v1/graduation/applications/${encodeURIComponent(applicationId)}/reject`,
  );
  return parseResponse(changedSchema, data);
}
