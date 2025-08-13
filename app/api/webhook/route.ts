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