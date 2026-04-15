/**
 * Tilopay Create Payment
 * POST /api/tilopay/create-payment
 * Authenticates, creates payment, returns redirect URL
 */

import { buildUserData, generateEventId, sendMetaEvent } from '../utils/meta.js';

const { TILOPAY_BASE_URL, TILOPAY_API_KEY, TILOPAY_USER, TILOPAY_PASSWORD } = process.env;
const SITE_URL = process.env.SITE_URL || 'https://cardiocostarica.cr';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const order = req.body;

    // 1. Authenticate with Tilopay
    const authRes = await fetch(`${TILOPAY_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiuser: TILOPAY_USER,
        password: TILOPAY_PASSWORD,
      }),
    });

    const authData = await authRes.json();
    if (!authData.access_token) {
      console.error('[Tilopay] Auth failed:', authData);
      return res.status(500).json({ error: 'Payment authentication failed' });
    }

    // 2. Build returnData
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

    // 3. Create payment
    const nameParts = order.customer.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;

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
        billToFirstName: firstName,
        billToLastName: lastName,
        billToAddress: order.shipping.address.fullAddress,
        billToCity: order.shipping.address.province,
        billToCountry: 'CR',
      }),
    });

    const paymentData = await paymentRes.json();

    if (!paymentData.url) {
      console.error('[Tilopay] Payment creation failed:', paymentData);
      return res.status(500).json({ error: 'Failed to create payment' });
    }

    // 4. Send Meta CAPI InitiateCheckout
    const eventId = order.eventId || generateEventId('ic', order.orderId);
    const userData = await buildUserData(order.customer, {
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    await sendMetaEvent({
      eventName: 'InitiateCheckout',
      eventId,
      userData,
      customData: {
        content_name: order.product.name,
        value: order.total,
        currency: 'CRC',
        num_items: order.product.quantity,
      },
      eventSourceUrl: SITE_URL,
    });

    return res.status(200).json({ paymentUrl: paymentData.url });
  } catch (err) {
    console.error('[Tilopay] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
