/* eslint-disable no-console */
import { NextResponse } from 'next/server';
 
type Product = {
  name: string;
  sku: string;
  quantity: number;
};
 
type Coupon = {
  code: string;
  discount: number;
};
 
type Fee = {
  name: string;
  amount: number;
};
 
type Order = {
  id: number;
  products: Product[];
  coupons?: Coupon[];
  fees?: Fee[];
  customer_id: number;
};
 
type Customer = {
  id: number;
  company?: string | null;
};
 
type ExtraField = {
  fieldName: string;
  fieldValue: string;
};
 
type CompanyDetail = {
  companyId: number;
  companyName: string;
  extraFields?: ExtraField[];
};
 
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook Payload:', body);
 
    const orderId = body.data?.id;
    const companyName =body.data?.billing_address?.company;
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID not found in payload' });
    }
 
    // Fetch Order Details
    const orderRes = await fetch(`https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v2/orders/${orderId}`, {
      headers: {
        'X-Auth-Token': process.env.BC_API_TOKEN as string,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    if (!orderRes.ok) throw new Error('Failed to fetch order details');
    const order: Order = await orderRes.json();
    console.log('Order Details:', order);
 
    // Fetch Products
    const productsRes = await fetch(`https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v2/orders/${orderId}/products`, {
      headers: {
        'X-Auth-Token': process.env.BC_API_TOKEN as string,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    if (!productsRes.ok) throw new Error('Failed to fetch order products');
    const products: Product[] = await productsRes.json();
    console.log('Products:', products);
 
   
    const companyRes = await fetch(`https://api-b2b.bigcommerce.com/api/v3/io/companies?q=${companyName}`, {
        headers: {
          Authorization: `Bearer ${process.env.BC_B2B_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    if (!companyRes.ok) throw new Error('Failed to fetch Customer Data');
    const companies: Customer = await companyRes.json();
    console.log('Customer:', companies);

    return NextResponse.json({
      success: true,
      order,
      products,
      companies
     // customer,
      //companyId,
      //e8CompanyId,
    });
 
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}