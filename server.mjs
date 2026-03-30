/**
 * Salman Dev Bot v3.0 — Local Node.js Server
 * Created by Md Salman Biswas
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env.local FIRST (before anything else reads process.env) ───────────
try {
  const envFile = path.join(__dirname, '.env.local');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key && !process.env[key]) process.env[key] = val;
    }
    console.log('  ✅ .env.local loaded');
  }
} catch (e) {
  console.warn('  ⚠️  Could not load .env.local:', e.message);
}

// ── Config (reads from env AFTER .env.local is loaded) ──────────────────────
const BOT_TOKEN    = process.env.BOT_TOKEN    || '';
const BOT_USERNAME = process.env.BOT_USERNAME || 'SalmanDevToolsBot';
const PORT         = parseInt(process.env.PORT || '8787', 10);

// Inject API keys into globalThis so ai.js can read them
globalThis.OPENROUTER_KEY = process.env.OPENROUTER_KEY || '';
globalThis.GROQ_KEY       = process.env.GROQ_KEY       || '';

// Validate required keys
console.log('\n  🔑 Key status:');
console.log('  BOT_TOKEN:      ', BOT_TOKEN ? `✅ ${BOT_TOKEN.slice(0, 12)}...` : '❌ MISSING');
console.log('  OPENROUTER_KEY: ', process.env.OPENROUTER_KEY ? `✅ ${process.env.OPENROUTER_KEY.slice(0, 12)}...` : '❌ MISSING');
console.log('  GROQ_KEY:       ', process.env.GROQ_KEY ? `✅ ${process.env.GROQ_KEY.slice(0, 12)}...` : '❌ MISSING');

// ── In-memory KV store (simulates Cloudflare KV) ─────────────────────────────
const kvStore = new Map();
const BOT_KV = {
  async get(key) {
    const e = kvStore.get(key);
    if (!e) return null;
    if (e.expires && Date.now() > e.expires) { kvStore.delete(key); return null; }
    return e.value;
  },
  async put(key, value, opts = {}) {
    const ttl = opts.expirationTtl;
    kvStore.set(key, { value, expires: ttl ? Date.now() + ttl * 1000 : 0 });
  },
  async delete(key) { kvStore.delete(key); },
};

const env = {
  BOT_TOKEN,
  BOT_USERNAME,
  BOT_KV,
  OPENROUTER_KEY: process.env.OPENROUTER_KEY || '',
  GROQ_KEY: process.env.GROQ_KEY || '',
  WEBHOOK_SECRET: '',
};

// ── Load worker ───────────────────────────────────────────────────────────────
const { default: worker } = await import('./src/index.js');

const ctx = {
  waitUntil(p) { p.catch(err => console.error('[waitUntil]', err)); },
};

// ── HTTP Server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bodyBuffer = Buffer.concat(chunks);

  // Use x-forwarded headers so setup endpoint gets the real public URL
  const proto  = req.headers['x-forwarded-proto'] || 'http';
  const host   = req.headers['x-forwarded-host']  || req.headers['host'] || `localhost:${PORT}`;
  const fullUrl = `${proto}://${host}${req.url || '/'}`;

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
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║       🤖  Salman Dev Bot v3.0  — RUNNING         ║
  ╠══════════════════════════════════════════════════╣
  ║  Local:    http://localhost:${PORT}                 ║
  ║  Health:   http://localhost:${PORT}/health          ║
  ║  Webhook:  http://localhost:${PORT}/webhook         ║
  ║  Setup:    http://localhost:${PORT}/setup           ║
  ╚══════════════════════════════════════════════════╝
  `);
});

server.on('error', err => {
  console.error('[HTTP Error]', err);
  process.exit(1);
});
