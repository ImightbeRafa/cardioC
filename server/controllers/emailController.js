/**
 * Email Controller — Local Dev Server
 * Handles SINPE order processing
 */

import { sendOrderToBetsyWithRetry } from '../utils/betsy.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL;

function formatCRC(amount) {
  return `₡${Number(amount).toLocaleString('es-CR')}`;
}

export async function sendSinpe(req, res) {
  try {
    const order = req.body;
    order.paymentMethod = 'sinpe';

    console.log(`[SINPE] Processing order ${order.orderId}`);

    // Send customer email
    if (RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Cardio Costa Rica <orders@cardiocr.shopping>',
            to: order.customer.email,
            subject: `Confirmación de pedido #${order.orderId}`,
            html: `<h2>Pedido Recibido — ${order.orderId}</h2>
              <p>${order.product.name} × ${order.product.quantity}</p>
              <p><strong>Total: ${formatCRC(order.total)}</strong></p>
              <h3>Datos para SINPE Móvil:</h3>
              <p>Número: <strong>8888-8888</strong></p>
              <p>Monto: <strong>${formatCRC(order.total)}</strong></p>
              <p>Nombre: Cardio Costa Rica</p>
              <p>Por favor realiza la transferencia y envíanos el comprobante por WhatsApp.</p>`,
          }),
        });
        console.log('[Resend] Customer email sent');
      } catch (e) {
        console.error('[Resend] Customer email error:', e.message);
      }

      // Admin email
      if (ADMIN_EMAIL) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Cardio Costa Rica <orders@cardiocr.shopping>',
              to: ADMIN_EMAIL,
              subject: `Nuevo pedido #${order.orderId} - SINPE`,
              html: `<h2>Nuevo Pedido SINPE — ${order.orderId}</h2>
                <p>Cliente: ${order.customer.name} (${order.customer.phone})</p>
                <p>Email: ${order.customer.email}</p>
                <p>Producto: ${order.product.name} × ${order.product.quantity}</p>
                <p>Total: ${formatCRC(order.total)}</p>
                <p>Provincia: ${order.shipping.address.province}</p>
                <p>Dirección: ${order.shipping.address.fullAddress}</p>
                <p>Estado: PENDIENTE (SINPE)</p>`,
            }),
          });
          console.log('[Resend] Admin email sent');
        } catch (e) {
          console.error('[Resend] Admin email error:', e.message);
        }
      }
    }

    // Sync to BetsyCRM
    sendOrderToBetsyWithRetry(order).catch(() => {});

    return res.json({ success: true, orderId: order.orderId });
  } catch (err) {
    console.error('[SINPE] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
