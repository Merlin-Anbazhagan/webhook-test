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
