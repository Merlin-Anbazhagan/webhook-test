import { NextRequest, NextResponse } from 'next/server';
 
const BC_API_TOKEN = process.env.BC_API_TOKEN!;
const BC_STORE_HASH = process.env.BC_STORE_HASH!;
const BC_B2B_API_TOKEN = process.env.BC_B2B_API_TOKEN!; // B2B API token
 
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
const orderId = body.data.id;
    console.log('Webhook triggered for Order ID:', orderId);
 
    // 1. Fetch Order Details
    const orderRes = await fetch(
`https://api.bigcommerce.com/stores/${BC_STORE_HASH}/v2/orders/${orderId}`,
      {
        headers: {
          'X-Auth-Token': BC_API_TOKEN,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
 
    const order = await orderRes.json();
    console.log('Order:', order);
 
    // 2. Fetch Products in Order
    const productsRes = await fetch(
`https://api.bigcommerce.com/stores/${BC_STORE_HASH}/v2/orders/${orderId}/products`,
      {
        headers: {
          'X-Auth-Token': BC_API_TOKEN,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
 
    const products = await productsRes.json();
    console.log('Products:', products);
 
    // 3. Fetch Customer Details
    const customerRes = await fetch(
`https://api.bigcommerce.com/stores/${BC_STORE_HASH}/v2/customers/${order.customer_id}`,
      {
        headers: {
          'X-Auth-Token': BC_API_TOKEN,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
 
    const customer = await customerRes.json();
    console.log('Customer:', customer);
 
    // Extract company name
const companyName = customer.company;
    console.log('Company Name from Customer:', companyName);
 
    // 4. Search Company by Name
    const companySearchRes = await fetch(
`https://api-b2b.bigcommerce.com/api/v3/io/companies?name=${encodeURIComponent(companyName)}`,
      {
        headers: {
          'X-Auth-Token': BC_B2B_API_TOKEN,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
 
    const companySearchData = await companySearchRes.json();
    const matchedCompany = companySearchData.data?.[0];
 
    if (!matchedCompany) {
      console.error('No company found for name:', companyName);
      return NextResponse.json({ message: 'Company not found' });
    }
 
    console.log('Matched Company:', matchedCompany);
 
    // 5. Fetch Company Details using company_id
    const companyDetailsRes = await fetch(
`https://api-b2b.bigcommerce.com/api/v3/io/companies/${matchedCompany.id}`,
      {
        headers: {
          'X-Auth-Token': BC_B2B_API_TOKEN,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
 
    const companyDetails = await companyDetailsRes.json();
 
    // Extract E8 Company ID from extraFields
    const e8CompanyId = companyDetails.data?.extraFields?.find(
(field: any) => field.name === 'E8 Company ID'
    )?.value;
 
console.log('Company ID:', matchedCompany.id);
    console.log('E8 Company ID:', e8CompanyId);
 
    // Final Response
    return NextResponse.json({
      order,
      products,
      customer,
      company: companyDetails.data,
companyId: matchedCompany.id,
      e8CompanyId,
    });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}