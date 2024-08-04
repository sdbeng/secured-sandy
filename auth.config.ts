import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
        authorized({ auth, request: {nextUrl}}) {
            //returns true if user is logged in, false if user is not logged in
            const isLoggedIn = !!auth?.user;// !! converts value to boolean
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if(isOnDashboard) {
                if(isLoggedIn) return true;
                return false; //Redirect unauthenticated users to login page
            }else if(isLoggedIn) {
                ////Redirect authenticated users to dashboard
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
    },
    providers: [],//add providers with empty array for now
} satisfies NextAuthConfig;