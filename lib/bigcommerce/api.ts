import { headers } from "next/headers";
import { Product } from "@/type/product";

type Company = {
  companyId: number;
  companyName: string;
  extraFields: {
    fieldName: string;
    fieldValue: string;
  }[];
};


export async function fetchOrder(orderId: number) {
  const res = await fetch(
    `https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v2/orders/${orderId}`,
    { headers: getBCHeaders() }
  );
  if (!res.ok) throw new Error('Failed to fetch order details');
  return res.json();
}

export async function fetchOrderProducts(orderId: number) {
  const res = await fetch(
    `https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v2/orders/${orderId}/products`,
    { headers: getBCHeaders() }
  );
  if (!res.ok) throw new Error('Failed to fetch order products');
  return res.json();
}

export async function fetchCustomer(customerId: number) {
  const res = await fetch(
    `https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v2/customers/${customerId}`,
    { headers: getBCHeaders() }
  );
  if (!res.ok) throw new Error('Failed to fetch customer data');
  return res.json();
}

export async function fetchCustomerRole(customerId: number) {
  const res = await fetch(
    `https://api-b2b.bigcommerce.com/api/v3/io/users/customer/${customerId}`,
    {
      headers: {
        authToken: process.env.BC_B2B_AUTH_TOKEN as string,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );
  if (!res.ok) throw new Error('Failed to fetch customer role');
  const data = await res.json();
  return data.data;
}

export async function updateOrderStatus(orderId: number, statusId: number, message: string) {
    console.log("IN ORDER STATUS UPDATE ")
  const res = await fetch(
    `https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v2/orders/${orderId}`,
    {
      method: 'PUT',
      headers: getBCHeaders(),
      body: JSON.stringify({ status_id: statusId, customer_message: message }),
    }
  );
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}



export async function fetchCompanyDetailsByName(companyName: string): Promise<Company> {
  const encodedName = encodeURIComponent(companyName);

  // Step 1: Search for company by name
  const searchRes = await fetch(
    `https://api-b2b.bigcommerce.com/api/v3/io/companies?q=${encodedName}`,
    { headers: getBCAPIHeaders() }
  );
  if (!searchRes.ok) throw new Error('Failed to fetch company list');

  const searchData = await searchRes.json();
  const companies: Company[] = searchData.data;

  if (!companies.length) throw new Error(`No company found for name: ${companyName}`);
  const companyId = companies[0].companyId;

  // Step 2: Fetch full company details
  const detailsRes = await fetch(
    `https://api-b2b.bigcommerce.com/api/v3/io/companies/${companyId}`,
    { headers: getBCAPIHeaders() }
  );
  if (!detailsRes.ok) throw new Error('Failed to fetch company details');

  const detailsData = await detailsRes.json();
  return detailsData.data;
}


export function extractMetafields(company: Company) {
  return company.extraFields.map((field) => ({
    name: field.fieldName,
    value: field.fieldValue,
  }));
}

// To update inventory data
export async function updateInventoryDetails(products: Product[], warehouseId: string) {
  
  const productList=products.map(product=>({
    location_id:warehouseId,
    variant_id:product.variant_id,
    quantity: -product.quantity
  }));

  const payload = {
    reason: "Inventory Relative Adjustment Operation",
    productList
  };

  console.log("Inventory Update Payload",payload)
  console.log("Json", JSON.stringify(payload ))

  const inventoryResponse = await fetch(
    `https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v3/inventory/adjustments/relative`,
    { 
      method: 'POST',
      headers: getBCHeaders(),
      body: JSON.stringify({ payload }),    
    }
  );
if (!inventoryResponse.ok) throw new Error('Failed to update Inventory Status');
  return inventoryResponse.json();
}




function getBCHeaders() {
  return {
    'X-Auth-Token': process.env.BC_API_TOKEN as string,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}


function getBCAPIHeaders() {
  return {
    'authToken': process.env.BC_B2B_AUTH_TOKEN as string,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}
