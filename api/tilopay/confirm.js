/**
 * Tilopay Confirm Payment
 * POST /api/tilopay/confirm
 * Called from success.html after Tilopay redirect
 */

import { sendOrderEmails } from '../utils/email.js';
import { sendOrderToBetsyWithRetry } from '../utils/betsy.js';
import { buildUserData, generateEventId, sendMetaEvent } from '../utils/meta.js';

const SITE_URL = process.env.SITE_URL || 'https://cardiocostarica.cr';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { returnData, code, transactionId } = req.body;

    // Validate payment success
    if (String(code) !== '1') {
      console.warn('[Tilopay Confirm] Payment not successful, code:', code);
      return res.status(400).json({ error: 'Payment was not successful', code });
    }

    // Decode returnData
    let order;
    try {
      order = JSON.parse(Buffer.from(returnData, 'base64').toString('utf-8'));
    } catch (e) {
      console.error('[Tilopay Confirm] Failed to decode returnData:', e);
      return res.status(400).json({ error: 'Invalid return data' });
    }

    order.transactionId = transactionId;
    order.paymentMethod = 'tilopay';

    console.log(`[Tilopay Confirm] Order ${order.orderId} confirmed, txn: ${transactionId}`);

    // Send emails (non-blocking to response)
    const emailPromise = sendOrderEmails(order);

    // Sync to BetsyCRM (non-blocking)
    const betsyPromise = sendOrderToBetsyWithRetry(order);

    // Send Meta CAPI Purchase event
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

    // Wait for all but don't block on failures
    await Promise.allSettled([emailPromise, betsyPromise, metaPromise]);

    return res.status(200).json({
      success: true,
      orderId: order.orderId,
      purchaseEventId,
    });
  } catch (err) {
    console.error('[Tilopay Confirm] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
