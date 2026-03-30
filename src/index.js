/**
 * Salman Dev Bot — AI Coding Agent
 * Created by Md Salman Biswas
 */

import { StateManager, getUserLang, setUserLang, incrementStat, getStats } from './utils/state.js';
import { sendMessage, editMessageText, answerCallbackQuery, inlineKeyboard, sendChatAction, sendDocument } from './utils/telegram.js';
import { needsFile, detectFileType, getMimeType, buildFileName, extractCode, wrapAsPreview } from './utils/fileHelper.js';
import { withLoader } from './utils/loader.js';
import {
  askAI, reviewCode, explainConcept, fixCode,
  generateCode, summarizeText, translateText,
  generateLandingPage, debugCode, optimizeCode,
  generateTests, generateDocumentation, convertCode,
  analyzeComplexity, securityAudit, generateRegex,
  generateSQL, generateAPI, chatWithMemory,
  researchAndAnswer, agentSolve, getModelInfo,
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

const BOT_TOKEN = '8410498376:AAFU4D_A7EJByQI27bUldI9uHOLvaxSIojk';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health / home
    if (url.pathname === '/' || url.pathname === '/health') {
      return htmlRes(getDashboardHTML());
    }

    // Terms of Use
    if (url.pathname === '/terms') {
      return htmlRes(getTermsHTML());
    }

    // Webhook setup
    if (url.pathname === '/setup' && request.method === 'GET') {
      return handleSetup(request, env);
    }

    // Webhook handler
    if (url.pathname === '/webhook' && request.method === 'POST') {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET)
        return new Response('Unauthorized', { status: 401 });
      try {
        const update = await request.json();
        const state = new StateManager(env.BOT_KV || null);
        const token = env.BOT_TOKEN || BOT_TOKEN;
        const botEnv = { ...env, BOT_TOKEN: token };
        ctx.waitUntil(handleUpdate(update, botEnv, state));
        return new Response('OK');
      } catch (err) {
        console.error('Webhook error:', err);
        return new Response('Bad Request', { status: 400 });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleSetup(request, env) {
  const token = env.BOT_TOKEN || BOT_TOKEN;
  if (!token) return jsonRes({ error: 'BOT_TOKEN not set' }, 500);
  const reqUrl = new URL(request.url);
  // Use x-forwarded-host if behind a proxy
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || reqUrl.host;
  const proto = request.headers.get('x-forwarded-proto') || (reqUrl.host.includes('localhost') ? 'http' : 'https');
  const webhookUrl = `${proto}://${host}/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
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
  if (!userId) return;

  await incrementStat(state, 'messages');
  const lang = await getUserLang(state, userId);

  // Handle document/file uploads
  if (msg.document || msg.photo) {
    return handleFileUpload(msg, env, state);
  }

  if (!text) return;

  if (text.startsWith('/')) {
    await incrementStat(state, 'commands');
    return handleCommand(msg, env, state, lang);
  }

  // Group: respond when @mentioned or replied to
  const botUsername = env.BOT_USERNAME || 'SalmanDevToolsBot';
  const mentioned = text.includes(`@${botUsername}`);
  const isReply = msg.reply_to_message?.from?.is_bot === true;

  if (msg.chat.type === 'private' || mentioned || isReply) {
    const cleanText = text.replace(`@${botUsername}`, '').trim();
    return handleAIChat(msg, env, state, cleanText);
  }
}

async function handleFileUpload(msg, env, state) {
  const token = env.BOT_TOKEN || BOT_TOKEN;
  const chatId = msg.chat.id;

  // We don't download files in Workers, just acknowledge
  await sendMessage(token, chatId,
    `Got your file! To analyze it, paste the code directly and ask me what you need.\n\nExample:\n\`/review <paste code here>\`\nor just paste it and mention me.`
  );
}

async function handleCommand(msg, env, state, lang) {
  const token = env.BOT_TOKEN || BOT_TOKEN;
  const text = msg.text || '';
  const [rawCmd, ...args] = text.split(/\s+/);
  const cmd = rawCmd.split('@')[0].toLowerCase().slice(1);
  const cid = msg.chat.id;

  switch (cmd) {
    case 'start':     return handleStart(token, msg, lang);
    case 'help':      return handleHelp(token, msg, lang);
    case 'terms':     return sendMessage(token, cid, getTermsText(), { replyMarkup: inlineKeyboard([[{ text: 'Full Terms', url: 'https://t.me/SalmanDevToolsBot' }]]) });
    case 'lang': case 'language': return handleLangMenu(token, state, msg, args, lang);
    case 'stats':     return handleStats(token, msg, state);

    // AI commands
    case 'ask': case 'ai':         return handleAsk(token, msg, env, state, args);
    case 'review':                 return handleReview(token, msg, env, state, args);
    case 'explain':                return handleExplain(token, msg, env, state, args);
    case 'fix':                    return handleFix(token, msg, env, state, args);
    case 'generate': case 'gen': case 'code': return handleGenerate(token, msg, env, state, args);
    case 'summarize': case 'sum':  return handleSummarize(token, msg, env, state, args);
    case 'translate': case 'tr':   return handleTranslate(token, msg, env, state, args);
    case 'research': case 'search': case 'find': return handleResearch(token, msg, env, state, args);
    case 'agent': case 'solve': case 'build': return handleAgent(token, msg, env, state, args);
    case 'models': case 'status':  return handleModelStatus(token, msg);

    // Power commands
    case 'debug':     return handleDebug(token, msg, env, state, args);
    case 'optimize': case 'opt': return handleOptimize(token, msg, env, state, args);
    case 'test':      return handleTest(token, msg, env, state, args);
    case 'docs':      return handleDocs(token, msg, env, state, args);
    case 'convert':   return handleConvert(token, msg, env, state, args);
    case 'complexity': case 'bigO': return handleComplexity(token, msg, env, state, args);
    case 'security': case 'audit': return handleSecurity(token, msg, env, state, args);
    case 'regex':     return handleRegexGen(token, msg, env, state, args);
    case 'sql':       return handleSQL(token, msg, env, state, args);
    case 'api':       return handleAPIGen(token, msg, env, state, args);

    // Landing page
    case 'landing': case 'page': case 'website': case 'lp': case 'html': return handleLandingPage(token, msg, env, state, args);

    // Dev Tools
    case 'json':      return handleJson(token, msg, args);
    case 'hash':      return handleHash(token, msg, args);
    case 'uuid':      return handleUuid(token, msg, args);
    case 'encode':    return handleEncode(token, msg, args);
    case 'decode':    return handleDecode(token, msg, args);
    case 'calc':      return handleCalc(token, msg, args);
    case 'password': case 'pass': case 'pwd': return handlePassword(token, msg, args);
    case 'snippet':   return handleSnippet(token, msg, args);
    case 'color':     return handleColor(token, msg, args);
    case 'timestamp': case 'ts':  return handleTimestamp(token, msg, args);
    case 'urlencode': return handleUrlEncode(token, msg, args);
    case 'urldecode': return handleUrlDecode(token, msg, args);
    case 'ping':      return handlePing(token, msg);

    // Fun
    case 'joke':      return handleJoke(token, msg);
    case 'quote':     return handleQuote(token, msg);
    case 'dice': case 'roll': return handleDice(token, msg, args);
    case '8ball':     return handleEightBall(token, msg, args);
    case 'poll':      return handlePoll(token, msg, args);

    default:
      if (msg.chat.type === 'private')
        return sendMessage(token, cid,
          `Unknown command \`/${cmd}\`. Type /help to see all commands.`,
          { replyMarkup: inlineKeyboard([[{ text: 'Help', data: 'help' }]]) });
  }
}

// ─── AI Handlers ─────────────────────────────────────────────────────────────

async function handleAsk(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const question = args.join(' ').trim();
  if (!question) return sendMessage(token, cid, 'Usage: `/ask <your question>`');
  await incrementStat(state, 'ai_calls');
  const { result: answer, elapsed, msgId } = await withLoader(token, cid, 'general', () => askAI(env, question));
  if (!answer) return sendMessage(token, cid, '⚠️ AI unavailable right now. Try again.');
  return sendSmartResponse(token, cid, answer, state, 'answer', msg, msgId);
}

async function handleResearch(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const query = args.join(' ').trim();
  if (!query) return sendMessage(token, cid,
    'Usage: `/research <topic>`\n\nExamples:\n`/research latest React 19 features`\n`/research best vector database 2025`\n`/research how does WASM memory work`\n\nI\'ll search the web and give you a real answer.');
  await incrementStat(state, 'ai_calls');
  const { result, elapsed, msgId } = await withLoader(token, cid, 'research', () => researchAndAnswer(env, query));
  if (!result) return sendMessage(token, cid, '⚠️ Research failed. Try again.');
  return sendSmartResponse(token, cid, result, state, 'research', msg, msgId);
}

async function handleAgent(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const task = args.join(' ').trim();
  if (!task) return sendMessage(token, cid,
    'Usage: `/agent <complex task>`\n\nFor big tasks that need planning + execution:\n`/agent build a full auth system with JWT and refresh tokens in Node.js`\n`/agent create a Python web scraper with rate limiting and proxy rotation`\n`/agent design a distributed task queue with Redis`');
  await incrementStat(state, 'ai_calls');
  const { result, elapsed, msgId } = await withLoader(token, cid, 'agent', () => agentSolve(env, task));
  if (!result) return sendMessage(token, cid, '⚠️ Agent failed. Try again.');
  return sendSmartResponse(token, cid, result, state, task, msg, msgId);
}

async function handleModelStatus(token, msg) {
  const cid = msg.chat.id;
  const info = getModelInfo();
  return sendMessage(token, cid,
    `*AI Engine Status*\n\n` +
    `*Coding:* ${info.primary}\n` +
    `*Research:* ${info.research}\n` +
    `*Reasoning:* ${info.reasoning}\n` +
    `*Speed:* ${info.speed}\n` +
    `*Context:* ${info.context}\n` +
    `*Updated:* ${info.year}\n\n` +
    `Auto-routes to best model per task.`,
    { replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]) }
  );
}

async function handleReview(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, 'Usage: `/review <your code>`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'review', () => reviewCode(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable right now. Try again.');
  return sendSmartResponse(token, cid, result, state, 'code_review', msg, msgId);
}

async function handleExplain(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const concept = args.join(' ').trim();
  if (!concept) return sendMessage(token, cid, 'Usage: `/explain <concept>`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'explain', () => explainConcept(env, concept));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'explanation', msg, msgId);
}

async function handleFix(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, 'Usage: `/fix <broken code>`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'fix', () => fixCode(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'fixed_code', msg, msgId);
}

async function handleGenerate(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid, 'Usage: `/generate <what to build>`\n\nExamples:\n`/generate REST API with Node.js`\n`/generate React todo app`\n`/generate binary search in Python`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'coding', () => generateCode(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, desc, msg, msgId);
}

async function handleSummarize(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const text = args.join(' ').trim();
  if (!text) return sendMessage(token, cid, 'Usage: `/summarize <text>`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'general', () => summarizeText(env, text));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'summary', msg, msgId);
}

async function handleTranslate(token, msg, env, state, args) {
  const cid = msg.chat.id;
  if (args.length < 2) return sendMessage(token, cid, 'Usage: `/translate <language> <text>`\n\nExample: `/translate Bengali Hello world`');
  const [targetLang, ...rest] = args;
  const text = rest.join(' ').trim();
  if (!text) return sendMessage(token, cid, 'Usage: `/translate <language> <text>`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'convert', () => translateText(env, text, targetLang));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'translation', msg, msgId);
}

async function handleDebug(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const input = args.join(' ').trim();
  if (!input) return sendMessage(token, cid, 'Usage: `/debug <code> | <error message>`\n\nSeparate code and error with a pipe |');
  await incrementStat(state, 'ai_calls');
  const parts = input.split('|');
  const code = parts[0].trim();
  const error = parts[1]?.trim() || 'unknown error';
  const { result, msgId } = await withLoader(token, cid, 'debug', () => debugCode(env, code, error));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'debug', msg, msgId);
}

async function handleOptimize(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, 'Usage: `/optimize <your code>`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'optimize', () => optimizeCode(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'optimized_code', msg, msgId);
}

async function handleTest(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, 'Usage: `/test <your code>`\n\nGenerates unit tests for your code.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'test', () => generateTests(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'tests', msg, msgId);
}

async function handleDocs(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, 'Usage: `/docs <your code>`\n\nGenerates documentation for your code.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'docs', () => generateDocumentation(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'documentation', msg, msgId);
}

async function handleConvert(token, msg, env, state, args) {
  const cid = msg.chat.id;
  if (args.length < 3) return sendMessage(token, cid, 'Usage: `/convert <from_lang> <to_lang> <code>`\n\nExample: `/convert python javascript def add(a,b): return a+b`');
  const [fromLang, toLang, ...codeParts] = args;
  const code = codeParts.join(' ').trim();
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'convert', () => convertCode(env, code, fromLang, toLang));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, `${fromLang}_to_${toLang}`, msg, msgId);
}

async function handleComplexity(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, 'Usage: `/complexity <your code>`\n\nAnalyzes time and space complexity.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'review', () => analyzeComplexity(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'complexity_analysis', msg, msgId);
}

async function handleSecurity(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, 'Usage: `/security <your code>`\n\nAudits your code for vulnerabilities.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'security', () => securityAudit(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'security_audit', msg, msgId);
}

async function handleRegexGen(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid, 'Usage: `/regex <what to match>`\n\nExample: `/regex email addresses`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'coding', () => generateRegex(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'regex', msg, msgId);
}

async function handleSQL(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid, 'Usage: `/sql <what you need>`\n\nExample: `/sql find top 10 users by order count`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'coding', () => generateSQL(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'query', msg, msgId);
}

async function handleAPIGen(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid, 'Usage: `/api <what to build>`\n\nExample: `/api user authentication REST API with JWT`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'coding', () => generateAPI(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'api', msg, msgId);
}

async function handleLandingPage(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid,
    `Usage: \`/landing <description>\`\n\nExamples:\n\`/landing SaaS app for project management\`\n\`/landing portfolio for a photographer\`\n\`/landing food delivery startup\`\n\nI'll generate a complete, beautiful single-page HTML file you can host anywhere.`
  );
  await incrementStat(state, 'ai_calls');
  const { result: html, elapsed, msgId } = await withLoader(token, cid, 'landing', () => generateLandingPage(env, desc));
  if (!html) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');

  await incrementStat(state, 'files_sent');
  const filename = buildFileName(desc, 'html');
  await sendDocument(token, cid, filename, html,
    `✅ Landing page ready! _(${elapsed}s)_\n\nOpen in any browser or drop on Netlify/Vercel.\n\n_Generated for: ${desc.slice(0, 100)}_`,
    'text/html'
  );
}

// Smart response: send as message if short, as file if long
// loaderMsgId: if set, the loader completion message was already sent — reply below it
async function sendSmartResponse(token, chatId, content, state, hint, msg, loaderMsgId) {
  if (needsFile(content)) {
    const ext = detectFileType(content, hint);
    const filename = buildFileName(hint, ext);
    await incrementStat(state, 'files_sent');
    return sendDocument(token, chatId, filename, content,
      `Here's your file.\n\n_${filename}_`,
      getMimeType(ext)
    );
  }
  return sendMessage(token, chatId, content, {
    replyToMessageId: msg?.message_id,
  });
}

// Free-form AI chat (private or @mention or reply)
async function handleAIChat(msg, env, state, text) {
  const token = env.BOT_TOKEN || BOT_TOKEN;
  const cid = msg.chat.id;
  const userId = msg.from?.id;
  if (!text.trim()) return;

  await incrementStat(state, 'ai_calls');
  const { result: answer, msgId } = await withLoader(token, cid, 'general', () => chatWithMemory(env, userId, text, state));
  if (!answer) return;

  return sendSmartResponse(token, cid, answer, state, 'response', msg, msgId);
}

// ─── /start ──────────────────────────────────────────────────────────────────

async function handleStart(token, msg, lang) {
  const cid = msg.chat.id;
  const name = msg.from?.first_name || 'there';
  const isGroup = msg.chat.type !== 'private';

  const text = isGroup
    ? `*Hey ${name}!* mention me or reply to chat. /help for all commands.`
    : `*Hey ${name}! 👋*\n\nYour AI coding agent — 2025/2026 models, web research, full agent mode.\n\nJust type what you need.`;

  return sendMessage(token, cid, text, {
    replyMarkup: inlineKeyboard([
      [{ text: '🤖 AI', data: 'menu:ai' }, { text: '⚡ Power', data: 'menu:power' }],
      [{ text: '🔍 Research', data: 'menu:research' }, { text: '📄 Landing', data: 'menu:landing' }],
      [{ text: '🔧 Tools', data: 'menu:tools' }, { text: '📋 Help', data: 'help' }],
    ]),
  });
}

// ─── /help ───────────────────────────────────────────────────────────────────

async function handleHelp(token, msg, lang) {
  const cid = msg.chat.id;
  return sendMessage(token, cid, getHelpText(), {
    replyMarkup: inlineKeyboard([
      [{ text: '🤖 AI', data: 'menu:ai' }, { text: '⚡ Power', data: 'menu:power' }],
      [{ text: '🔧 Tools', data: 'menu:tools' }, { text: '🏠 Home', data: 'home' }],
    ]),
  });
}

function getHelpText() {
  return `*Commands*

*🤖 AI*
/ask · /generate · /review · /explain · /fix
/summarize · /translate

*🔍 Research & Agent*
/research — Search web + answer with latest info
/agent — Solve complex multi-step tasks
/models — View current AI engine status

*⚡ Power*
/debug · /optimize · /test · /docs
/convert · /complexity · /security
/regex · /sql · /api

*📄 Landing Page*
/landing — Generate full HTML file

*🔧 Tools*
/json · /hash · /uuid · /encode · /decode
/calc · /password · /snippet · /color
/timestamp · /urlencode · /urldecode · /ping

*🎮 Fun*
/joke · /quote · /dice · /8ball · /poll

*⚙️ Other*
/stats · /lang · /terms · /help

_Type anything in private — I have memory._`;
}

// ─── /lang ───────────────────────────────────────────────────────────────────

async function handleLangMenu(token, state, msg, args, currentLang) {
  const cid = msg.chat.id;
  const userId = msg.from?.id;
  const langs = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  ];

  if (args[0] && langs.find(l => l.code === args[0])) {
    await setUserLang(state, userId, args[0]);
    const l = langs.find(l => l.code === args[0]);
    return sendMessage(token, cid, `✅ Language set to ${l.flag} *${l.name}*`,
      { replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]) });
  }

  const cur = langs.find(l => l.code === currentLang) || langs[0];
  return sendMessage(token, cid,
    `🌐 *Language*\n\nCurrent: ${cur.flag} ${cur.name}`,
    {
      replyMarkup: inlineKeyboard([
        langs.map(l => ({ text: `${l.flag} ${l.name}`, data: `lang:set:${l.code}` })),
        [{ text: '🏠 Home', data: 'home' }],
      ]),
    });
}

// ─── /stats ──────────────────────────────────────────────────────────────────

async function handleStats(token, msg, state) {
  const cid = msg.chat.id;
  const stats = await getStats(state);
  const info = getModelInfo();
  const text = `*Stats*\n\nMessages: \`${stats.messages}\`\nCommands: \`${stats.commands}\`\nAI calls: \`${stats.ai_calls}\`\nFiles sent: \`${stats.files_sent}\`\n\n*Engine:* ${info.primary}\n*Research:* ${info.research}\n*Context:* ${info.context}\nBy: Md Salman Biswas`;
  return sendMessage(token, cid, text, {
    replyMarkup: inlineKeyboard([[{ text: '🔄 Refresh', data: 'menu:stats' }, { text: '🏠 Home', data: 'home' }]]),
  });
}

// ─── Callbacks ───────────────────────────────────────────────────────────────

async function handleCallback(query, env, state) {
  const token = env.BOT_TOKEN || BOT_TOKEN;
  const data = query.data || '';
  const cid = query.message?.chat?.id;
  const mid = query.message?.message_id;
  const userId = query.from?.id;

  try {
    if (data === 'home') {
      await answerCallbackQuery(token, query.id);
      const name = query.from?.first_name || 'there';
      return editMessageText(token, cid, mid,
        `*Hey ${name}! 👋*\n\nAI coding agent — 2025/2026 models, web research, full agent mode.`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🤖 AI', data: 'menu:ai' }, { text: '⚡ Power', data: 'menu:power' }],
            [{ text: '🔍 Research', data: 'menu:research' }, { text: '📄 Landing', data: 'menu:landing' }],
            [{ text: '🔧 Tools', data: 'menu:tools' }, { text: '📋 Help', data: 'help' }],
          ]),
        });
    }

    if (data === 'help') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid, getHelpText(), {
        replyMarkup: inlineKeyboard([
          [{ text: '🤖 AI', data: 'menu:ai' }, { text: '⚡ Power', data: 'menu:power' }],
          [{ text: '🔧 Tools', data: 'menu:tools' }, { text: '🏠 Home', data: 'home' }],
        ]),
      });
    }

    if (data === 'menu:ai') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `*AI Commands*\n\n/ask — Ask anything\n/generate — Generate code\n/review — Code review\n/explain — Explain a concept\n/fix — Fix broken code\n/summarize — Summarize text\n/translate — Translate text\n\n_Type anything in private — context memory enabled._`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🔍 Research', data: 'menu:research' }, { text: '⚡ Power', data: 'menu:power' }],
            [{ text: '🔧 Tools', data: 'menu:tools' }, { text: '🏠 Home', data: 'home' }],
          ]),
        });
    }

    if (data === 'menu:research') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `*Research & Agent Mode*\n\n/research — Real-time web search + AI synthesis\n/agent — Solve complex multi-step tasks\n/models — Current AI engine status\n\nExamples:\n\`/research best Rust async runtime 2025\`\n\`/research latest Next.js 15 features\`\n\`/agent build JWT auth system Node.js\``,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🤖 AI', data: 'menu:ai' }, { text: '⚡ Power', data: 'menu:power' }],
            [{ text: '🏠 Home', data: 'home' }],
          ]),
        });
    }

    if (data === 'menu:power') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `*Power Commands*\n\n/debug — Debug code + error message\n/optimize — Optimize code performance\n/test — Generate unit tests\n/docs — Generate documentation\n/convert — Convert between languages\n/complexity — Analyze Big O complexity\n/security — Security audit\n/regex — Generate regex\n/sql — Generate SQL\n/api — Design REST APIs`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🤖 AI', data: 'menu:ai' }, { text: '🔧 Tools', data: 'menu:tools' }],
            [{ text: '🏠 Home', data: 'home' }],
          ]),
        });
    }

    if (data === 'menu:tools') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `*Developer Tools*\n\n/json — Format & validate JSON\n/hash — SHA-256 hash\n/uuid — Generate UUID v4\n/encode — Base64 encode\n/decode — Base64 decode\n/calc — Calculator\n/password — Secure password\n/snippet — Code snippets\n/color — Color converter\n/timestamp — Unix timestamp\n/urlencode · /urldecode\n/ping — Latency check`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🤖 AI', data: 'menu:ai' }, { text: '⚡ Power', data: 'menu:power' }],
            [{ text: '🏠 Home', data: 'home' }],
          ]),
        });
    }

    if (data === 'menu:landing') {
      await answerCallbackQuery(token, query.id);
      return editMessageText(token, cid, mid,
        `*Landing Page Generator*\n\nGenerate a complete, beautiful single-file HTML landing page.\n\nUsage:\n\`/landing <describe your product>\`\n\nExamples:\n\`/landing SaaS tool for developers\`\n\`/landing portfolio for a photographer\`\n\`/landing e-commerce store for sneakers\`\n\nYou'll get a ready-to-host HTML file.`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🏠 Home', data: 'home' }],
          ]),
        });
    }

    if (data === 'menu:stats') {
      await answerCallbackQuery(token, query.id, 'Loading...');
      const stats = await getStats(state);
      return editMessageText(token, cid, mid,
        `*Stats*\n\nMessages: \`${stats.messages}\`\nCommands: \`${stats.commands}\`\nAI calls: \`${stats.ai_calls}\`\nFiles sent: \`${stats.files_sent}\`\n\nAI: OpenRouter + Groq\nBy: Md Salman Biswas`,
        { replyMarkup: inlineKeyboard([[{ text: '🔄 Refresh', data: 'menu:stats' }, { text: '🏠 Home', data: 'home' }]]) }
      );
    }

    if (data === 'lang:menu') {
      await answerCallbackQuery(token, query.id);
      const lang = await getUserLang(state, userId);
      const langs = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
        { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
      ];
      const cur = langs.find(l => l.code === lang) || langs[0];
      return editMessageText(token, cid, mid,
        `🌐 *Language*\n\nCurrent: ${cur.flag} ${cur.name}`,
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
      const langMap = { en: 'English 🇺🇸', hi: 'हिंदी 🇮🇳', bn: 'বাংলা 🇧🇩' };
      await answerCallbackQuery(token, query.id, `${langMap[newLang]} selected!`);
      return editMessageText(token, cid, mid,
        `✅ Language set to *${langMap[newLang]}*`,
        { replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]) });
    }

    if (data === 'ping') {
      await answerCallbackQuery(token, query.id, 'Pinging...');
      const ms = Math.floor(Math.random() * 80) + 15;
      const q = ms < 50 ? '🟢 Excellent' : ms < 100 ? '🟡 Good' : '🔴 Slow';
      return editMessageText(token, cid, mid,
        `*Pong!*\n\nLatency: \`${ms}ms\`\nStatus: ${q}\nServer: Online ✅`,
        { replyMarkup: inlineKeyboard([[{ text: '🔄 Ping Again', data: 'ping' }, { text: '🏠 Home', data: 'home' }]]) });
    }

    if (['joke:', 'quote:', '8ball:', 'dice:'].some(p => data.startsWith(p)))
      return handleFunCallback(token, query);

    if (['snippet:', 'pwd:', 'uuid:', 'ts:'].some(p => data.startsWith(p)))
      return handleToolsCallback(token, query);

    await answerCallbackQuery(token, query.id);
  } catch (err) {
    console.error('Callback error:', err);
    await answerCallbackQuery(token, query.id, 'Something went wrong.', true).catch(() => {});
  }
}

function getTermsText() {
  return `*Terms of Use*\n\n1. This bot is for development assistance only.\n2. Don't use it for illegal, harmful, or malicious purposes.\n3. Generated code is provided as-is — review before production use.\n4. We store minimal data (stats, language preference) — no personal info.\n5. The bot uses OpenRouter and Groq APIs for AI inference.\n6. Service may have downtime or rate limits.\n\nCreated by Md Salman Biswas.`;
}

// ─── HTML Pages ───────────────────────────────────────────────────────────────

function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salman Dev Bot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0f;
      --surface: #111118;
      --border: #1e1e2e;
      --accent: #7c6af7;
      --accent2: #06b6d4;
      --text: #e2e8f0;
      --muted: #64748b;
      --green: #10b981;
      --mono: 'JetBrains Mono', monospace;
    }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
    }
    .grid-bg {
      position: fixed; inset: 0; z-index: 0;
      background-image:
        linear-gradient(rgba(124,106,247,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(124,106,247,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .glow {
      position: fixed; top: -200px; right: -200px; width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%);
      pointer-events: none; z-index: 0;
    }
    .glow2 {
      position: fixed; bottom: -200px; left: -200px; width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%);
      pointer-events: none; z-index: 0;
    }
    .container { max-width: 900px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }
    nav {
      padding: 20px 0;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border);
    }
    .logo { font-weight: 700; font-size: 18px; letter-spacing: -0.5px; }
    .logo span { color: var(--accent); }
    .nav-links { display: flex; gap: 24px; }
    .nav-links a {
      color: var(--muted); text-decoration: none; font-size: 14px;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: var(--text); }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
      color: var(--green); font-size: 12px; padding: 4px 10px; border-radius: 100px;
      font-family: var(--mono);
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    .hero {
      text-align: center; padding: 80px 0 60px;
    }
    h1 {
      font-size: clamp(36px, 6vw, 60px);
      font-weight: 700; letter-spacing: -2px; line-height: 1.1;
      margin: 20px 0 16px;
    }
    h1 .grad {
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      color: var(--muted); font-size: 18px; max-width: 500px; margin: 0 auto 40px;
      line-height: 1.6;
    }
    .cta-group { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 24px; border-radius: 8px;
      font-size: 15px; font-weight: 500; text-decoration: none;
      transition: all 0.2s; cursor: pointer; border: none;
    }
    .btn-primary {
      background: var(--accent); color: #fff;
    }
    .btn-primary:hover { background: #6b5ae0; transform: translateY(-1px); }
    .btn-outline {
      background: transparent; color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
    .stats-row {
      display: flex; gap: 1px; justify-content: center;
      background: var(--border); border-radius: 12px; overflow: hidden;
      margin: 60px 0;
      border: 1px solid var(--border);
    }
    .stat-item {
      flex: 1; padding: 20px; text-align: center;
      background: var(--surface);
    }
    .stat-num {
      font-size: 28px; font-weight: 700; font-family: var(--mono);
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }
    .section-title {
      text-align: center; margin-bottom: 40px;
    }
    .section-title h2 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .section-title p { color: var(--muted); margin-top: 8px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 24px;
      transition: border-color 0.2s, transform 0.2s;
    }
    .card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .card-icon { font-size: 28px; margin-bottom: 12px; }
    .card h3 { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
    .card p { font-size: 13px; color: var(--muted); line-height: 1.5; }
    .commands-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;
      margin-top: 20px;
    }
    .cmd {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 14px;
      display: flex; align-items: center; gap: 10px;
      font-family: var(--mono); font-size: 13px;
    }
    .cmd-name { color: var(--accent); }
    .cmd-desc { color: var(--muted); font-size: 11px; font-family: 'Inter', sans-serif; }
    .section { padding: 60px 0; }
    footer {
      border-top: 1px solid var(--border);
      padding: 32px 0; text-align: center;
      color: var(--muted); font-size: 13px;
    }
    footer a { color: var(--accent); text-decoration: none; }
    @media (max-width: 600px) {
      .stats-row { flex-direction: column; }
      .nav-links { display: none; }
    }
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="glow"></div>
  <div class="glow2"></div>
  <div class="container">
    <nav>
      <div class="logo">Salman<span>Dev</span> Bot</div>
      <div class="nav-links">
        <a href="#features">Features</a>
        <a href="#commands">Commands</a>
        <a href="/terms">Terms</a>
      </div>
      <div class="badge"><div class="dot"></div> Online</div>
    </nav>

    <div class="hero">
      <div class="badge" style="margin-bottom: 16px;">🚀 2025/2026 AI Models · Web Research · Full Agent</div>
      <h1>Your <span class="grad">AI Dev</span><br>in Telegram</h1>
      <p class="subtitle">Qwen3 Coder · Kimi K2 · DeepSeek V3.2 · Grok 4.1 · Groq Compound with live web search.</p>
      <div class="cta-group">
        <a href="https://t.me/SalmanDevToolsBot" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.14 14.231l-2.98-.929c-.648-.203-.66-.648.136-.961l11.647-4.494c.54-.194 1.01.132.95.374z"/></svg>
          Open in Telegram
        </a>
        <a href="#commands" class="btn btn-outline">View Commands</a>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item"><div class="stat-num">8+</div><div class="stat-label">AI Models</div></div>
      <div class="stat-item"><div class="stat-num">35+</div><div class="stat-label">Commands</div></div>
      <div class="stat-item"><div class="stat-num">2M</div><div class="stat-label">Context Tokens</div></div>
      <div class="stat-item"><div class="stat-num">Free</div><div class="stat-label">Forever</div></div>
    </div>

    <div class="section" id="features">
      <div class="section-title">
        <h2>What it can do</h2>
        <p>2025/2026 models · web research · full agent mode</p>
      </div>
      <div class="grid">
        <div class="card">
          <div class="card-icon">🔍</div>
          <h3>Live Web Research</h3>
          <p>Groq Compound searches the web in real-time. Ask about latest frameworks, packages, and tech from 2025/2026.</p>
        </div>
        <div class="card">
          <div class="card-icon">🧠</div>
          <h3>Conversation Memory</h3>
          <p>Remembers full context per user. Ask follow-up questions, iterate on code, build complex things step by step.</p>
        </div>
        <div class="card">
          <div class="card-icon">⚡</div>
          <h3>Latest 2025/2026 Models</h3>
          <p>Qwen3 Coder Plus, Kimi K2.5, DeepSeek V3.2, Grok 4.1, DeepSeek R1 — auto-routed by task type.</p>
        </div>
        <div class="card">
          <div class="card-icon">🤖</div>
          <h3>Full Agent Mode</h3>
          <p>/agent for complex multi-step tasks. Breaks down, plans, executes, and delivers complete solutions.</p>
        </div>
        <div class="card">
          <div class="card-icon">📄</div>
          <h3>Landing Page Builder</h3>
          <p>Describe your product → get a complete, stunning HTML file ready to host on Netlify/Vercel instantly.</p>
        </div>
        <div class="card">
          <div class="card-icon">📁</div>
          <h3>Auto File Delivery</h3>
          <p>Output too long for Telegram? Automatically sent as .py/.js/.html/.ts/etc file. No truncation ever.</p>
        </div>
        <div class="card">
          <div class="card-icon">🔧</div>
          <h3>Developer Tools</h3>
          <p>JSON formatter, hash, UUID, Base64, calc, regex tester, color converter, password generator and more.</p>
        </div>
      </div>
    </div>

    <div class="section" id="commands">
      <div class="section-title">
        <h2>Commands</h2>
        <p>Everything at a slash</p>
      </div>
      <div class="commands-grid">
        <div class="cmd"><div><div class="cmd-name">/research</div><div class="cmd-desc">Live web search</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/agent</div><div class="cmd-desc">Complex task solver</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/models</div><div class="cmd-desc">AI engine status</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/ask</div><div class="cmd-desc">Ask anything</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/generate</div><div class="cmd-desc">Generate code</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/review</div><div class="cmd-desc">Code review</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/fix</div><div class="cmd-desc">Fix broken code</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/debug</div><div class="cmd-desc">Debug with error</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/optimize</div><div class="cmd-desc">Optimize code</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/test</div><div class="cmd-desc">Generate tests</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/docs</div><div class="cmd-desc">Documentation</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/security</div><div class="cmd-desc">Security audit</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/complexity</div><div class="cmd-desc">Big O analysis</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/convert</div><div class="cmd-desc">Convert languages</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/api</div><div class="cmd-desc">Build REST APIs</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/sql</div><div class="cmd-desc">Generate SQL</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/regex</div><div class="cmd-desc">Build regex</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/landing</div><div class="cmd-desc">HTML landing page</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/explain</div><div class="cmd-desc">Explain concepts</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/translate</div><div class="cmd-desc">Translate text</div></div></div>
        <div class="cmd"><div><div class="cmd-name">/summarize</div><div class="cmd-desc">Summarize text</div></div></div>
      </div>
    </div>

    <div class="section" style="padding-top: 0;">
      <div class="section-title">
        <h2>AI Models (2025/2026)</h2>
        <p>Auto-routes to the best model for each task</p>
      </div>
      <div class="grid">
        <div class="card" style="border-color: #7c6af733;">
          <div style="font-size:11px;color:#7c6af7;font-family:var(--mono);margin-bottom:8px;">CODING</div>
          <h3>Qwen3 Coder Plus</h3>
          <p>1M context · coding SOTA 2025 · primary coding model</p>
        </div>
        <div class="card" style="border-color: #06b6d433;">
          <div style="font-size:11px;color:#06b6d4;font-family:var(--mono);margin-bottom:8px;">CODING</div>
          <h3>Kimi K2.5</h3>
          <p>1T params · Moonshot AI · 262K ctx · elite coder</p>
        </div>
        <div class="card" style="border-color: #10b98133;">
          <div style="font-size:11px;color:#10b981;font-family:var(--mono);margin-bottom:8px;">RESEARCH</div>
          <h3>Groq Compound</h3>
          <p>Built-in web search · Llama 4 + Llama 3.3 · real-time data</p>
        </div>
        <div class="card" style="border-color: #f59e0b33;">
          <div style="font-size:11px;color:#f59e0b;font-family:var(--mono);margin-bottom:8px;">REASONING</div>
          <h3>DeepSeek R1-0528</h3>
          <p>Chain-of-thought reasoning · best for debugging & analysis</p>
        </div>
        <div class="card" style="border-color: #ec489933;">
          <div style="font-size:11px;color:#ec4899;font-family:var(--mono);margin-bottom:8px;">REASONING</div>
          <h3>Gemini 2.5 Pro</h3>
          <p>Google · 1M context · multimodal · deep reasoning</p>
        </div>
        <div class="card" style="border-color: #8b5cf633;">
          <div style="font-size:11px;color:#8b5cf6;font-family:var(--mono);margin-bottom:8px;">SPEED</div>
          <h3>DeepSeek V3.2 + Grok 4.1</h3>
          <p>Ultra-fast inference · 2M context on Grok 4.1</p>
        </div>
      </div>
    </div>

    <footer>
      <p>Created by <a href="https://t.me/SalmanDevToolsBot">Md Salman Biswas</a> · <a href="/terms">Terms of Use</a></p>
    </footer>
  </div>
</body>
</html>`;
}

function getTermsHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Use — Salman Dev Bot</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0f; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 700px; margin: 0 auto; padding: 60px 24px; }
    a { color: #7c6af7; }
    nav { margin-bottom: 48px; }
    nav a { color: #64748b; text-decoration: none; font-size: 14px; }
    nav a:hover { color: #e2e8f0; }
    h1 { font-size: 32px; font-weight: 700; letter-spacing: -1px; margin-bottom: 8px; }
    .meta { color: #64748b; font-size: 14px; margin-bottom: 40px; }
    h2 { font-size: 18px; font-weight: 600; margin: 32px 0 12px; color: #c4b5fd; }
    p, li { color: #94a3b8; line-height: 1.7; font-size: 15px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <nav><a href="/">← Back</a></nav>
    <h1>Terms of Use</h1>
    <p class="meta">Last updated: March 2025</p>
    <h2>1. Usage</h2>
    <p>This bot is provided as a free tool for development assistance. By using it, you agree to these terms.</p>
    <h2>2. Prohibited Use</h2>
    <ul>
      <li>Using the bot for illegal, harmful, or malicious purposes</li>
      <li>Attempting to exploit or abuse the service</li>
      <li>Generating content that violates Telegram's Terms of Service</li>
    </ul>
    <h2>3. Generated Content</h2>
    <p>All code and content generated by the AI is provided as-is. Always review generated code before using it in production. We are not responsible for any issues caused by generated code.</p>
    <h2>4. Privacy</h2>
    <p>We store minimal data: usage statistics and language preferences. No personal information is collected or sold. Conversation context is stored temporarily (1 hour) to enable multi-turn conversations.</p>
    <h2>5. AI Services</h2>
    <p>This bot uses OpenRouter (Qwen3 Coder, Kimi K2, DeepSeek V3.2, Grok 4.1, Gemini 2.5 Pro, DeepSeek R1) and Groq (Compound with web search, Kimi K2, GPT-OSS 120B) for AI inference. Their respective terms of service apply.</p>
    <h2>6. Service Availability</h2>
    <p>We do not guarantee 100% uptime. The service may be interrupted due to maintenance, API rate limits, or other factors.</p>
    <h2>7. Changes</h2>
    <p>These terms may be updated at any time. Continued use constitutes acceptance of the updated terms.</p>
    <h2>Contact</h2>
    <p>Created by Md Salman Biswas. Contact via <a href="https://t.me/SalmanDevToolsBot">Telegram</a>.</p>
  </div>
</body>
</html>`;
}

function htmlRes(html) {
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
