import NextAuth, { type User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sessionUserSchema } from '@/lib/auth/session-user';

const SESSION_MAX_AGE_SECONDS = 60 * 60;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        accountId: {},
        email: {},
        firstName: {},
        lastName: {},
      },
      authorize(credentials): User | null {
        const parsed = sessionUserSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { accountId, email, firstName, lastName } = parsed.data;
        return { id: accountId, email, name: `${firstName} ${lastName}`.trim() };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
    jwt({ token, user }) {
      if (user) return { ...token, sessionExpiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 };

      const { sessionExpiresAt } = token;
      if (typeof sessionExpiresAt !== 'number' || Date.now() >= sessionExpiresAt) return null;
      return token;
    },
  },
});
