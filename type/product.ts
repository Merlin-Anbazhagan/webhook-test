
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
