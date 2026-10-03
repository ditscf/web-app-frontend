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
