/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { Product } from '@/type/product';

import {
  fetchOrder,
  fetchOrderProducts,
  fetchCustomer,
  fetchCustomerRole,
  updateOrderStatus,
  fetchCompanyDetailsByName, 
  extractMetafields,
  updateInventoryDetails,
} from '../../../lib/bigcommerce/api';

 
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
    console.log('Order Details:', fetchedOrder);
  
    // Fetch Products

    const fetchedProducts = await fetchOrderProducts(orderId);
    const products: Product[] = fetchedProducts;
    console.log('Products:', fetchedProducts);  
  
   
    
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

  const fetchedCustomer = await fetchCustomer(order.customer_id);
  const userDetails: Customer = fetchedCustomer;
  const companyName = userDetails.company;
  console.log('User Reponse', fetchedCustomer);
  console.log('company Name:',companyName);

//   // To Get the Buyer Roles :::: 

//   const fetchedBuyerRoles = await fetchCustomerRole(order.customer_id);
//   const userCompany : Customer = fetchedBuyerRoles;
//   console.log('UserResponse:', fetchedBuyerRoles);
//   console.log('RoleID',userCompany.company, userCompany.companyRoleId );


// // Update the Order status if its Junior Buyer

// if(userCompany.companyRoleId ===22405){
//   console.log("In Update Order Method")
//   const status =1;
//   const customer_message="Order submitted by Junior Buyer, awaiting Senior Buyer approval."
//   const orderStatusUpdate = await updateOrderStatus(orderId,status,customer_message);
//   console.log("Order Status Update",orderStatusUpdate);
// }


const companyDetails = await fetchCompanyDetailsByName(companyName);
console.log('Company Details:', companyDetails);

let e8field;
let e8fieldName ;
let warehouseId ;
const metafields = extractMetafields(companyDetails);
metafields.forEach(({ name, value }) => {

  if(name=='E8 COMPANY ID'){
     e8field = value;
     e8fieldName = name;
  }

  if(name =='Warehouse'){
    warehouseId=value;
  }
  console.log(`Metafield: ${name} = ${value}`);
});

console.log('Entire Company Details',companyDetails);
    

const updatedOrderDetails = await fetchOrder(orderId);
const Updatedorder: Order = updatedOrderDetails;
console.log('Updated Order Details:', Updatedorder);

console.log('warehouseId:',warehouseId);

const customerDetails = {
   companyName: companyDetails.companyName,
   e8CompanyId: e8field,
   warehouseId: parseInt(warehouseId ?? ""),
 };

// To update Inventory 
const inventoryResponse = await updateInventoryDetails(products, customerDetails.warehouseId);

console.log("Updated inventory response")



const OrderDetails = {
    ...Updatedorder,
    customerDetails,
    products: productDetails,
  };

console.log("Merged Output",OrderDetails);

    return NextResponse.json({
      success: true,
 //     OrderDetails,
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