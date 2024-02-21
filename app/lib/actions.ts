'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { custom, z } from 'zod';

// mark all the exported functions within the file as server functions. They can be imported into Client and Server components, making them extremely versatile

const InvoiceFormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(), // Use coerce to cast the string to a number
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = InvoiceFormSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoiceFormSchema.omit({ id: true, date: true });
const invoicesPath: string = '/dashboard/invoices';

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // To eliminate JS floating point issues, convert the amount (dollars eg. xx.xx) to cents (eg. xxxxx)
  const amountInCents = amount * 100;
  const currentDate = new Date().toISOString().split('T')[0];
  console.log({ customerId, amountInCents, status, currentDate });

  await sql`
    INSERT INTO invoices (customer_id, amount, date, status)
    VALUES (${customerId}, ${amountInCents}, ${currentDate}, ${status})
  `;

  // Clear the cached route of the invoices page, requiring a new request to be made
  // This will require the invoices list to be re-fetched, and the UI to be updated
  revalidateAndRedirect();
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidateAndRedirect();
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;

  // No need to redirect, since the action is called in the invoices path directly. It is not occurring in another page like create/update.
  // Still need to revalidate in order to reload the invoices list
  revalidatePath(invoicesPath);
}

function revalidateAndRedirect() {
  revalidatePath(invoicesPath);
  redirect(invoicesPath);
}
