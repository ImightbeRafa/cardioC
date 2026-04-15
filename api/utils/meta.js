/**
 * Meta Conversions API Helper
 * Hashes PII, builds user data, sends server-side events
 */

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const GRAPH_API_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

async function hashValue(value) {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function buildUserData(customer = {}, request = {}) {
  return Promise.all([
    hashValue(customer.email),
    hashValue(customer.phone),
    hashValue(customer.name?.split(' ')[0]),
    hashValue(customer.name?.split(' ').slice(1).join(' ')),
    hashValue(customer.city || customer.address?.province),
    hashValue(customer.address?.province),
    hashValue('cr'),
  ]).then(([em, ph, fn, ln, ct, st, country]) => {
    const userData = {};
    if (em) userData.em = [em];
    if (ph) userData.ph = [ph];
    if (fn) userData.fn = [fn];
    if (ln) userData.ln = [ln];
    if (ct) userData.ct = [ct];
    if (st) userData.st = [st];
    if (country) userData.country = [country];
    if (request.ip) userData.client_ip_address = request.ip;
    if (request.userAgent) userData.client_user_agent = request.userAgent;
    return userData;
  });
}

function generateEventId(prefix, orderId, extra = '') {
  const parts = [prefix, orderId];
  if (extra) parts.push(extra);
  return parts.join('_');
}

async function sendMetaEvent({ eventName, eventId, userData, customData, eventSourceUrl, actionSource = 'website' }) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.log('[Meta CAPI] Skipping — no pixel ID or access token configured');
    return null;
  }

  const eventData = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: actionSource,
    user_data: userData,
    custom_data: customData,
  };

  if (eventId) eventData.event_id = eventId;
  if (eventSourceUrl) eventData.event_source_url = eventSourceUrl;

  try {
    const res = await fetch(GRAPH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [eventData],
        access_token: ACCESS_TOKEN,
      }),
    });

    const result = await res.json();
    console.log(`[Meta CAPI] ${eventName} sent:`, result);
    return result;
  } catch (err) {
    console.error(`[Meta CAPI] ${eventName} error:`, err.message);
    return null;
  }
}

export { hashValue, buildUserData, generateEventId, sendMetaEvent };
