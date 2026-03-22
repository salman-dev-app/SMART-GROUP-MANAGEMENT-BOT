#!/usr/bin/env node
/**
 * Setup Telegram Webhook
 * Usage: BOT_TOKEN=xxx WORKER_URL=https://devbot.yourname.workers.dev node scripts/setup-webhook.mjs
 */

const BOT_TOKEN = process.env.BOT_TOKEN;
const WORKER_URL = process.env.WORKER_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN environment variable is required');
  console.error('Usage: BOT_TOKEN=xxx WORKER_URL=https://... node scripts/setup-webhook.mjs');
  process.exit(1);
}

if (!WORKER_URL) {
  console.error('❌ WORKER_URL environment variable is required');
  console.error('Example: WORKER_URL=https://devbot.yourname.workers.dev');
  process.exit(1);
}

const webhookUrl = `${WORKER_URL.replace(/\/$/, '')}/webhook`;

console.log('🔧 Setting up Telegram webhook...');
console.log(`📍 Webhook URL: ${webhookUrl}`);

async function setupWebhook() {
  try {
    // First, get bot info
    const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const info = await infoRes.json();
    
    if (!info.ok) {
      throw new Error(`Invalid token: ${info.description}`);
    }
    
    console.log(`🤖 Bot: @${info.result.username} (${info.result.first_name})`);

    // Delete existing webhook
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true })
    });

    // Set new webhook
    const body = {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query', 'chat_member'],
      drop_pending_updates: true,
      max_connections: 40
    };

    if (WEBHOOK_SECRET) {
      body.secret_token = WEBHOOK_SECRET;
      console.log('🔐 Webhook secret configured');
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await res.json();

    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`📡 URL: ${webhookUrl}`);
      
      // Verify webhook info
      const infoRes2 = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const webhookInfo = await infoRes2.json();
      console.log('\n📊 Webhook Info:');
      console.log(JSON.stringify(webhookInfo.result, null, 2));
    } else {
      console.error('❌ Failed to set webhook:', result.description);
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setupWebhook();
