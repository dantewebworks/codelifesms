// Fetch recent messages directly from Telnyx and normalize them for the dashboard
// ESM default export for Vercel serverless functions

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { apiKey, pageSize = 100, hours = 168, phoneNumbers = [] } = req.body || {};

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'Missing apiKey' });
    }

    // Build request to Telnyx list messages endpoint
    const sinceISO = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const url = new URL('https://api.telnyx.com/v2/messages');
    url.searchParams.set('page[size]', String(pageSize));
    // Try common filters; Telnyx supports ERE filters with created_at; if unsupported, server still returns and we filter client-side
    url.searchParams.set('filter[created_at][gte]', sinceISO);

    const telnyxResp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!telnyxResp.ok) {
      const t = await telnyxResp.text();
      return res.status(telnyxResp.status).json({ success: false, error: `Telnyx API error ${telnyxResp.status}: ${t.slice(0, 500)}` });
    }

    const payload = await telnyxResp.json();
    const items = Array.isArray(payload.data) ? payload.data : [];

    // Normalize messages into portable shape
    const mySet = new Set((phoneNumbers || []).map((p) => (typeof p === 'string' ? p : p.phone_number)).filter(Boolean));

    const normalized = items.map((m) => {
      // Telnyx message resource may include attributes nested in different shapes; be defensive
      const id = m.id || m.data?.id || m.record_type || Math.random().toString(36).slice(2);
      const attrs = m.attributes || m.data || m;
      const from = attrs.from?.phone_number || attrs.from || attrs.from_number || attrs.from_phone_number || m.from || null;
      const toRaw = attrs.to || attrs.to_number || attrs.to_phone_number || m.to || [];
      const to = Array.isArray(toRaw)
        ? (toRaw[0]?.phone_number || toRaw[0]?.number || toRaw[0])
        : (toRaw?.phone_number || toRaw?.number || toRaw);
      const text = attrs.text || attrs.body || attrs.content || attrs.subject || '';
      const created = attrs.received_at || attrs.sent_at || attrs.created_at || m.created_at || new Date().toISOString();
      const direction = attrs.direction || (mySet.has(to) ? 'inbound' : mySet.has(from) ? 'outbound' : 'unknown');

      return { id, from, to, text, direction, timestamp: created };
    });

    return res.status(200).json({ success: true, messages: normalized, count: normalized.length, since: sinceISO });
  } catch (err) {
    console.error('telnyx-messages error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

