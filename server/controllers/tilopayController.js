/**
 * Tilopay Controller — Local Dev Server
 */

import { sendOrderToBetsyWithRetry } from '../utils/betsy.js';

const { TILOPAY_BASE_URL, TILOPAY_API_KEY, TILOPAY_USER, TILOPAY_PASSWORD, TILOPAY_WEBHOOK_SECRET } = process.env;
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL;

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) {
    console.log('[Resend] Skipping — no API key');
    return null;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Cardio Costa Rica <orders@cardiocr.shopping>',
      to, subject, html,
    }),
  });
  return res.json();
}

export async function createPayment(req, res) {
  try {
    const order = req.body;

    // Authenticate
    const authRes = await fetch(`${TILOPAY_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiuser: TILOPAY_USER, password: TILOPAY_PASSWORD }),
    });

    const authData = await authRes.json();
    if (!authData.access_token) {
      return res.status(500).json({ error: 'Auth failed' });
    }

    const returnData = Buffer.from(JSON.stringify({
      orderId: order.orderId,
      customer: order.customer,
      product: order.product,
      shipping: order.shipping,
      subtotal: order.subtotal,
      total: order.total,
      paymentMethod: 'tilopay',
      comments: order.comments || '',
      eventId: order.eventId,
    })).toString('base64');

    const nameParts = order.customer.name.split(' ');
    const paymentRes = await fetch(`${TILOPAY_BASE_URL}/processPayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.access_token}`,
      },
      body: JSON.stringify({
        key: TILOPAY_API_KEY,
        amount: order.total,
        currency: 'CRC',
        orderNumber: order.orderId,
        capture: '1',
        hashVersion: 'V2',
        redirect: `${SITE_URL}/success.html`,
        platform: 'Cardio Costa Rica',
        returnData,
        billToFirstName: nameParts[0] || '',
        billToLastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
        billToAddress: order.shipping.address.fullAddress,
        billToCity: order.shipping.address.province,
        billToCountry: 'CR',
      }),
    });

    const paymentData = await paymentRes.json();

    if (!paymentData.url) {
      return res.status(500).json({ error: 'Failed to create payment' });
    }

    return res.json({ paymentUrl: paymentData.url });
  } catch (err) {
    console.error('[Tilopay] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function confirmPayment(req, res) {
  try {
    const { returnData, code, transactionId } = req.body;

    if (String(code) !== '1') {
      return res.status(400).json({ error: 'Payment not successful', code });
    }

    let order;
    try {
      order = JSON.parse(Buffer.from(returnData, 'base64').toString('utf-8'));
    } catch (e) {
      return res.status(400).json({ error: 'Invalid return data' });
    }

    order.transactionId = transactionId;
    order.paymentMethod = 'tilopay';

    console.log(`[Tilopay Confirm] Order ${order.orderId} confirmed`);

    // Non-blocking: emails + Betsy
    sendOrderToBetsyWithRetry(order).catch(() => {});

    return res.json({ success: true, orderId: order.orderId });
  } catch (err) {
    console.error('[Tilopay Confirm] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleWebhook(req, res) {
  try {
    const { code, returnData, transactionId } = req.body;

    if (String(code) !== '1') {
      return res.json({ received: true, processed: false });
    }

    let order;
    try {
      order = JSON.parse(Buffer.from(returnData, 'base64').toString('utf-8'));
    } catch (e) {
      return res.status(400).json({ error: 'Invalid return data' });
    }

    order.transactionId = transactionId;
    order.paymentMethod = 'tilopay';

    console.log(`[Tilopay Webhook] Processing order ${order.orderId}`);

    sendOrderToBetsyWithRetry(order).catch(() => {});

    return res.json({ received: true, processed: true, orderId: order.orderId });
  } catch (err) {
    console.error('[Tilopay Webhook] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
