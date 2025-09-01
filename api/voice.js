// Minimal Telnyx Voice webhook handler for Vercel (ESM)
// Accepts all methods and responds 200 OK quickly.
// Stores recent events in a transient in-memory array for quick inspection.

export default async function handler(req, res) {
  try {
    global.voiceEvents = global.voiceEvents || [];
    global.voiceEvents.unshift({
      method: req.method,
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    // Keep only the most recent 100 events to avoid unbounded growth
    if (global.voiceEvents.length > 100) {
      global.voiceEvents.length = 100;
    }
  } catch (e) {
    // Swallow errors to ensure 200 OK for webhook reliablity
  }

  // Telnyx expects a fast 2xx response
  res.status(200).json({ success: true });
}

