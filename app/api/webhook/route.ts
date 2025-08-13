/* eslint-disable no-console */
import { NextResponse } from 'next/server';
 
type Product = {
  name: string;
  name_customer: string;
  name_merchant: string;
  product_id: number;
  variant_id:number;  
  sku: string;
  quantity: number;
  is_refunded: boolean;
  quantity_refunded: number;
  refund_amount: DoubleRange;
  return_id:number;
  base_price: string;
  base_total: string;
  total_ex_tax:  string;
  total_inc_tax: string;

};
 
 
type Fee = {
  name: string;
  amount: number;
};
 
type Order = {
  id: number;
  products: Product[];
  fees?: Fee[];
  customer_id: number;
  billing_address: BillingAddress;
 // shipping_address: ShippingAddress;
  E8_companyId: string;
  companyId:number;
  companyName: string,
  companyEmail: string,
};
 
type Company = {
  companyId: number;
  companyName: string
  extraFields: ExtraField[];
  companyEmail: string;
};


 
type ExtraField = {
  fieldName: string;
  fieldValue: string;
};

type Customer ={
  company: string;
}
 

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
  
   
    
const productDetails = products.map(product => ({
   // product_id: product.product_id,
  name: product.name,
  name_customer: product.name_customer,
  name_merchant: product.name_merchant,
  product_id: product.product_id,
  variant_id:product.variant_id,  
  sku: product.sku,
  quantity: product.quantity,
  is_refunded: product.is_refunded,
  quantity_refunded: product.quantity_refunded,
  refund_amount: product.refund_amount,
  return_id:product.return_id,
  base_price: product.base_price,
  base_total: product.base_total,
  total_ex_tax:  product.total_ex_tax,
  total_inc_tax: product.total_inc_tax
  }));

  // To Fetch customer Data
    const customerRes = await fetch(`https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v2/customers/${order.customer_id}`, {
      headers: {
        'X-Auth-Token': process.env.BC_API_TOKEN as string,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  if (!customerRes.ok) throw new Error('Failed to fetch Customer Data');
    const userDetails: Customer = await customerRes.json();
    const companyName = userDetails.company;
    console.log('User Reponse', userDetails);
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
    const e8FieldValue =metaFields[0].fieldValue;
  

    order.E8_companyId =e8FieldValue;
    order.companyEmail=companyDetails.companyEmail;
    order.companyName =companyDetails.companyName;
    


const enrichedOrder = {
    ...order,
    products: productDetails,
  };

console.log("Merged Output",enrichedOrder);

    return NextResponse.json({
      success: true,
      enrichedOrder,
    //  order,
      products,
   //   userDetails,
     // companyDetails,
     });
 
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}