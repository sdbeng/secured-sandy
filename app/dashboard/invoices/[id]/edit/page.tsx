import Form from '@/app/ui/invoices/edit-form'
import Breadcrumbs from '@/app/ui//invoices/breadcrumbs'
import { fetchCustomers, fetchInvoiceById } from '@/app/lib/data'

export default async function Page({params}: {params: {id: string}}) {
    // console.log('params===', params)
    //call the prop params to access the id
    const id = params.id
    //can use Promise.all to fetch both the invoice and customers in parallel
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers()
    ])

    return (
        <main>
            <Breadcrumbs
               breadcrumbs={[
                {label: 'Invoices', href: '/dashboard/invoices'},
                {label: 'Edit Invoice', href: '/dashboard/invoices/edit', active: true},
               ]} 
            />
            <Form customers={customers} invoice={invoice} />
        </main>
    )
}