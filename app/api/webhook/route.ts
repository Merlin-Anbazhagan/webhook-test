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
  billing_address: BillingAddress;
};
 
type Company = {
  companyId: number;
  companyName?: string | null;
  extraFields: ExtraField[];
  companyEmail: string;
};
 
type ExtraField = {
  fieldName: string;
  fieldValue: string;
};
 

type BillingAddress ={
    company: string;
    first_name:string;

}
 
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook Payload:', body);
 
    const orderId = body.data?.id;
    
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
    const billingAddress= order.billing_address;
    const companyName = billingAddress.company;
 
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
    console.log('company Name:',companyName);
   
    

    const encodedParam =encodeURIComponent(companyName);
    const companyRes = await fetch(`https://api-b2b.bigcommerce.com/api/v3/io/companies?q=${encodedParam}`, {
        headers: {
          'authToken': process.env.BC_B2B_AUTH_TOKEN as string,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    if (!companyRes.ok) throw new Error('Failed to fetch Customer Data');
    const responseBody = await companyRes.json();
    const companies :Company[] = responseBody.data;
   // const companies: Company = await companyRes.json();
    console.log('Customer:', companies);
    console.log('encoded param',encodedParam);

    const companyNum = companies[0].companyId;

    console.log('Company Number',companyNum);

    const comPanyDeatilsRes = await fetch(`https://api-b2b.bigcommerce.com/api/v3/io/companies/${companyNum}`, {
        headers: {
          'authToken': process.env.BC_B2B_AUTH_TOKEN as string,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    if (!comPanyDeatilsRes.ok) throw new Error('Failed to fetch Company Data');
    const companyReponseDeatils = await comPanyDeatilsRes.json();
    const companyDetails: Company =companyReponseDeatils.data;

    console.log('ENtire Company Details',companyDetails);

    const metaFields = companyDetails.extraFields;
    const e8field =metaFields[0].fieldName;
    console.log('E8 Field',e8field);

    

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