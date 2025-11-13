import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyUserCredentials } from '@/lib/auth';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Admin Login über ENV-Variablen
          const adminEmail = process.env.ADMIN_EMAIL?.trim();
          const adminPassword = process.env.ADMIN_PASSWORD?.trim();
          const inputEmail = credentials.email?.trim().toLowerCase();
          const inputPassword = credentials.password?.trim();

        // Debug-Logging (nur in Development)
        const emailMatches = inputEmail === adminEmail?.toLowerCase();
        const passwordMatches = inputPassword === adminPassword;
        const allConditionsMet = !!(
          adminEmail &&
          adminPassword &&
          emailMatches &&
          passwordMatches
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Admin Login Attempt:', {
            hasAdminEmail: !!adminEmail,
            hasAdminPassword: !!adminPassword,
            adminEmailLength: adminEmail?.length,
            adminPasswordLength: adminPassword?.length,
            inputEmailLength: inputEmail?.length,
            inputPasswordLength: inputPassword?.length,
            emailMatch: emailMatches,
            passwordMatch: passwordMatches,
            allConditionsMet: allConditionsMet,
            adminEmailValue: adminEmail ? `${adminEmail.substring(0, 3)}...` : 'undefined',
            inputEmailValue: inputEmail ? `${inputEmail.substring(0, 3)}...` : 'undefined',
            condition1: !!adminEmail,
            condition2: !!adminPassword,
            condition3: emailMatches,
            condition4: passwordMatches,
          });
        }

        if (allConditionsMet) {
          const adminUser = {
            id: 'admin',
            email: adminEmail,
            role: Role.ADMIN,
            name: 'Admin',
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Admin login successful, returning user:', {
              id: adminUser.id,
              email: adminUser.email,
              role: adminUser.role,
            });
          }
          
          return adminUser;
        }

        // Normale User Login über Datenbank
        const user = await verifyUserCredentials(
          credentials.email,
          credentials.password
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          role: user.role,
          name: user.name || user.email,
        };
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error in authorize function:', error);
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('JWT callback - user data:', {
            id: user.id,
            email: user.email,
            role: user.role,
          });
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Session callback - token data:', {
            id: token.id,
            email: token.email,
            role: token.role,
          });
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

