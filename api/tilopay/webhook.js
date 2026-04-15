/**
 * Tilopay Webhook
 * POST /api/tilopay/webhook
 * Async backup: verifies HMAC, processes order
 */

import { sendOrderEmails } from '../utils/email.js';
import { sendOrderToBetsyWithRetry } from '../utils/betsy.js';
import { buildUserData, generateEventId, sendMetaEvent } from '../utils/meta.js';

const WEBHOOK_SECRET = process.env.TILOPAY_WEBHOOK_SECRET;
const SITE_URL = process.env.SITE_URL || 'https://cardiocostarica.cr';

async function verifyHMAC(body, signature) {
  if (!WEBHOOK_SECRET || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(typeof body === 'string' ? body : JSON.stringify(body))
  );

  const computed = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === signature;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify HMAC signature
    const signature = req.headers['hash-tilopay'] || req.headers['x-tilopay-secret'];
    if (WEBHOOK_SECRET && signature) {
      const isValid = await verifyHMAC(req.body, signature);
      if (!isValid) {
        console.error('[Tilopay Webhook] HMAC verification failed');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { code, returnData, transactionId } = req.body;

    // Only process successful payments
    if (String(code) !== '1') {
      console.log('[Tilopay Webhook] Non-success code:', code);
      return res.status(200).json({ received: true, processed: false });
    }

    // Decode returnData
    let order;
    try {
      order = JSON.parse(Buffer.from(returnData, 'base64').toString('utf-8'));
    } catch (e) {
      console.error('[Tilopay Webhook] Failed to decode returnData');
      return res.status(400).json({ error: 'Invalid return data' });
    }

    order.transactionId = transactionId;
    order.paymentMethod = 'tilopay';

    console.log(`[Tilopay Webhook] Processing order ${order.orderId}`);

    // Send emails
    const emailPromise = sendOrderEmails(order);

    // Sync to BetsyCRM
    const betsyPromise = sendOrderToBetsyWithRetry(order);

    // Meta CAPI Purchase
    const purchaseEventId = generateEventId('purchase', order.orderId, transactionId);
    const userData = await buildUserData(order.customer, {
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    const metaPromise = sendMetaEvent({
      eventName: 'Purchase',
      eventId: purchaseEventId,
      userData,
      customData: {
        content_name: order.product.name,
        value: order.total,
        currency: 'CRC',
        num_items: order.product.quantity,
        order_id: order.orderId,
      },
      eventSourceUrl: `${SITE_URL}/success.html`,
    });

    await Promise.allSettled([emailPromise, betsyPromise, metaPromise]);

    return res.status(200).json({ received: true, processed: true, orderId: order.orderId });
  } catch (err) {
    console.error('[Tilopay Webhook] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
