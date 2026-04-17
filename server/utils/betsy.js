/**
 * BetsyCRM Integration — Local Dev Server
 * Same logic as api/utils/betsy.js but for Express
 */

const BETSY_API_KEY = process.env.BETSY_API_KEY;
const BETSY_API_URL = process.env.BETSY_API_URL || 'https://www.betsycrm.com/api/integration/orders/create';

function buildBetsyPayload(order) {
  const paymentMethod = 'Tilopay';
  const status = 'PAGADO';

  return {
    orderId: order.orderId,
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      email: order.customer.email,
    },
    product: {
      name: order.product.name,
      quantity: order.product.quantity,
      unitPrice: String(order.product.unitPrice),
    },
    shipping: {
      cost: String(order.shipping.cost),
      courier: 'Correos de Costa Rica',
      address: {
        province: order.shipping.address.province,
        canton: order.shipping.address.canton || '',
        district: order.shipping.address.district || '',
        fullAddress: order.shipping.address.fullAddress,
      },
    },
    total: `₡${Number(order.total).toLocaleString('es-CR')}`,
    payment: {
      method: paymentMethod,
      transactionId: order.transactionId || order.orderId,
      status,
      date: new Date().toISOString(),
    },
    source: 'Cardio Costa Rica Website',
    salesChannel: 'Website',
    seller: 'Website',
    metadata: {
      campaign: 'organic',
      referrer: 'direct',
      comments: order.comments || '',
      createdAt: new Date().toISOString(),
    },
  };
}

async function sendOrderToBetsyWithRetry(order, maxRetries = 3) {
  if (!BETSY_API_KEY) {
    console.log('[BetsyCRM] Skipping — no API key configured');
    return null;
  }

  const payload = buildBetsyPayload(order);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(BETSY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': BETSY_API_KEY,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        console.log(`[BetsyCRM] Order synced (attempt ${attempt}):`, data);
        return data;
      }

      if (res.status >= 400 && res.status < 500) {
        const errorText = await res.text();
        console.error(`[BetsyCRM] Client error ${res.status}:`, errorText);
        return null;
      }

      console.warn(`[BetsyCRM] Server error ${res.status} — attempt ${attempt}/${maxRetries}`);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn(`[BetsyCRM] Timeout — attempt ${attempt}/${maxRetries}`);
      } else {
        console.error(`[BetsyCRM] Network error — attempt ${attempt}/${maxRetries}:`, err.message);
      }
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }

  console.error('[BetsyCRM] All retries exhausted');
  return null;
}

export { sendOrderToBetsyWithRetry };
