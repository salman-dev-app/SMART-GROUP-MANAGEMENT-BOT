/**
 * Standalone Node.js HTTP server for DevBot
 * Wraps the Cloudflare Workers bot logic to run locally.
 * Acts as the Telegram webhook receiver.
 */

import http from 'http';

// ── Polyfill the Cloudflare Workers environment ───────────────
// The bot code uses: env.BOT_TOKEN, env.BOT_USERNAME, env.BOT_KV
// We provide these from environment variables + in-memory KV.

const BOT_TOKEN    = process.env.BOT_TOKEN    || '8410498376:AAFU4D_A7EJByQI27bUldI9uHOLvaxSIojk';
const BOT_USERNAME = process.env.BOT_USERNAME || 'SalmanDevToolsBot';
const PORT         = parseInt(process.env.PORT || '8787', 10);

// ── Inline in-memory KV (mirrors StateManager's memory Map) ──
const kvStore = new Map();
const kvNamespace = {
  async get(key) {
    const entry = kvStore.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) { kvStore.delete(key); return null; }
    try { return JSON.parse(entry.value); } catch { return entry.value; }
  },
  async put(key, value, options = {}) {
    const ttl = options.expirationTtl;
    kvStore.set(key, {
      value,
      expires: ttl ? Date.now() + ttl * 1000 : 0
    });
  },
  async delete(key) { kvStore.delete(key); }
};

// ── Build the env object the worker expects ───────────────────
const env = {
  BOT_TOKEN,
  BOT_USERNAME,
  BOT_KV: kvNamespace,
  WEBHOOK_SECRET: '' // no secret for local testing
};

// ── Import the worker's default export ───────────────────────
// We need to load index.js which is a CF Worker module.
// We create a minimal ctx shim.
const { default: worker } = await import('./src/index.js');

// ── ctx shim (waitUntil just runs the promise) ────────────────
const ctx = {
  waitUntil(p) {
    p.catch(err => console.error('[waitUntil error]', err));
  }
};

// ── HTTP server ───────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // Collect body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bodyBuffer = Buffer.concat(chunks);
  const bodyText = bodyBuffer.toString('utf8');

  // Build a Request-like object that matches the fetch API
  const baseUrl = `http://localhost:${PORT}`;
  const fullUrl = baseUrl + (req.url || '/');

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  }

  const fetchRequest = new Request(fullUrl, {
    method: req.method || 'GET',
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : bodyBuffer
  });

  try {
    const fetchResponse = await worker.fetch(fetchRequest, env, ctx);

    res.statusCode = fetchResponse.status;
    fetchResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const responseBody = await fetchResponse.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (err) {
    console.error('[Server Error]', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🤖 DevBot server is running!`);
  console.log(`   ➜  Local:   http://localhost:${PORT}`);
  console.log(`   ➜  Health:  http://localhost:${PORT}/health`);
  console.log(`   ➜  Webhook: http://localhost:${PORT}/webhook`);
  console.log(`\n   BOT_TOKEN:    ${BOT_TOKEN.slice(0, 12)}...`);
  console.log(`   BOT_USERNAME: ${BOT_USERNAME}`);
  console.log(`\n   Waiting for Telegram updates...\n`);
});

server.on('error', err => {
  console.error('[HTTP Server Error]', err);
  process.exit(1);
});
