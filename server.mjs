/**
 * Salman Dev Bot — Local Node.js Server
 * Created by Md Salman Biswas
 */

import http from 'http';

const BOT_TOKEN    = process.env.BOT_TOKEN    || '8410498376:AAFU4D_A7EJByQI27bUldI9uHOLvaxSIojk';
const BOT_USERNAME = process.env.BOT_USERNAME || 'SalmanDevToolsBot';
const PORT         = parseInt(process.env.PORT || '8787', 10);

// Load .env.local if it exists (for local dev — never commit this file)
try {
  const fs = await import('fs');
  const path = await import('path');
  const envFile = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
  }
} catch {}

// Inject API keys into global scope for the AI module
globalThis.OPENROUTER_KEY = process.env.OPENROUTER_KEY || '';
globalThis.GROQ_KEY       = process.env.GROQ_KEY       || '';

// In-memory KV store
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

const env = {
  BOT_TOKEN,
  BOT_USERNAME,
  BOT_KV: kvNamespace,
  WEBHOOK_SECRET: '',
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
    console.error('[Error]', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Salman Dev Bot running`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  Webhook: http://localhost:${PORT}/webhook`);
  console.log(`  Setup:   http://localhost:${PORT}/setup\n`);
});

server.on('error', err => {
  console.error('[HTTP Error]', err);
  process.exit(1);
});
