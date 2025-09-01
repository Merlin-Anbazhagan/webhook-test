
export interface Product {
  name: string;
  name_customer: string;
  name_merchant: string;
  product_id: number;
  variant_id: number;
  sku: string;
  quantity: number;
  is_refunded: boolean;
  quantity_refunded: number;
  refund_amount: number;
  return_id: number;
  base_price: number;
  base_total: number;
  total_ex_tax: number;
  total_inc_tax: number;
}


export interface ShippingAddress {
  first_name: string;
  last_name: string;
  company: string;
  street_1: string;
  street_2: number;
  city: string;
  zip: number;
  country: boolean;
  country_iso2: number;
  email:string
  state: number;
  shipping_method:string
  items_total:number;
  items_shipped: number;
  shipping_zone_id:number
  shipping_zone_name:string;
  base_cost: number;
}
