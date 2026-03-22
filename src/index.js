/**
 * DevBot – Main Cloudflare Worker Entry Point
 *
 * Architecture:
 *  - Webhook receiver at POST /webhook
 *  - GET / → health check
 *  - GET /setup → sets up Telegram webhook (called once)
 *  - Modular handlers for moderation, dev tools, fun, language
 */

import { StateManager } from './utils/state.js';
import { sendMessage, getUserName } from './utils/telegram.js';
import { t } from './data/languages.js';
import { getEffectiveLang } from './modules/language.js';
import { handleLang } from './modules/language.js';
import { matchConversation } from './data/conversations.js';
import { handleAutoModeration } from './modules/moderation.js';
import { incrementStat, getStats } from './utils/state.js';

// Moderation commands
import {
  handleWarn, handleBan, handleUnban,
  handleMute, handleUnmute, handleWarnings, handleClearWarns
} from './modules/moderation.js';

// Dev tools
import {
  handleJson, handleEncode, handleDecode, handleHash,
  handleUuid, handleRegex, handleSnippet, handleTimestamp,
  handleColor, handleUrlEncode, handleUrlDecode, handleEscape, handlePing
} from './modules/devtools.js';

// Fun
import {
  handleJoke, handleQuote, handlePoll,
  handleEightBall, handleDice, handleAbout, handleCredit
} from './modules/fun.js';

// ── Worker fetch handler ──────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const state = new StateManager(env.BOT_KV || null);

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        name: 'DevBot',
        version: '2.0.0',
        runtime: 'Cloudflare Workers',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Webhook setup endpoint (GET /setup?secret=YOUR_SECRET)
    if (url.pathname === '/setup' && request.method === 'GET') {
      return handleSetup(request, env);
    }

    // Main webhook endpoint
    if (url.pathname === '/webhook' && request.method === 'POST') {
      // Verify secret token if configured
      const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (env.WEBHOOK_SECRET && secretToken !== env.WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }

      try {
        const update = await request.json();
        ctx.waitUntil(handleUpdate(update, env, state));
        return new Response('OK', { status: 200 });
      } catch (err) {
        console.error('Webhook parse error:', err);
        return new Response('Bad Request', { status: 400 });
      }
    }

    return new Response('DevBot is running! 🤖', { status: 200 });
  }
};

// ── Webhook setup handler ────────────────────────────────────

async function handleSetup(request, env) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');

  if (!env.BOT_TOKEN) {
    return jsonResponse({ error: 'BOT_TOKEN not configured' }, 500);
  }

  // Build webhook URL from request origin
  const webhookUrl = `${url.origin}/webhook`;

  const body = {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query', 'chat_member'],
    drop_pending_updates: true
  };

  if (env.WEBHOOK_SECRET) {
    body.secret_token = env.WEBHOOK_SECRET;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );

  const result = await response.json();
  return jsonResponse({
    webhook_url: webhookUrl,
    telegram_response: result
  });
}

// ── Main update dispatcher ───────────────────────────────────

async function handleUpdate(update, env, state) {
  const token = env.BOT_TOKEN;
  if (!token) return;

  try {
    // Handle callback queries (inline buttons)
    if (update.callback_query) {
      return handleCallbackQuery(update.callback_query, token, state);
    }

    // Handle messages
    if (update.message) {
      return handleMessage(update.message, token, env, state);
    }

  } catch (err) {
    console.error('Update handler error:', err);
  }
}

// ── Message handler ──────────────────────────────────────────

async function handleMessage(msg, token, env, state) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text = msg.text || '';

  if (!userId) return;

  // Count all messages
  await incrementStat(state, 'messages');

  // Get language for this user/chat
  const lang = await getEffectiveLang(state, userId, chatId);

  // Auto-moderation (skip if command)
  if (!text.startsWith('/')) {
    const wasModerated = await handleAutoModeration(token, state, msg, lang);
    if (wasModerated) return;
  }

  // Route commands
  if (text.startsWith('/')) {
    return handleCommand(msg, token, env, state, lang);
  }

  // Conversational responses for non-command messages
  if (msg.chat.type === 'private' || text.includes('@' + (env.BOT_USERNAME || ''))) {
    const match = matchConversation(text);
    if (match) {
      return sendMessage(token, chatId, match.response, {
        replyToMessageId: msg.message_id
      });
    }
  }

  // In groups: respond to direct mentions or replies
  if (msg.reply_to_message?.from?.is_bot) {
    const match = matchConversation(text);
    if (match) {
      return sendMessage(token, chatId, match.response, {
        replyToMessageId: msg.message_id
      });
    }
  }
}

// ── Command dispatcher ───────────────────────────────────────

async function handleCommand(msg, token, env, state, lang) {
  const text = msg.text || '';
  const chatId = msg.chat.id;

  // Parse command and args
  // Handle /command@botusername format
  const [rawCmd, ...args] = text.split(/\s+/);
  const cmd = rawCmd.split('@')[0].toLowerCase().slice(1); // remove /

  await incrementStat(state, 'commands');

  switch (cmd) {
    // ── Info commands ────────────────────────────────────────
    case 'start':
      return sendMessage(token, chatId, t(lang, 'welcome'));

    case 'help':
      return sendMessage(token, chatId, t(lang, 'help'));

    case 'about':
      return handleAbout(token, msg, lang);

    case 'credit':
    case 'developer':
    case 'dev':
      return handleCredit(token, msg, lang);

    case 'ping':
      return handlePing(token, msg, lang);

    case 'stats':
      return handleStats(token, chatId, state, lang);

    // ── Language ─────────────────────────────────────────────
    case 'lang':
    case 'language':
      return handleLang(token, state, msg, args, lang);

    // ── Moderation ───────────────────────────────────────────
    case 'warn':
      return handleWarn(token, state, msg, args, lang);

    case 'ban':
      return handleBan(token, state, msg, args, lang);

    case 'unban':
      return handleUnban(token, state, msg, args, lang);

    case 'mute':
      return handleMute(token, state, msg, args, lang);

    case 'unmute':
      return handleUnmute(token, state, msg, args, lang);

    case 'warnings':
    case 'warns':
      return handleWarnings(token, state, msg, args, lang);

    case 'clearwarns':
    case 'clearwarnings':
      return handleClearWarns(token, state, msg, args, lang);

    // ── Developer Tools ──────────────────────────────────────
    case 'json':
      return handleJson(token, msg, args, lang);

    case 'encode':
    case 'b64encode':
      return handleEncode(token, msg, args, lang);

    case 'decode':
    case 'b64decode':
      return handleDecode(token, msg, args, lang);

    case 'hash':
    case 'sha256':
      return handleHash(token, msg, args, lang);

    case 'uuid':
      return handleUuid(token, msg, args, lang);

    case 'regex':
      return handleRegex(token, msg, args, lang);

    case 'snippet':
    case 'code':
      return handleSnippet(token, msg, args, lang);

    case 'timestamp':
    case 'ts':
      return handleTimestamp(token, msg, args, lang);

    case 'color':
    case 'colour':
      return handleColor(token, msg, args, lang);

    case 'urlencode':
      return handleUrlEncode(token, msg, args, lang);

    case 'urldecode':
      return handleUrlDecode(token, msg, args, lang);

    case 'escape':
    case 'htmlescape':
      return handleEscape(token, msg, args, lang);

    // ── Fun ──────────────────────────────────────────────────
    case 'joke':
      return handleJoke(token, msg, lang);

    case 'quote':
      return handleQuote(token, msg, lang);

    case 'poll':
      return handlePoll(token, msg, args, lang);

    case '8ball':
      return handleEightBall(token, msg, args, lang);

    case 'dice':
    case 'roll':
      return handleDice(token, msg, args, lang);

    default:
      // Only respond to unknown commands in private chats or if mentioned
      if (msg.chat.type === 'private') {
        return sendMessage(token, chatId, t(lang, 'unknownCommand'));
      }
      break;
  }
}

// ── Callback query handler ───────────────────────────────────

async function handleCallbackQuery(query, token, state) {
  // Currently handled inline - extend for future button actions
  const chatId = query.message?.chat?.id;
  const data = query.data || '';

  // Language change via inline button
  if (data.startsWith('lang:')) {
    const langCode = data.split(':')[1];
    const userId = query.from?.id;
    const lang = await getEffectiveLang(state, userId, chatId);

    await import('./utils/state.js').then(m => m.setUserLang(state, userId, langCode));
    await import('./utils/state.js').then(m => m.setChatLang(state, chatId, langCode));

    const { getLang } = await import('./data/languages.js');
    const langData = getLang(langCode);

    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: query.id,
        text: `Language changed to ${langData.name} ${langData.flag}`,
        show_alert: false
      })
    });
  }
}

// ── Stats command handler ────────────────────────────────────

async function handleStats(token, chatId, state, lang) {
  const stats = await getStats(state);
  const text = [
    t(lang, 'statsTitle'),
    '',
    `📨 ${t(lang, 'statsMessages', { count: stats.messages })}`,
    `⌨️ ${t(lang, 'statsCommands', { count: stats.commands })}`,
    `🚨 ${t(lang, 'statsSpam', { count: stats.spam })}`,
    `⚠️ ${t(lang, 'statsWarnings', { count: stats.warnings })}`,
    `🔨 ${t(lang, 'statsBans', { count: stats.bans })}`,
    '',
    `_Runtime: Cloudflare Workers ⚡_`
  ].join('\n');

  return sendMessage(token, chatId, text);
}

// ── Utility ──────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
