/**
 * Resend Email Service
 * Sends customer confirmation and admin notification emails
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL;
const FROM_EMAIL = 'Cardio Costa Rica <orders@cardiocr.shopping>';

function formatCRC(amount) {
  return `₡${Number(amount).toLocaleString('es-CR')}`;
}

function buildCustomerEmailHTML(order) {
  const isSinpe = order.paymentMethod === 'sinpe';

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#F8F6F3;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1A1A;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;">
    <!-- Header -->
    <div style="background:#1A1A1A;padding:24px 32px;border-bottom:4px solid #0077B6;">
      <h1 style="margin:0;font-size:24px;color:#FFFFFF;letter-spacing:-0.02em;">
        CARDIO <span style="color:#5A9ABF;">COSTA RICA</span>
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:22px;color:#1A1A1A;">¡Pedido Confirmado!</h2>
      <p style="margin:0 0 24px;color:#666666;font-size:16px;">
        Orden <strong style="font-family:monospace;">${order.orderId}</strong>
      </p>

      <!-- Product -->
      <div style="border:3px solid #1A1A1A;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-weight:700;">${order.product.name}</p>
        <p style="margin:0;color:#666;">Cantidad: ${order.product.quantity}</p>
        <p style="margin:8px 0 0;font-family:monospace;font-size:18px;font-weight:700;color:#D32F2F;">
          ${formatCRC(order.product.unitPrice)} c/u
        </p>
      </div>

      <!-- Summary -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;color:#666;">Subtotal</td><td style="padding:8px 0;text-align:right;font-family:monospace;">${formatCRC(order.subtotal)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Envío</td><td style="padding:8px 0;text-align:right;font-family:monospace;">${formatCRC(order.shipping.cost)}</td></tr>
        <tr style="border-top:3px solid #1A1A1A;"><td style="padding:12px 0;font-weight:700;font-size:18px;">Total</td><td style="padding:12px 0;text-align:right;font-family:monospace;font-weight:700;font-size:20px;color:#D32F2F;">${formatCRC(order.total)}</td></tr>
      </table>

      ${isSinpe ? `
      <!-- SINPE Instructions -->
      <div style="border:3px solid #0077B6;padding:20px;margin-bottom:24px;background:#E8F4FA;">
        <p style="margin:0 0 8px;font-weight:700;color:#0077B6;">DATOS PARA SINPE MÓVIL:</p>
        <p style="margin:0;font-family:monospace;font-size:16px;">Número: <strong>8888-8888</strong></p>
        <p style="margin:4px 0 0;font-family:monospace;font-size:16px;">Monto: <strong>${formatCRC(order.total)}</strong></p>
        <p style="margin:8px 0 0;font-size:14px;color:#666;">Nombre: Cardio Costa Rica</p>
        <p style="margin:12px 0 0;font-size:13px;color:#666;">Por favor realiza la transferencia y envíanos el comprobante por WhatsApp.</p>
      </div>
      ` : `
      <div style="border:3px solid #2E7D32;padding:16px;margin-bottom:24px;background:#E8F5E9;">
        <p style="margin:0;font-weight:700;color:#2E7D32;">✓ Pago procesado exitosamente con tarjeta.</p>
      </div>
      `}

      <!-- Shipping Info -->
      <div style="margin-bottom:24px;">
        <p style="margin:0 0 8px;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:#0077B6;">DIRECCIÓN DE ENVÍO</p>
        <p style="margin:0;color:#666;">${order.customer.name}</p>
        <p style="margin:0;color:#666;">${order.shipping.address.fullAddress}</p>
        <p style="margin:0;color:#666;">${order.shipping.address.district ? order.shipping.address.district + ', ' : ''}${order.shipping.address.canton ? order.shipping.address.canton + ', ' : ''}${order.shipping.address.province}</p>
        <p style="margin:0;color:#666;">Tel: ${order.customer.phone}</p>
      </div>

      <p style="margin:0;font-size:14px;color:#999;">
        ¿Preguntas? Escríbenos por WhatsApp o a orders@cardiocr.shopping
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#1A1A1A;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">
        © 2025 Cardio Costa Rica — Hecho en Costa Rica
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildAdminEmailHTML(order) {
  const paymentLabel = order.paymentMethod === 'tilopay' ? 'Tarjeta (Tilopay)' : 'SINPE Móvil';
  const status = order.paymentMethod === 'tilopay' ? 'PAGADO' : 'PENDIENTE';

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#F8F6F3;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1A1A;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;padding:32px;">
    <h2 style="margin:0 0 16px;border-bottom:3px solid #1A1A1A;padding-bottom:12px;">
      Nuevo Pedido — ${order.orderId}
    </h2>

    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 0;font-weight:700;width:40%;">Cliente</td><td style="padding:6px 0;">${order.customer.name}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;">Teléfono</td><td style="padding:6px 0;font-family:monospace;">${order.customer.phone}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;">Email</td><td style="padding:6px 0;">${order.customer.email}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;">Producto</td><td style="padding:6px 0;">${order.product.name} × ${order.product.quantity}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;">Total</td><td style="padding:6px 0;font-family:monospace;font-weight:700;color:#D32F2F;">${formatCRC(order.total)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;">Pago</td><td style="padding:6px 0;">${paymentLabel} — <strong>${status}</strong></td></tr>
      <tr><td style="padding:6px 0;font-weight:700;">Provincia</td><td style="padding:6px 0;">${order.shipping.address.province}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700;">Dirección</td><td style="padding:6px 0;">${order.shipping.address.fullAddress}</td></tr>
      ${order.comments ? `<tr><td style="padding:6px 0;font-weight:700;">Comentarios</td><td style="padding:6px 0;">${order.comments}</td></tr>` : ''}
      ${order.transactionId ? `<tr><td style="padding:6px 0;font-weight:700;">Transacción</td><td style="padding:6px 0;font-family:monospace;">${order.transactionId}</td></tr>` : ''}
    </table>
  </div>
</body>
</html>`;
}

async function sendOrderEmails(order) {
  if (!RESEND_API_KEY) {
    console.log('[Resend] Skipping — no API key configured');
    return { customer: null, admin: null };
  }

  const paymentLabel = order.paymentMethod === 'tilopay' ? 'Tarjeta' : 'SINPE';
  const results = {};

  // Customer email
  try {
    const customerRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: order.customer.email,
        subject: `Confirmación de pedido #${order.orderId}`,
        html: buildCustomerEmailHTML(order),
      }),
    });
    results.customer = await customerRes.json();
    console.log('[Resend] Customer email sent:', results.customer);
  } catch (err) {
    console.error('[Resend] Customer email error:', err.message);
    results.customer = null;
  }

  // Admin email
  if (ADMIN_EMAIL) {
    try {
      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `Nuevo pedido #${order.orderId} - ${paymentLabel}`,
          html: buildAdminEmailHTML(order),
        }),
      });
      results.admin = await adminRes.json();
      console.log('[Resend] Admin email sent:', results.admin);
    } catch (err) {
      console.error('[Resend] Admin email error:', err.message);
      results.admin = null;
    }
  }

  return results;
}

export { sendOrderEmails, formatCRC };
