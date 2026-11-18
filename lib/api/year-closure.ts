import { z } from 'zod';
import { apiClient, parseResponse } from '@/lib/api/client';

const yearStatusSchema = z.enum(['OPEN', 'CLOSED', 'ARCHIVED']);
const requestStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED']);

const pendingRequestSchema = z.object({
  id: z.string(),
  status: requestStatusSchema,
  requestedAt: z.string(),
  expiresAt: z.string(),
  remainingSeconds: z.number().int().nullable(),
  confirmedAt: z.string().nullable(),
});

const yearSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: yearStatusSchema,
  closedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
});

const blockersSchema = z.object({
  activeEventCount: z.number().int().nonnegative(),
  nonArchivedEventCount: z.number().int().nonnegative(),
});

const closureStatusSchema = z.object({
  year: yearSchema,
  pendingRequest: pendingRequestSchema.nullable(),
  blockers: blockersSchema,
});

const closureChangedSchema = z.object({
  year: yearSchema,
  pendingRequest: pendingRequestSchema.nullable(),
});

export type YearClosureStatus = z.infer<typeof closureStatusSchema>;

export async function getYearClosureStatus(): Promise<YearClosureStatus> {
  const { data } = await apiClient.get('/v1/fellowship-year/closure');
  return parseResponse(closureStatusSchema, data);
}

export async function requestYearClosure(): Promise<z.infer<typeof closureChangedSchema>> {
  const { data } = await apiClient.post('/v1/fellowship-year/closure/request');
  return parseResponse(closureChangedSchema, data);
}

export async function cancelYearClosure(): Promise<z.infer<typeof closureChangedSchema>> {
  const { data } = await apiClient.post('/v1/fellowship-year/closure/cancel');
  return parseResponse(closureChangedSchema, data);
}

export async function confirmYearClosure(): Promise<z.infer<typeof closureChangedSchema>> {
  const { data } = await apiClient.post('/v1/fellowship-year/closure/confirm');
  return parseResponse(closureChangedSchema, data);
}

export async function archiveFellowshipYear(): Promise<z.infer<typeof closureChangedSchema>> {
  const { data } = await apiClient.post('/v1/fellowship-year/archive');
  return parseResponse(closureChangedSchema, data);
}
