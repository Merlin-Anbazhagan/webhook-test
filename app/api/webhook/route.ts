/* eslint-disable no-console */
import { NextResponse } from 'next/server';

import {
  fetchOrder,
  fetchOrderProducts,
  fetchCustomer,
  fetchCustomerRole,
  updateOrderStatus,
} from '../../../lib/bigcommerce/api';

 
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
  companyRoleId: number;
  companyRoleName: string;
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
    const fetchedOrder = await fetchOrder(orderId);
    const order: Order = fetchedOrder;
    console.log('Order Details:', order);
  
    // Fetch Products

    const fetchedProducts = await fetchOrderProducts(orderId);
    const products: Product[] = await fetchedProducts.json();
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


// To Get the Buyer Roles :::: 
 
    const getUserRoles = await fetch(`https://api-b2b.bigcommerce.com/api/v3/io/users/customer/${order.customer_id}`, {
        headers: {
          'authToken': process.env.BC_B2B_AUTH_TOKEN as string,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    if (!getUserRoles.ok) throw new Error('Failed to fetch User Data');
    const userResponseBody = await getUserRoles.json();
  const userCompany : Customer = userResponseBody.data;
   // const companies: Company = await companyRes.json();
   
    console.log('UserResponse:', userResponseBody);


// Update the Order status if its Junior Buyer

if(userCompany.companyRoleId ===22405){
  console.log("In Update Order Method")
const updateRes = await fetch(`https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v2/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'X-Auth-Token': process.env.BC_API_TOKEN as string,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        status_id: 1, // or your custom status ID
        customer_message: 'Order submitted by Junior Buyer, awaiting Senior Buyer approval.',
      }),
    });

    const updateData = await updateRes.json();

    console.log("Order Status Update",updateData);

}


//To Get the Company Name:::::
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





    console.log('Entire Company Details',companyDetails);

    const metaFields = companyDetails.extraFields;
    const e8field =metaFields[0].fieldName;
    const e8FieldValue =metaFields[0].fieldValue;

    
const customerDetails = {
  companyName: companyDetails.companyName,
  companyEmail: companyDetails.companyEmail,
  e8CompanyId: e8FieldValue,
};

  


const OrderDetails = {
    ...order,
    customerDetails,
    products: productDetails,
  };

console.log("Merged Output",OrderDetails);

    return NextResponse.json({
      success: true,
      OrderDetails,
    //  order,
    //  products,
   //   userDetails,
     // companyDetails,
     });
 
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}