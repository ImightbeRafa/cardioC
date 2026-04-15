/**
 * SINPE Móvil Order Processing
 * POST /api/email/send-sinpe
 * Sends confirmation emails + syncs to BetsyCRM + Meta CAPI Lead
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
    const order = req.body;
    order.paymentMethod = 'sinpe';

    console.log(`[SINPE] Processing order ${order.orderId}`);

    // Send emails
    const emailPromise = sendOrderEmails(order);

    // Sync to BetsyCRM with status PENDIENTE
    const betsyPromise = sendOrderToBetsyWithRetry(order);

    // Meta CAPI Lead event
    const eventId = order.eventId || generateEventId('lead', order.orderId);
    const userData = await buildUserData(order.customer, {
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    const metaPromise = sendMetaEvent({
      eventName: 'Lead',
      eventId,
      userData,
      customData: {
        content_name: order.product.name,
        value: order.total,
        currency: 'CRC',
      },
      eventSourceUrl: SITE_URL,
    });

    await Promise.allSettled([emailPromise, betsyPromise, metaPromise]);

    return res.status(200).json({
      success: true,
      orderId: order.orderId,
      message: 'SINPE order processed',
    });
  } catch (err) {
    console.error('[SINPE] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
