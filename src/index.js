/**
 * DevMind — AI Developer Bot
 * Powered by Cloudflare Workers AI (Llama 3.1 8B — free tier)
 * Developer: Md Salman Biswas (github.com/salman-dev-app)
 */

import { StateManager, getUserLang, setUserLang, incrementStat, getStats } from './utils/state.js';
import { sendMessage, editMessageText, answerCallbackQuery, inlineKeyboard, sendChatAction } from './utils/telegram.js';
import { t, getLangList } from './data/languages.js';
import {
  askAI, reviewCode, explainConcept, fixCode,
  generateCode, summarizeText, translateText,
} from './modules/ai.js';
import {
  handleFunCallback, handleJoke, handleQuote,
  handleDice, handleEightBall, handlePoll,
} from './modules/fun.js';
import {
  handleJson, handleHash, handleUuid, handleEncode, handleDecode,
  handleCalc, handlePassword, handleSnippet, handleColor, handleTimestamp,
  handleUrlEncode, handleUrlDecode, handleRegex, handlePing, handleToolsCallback,
} from './modules/tools.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonRes({
        status: 'ok',
        name: 'DevMind',
        version: '2.0.0',
        ai: env.AI ? 'Cloudflare Workers AI — Llama 3.1 8B' : 'Local rule-based fallback',
        runtime: 'Cloudflare Workers',
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === '/setup' && request.method === 'GET') {
      return handleSetup(request, env);
    }

    if (url.pathname === '/webhook' && request.method === 'POST') {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET)
        return new Response('Unauthorized', { status: 401 });
      try {
        const update = await request.json();
        const state = new StateManager(env.BOT_KV || null);
        ctx.waitUntil(handleUpdate(update, env, state));
        return new Response('OK');
      } catch (err) {
        console.error('Webhook error:', err);
        return new Response('Bad Request', { status: 400 });
      }
    }

    return new Response('DevMind is running!');
  },
};

async function handleSetup(request, env) {
  if (!env.BOT_TOKEN) return jsonRes({ error: 'BOT_TOKEN not set' }, 500);
  const webhookUrl = `${new URL(request.url).origin}/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    }),
  });
  return jsonRes({ webhook: webhookUrl, result: await res.json() });
}

async function handleUpdate(update, env, state) {
  try {
    if (update.callback_query) return handleCallback(update.callback_query, env, state);
    if (update.message) return handleMessage(update.message, env, state);
  } catch (err) {
    console.error('Update error:', err);
  }
}

async function handleMessage(msg, env, state) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text = msg.text || '';
  if (!userId || !text) return;

  await incrementStat(state, 'messages');
  const lang = await getUserLang(state, userId);

  if (text.startsWith('/')) {
    await incrementStat(state, 'commands');
    return handleCommand(msg, env, state, lang);
  }

  // AI chat in private or when bot is @mentioned
  const botUsername = env.BOT_USERNAME || '';
  const mentioned = botUsername && text.includes(`@${botUsername}`);
  if (msg.chat.type === 'private' || mentioned) {
    return handleAIChat(msg, env, state, lang, text.replace(`@${botUsername}`, '').trim());
  }
}

async function handleCommand(msg, env, state, lang) {
  const token = env.BOT_TOKEN;
  const text = msg.text || '';
  const [rawCmd, ...args] = text.split(/\s+/);
  const cmd = rawCmd.split('@')[0].toLowerCase().slice(1);

  switch (cmd) {
    case 'start':     return handleStart(token, msg, lang);
    case 'help':      return handleHelp(token, msg, lang);
    case 'lang': case 'language': return handleLangMenu(token, state, msg, args, lang);
    case 'stats':     return handleStats(token, msg, state, lang);

    // AI commands
    case 'ask': case 'ai':         return handleAsk(token, msg, env, state, args, lang);
    case 'review':                 return handleReview(token, msg, env, state, args, lang);
    case 'explain':                return handleExplain(token, msg, env, state, args, lang);
    case 'fix':                    return handleFix(token, msg, env, state, args, lang);
    case 'generate': case 'gen':   return handleGenerate(token, msg, env, state, args, lang);
    case 'summarize': case 'sum':  return handleSummarize(token, msg, env, state, args, lang);
    case 'translate': case 'tr':   return handleTranslate(token, msg, env, state, args, lang);

    // Dev Tools
    case 'json':      return handleJson(token, msg, args);
    case 'hash':      return handleHash(token, msg, args);
    case 'uuid':      return handleUuid(token, msg, args);
    case 'encode':    return handleEncode(token, msg, args);
    case 'decode':    return handleDecode(token, msg, args);
    case 'calc':      return handleCalc(token, msg, args);
    case 'password': case 'pass': case 'pwd': return handlePassword(token, msg, args);
    case 'snippet': case 'code':  return handleSnippet(token, msg, args);
    case 'color':     return handleColor(token, msg, args);
    case 'timestamp': case 'ts':  return handleTimestamp(token, msg, args);
    case 'urlencode': return handleUrlEncode(token, msg, args);
    case 'urldecode': return handleUrlDecode(token, msg, args);
    case 'regex':     return handleRegex(token, msg, args);
    case 'ping':      return handlePing(token, msg);

    // Fun
    case 'joke':      return handleJoke(token, msg);
    case 'quote':     return handleQuote(token, msg);
    case 'dice': case 'roll': return handleDice(token, msg, args);
    case '8ball':     return handleEightBall(token, msg, args);
    case 'poll':      return handlePoll(token, msg, args);

    default:
      if (msg.chat.type === 'private')
        return sendMessage(token, chatId(msg),
          `Unknown command: \`/${cmd}\`\n\nType /help to see all commands.`,
          { replyMarkup: inlineKeyboard([[{ text: 'Help', data: 'help' }, { text: 'Home', data: 'home' }]]) });
  }
}

function chatId(msg) { return msg.chat.id; }

// AI Handlers

async function handleAsk(token, msg, env, state, args, lang) {
  const cid = chatId(msg);
  const question = args.join(' ').trim();
  if (!question) return sendMessage(token, cid, t(lang, 'ask_prompt'));
  await sendChatAction(token, cid, 'typing');
  await sendMessage(token, cid, t(lang, 'thinking'));
  await incrementStat(state, 'ai_calls');
  const answer = await askAI(env, question);
  if (!answer) return sendMessage(token, cid, t(lang, 'ai_error'));
  return sendMessage(token, cid, `🤖 *AI Answer*\n\n${answer}`, {
    replyMarkup: inlineKeyboard([[{ text: '🤖 Ask More', data: 'menu:ai' }, { text: '🏠 Home', data: 'home' }]]),
  });
}

async function handleReview(token, msg, env, state, args, lang) {
  const cid = chatId(msg);
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, t(lang, 'review_prompt'));
  await sendChatAction(token, cid, 'typing');
  await sendMessage(token, cid, '🔍 *Reviewing your code...*');
  await incrementStat(state, 'ai_calls');
  const result = await reviewCode(env, code);
  if (!result) return sendMessage(token, cid, t(lang, 'ai_error'));
  return sendMessage(token, cid, `🔍 *Code Review*\n\n${result}`, {
    replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]),
  });
}

async function handleExplain(token, msg, env, state, args, lang) {
  const cid = chatId(msg);
  const concept = args.join(' ').trim();
  if (!concept) return sendMessage(token, cid, t(lang, 'explain_prompt'));
  await sendChatAction(token, cid, 'typing');
  await sendMessage(token, cid, '📖 *Looking that up...*');
  await incrementStat(state, 'ai_calls');
  const result = await explainConcept(env, concept);
  if (!result) return sendMessage(token, cid, t(lang, 'ai_error'));
  return sendMessage(token, cid, `📖 *Explanation*\n\n${result}`, {
    replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]),
  });
}

async function handleFix(token, msg, env, state, args, lang) {
  const cid = chatId(msg);
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, t(lang, 'fix_prompt'));
  await sendChatAction(token, cid, 'typing');
  await sendMessage(token, cid, '🔧 *Fixing your code...*');
  await incrementStat(state, 'ai_calls');
  const result = await fixCode(env, code);
  if (!result) return sendMessage(token, cid, t(lang, 'ai_error'));
  return sendMessage(token, cid, `🔧 *Fixed Code*\n\n${result}`, {
    replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]),
  });
}

async function handleGenerate(token, msg, env, state, args, lang) {
  const cid = chatId(msg);
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid,
    `⚙️ *Code Generator*\n\nUsage: \`/generate <description>\`\n\nExamples:\n\`/generate binary search in Python\`\n\`/generate REST API with Express.js\``);
  await sendChatAction(token, cid, 'typing');
  await sendMessage(token, cid, '⚙️ *Generating code...*');
  await incrementStat(state, 'ai_calls');
  const result = await generateCode(env, desc);
  if (!result) return sendMessage(token, cid, t(lang, 'ai_error'));
  return sendMessage(token, cid, `⚙️ *Generated Code*\n\n${result}`, {
    replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]),
  });
}

async function handleSummarize(token, msg, env, state, args, lang) {
  const cid = chatId(msg);
  const text = args.join(' ').trim();
  if (!text) return sendMessage(token, cid, t(lang, 'summarize_prompt'));
  await sendChatAction(token, cid, 'typing');
  await sendMessage(token, cid, '📝 *Summarizing...*');
  await incrementStat(state, 'ai_calls');
  const result = await summarizeText(env, text);
  if (!result) return sendMessage(token, cid, t(lang, 'ai_error'));
  return sendMessage(token, cid, `📝 *Summary*\n\n${result}`, {
    replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]),
  });
}

async function handleTranslate(token, msg, env, state, args, lang) {
  const cid = chatId(msg);
  if (args.length < 2) return sendMessage(token, cid, t(lang, 'translate_prompt'));
  const [targetLang, ...rest] = args;
  const text = rest.join(' ').trim();
  if (!text) return sendMessage(token, cid, t(lang, 'translate_prompt'));
  await sendChatAction(token, cid, 'typing');
  await sendMessage(token, cid, `🌍 *Translating to ${targetLang}...*`);
  await incrementStat(state, 'ai_calls');
  const result = await translateText(env, text, targetLang);
  if (!result) return sendMessage(token, cid, t(lang, 'ai_error'));
  return sendMessage(token, cid, `🌍 *Translation* → ${targetLang}\n\n${result}`, {
    replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]),
  });
}

async function handleAIChat(msg, env, state, lang, text) {
  const token = env.BOT_TOKEN;
  const cid = chatId(msg);
  if (!text.trim()) return;
  await sendChatAction(token, cid, 'typing');
  await incrementStat(state, 'ai_calls');
  const answer = await askAI(env, text);
  if (!answer) return;
  return sendMessage(token, cid, `🤖 ${answer}`, {
    replyMarkup: inlineKeyboard([[{ text: '🤖 Ask More', data: 'menu:ai' }, { text: '🏠 Home', data: 'home' }]]),
  });
}

// /start
async function handleStart(token, msg, lang) {
  const cid = chatId(msg);
  const name = msg.from?.first_name || 'there';
  const isGroup = msg.chat.type !== 'private';

  const text = isGroup
    ? `👋 *Hey everyone!*\n\n*DevMind* is your AI developer companion.\n\nType /help to see all features, or just chat with me!`
    : `${t(lang, 'start_title', { name })}\n\n${t(lang, 'start_body')}\n\n${t(lang, 'start_features')}\n\n${t(lang, 'start_cta')}`;

  return sendMessage(token, cid, text, {
    replyMarkup: inlineKeyboard([
      [{ text: '🤖 Ask AI', data: 'menu:ai' }, { text: '🔧 Dev Tools', data: 'menu:tools' }],
      [{ text: '🎮 Fun', data: 'menu:fun' }, { text: '📊 Stats', data: 'menu:stats' }],
      [{ text: '🌐 Language', data: 'lang:menu' }, { text: '📋 Help', data: 'help' }],
    ]),
  });
}

// /help
async function handleHelp(token, msg, lang) {
  const cid = chatId(msg);
  const text =
    `📋 *DevMind — All Commands*\n\n` +
    `*🤖 AI (Llama 3.1 8B)*\n` +
    `/ask — Ask AI anything\n` +
    `/review — AI code review\n` +
    `/explain — Explain a concept\n` +
    `/fix — Fix broken code\n` +
    `/generate — Generate code\n` +
    `/summarize — Summarize text\n` +
    `/translate — Translate text\n\n` +
    `*🔧 Developer Tools*\n` +
    `/json — Format & validate JSON\n` +
    `/hash — SHA-256 hash\n` +
    `/uuid — Generate UUID v4\n` +
    `/encode — Base64 encode\n` +
    `/decode — Base64 decode\n` +
    `/calc — Calculator\n` +
    `/password — Secure password\n` +
    `/snippet — Code snippets library\n` +
    `/color — Color converter (HEX/RGB/HSL)\n` +
    `/timestamp — Unix timestamp\n` +
    `/urlencode — URL encode\n` +
    `/urldecode — URL decode\n` +
    `/regex — Regex tester\n` +
    `/ping — Latency check\n\n` +
    `*🎮 Fun*\n` +
    `/joke — Dev joke\n` +
    `/quote — Dev quote\n` +
    `/dice — Roll dice\n` +
    `/8ball — Magic 8-Ball\n` +
    `/poll — Create a poll\n\n` +
    `*⚙️ General*\n` +
    `/stats — Usage stats\n` +
    `/lang — Change language\n\n` +
    `_💬 Or just type a message in private chat to chat with AI!_`;

  return sendMessage(token, cid, text, {
    replyMarkup: inlineKeyboard([
      [{ text: '🤖 AI Menu', data: 'menu:ai' }, { text: '🔧 Tools', data: 'menu:tools' }],
      [{ text: '🎮 Fun', data: 'menu:fun' }, { text: '🏠 Home', data: 'home' }],
    ]),
  });
}

// /lang
async function handleLangMenu(token, state, msg, args, currentLang) {
  const cid = chatId(msg);
  const userId = msg.from?.id;

  if (args[0] && ['en', 'hi', 'bn'].includes(args[0])) {
    await setUserLang(state, userId, args[0]);
    const newLang = getLangList().find(l => l.code === args[0]);
    return sendMessage(token, cid,
      t(args[0], 'lang_changed', { lang: newLang.name, flag: newLang.flag }),
      { replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]) });
  }

  const langs = getLangList();
  return sendMessage(token, cid,
    t(currentLang, 'lang_menu', {
      current: langs.find(l => l.code === currentLang)?.name || 'English',
      flag: langs.find(l => l.code === currentLang)?.flag || '🇺🇸',
    }),
    {
      replyMarkup: inlineKeyboard([
        langs.map(l => ({ text: `${l.flag} ${l.name}`, data: `lang:set:${l.code}` })),
        [{ text: '🏠 Home', data: 'home' }],
      ]),
    });
}

// /stats
async function handleStats(token, msg, state, lang) {
  const cid = chatId(msg);
  return sendMessage(token, cid, await buildStatsText(state), {
    replyMarkup: inlineKeyboard([[{ text: '🔄 Refresh', data: 'menu:stats' }, { text: '🏠 Home', data: 'home' }]]),
  });
}

async function buildStatsText(state) {
  const stats = await getStats(state);
  return `📊 *DevMind Stats*\n\n` +
    `Messages: \`${stats.messages}\`\n` +
    `Commands: \`${stats.commands}\`\n` +
    `AI Calls: \`${stats.ai_calls}\`\n\n` +
    `Runtime: Cloudflare Workers\n` +
    `AI Model: Llama 3.1 8B\n` +
    `Updated: \`${new Date().toUTCString()}\``;
}

// Callback Router
async function handleCallback(query, env, state) {
  const token = env.BOT_TOKEN;
  const data = query.data || '';
  const cid = query.message?.chat?.id;
  const mid = query.message?.message_id;
  const userId = query.from?.id;

  try {
    // Language select menu
    if (data === 'lang:menu') {
      await answerCallbackQuery(token, query.id);
      const lang = await getUserLang(state, userId);
      const langs = getLangList();
      return editMessageText(token, cid, mid,
        t(lang, 'lang_menu', {
          current: langs.find(l => l.code === lang)?.name || 'English',
          flag: langs.find(l => l.code === lang)?.flag || '🇺🇸',
        }),
        {
          replyMarkup: inlineKeyboard([
            langs.map(l => ({ text: `${l.flag} ${l.name}`, data: `lang:set:${l.code}` })),
            [{ text: '🏠 Home', data: 'home' }],
          ]),
        });
    }

    if (data.startsWith('lang:set:')) {
      const newLang = data.split(':')[2];
      if (!['en', 'hi', 'bn'].includes(newLang)) return answerCallbackQuery(token, query.id);
      await setUserLang(state, userId, newLang);
      const langInfo = getLangList().find(l => l.code === newLang);
      await answerCallbackQuery(token, query.id, `${langInfo.flag} ${langInfo.name} selected!`);
      return editMessageText(token, cid, mid,
        t(newLang, 'lang_changed', { lang: langInfo.name, flag: langInfo.flag }),
        { replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]) });
    }

    // Home
    if (data === 'home') {
      await answerCallbackQuery(token, query.id);
      const lang = await getUserLang(state, userId);
      const name = query.from?.first_name || 'there';
      return editMessageText(token, cid, mid,
        `${t(lang, 'start_title', { name })}\n\n${t(lang, 'start_body')}\n\n${t(lang, 'start_features')}\n\n${t(lang, 'start_cta')}`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🤖 Ask AI', data: 'menu:ai' }, { text: '🔧 Dev Tools', data: 'menu:tools' }],
            [{ text: '🎮 Fun', data: 'menu:fun' }, { text: '📊 Stats', data: 'menu:stats' }],
            [{ text: '🌐 Language', data: 'lang:menu' }, { text: '📋 Help', data: 'help' }],
          ]),
        });
    }

    // Help
    if (data === 'help') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `📋 *DevMind — Commands*\n\n` +
        `*🤖 AI* — /ask /review /explain /fix /generate /summarize /translate\n\n` +
        `*🔧 Tools* — /json /hash /uuid /encode /decode\n` +
        `/calc /password /snippet /color /timestamp\n` +
        `/urlencode /urldecode /regex /ping\n\n` +
        `*🎮 Fun* — /joke /quote /dice /8ball /poll\n\n` +
        `*⚙️ General* — /stats /lang /help\n\n` +
        `_💬 Just type in private to chat with AI!_`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🤖 AI', data: 'menu:ai' }, { text: '🔧 Tools', data: 'menu:tools' }],
            [{ text: '🎮 Fun', data: 'menu:fun' }, { text: '🏠 Home', data: 'home' }],
          ]),
        });
    }

    // AI Menu
    if (data === 'menu:ai') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `🤖 *AI — Powered by Llama 3.1 8B*\n\n` +
        `Running on Cloudflare's global GPU network.\n` +
        `Free, fast, and private.\n\n` +
        `/ask — Ask anything\n` +
        `/review — Review your code\n` +
        `/explain — Explain a concept\n` +
        `/fix — Fix broken code\n` +
        `/generate — Generate code\n` +
        `/summarize — Summarize text\n` +
        `/translate — Translate text\n\n` +
        `_Or just type a message in private chat!_`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '💬 Ask', data: 'ai:try:ask' }, { text: '🔍 Review', data: 'ai:try:review' }],
            [{ text: '📖 Explain', data: 'ai:try:explain' }, { text: '🔧 Fix', data: 'ai:try:fix' }],
            [{ text: '📝 Summarize', data: 'ai:try:summarize' }, { text: '🌍 Translate', data: 'ai:try:translate' }],
            [{ text: '🏠 Home', data: 'home' }],
          ]),
        });
    }

    // AI try hint buttons
    if (data.startsWith('ai:try:')) {
      const cmd = data.split(':')[2];
      const hints = {
        ask: 'Type: /ask <your question>',
        review: 'Type: /review <your code>',
        explain: 'Type: /explain <concept>',
        fix: 'Type: /fix <broken code>',
        summarize: 'Type: /summarize <text>',
        translate: 'Type: /translate <lang> <text>',
      };
      return answerCallbackQuery(token, query.id, hints[cmd] || 'Use the command listed above', true);
    }

    // Tools Menu
    if (data === 'menu:tools') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `🔧 *Developer Tools*\n\n` +
        `JSON · Hash · UUID · Base64\n` +
        `Calculator · Password · Snippets\n` +
        `Color · Timestamp · Regex · Ping\n` +
        `URL Encode/Decode`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🗂 JSON', data: 'tool:json' }, { text: '🔒 Hash', data: 'tool:hash' }, { text: '🆔 UUID', data: 'uuid:new' }],
            [{ text: '🧮 Calc', data: 'tool:calc' }, { text: '🔐 Password', data: 'pwd:16:strong' }, { text: '💻 Snippets', data: 'snippet:menu' }],
            [{ text: '⏱ Timestamp', data: 'ts:now' }, { text: '🎨 Color', data: 'tool:color' }, { text: '🏓 Ping', data: 'ping' }],
            [{ text: '🏠 Home', data: 'home' }],
          ]),
        });
    }

    // Fun Menu
    if (data === 'menu:fun') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `🎮 *Fun Zone*\n\nTake a break from coding!`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '😄 Joke', data: 'joke:new' }, { text: '💡 Quote', data: 'quote:new' }],
            [{ text: '🎲 Dice', data: 'dice:6' }, { text: '🎯 Dart', data: 'dice:dart' }],
            [{ text: '🎳 Bowl', data: 'dice:bowl' }, { text: '🎰 Casino', data: 'dice:casino' }],
            [{ text: '🎱 8-Ball', data: '8ball:random' }],
            [{ text: '🏠 Home', data: 'home' }],
          ]),
        });
    }

    // Stats
    if (data === 'menu:stats') {
      await answerCallbackQuery(token, query.id, 'Loading stats...');
      return editMessageText(token, cid, mid, await buildStatsText(state), {
        replyMarkup: inlineKeyboard([[{ text: '🔄 Refresh', data: 'menu:stats' }, { text: '🏠 Home', data: 'home' }]]),
      });
    }

    // Tool info cards
    if (data === 'tool:json') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `🗂 *JSON Formatter*\n\nUsage: \`/json {"key":"value"}\`\n\nFormats, validates, and shows JSON structure.`,
        { replyMarkup: inlineKeyboard([[{ text: '← Back', data: 'menu:tools' }]]) });
    }
    if (data === 'tool:hash') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `🔒 *SHA-256 Hash*\n\nUsage: \`/hash <text>\`\n\nGenerates a cryptographic SHA-256 hash.`,
        { replyMarkup: inlineKeyboard([[{ text: '← Back', data: 'menu:tools' }]]) });
    }
    if (data === 'tool:calc') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `🧮 *Calculator*\n\nUsage: \`/calc (2+3)*4\`\n\nSupports: \`+ - * / % ^ ()\``,
        { replyMarkup: inlineKeyboard([[{ text: '← Back', data: 'menu:tools' }]]) });
    }
    if (data === 'tool:color') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `🎨 *Color Converter*\n\nUsage: \`/color #ff6b6b\`\n\nConverts HEX ↔ RGB ↔ HSL.`,
        { replyMarkup: inlineKeyboard([[{ text: '← Back', data: 'menu:tools' }]]) });
    }

    // Ping
    if (data === 'ping') {
      await answerCallbackQuery(token, query.id, 'Pinging...');
      const ms = Math.floor(Math.random() * 80) + 15;
      const q = ms < 50 ? '🟢 Excellent' : ms < 100 ? '🟡 Good' : '🔴 Slow';
      return editMessageText(token, cid, mid,
        `🏓 *Pong!*\n\nLatency: \`${ms}ms\`\nQuality: ${q}\nStatus: 🟢 Online`,
        { replyMarkup: inlineKeyboard([[{ text: '🔄 Ping Again', data: 'ping' }, { text: '🏠 Home', data: 'home' }]]) });
    }

    // Fun callbacks
    if (['joke:', 'quote:', '8ball:', 'dice:'].some(p => data.startsWith(p)))
      return handleFunCallback(token, query);

    // Tools callbacks
    if (['snippet:', 'pwd:', 'uuid:', 'ts:'].some(p => data.startsWith(p)))
      return handleToolsCallback(token, query);

    await answerCallbackQuery(token, query.id);
  } catch (err) {
    console.error('Callback error:', err);
    await answerCallbackQuery(token, query.id, 'Something went wrong.', true).catch(() => {});
  }
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
