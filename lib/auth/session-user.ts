import { z } from 'zod';
import type { ActorProfile } from '@/lib/api/auth';

// The only profile fields the Auth.js session may hold. Never add NestJS session data here.
export const sessionUserSchema = z.object({
  accountId: z.string().min(1),
  email: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export function toSessionUser(actor: ActorProfile): SessionUser {
  return {
    accountId: actor.accountId,
    email: actor.email,
    firstName: actor.firstName,
    lastName: actor.lastName,
  };
}
