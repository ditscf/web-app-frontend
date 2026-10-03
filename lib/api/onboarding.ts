import { z } from 'zod';
import { apiClient, parseResponse } from '@/lib/api/client';

const onboardingResultSchema = z.object({
  onboardingCompleted: z.literal(true),
  ministries: z.array(z.object({ id: z.string(), name: z.string() })),
});

export type OnboardingResult = z.infer<typeof onboardingResultSchema>;

/** One-time and final: the API refuses a second submission with 409. */
export async function completeOnboarding(ministryIds: string[]): Promise<OnboardingResult> {
  const { data } = await apiClient.post('/v1/onboarding/complete', { ministryIds });
  return parseResponse(onboardingResultSchema, data);
}
