/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { Product ,ShippingAddress} from '@/type/product';

import {
  fetchOrder,
  fetchOrderProducts,
  fetchCustomer,
  fetchCustomerRole,
  updateOrderStatus,
  fetchCompanyDetailsByName, 
  extractMetafields,
  updateInventoryDetails,
  fetchShippingAddress,
  fetchInventoryDetails
} from '../../../lib/bigcommerce/api';
import { checkServerIdentity } from 'tls';

 
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


type customerCompanyDetails = {
   companyName: string;
   e8CompanyId: string;
   warehouseId: number;
   warehouseName: string;
   warehouseCode: string;
};


type InventoryItem = {  
identity: {
    product_id: number;
    sku: string;
  };
  locations: InventoryLocation[];
};

type InventoryLocation = {
  location_id: number;
  location_name: string;
  location_code: string;
  available_to_sell: number;
  settings: settingDetails[];
};

type settingDetails = {
  bin_picking_number: string;
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
  
   
    const fetchedShippingAddress = await fetchShippingAddress(orderId);
    const shippingAddress: ShippingAddress[] = fetchedShippingAddress;
    console.log('Shipping Address:', fetchedShippingAddress);


const shippingDetails = shippingAddress.map(address => ({
  first_name: address.first_name,
  last_name: address.last_name,
  company: address.company,
  street_1: address.street_1,
  street_2: address.street_2,
  city: address.city,
  zip: address.zip,
  country: address.country,
  country_iso2: address.country_iso2,
  email: address.email,
  state: address.state,
  shipping_method: address.shipping_method,
  items_total: address.items_total,
  items_shipped: address.items_shipped,
  shipping_zone_id: address.shipping_zone_id,
  shipping_zone_name: address.shipping_zone_name,
  base_cost: address.base_cost
}));


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

//To Fetch Company Details
const companyDetails = await fetchCompanyDetailsByName(companyName);

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
    warehouseId = value;
  }
  console.log(`Metafield: ${name} = ${value}`);
});

console.log('Company Response:',companyDetails);
console.log('warehouseId:',warehouseId);

const customerDetails = {
   companyName: companyDetails.companyName,
   e8CompanyId: e8field,
   warehouseId: parseInt(warehouseId ?? "") 
 };

// To update Inventory 
const inventoryResponse = await updateInventoryDetails(products, customerDetails.warehouseId);

console.log("Updated inventory response")


const inventoryData = await fetchInventoryDetails(products, customerDetails.warehouseId);
const inventoryDetails: InventoryItem[] = inventoryData.data;

const inventoryLocations = inventoryDetails.flatMap(item => {
  
  const productId = item.identity.product_id;
  const sku= item.identity.sku;

  const locations = item.locations.map(location => ({
    productId,
    sku,
    locationId: location.location_id,
    locationName: location.location_name,
    availaleQuantity: location.available_to_sell,
    UOM:location.settings[0].bin_picking_number
  }));
  return { locations };
});


console.log('Inventory Locations:', inventoryLocations);

const OrderDetails = {
    ...order,
    customerDetails,
    products: productDetails,
    shipping_addresses:shippingDetails,
    inventoryLocations
  };

console.log("Order Export Output",OrderDetails);

    return NextResponse.json({
      success: true,
      OrderDetails,
        });
 
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}