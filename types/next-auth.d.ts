import { Role } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    email: string;
    name?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      email: string;
      name?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    email: string;
  }
}



