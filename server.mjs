/**
 * DevMind — Local Node.js Test Server
 * Wraps the Cloudflare Workers bot for local testing.
 * Usage: BOT_TOKEN=<token> node server.mjs
 */

import http from 'http';

const BOT_TOKEN    = process.env.BOT_TOKEN    || '8410498376:AAFU4D_A7EJByQI27bUldI9uHOLvaxSIojk';
const BOT_USERNAME = process.env.BOT_USERNAME || 'SalmanDevToolsBot';
const PORT         = parseInt(process.env.PORT || '8787', 10);

// In-memory KV store (mirrors Cloudflare KV)
const kvStore = new Map();
const kvNamespace = {
  async get(key) {
    const entry = kvStore.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) { kvStore.delete(key); return null; }
    return entry.value;
  },
  async put(key, value, options = {}) {
    const ttl = options.expirationTtl;
    kvStore.set(key, { value, expires: ttl ? Date.now() + ttl * 1000 : 0 });
  },
  async delete(key) { kvStore.delete(key); },
};

// env shim — no AI binding locally (falls back to rule-based)
const env = {
  BOT_TOKEN,
  BOT_USERNAME,
  BOT_KV: kvNamespace,
  WEBHOOK_SECRET: '',
  // AI: undefined (local fallback kicks in automatically)
};

const { default: worker } = await import('./src/index.js');

const ctx = {
  waitUntil(p) { p.catch(err => console.error('[waitUntil]', err)); },
};

const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bodyBuffer = Buffer.concat(chunks);

  const fullUrl = `http://localhost:${PORT}${req.url || '/'}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  }

  const fetchRequest = new Request(fullUrl, {
    method: req.method || 'GET',
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : bodyBuffer,
  });

  try {
    const fetchResponse = await worker.fetch(fetchRequest, env, ctx);
    res.statusCode = fetchResponse.status;
    fetchResponse.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await fetchResponse.arrayBuffer()));
  } catch (err) {
    console.error('[Server Error]', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🤖 DevMind server is running!`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Health:   http://localhost:${PORT}/health`);
  console.log(`   Webhook:  http://localhost:${PORT}/webhook`);
  console.log(`   Setup:    http://localhost:${PORT}/setup`);
  console.log(`\n   BOT_TOKEN:    ${BOT_TOKEN.slice(0, 12)}...`);
  console.log(`   BOT_USERNAME: ${BOT_USERNAME}`);
  console.log(`   Runtime:      Node.js ${process.version} (local)`);
  console.log(`\n   AI: Local rule-based fallback (deploy to Cloudflare for Llama 3.1 8B)\n`);
});

server.on('error', err => {
  console.error('[HTTP Server Error]', err);
  process.exit(1);
});
