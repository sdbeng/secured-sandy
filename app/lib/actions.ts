'use server';

import {z} from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

//define a schema that matches the shape of the form object. This schema will
//validate the formData object before saving it to the database.

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),//coerce from a string to a number while validating its type
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({id: true, date: true});//omit the id and date fields from the schema

const UpdateInvoice = FormSchema.omit({date: true});//whatch out it starts with capital U!!

export async function createInvoice(formData: FormData) {
    const {customerId, amount, status} = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    //it's a good practice to store monetary values in cents in your database to eliminate floating point errors and ensure greater accuracy.
    const amountInCents =  amount * 100;//basic conversion to cents
    // const amountInCents = Math.round(amount * 100);//alt:converted and rounded to nearest cent

    //create new data with format "yyyy-mm-dd" for the invoice's creation date
    const date = new Date().toISOString().split('T')[0];//get the current date in the format "yyyy-mm-dd" from the ISO string then split it at the 'T' character

    //create a SQL query to insert the new invoice into the database and pass in the variables
    await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;//insert the new invoice into the database

    // const result = await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date}) RETURNING *`;//alt:use the RETURNING clause to return the newly created invoice

    //since i'm updating the data displayed in the invoices route, i want to clear this cache and trigger a new request to the server - do this with the revalidatePath function
    revalidatePath('/dashboard/invoices');//clear the cache for the invoices route, once the database has been updated, the /dashboard/invoices path will be revalidated, and fresh data will be fetched from the server!!

    redirect('/dashboard/invoices');//redirect the user back to the invoices route after the invoice has been created
}

export async function updateInvoice(id: string, formData: FormData) {
    const {customerId, amount, status} = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents =  amount * 100;

    await sql`UPDATE invoices SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status} WHERE id = ${id}`;

    revalidatePath('/dashboard/invoices');

    redirect('/dashboard/invoices');

}

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;

    revalidatePath('/dashboard/invoices');

    // redirect('/dashboard/invoices');
}