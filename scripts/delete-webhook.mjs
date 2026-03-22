#!/usr/bin/env node
/**
 * Delete Telegram Webhook
 * Usage: BOT_TOKEN=xxx node scripts/delete-webhook.mjs
 */

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required');
  process.exit(1);
}

async function deleteWebhook() {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drop_pending_updates: true })
  });

  const result = await res.json();
  if (result.ok) {
    console.log('✅ Webhook deleted successfully.');
  } else {
    console.error('❌ Failed:', result.description);
  }
}

deleteWebhook();
