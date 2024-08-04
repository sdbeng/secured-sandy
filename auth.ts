import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials  from "next-auth/providers/credentials";
import { z } from "zod";
import { sql } from '@vercel/postgres';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';

/* i will need to add the providers option for NextAuth.js. 
- providers is an array where you list different login options such as Google or GitHub.
- we will focus on using the Credentials provider only.
- the Credentials provider allows users to log in with a username and a password.\
- it's generally recommended to use alternative providers such as OAuth or email providers. See the NextAuth.js docs for a full list of options
- Adding sign in functionality: use the authorize function to handle the authentication logic. Similarly to Server Actions, you can use zod to validate the email and password before checking if the user exists in the database

*/

//create a getUser function to fetch/queries the user from the database
async function getUser(email: string): Promise<User | undefined> {
    try {
        const user = await sql<User>`SELECT * FROM users WHERE email = ${email}`;
        return user.rows[0];
        
    } catch (error) {
        console.log('Failed to fetch user:', error);
        throw new Error('Failed to fetch user');
    }
}

export const {auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
        async authorize(credentials) {
            const parsedCredentials = z.object({ email: z.string().email(), password: z.string().min(6)})
            .safeParse(credentials);
        
        if(parsedCredentials.success) {
            const { email, password } = parsedCredentials.data;
            const user = await getUser(email);
            if(!user) return null;
            const passwordMatch = await bcrypt.compare(password, user.password);
            if(passwordMatch) return user;
        }
        console.log('Invalid credentials');
        return null;
    },
    }),
],
});