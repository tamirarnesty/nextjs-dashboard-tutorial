import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
/*
 * Full list of providers: https://authjs.dev/getting-started/providers
 * It is recommended to use OAuth or email providers over credential providers
 */
import Credentials from 'next-auth/providers/credentials';
import { sql } from '@vercel/postgres';

/* create a separate file for the bcrypt package. This is because bcrypt relies on Node.js APIs not available in Next.js Middleware. */
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;

          // Compare passwords using bcrypt to validate credentials
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User>`SELECT * FROM users where email = ${email}`;
    return user.rows[0];
  } catch (error) {
    console.log(`Failed to fetch user with email: ${email}`);
    console.log(error);
    throw new Error('Failed to fetch user');
  }
}
