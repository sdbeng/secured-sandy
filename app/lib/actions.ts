'use server';

import {z} from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

//define a schema that matches the shape of the form object. This schema will
//use Zod to validate the formData object before saving it to the database.

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number().gt(0, {message: 'Please enter an amount grater than $0.'}),//coerce from a string to a number while validating its type, and always want an amount > 0
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({id: true, date: true});//omit the id and date fields from the schema

const UpdateInvoice = FormSchema.omit({date: true});//whatch out it starts with capital U!!

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    }
    message?: string | null;
}

export async function createInvoice(prevState: State, formData: FormData) {
    //validate fields using Zod schema
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    //if form validation fails, return errors early. Otherwise, continue
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to create invoice.',
        };
    }

    // Prepare data for insertion into the database
    const {customerId, amount, status} = validatedFields.data;

    //it's a good practice to store monetary values in cents in your database to eliminate floating point errors and ensure greater accuracy.
    const amountInCents =  amount * 100;//basic conversion to cents
    // const amountInCents = Math.round(amount * 100);//alt:converted and rounded to nearest cent
    
    //create new data with format "yyyy-mm-dd" for the invoice's creation date
    const date = new Date().toISOString().split('T')[0];//get the current date in the format "yyyy-mm-dd" from the ISO string then split it at the 'T' character
    
    //create a SQL query to insert the new invoice into the database and pass in the variables
    //add try/catch block to catch any errors that occur during the sql query process
    try {        
    await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
    } catch (error) {
        console.error('Error creating invoice:', error);
        return {
            message: 'Database error: Failed to create invoice.',
        }        
    }
    // const result = await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date}) RETURNING *`;//alt:use the RETURNING clause to return the newly created invoice

    //since i'm updating the data displayed in the invoices route, i want to clear this cache and trigger a new request to the server - do this with the revalidatePath function
    revalidatePath('/dashboard/invoices');//clear the cache for the invoices route, once the database has been updated, the /dashboard/invoices path will be revalidated, and fresh data will be fetched from the server!!

    //redirect user back to the invoices route after invoice has been created
    redirect('/dashboard/invoices');
}

export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData
) {
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    if(!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to Update invoice...',
        };
    }
    const {customerId, amount, status} = validatedFields.data;
    const amountInCents =  amount * 100;

    try{
        await sql`UPDATE invoices SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status} WHERE id = ${id}`;

    }catch (error) {
        // console.error('Error updating invoice:', error);
        return {
            message: 'Database error: Failed to update invoice.',
        }
    }

    revalidatePath('/dashboard/invoices');

    redirect('/dashboard/invoices');

}

export async function deleteInvoice(id: string) {
    //throw new Error('Failed to delete invoice');//throw an error to temporarily test the error handling in the deleteInvoice function

    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;        
        revalidatePath('/dashboard/invoices');
        return {message: 'Invoice deleted successfully.'};
    } catch (error) {
        return {
            message: 'Database error: Failed to delete invoice.',
        }        
    }
}

/* Note how redirect is being called outside of the try/catch block. This is because redirect works by throwing an error, which would be caught by the catch block. To avoid this, you can call redirect after try/catch. redirect would only be reachable if try is successful.*/

//connect the auth logic with your login form. In your actions.ts file, create a new action called authenticate. This action should import the signIn function from auth.ts

export async function authenticate(
    prevState: string | undefined, formData: FormData
) {
    try {        
        await signIn('credentials', formData);
    } catch (error) {
        if(error instanceof AuthError) { 
            console.log('error:', error);           
            switch (error.type) {
                case 'CredentialsSignin': 
                    return 'Invalid credentials';
                default:
                    return 'Something went wrong';
            }
        }
        throw error;
    }
}