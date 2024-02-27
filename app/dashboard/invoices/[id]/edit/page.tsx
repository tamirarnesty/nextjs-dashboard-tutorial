/* Next.js allows you to create Dynamic Route Segments (https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes) 
when you don't know the exact segment name and want to create routes based on data. This could be blog post titles, product pages, etc. 
You can create dynamic route segments by wrapping a folder's name in square brackets. For example, [id], [post] or [slug].
 */
import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers, fetchInvoiceById } from '@/app/lib/data';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: { id: string } }) {
  const invoiceId: string = params.id;

  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(invoiceId),
    fetchCustomers(),
  ]);

  if (!invoice) {
    // Show a specific 404 not-found.tsx page if the invoice is not found
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${invoiceId}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}
