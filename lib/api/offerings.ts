import { z } from 'zod';
import { apiClient, parseResponse } from '@/lib/api/client';

const yearStatusSchema = z.enum(['OPEN', 'CLOSED', 'ARCHIVED']);

const offeringSchema = z.object({
  id: z.string(),
  offeredOn: z.string(),
  amountTzs: z.number().int(),
  updatedAt: z.string(),
});

const offeringsListSchema = z.object({
  operativeYear: z.object({
    id: z.string(),
    label: z.string(),
    status: yearStatusSchema,
  }),
  offerings: z.array(offeringSchema),
  totalTzs: z.number().int(),
});

const offeringChangedSchema = z.object({
  operativeYear: z.object({
    id: z.string(),
    label: z.string(),
    status: yearStatusSchema,
  }),
  offering: offeringSchema,
});

const offeringRemovedSchema = z.object({
  operativeYear: z.object({
    id: z.string(),
    label: z.string(),
    status: yearStatusSchema,
  }),
  offering: z.object({
    id: z.string(),
    offeredOn: z.string(),
    amountTzs: z.number().int(),
  }),
  removedAt: z.string(),
});

export type OfferingsList = z.infer<typeof offeringsListSchema>;
export type OfferingView = z.infer<typeof offeringSchema>;

export async function listOfferings(): Promise<OfferingsList> {
  const { data } = await apiClient.get('/v1/offerings/list');
  return parseResponse(offeringsListSchema, data);
}

export async function upsertOffering(input: {
  offeredOn: string;
  amountTzs: number;
}): Promise<z.infer<typeof offeringChangedSchema>> {
  const { data } = await apiClient.put('/v1/offerings', input);
  return parseResponse(offeringChangedSchema, data);
}

export async function removeOffering(
  offeringId: string,
): Promise<z.infer<typeof offeringRemovedSchema>> {
  const { data } = await apiClient.delete(
    `/v1/offerings/${encodeURIComponent(offeringId)}`,
  );
  return parseResponse(offeringRemovedSchema, data);
}
