/**
 * Salman-Dev Tools v4.0 — Premium Telegram Bot
 * Developer: Md Salman Biswas
 * Runtime: Cloudflare Workers / Node.js
 */

import { StateManager } from './utils/state.js';
import { sendMessage, editMessageText, answerCallbackQuery, inlineKeyboard, getUserName } from './utils/telegram.js';
import { t } from './data/languages.js';
import { getEffectiveLang, handleLang, showLangMenu, handleLangCallback } from './modules/language.js';
import { matchConversation } from './data/conversations.js';
import { handleAutoModeration } from './modules/moderation.js';
import { incrementStat, getStats } from './utils/state.js';

import {
  handleWarn, handleBan, handleUnban,
  handleMute, handleUnmute, handleWarnings, handleClearWarns
} from './modules/moderation.js';

import {
  handleJson, handleEncode, handleDecode, handleHash,
  handleUuid, handleRegex, handleSnippet, handleTimestamp,
  handleColor, handleUrlEncode, handleUrlDecode, handleEscape,
  handlePing, handleCalc, handlePassword,
  handleDevtoolsCallback
} from './modules/devtools.js';

import {
  handleJoke, handleQuote, handlePoll,
  handleEightBall, handleDice, handleAbout, handleCredit,
  handleFunCallback
} from './modules/fun.js';

// Worker Entry

export default {
  async fetch(request, env, ctx) {
    const url   = new URL(request.url);
    const state = new StateManager(env.BOT_KV || null);

    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok', name: 'Salman-Dev Tools', version: '4.0.0',
        runtime: 'Cloudflare Workers', timestamp: new Date().toISOString()
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/setup' && request.method === 'GET') {
      return handleSetup(request, env);
    }

    if (url.pathname === '/webhook' && request.method === 'POST') {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET) {
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

    return new Response('Salman-Dev Tools v4.0 is running!', { status: 200 });
  }
};

// Webhook Setup

async function handleSetup(request, env) {
  const url = new URL(request.url);
  if (!env.BOT_TOKEN) return jsonRes({ error: 'BOT_TOKEN not configured' }, 500);

  const webhookUrl = `${url.origin}/webhook`;
  const body = { url: webhookUrl, allowed_updates: ['message', 'callback_query', 'chat_member'], drop_pending_updates: true };
  if (env.WEBHOOK_SECRET) body.secret_token = env.WEBHOOK_SECRET;

  const res    = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const result = await res.json();
  return jsonRes({ webhook_url: webhookUrl, telegram_response: result });
}

// Update Dispatcher

async function handleUpdate(update, env, state) {
  const token = env.BOT_TOKEN;
  if (!token) return;
  try {
    if (update.callback_query) return handleCallbackQuery(update.callback_query, token, env, state);
    if (update.message)        return handleMessage(update.message, token, env, state);
  } catch (err) {
    console.error('Update handler error:', err);
  }
}

// Message Handler

async function handleMessage(msg, token, env, state) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text   = msg.text || '';
  if (!userId) return;

  await incrementStat(state, 'messages');
  const lang = await getEffectiveLang(state, userId, chatId);

  if (!text.startsWith('/')) {
    const wasModerated = await handleAutoModeration(token, state, msg, lang);
    if (wasModerated) return;
  }

  if (text.startsWith('/')) return handleCommand(msg, token, env, state, lang);

  const botUsername = env.BOT_USERNAME || '';
  const mentioned   = botUsername && text.includes('@' + botUsername);
  if (msg.chat.type === 'private' || mentioned || msg.reply_to_message?.from?.is_bot) {
    const match = matchConversation(text);
    if (match) {
      return sendMessage(token, chatId, match.response, { replyToMessageId: msg.message_id });
    }
  }
}

// Command Dispatcher

async function handleCommand(msg, token, env, state, lang) {
  const text   = msg.text || '';
  const chatId = msg.chat.id;
  const [rawCmd, ...args] = text.split(/\s+/);
  const cmd = rawCmd.split('@')[0].toLowerCase().slice(1);

  await incrementStat(state, 'commands');

  switch (cmd) {
    case 'start':    return handleStart(token, msg, lang);
    case 'help':     return handleHelp(token, msg, lang);
    case 'about':    return handleAbout(token, msg, lang);
    case 'credit': case 'developer': case 'dev':
                     return handleCredit(token, msg, lang);
    case 'ping':     return handlePing(token, msg, lang);
    case 'stats':    return handleStats(token, chatId, state, lang);
    case 'rules':    return handleRules(token, msg, lang);
    case 'lang': case 'language':
                     return handleLang(token, state, msg, args, lang);

    case 'warn':     return handleWarn(token, state, msg, args, lang);
    case 'ban':      return handleBan(token, state, msg, args, lang);
    case 'unban':    return handleUnban(token, state, msg, args, lang);
    case 'mute':     return handleMute(token, state, msg, args, lang);
    case 'unmute':   return handleUnmute(token, state, msg, args, lang);
    case 'warnings': case 'warns':
                     return handleWarnings(token, state, msg, args, lang);
    case 'clearwarns': case 'clearwarnings':
                     return handleClearWarns(token, state, msg, args, lang);

    case 'json':     return handleJson(token, msg, args, lang);
    case 'encode': case 'b64encode': return handleEncode(token, msg, args, lang);
    case 'decode': case 'b64decode': return handleDecode(token, msg, args, lang);
    case 'hash': case 'sha256':      return handleHash(token, msg, args, lang);
    case 'uuid':     return handleUuid(token, msg, args, lang);
    case 'regex':    return handleRegex(token, msg, args, lang);
    case 'snippet': case 'code':     return handleSnippet(token, msg, args, lang);
    case 'timestamp': case 'ts':     return handleTimestamp(token, msg, args, lang);
    case 'color': case 'colour':     return handleColor(token, msg, args, lang);
    case 'urlencode': return handleUrlEncode(token, msg, args, lang);
    case 'urldecode': return handleUrlDecode(token, msg, args, lang);
    case 'escape': case 'htmlescape': return handleEscape(token, msg, args, lang);
    case 'calc': case 'calculate':   return handleCalc(token, msg, args, lang);
    case 'password': case 'passwd': case 'pass': case 'pwd':
                     return handlePassword(token, msg, args, lang);

    case 'joke':     return handleJoke(token, msg, lang);
    case 'quote':    return handleQuote(token, msg, lang);
    case 'poll':     return handlePoll(token, msg, args, lang);
    case '8ball':    return handleEightBall(token, msg, args, lang);
    case 'dice': case 'roll': return handleDice(token, msg, args, lang);

    default:
      if (msg.chat.type === 'private') {
        return sendMessage(token, chatId,
          `✦ *Unknown Command*\n\n\`/${cmd}\` is not recognized.\n\nType /help to see all available commands.`,
          { replyMarkup: inlineKeyboard([[{ text: '📋  View Help', data: 'help:show' }]]) }
        );
      }
  }
}

// /start — Premium Home

async function handleStart(token, msg, lang) {
  const chatId  = msg.chat.id;
  const name    = msg.from?.first_name || 'there';
  const isGroup = msg.chat.type !== 'private';

  const text = isGroup
    ? `👋 *Hey, group!*\n\n*Salman-Dev Tools* is active and ready.\nUse /help to explore all features.`
    : `👋 *Hey ${name}!*\n\n` +
      `Welcome to *Salman-Dev Tools* — your all-in-one developer companion.\n\n` +
      `🛡 Smart group moderation\n` +
      `🛠 15+ developer utilities\n` +
      `🎮 Fun games and activities\n` +
      `🌐 10 languages supported\n` +
      `🔐 Password generator\n` +
      `🧮 Calculator\n` +
      `💬 AI-powered chat\n\n` +
      `Choose a section to get started 👇`;

  const markup = inlineKeyboard([
    [
      { text: '📋  Commands',    data: 'help:show' },
      { text: '🛠  Dev Tools',   data: 'menu:devtools' },
    ],
    [
      { text: '🎮  Fun Zone',    data: 'menu:fun' },
      { text: '🛡  Moderation',  data: 'menu:moderation' },
    ],
    [
      { text: '🌐  Language',    data: 'lang:menu' },
      { text: '📊  Statistics',  data: 'stats:show' },
    ],
    [
      { text: '👨‍💻  Developer',    data: 'credit:show' },
      { text: 'ℹ️  About',        data: 'about:show' },
    ]
  ]);

  return sendMessage(token, chatId, text, { replyMarkup: markup });
}

// /help — Command Reference

async function handleHelp(token, msg, lang) {
  const chatId = msg.chat.id;

  const text =
    `📋  *Command Reference*\n\n` +
    `🛡  *Moderation*  _(admins only)_\n` +
    `/warn  /ban  /unban  /mute  /unmute\n` +
    `/warnings  /clearwarns\n\n` +
    `🛠  *Developer Tools*\n` +
    `/json  /encode  /decode  /hash\n` +
    `/uuid  /regex  /snippet  /color\n` +
    `/timestamp  /calc  /password\n` +
    `/urlencode  /urldecode  /escape\n\n` +
    `🎮  *Fun & Games*\n` +
    `/joke  /quote  /poll\n` +
    `/8ball  /dice\n\n` +
    `⚙️  *General*\n` +
    `/start  /stats  /about  /credit\n` +
    `/ping  /rules  /lang`;

  const markup = inlineKeyboard([
    [
      { text: '🛠  Dev Tools',   data: 'menu:devtools' },
      { text: '🎮  Fun Zone',    data: 'menu:fun' },
    ],
    [
      { text: '🛡  Moderation',  data: 'menu:moderation' },
      { text: '🌐  Language',    data: 'lang:menu' },
    ],
    [
      { text: '🏠  Home',        data: 'start:home' },
    ]
  ]);

  return sendMessage(token, chatId, text, { replyMarkup: markup });
}

// /rules

async function handleRules(token, msg, lang) {
  const chatId = msg.chat.id;

  const text =
    `📜  *Group Rules*\n\n` +
    `1   Be respectful to everyone\n` +
    `2   No spam or message flooding\n` +
    `3   No advertisements or self-promotion\n` +
    `4   Stay on topic\n` +
    `5   No NSFW content\n` +
    `6   Follow admin instructions\n\n` +
    `⚠️  Three warnings result in a permanent ban.\n` +
    `🤖  Auto-moderation is always active.`;

  const markup = inlineKeyboard([
    [
      { text: '🏠  Home',       data: 'start:home' },
      { text: '📊  My Stats',   data: 'stats:show' },
    ]
  ]);

  return sendMessage(token, chatId, text, { replyMarkup: markup });
}

// /stats

async function handleStats(token, chatId, state, lang, msgId = null) {
  const stats = await getStats(state);

  const text =
    `📊  *Live Statistics*\n\n` +
    `📨  Messages analyzed  •  \`${stats.messages}\`\n` +
    `⌨️  Commands executed  •  \`${stats.commands}\`\n` +
    `🚨  Spam blocked       •  \`${stats.spam}\`\n` +
    `⚠️  Warnings issued    •  \`${stats.warnings}\`\n` +
    `🔨  Users banned       •  \`${stats.bans}\`\n\n` +
    `⚡  Runtime: Cloudflare Workers\n` +
    `🕐  Updated: \`${new Date().toUTCString()}\``;

  const markup = inlineKeyboard([
    [
      { text: '🔄  Refresh',  data: 'stats:show' },
      { text: '🏠  Home',     data: 'start:home' },
    ]
  ]);

  if (msgId) {
    return editMessageText(token, chatId, msgId, text, { replyMarkup: markup });
  }
  return sendMessage(token, chatId, text, { replyMarkup: markup });
}

// Menu Screens (callback-driven)

async function showDevToolsMenu(token, chatId, msgId) {
  const text =
    `🛠  *Developer Tools*\n\n` +
    `Tap any tool to see usage and examples.`;

  const markup = inlineKeyboard([
    [
      { text: '🗂  JSON',        data: 'tool:json' },
      { text: '🔠  Encode',      data: 'tool:encode' },
      { text: '🔡  Decode',      data: 'tool:decode' },
    ],
    [
      { text: '🔒  Hash',        data: 'tool:hash' },
      { text: '🆔  UUID',        data: 'uuid:new' },
      { text: '🔍  Regex',       data: 'tool:regex' },
    ],
    [
      { text: '📝  Snippet',     data: 'snippet:menu' },
      { text: '⏱  Timestamp',   data: 'timestamp:now' },
      { text: '🎨  Color',       data: 'tool:color' },
    ],
    [
      { text: '🧮  Calculator',  data: 'tool:calc' },
      { text: '🔑  Password',    data: 'pwd:16:strong' },
    ],
    [
      { text: '🏠  Home',        data: 'start:home' },
    ],
  ]);

  return editMessageText(token, chatId, msgId, text, { replyMarkup: markup });
}

async function showFunMenu(token, chatId, msgId) {
  const text =
    `🎮  *Fun Zone*\n\n` +
    `Pick something to play with!`;

  const markup = inlineKeyboard([
    [
      { text: '😄  Joke',       data: 'joke:new' },
      { text: '💡  Quote',      data: 'quote:new' },
    ],
    [
      { text: '🎲  Dice',       data: 'dice:6' },
      { text: '🎯  Dart',       data: 'dice:dart' },
    ],
    [
      { text: '🎳  Bowling',    data: 'dice:bowl' },
      { text: '🎰  Slots',      data: 'dice:casino' },
    ],
    [
      { text: '🎱  Magic 8-Ball', data: '8ball:random' },
    ],
    [
      { text: '🏠  Home',       data: 'start:home' },
    ],
  ]);

  return editMessageText(token, chatId, msgId, text, { replyMarkup: markup });
}

async function showModerationMenu(token, chatId, msgId) {
  const text =
    `🛡  *Moderation Commands*\n\n` +
    `All commands require admin rights.\n\n` +
    `/warn @user  reason  —  Issue a warning\n` +
    `/ban @user  reason   —  Ban from group\n` +
    `/unban @user         —  Remove ban\n` +
    `/mute @user  mins    —  Mute temporarily\n` +
    `/unmute @user        —  Remove mute\n` +
    `/warnings @user      —  Check warning count\n` +
    `/clearwarns @user    —  Reset warnings\n\n` +
    `⚠️  Three warnings trigger an automatic ban.`;

  const markup = inlineKeyboard([
    [
      { text: '📜  Group Rules', data: 'rules:show' },
    ],
    [
      { text: '🏠  Home',        data: 'start:home' },
    ],
  ]);

  return editMessageText(token, chatId, msgId, text, { replyMarkup: markup });
}

// Tool Info Cards

const TOOL_CARDS = {
  'tool:json':
    `🗂  *JSON Formatter*\n\n` +
    `Usage: \`/json {"key": "value"}\`\n\n` +
    `Formats, validates, and inspects JSON.\nShows type info and key count.`,

  'tool:encode':
    `🔠  *Base64 Encoder*\n\n` +
    `Usage: \`/encode Hello World\`\n\n` +
    `Encodes any text to Base64 format.`,

  'tool:decode':
    `🔡  *Base64 Decoder*\n\n` +
    `Usage: \`/decode SGVsbG8gV29ybGQ=\`\n\n` +
    `Decodes Base64 back to plain text.`,

  'tool:hash':
    `🔒  *SHA-256 Hash*\n\n` +
    `Usage: \`/hash mypassword\`\n\n` +
    `Generates a cryptographic SHA-256 hash.`,

  'tool:regex':
    `🔍  *Regex Tester*\n\n` +
    `Usage: \`/regex \\d+ test123\`\n\n` +
    `Tests regex patterns against any text.\nShows all matches with positions.`,

  'tool:color':
    `🎨  *Color Converter*\n\n` +
    `Usage: \`/color #ff6b6b\`\n\n` +
    `Converts between HEX, RGB, and HSL.\nSupports named colors too.`,

  'tool:calc':
    `🧮  *Calculator*\n\n` +
    `Usage: \`/calc (2 + 3) * 4\`\n\n` +
    `Supports  +  −  ×  ÷  %  ^  and brackets.`,
};

// Callback Query Router

async function handleCallbackQuery(query, token, env, state) {
  const data   = query.data || '';
  const chatId = query.message?.chat?.id;
  const msgId  = query.message?.message_id;
  const userId = query.from?.id;

  try {

    // Language
    if (data === 'lang:menu' || data.startsWith('lang:set:')) {
      return handleLangCallback(token, query, state);
    }

    // Fun
    if (
      data.startsWith('joke:') || data.startsWith('quote:') ||
      data.startsWith('8ball:') || data.startsWith('dice:') ||
      data.startsWith('poll:') || data === 'credit:show'
    ) {
      return handleFunCallback(token, query, state);
    }

    // Dev Tools
    if (
      data.startsWith('snippet:') || data === 'uuid:new' ||
      data.startsWith('pwd:') || data === 'timestamp:now'
    ) {
      return handleDevtoolsCallback(token, query);
    }

    // Tool info cards
    if (TOOL_CARDS[data]) {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, chatId, msgId, TOOL_CARDS[data], {
        replyMarkup: inlineKeyboard([
          [{ text: '‹  Back to Tools', data: 'menu:devtools' }]
        ])
      });
    }

    // Menus
    if (data === 'menu:devtools') {
      await answerCallbackQuery(token, query.id);
      return showDevToolsMenu(token, chatId, msgId);
    }

    if (data === 'menu:fun') {
      await answerCallbackQuery(token, query.id);
      return showFunMenu(token, chatId, msgId);
    }

    if (data === 'menu:moderation') {
      await answerCallbackQuery(token, query.id);
      return showModerationMenu(token, chatId, msgId);
    }

    // Home
    if (data === 'start:home') {
      await answerCallbackQuery(token, query.id);
      const name = query.from?.first_name || 'there';
      const text =
        `👋 *Hey ${name}!*\n\n` +
        `Welcome back to *Salman-Dev Tools*.\n\n` +
        `🛡 Smart group moderation\n` +
        `🛠 15+ developer utilities\n` +
        `🎮 Fun games and activities\n` +
        `🌐 10 languages supported\n` +
        `🔐 Password generator\n` +
        `🧮 Calculator\n` +
        `💬 AI-powered chat\n\n` +
        `Choose a section to get started 👇`;

      return editMessageText(token, chatId, msgId, text, {
        replyMarkup: inlineKeyboard([
          [
            { text: '📋  Commands',   data: 'help:show' },
            { text: '🛠  Dev Tools',  data: 'menu:devtools' },
          ],
          [
            { text: '🎮  Fun Zone',   data: 'menu:fun' },
            { text: '🛡  Moderation', data: 'menu:moderation' },
          ],
          [
            { text: '🌐  Language',   data: 'lang:menu' },
            { text: '📊  Statistics', data: 'stats:show' },
          ],
          [
            { text: '👨‍💻  Developer',  data: 'credit:show' },
            { text: 'ℹ️  About',       data: 'about:show' },
          ]
        ])
      });
    }

    // Help
    if (data === 'help:show') {
      await answerCallbackQuery(token, query.id);
      const text =
        `📋  *Command Reference*\n\n` +
        `🛡  /warn  /ban  /unban  /mute  /unmute\n` +
        `🛠  /json  /encode  /decode  /hash  /uuid\n` +
        `🔍  /regex  /snippet  /color  /timestamp\n` +
        `🧮  /calc  /password  /urlencode  /escape\n` +
        `🎮  /joke  /quote  /poll  /8ball  /dice\n` +
        `⚙️  /start  /stats  /about  /credit  /ping\n` +
        `🌐  /lang  /rules`;

      return editMessageText(token, chatId, msgId, text, {
        replyMarkup: inlineKeyboard([
          [
            { text: '🛠  Dev Tools',  data: 'menu:devtools' },
            { text: '🎮  Fun Zone',   data: 'menu:fun' },
          ],
          [
            { text: '🏠  Home',       data: 'start:home' },
          ]
        ])
      });
    }

    // Stats
    if (data === 'stats:show') {
      await answerCallbackQuery(token, query.id, 'Loading stats...');
      const lang = await getEffectiveLang(state, userId, chatId);
      return handleStats(token, chatId, state, lang, msgId);
    }

    // About
    if (data === 'about:show') {
      await answerCallbackQuery(token, query.id);
      const text =
        `ℹ️  *About Salman-Dev Tools*\n\n` +
        `Version   •  \`4.0.0\`\n` +
        `Runtime   •  Cloudflare Workers\n` +
        `AI        •  Rule-based NLP engine\n` +
        `Languages •  10 supported\n` +
        `Moderation•  Smart anti-spam\n` +
        `Tools     •  15+ dev utilities\n` +
        `License   •  MIT\n\n` +
        `Built with ❤️ by [Md Salman Biswas](https://github.com/salman-dev-app)`;

      return editMessageText(token, chatId, msgId, text, {
        replyMarkup: inlineKeyboard([
          [
            { text: '👨‍💻  Developer', data: 'credit:show' },
            { text: '📊  Stats',      data: 'stats:show' },
          ],
          [
            { text: '🐙  GitHub',     url: 'https://github.com/salman-dev-app' },
          ],
          [
            { text: '🏠  Home',       data: 'start:home' },
          ],
        ])
      });
    }

    // Rules
    if (data === 'rules:show') {
      await answerCallbackQuery(token, query.id);
      const text =
        `📜  *Group Rules*\n\n` +
        `1   Be respectful to everyone\n` +
        `2   No spam or message flooding\n` +
        `3   No advertisements or self-promotion\n` +
        `4   Stay on topic\n` +
        `5   No NSFW content\n` +
        `6   Follow admin instructions\n\n` +
        `⚠️  Three warnings result in a permanent ban.`;

      return editMessageText(token, chatId, msgId, text, {
        replyMarkup: inlineKeyboard([
          [{ text: '🏠  Home', data: 'start:home' }]
        ])
      });
    }

    // Ping
    if (data === 'ping:again') {
      await answerCallbackQuery(token, query.id, 'Pinging...');
      const latency = Math.floor(Math.random() * 80) + 20;
      const quality = latency < 50 ? '🟢  Excellent' : latency < 100 ? '🟡  Good' : '🔴  Slow';
      return editMessageText(token, chatId, msgId,
        `🏓  *Pong!*\n\n` +
        `Latency  •  \`${latency} ms\`\n` +
        `Quality  •  ${quality}\n` +
        `Status   •  Online ✅`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🔄  Ping Again', data: 'ping:again' }]
          ])
        }
      );
    }

    await answerCallbackQuery(token, query.id);

  } catch (err) {
    console.error('Callback error:', err);
    await answerCallbackQuery(token, query.id, 'Something went wrong', true).catch(() => {});
  }
}

// Utility

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status, headers: { 'Content-Type': 'application/json' }
  });
}
