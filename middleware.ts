import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-Routen nur für ADMIN
    if (path.startsWith('/admin')) {
      if (token?.role !== Role.ADMIN) {
        return NextResponse.redirect(new URL('/overview', req.url));
      }
    }

    // Overview-Route nur für eingeloggte User
    if (path.startsWith('/overview')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Login-Seite ist für alle zugänglich
        if (path === '/login') {
          return true;
        }

        // Admin-Routen benötigen Token
        if (path.startsWith('/admin')) {
          return !!token;
        }

        // Overview-Route benötigt Token
        if (path.startsWith('/overview')) {
          return !!token;
        }

        // Startseite ist für alle zugänglich
        if (path === '/') {
          return true;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/overview/:path*', '/login'],
};

