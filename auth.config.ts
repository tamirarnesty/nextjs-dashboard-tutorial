import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // authorized is used to verify if the request is authorized to access a page via Next.js Middleware
    authorized({ auth, request: { nextUrl } }) {
      // Called before a request is complete (eg. loading a page/route). Pages will not be rendered until this is complete & returns true
      // auth contains user's session
      // request contains the request object
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  // list different login options in providers block
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
