'use server';
import { signIn, signOut } from '@/auth';
// mark all the exported functions within the file as server functions. They can be imported into Client and Server components, making them extremely versatile

import { sql } from '@vercel/postgres';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

enum OperationType {
  Create,
  Update,
  Delete,
}

const InvoiceFormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer',
  }),
  amount: z.coerce.number().gt(0, 'Please enter an amount greater than $0'), // Use coerce to cast the string to a number. Also, an empty input will default to 0, so check that it's greater
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status',
  }),
  date: z.string(),
});

const CreateInvoice = InvoiceFormSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoiceFormSchema.omit({ id: true, date: true });
const invoicesPath: string = '/dashboard/invoices';

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;

  // To eliminate JS floating point issues, convert the amount (dollars eg. xx.xx) to cents (eg. xxxxx)
  const amountInCents = amount * 100;
  const currentDate = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, date, status)
      VALUES (${customerId}, ${amountInCents}, ${currentDate}, ${status})
    `;
    console.log('Invoice created successfully');
  } catch (error) {
    console.log(error);
    return {
      message: generateErrorWithMessage(OperationType.Create),
    };
  }

  // Clear the cached route of the invoices page, requiring a new request to be made
  // This will require the invoices list to be re-fetched, and the UI to be updated
  revalidatePath(invoicesPath);
  redirect(invoicesPath);
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    return {
      message: generateErrorWithMessage(OperationType.Update, id),
    };
  }

  revalidatePath(invoicesPath);
  redirect(invoicesPath);
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    // NOTE: No need to redirect, since the action is called in the invoices path directly. It is not occurring in another page like create/update.
    // Still need to revalidate in order to reload the invoices list
    // NOTE: Redirect from within the delete in case it fails to delete the invoice
    revalidatePath(invoicesPath);
  } catch (error) {
    return generateErrorWithMessage(OperationType.Delete, id);
  }
}

function generateErrorWithMessage(operation: OperationType, id?: string) {
  let message: string = `Database Error: Failed to ${operation} invoice`;
  if (operation == OperationType.Create) {
    // Verify that id is undefined, otherwise raise an error
    if (id) throw new Error('ID should not be defined for create operation');
    return message;
  }

  return `${message}: ${id}`;
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        // Checkout NextAuth.js errors here: https://errors.authjs.dev/
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut();
}
