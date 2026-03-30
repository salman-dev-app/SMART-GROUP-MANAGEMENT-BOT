/**
 * Salman Dev Bot v3.0 — MAXIMUM POWER AI Agent
 * Ultra-fast · Premium UI · 40+ Commands · Full Agent Mode
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
  // NEW v3.0 features
  architectSystem, generateDeployScript, interviewPrep,
  codeDiff, brainstorm, generateGitCommit, explainError,
  generateReadme, performanceAnalysis, refactorCode, generateSchema,
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

    if (url.pathname === '/' || url.pathname === '/health') return htmlRes(getDashboardHTML());
    if (url.pathname === '/terms') return htmlRes(getTermsHTML());
    if (url.pathname === '/setup' && request.method === 'GET') return handleSetup(request, env);
    if (url.pathname === '/webhook' && request.method === 'POST') {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET)
        return new Response('Unauthorized', { status: 401 });
      try {
        const update = await request.json();
        const state = new StateManager(env.BOT_KV || null);
        const token = env.BOT_TOKEN || BOT_TOKEN;
        ctx.waitUntil(handleUpdate(update, { ...env, BOT_TOKEN: token }, state));
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
  const u = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || u.host;
  const proto = request.headers.get('x-forwarded-proto') || (u.host.includes('localhost') ? 'http' : 'https');
  const webhookUrl = `${proto}://${host}/webhook`;
  const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true }),
  });
  return jsonRes({ webhook: webhookUrl, result: await r.json() });
}

async function handleUpdate(update, env, state) {
  try {
    if (update.callback_query) return handleCallback(update.callback_query, env, state);
    if (update.message) return handleMessage(update.message, env, state);
  } catch (err) { console.error('Update error:', err); }
}

async function handleMessage(msg, env, state) {
  const userId = msg.from?.id;
  const text = msg.text || '';
  if (!userId) return;

  await incrementStat(state, 'messages');
  const lang = await getUserLang(state, userId);

  if (msg.document || msg.photo) return handleFileUpload(msg, env, state);
  if (!text) return;

  if (text.startsWith('/')) {
    await incrementStat(state, 'commands');
    return handleCommand(msg, env, state, lang);
  }

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
  await sendMessage(token, msg.chat.id,
    `📎 Got your file!\n\nTo analyze it, paste the code and use:\n\`/review <code>\` — full code review\n\`/debug <code> | <error>\` — debug with error\n\`/security <code>\` — security audit\n\nor just paste code and mention me.`
  );
}

async function handleCommand(msg, env, state, lang) {
  const token = env.BOT_TOKEN || BOT_TOKEN;
  const text = msg.text || '';
  const [rawCmd, ...args] = text.split(/\s+/);
  const cmd = rawCmd.split('@')[0].toLowerCase().slice(1);
  const cid = msg.chat.id;

  switch (cmd) {
    case 'start':     return handleStart(token, msg);
    case 'help':      return handleHelp(token, msg);
    case 'terms':     return sendMessage(token, cid, getTermsText());
    case 'lang': case 'language': return handleLangMenu(token, state, msg, args, lang);
    case 'stats':     return handleStats(token, msg, state);

    // ─── Core AI ──────────────────────────────────────────────
    case 'ask': case 'ai':          return handleAsk(token, msg, env, state, args);
    case 'review':                  return handleReview(token, msg, env, state, args);
    case 'explain':                 return handleExplain(token, msg, env, state, args);
    case 'fix':                     return handleFix(token, msg, env, state, args);
    case 'generate': case 'gen': case 'code': return handleGenerate(token, msg, env, state, args);
    case 'summarize': case 'sum':   return handleSummarize(token, msg, env, state, args);
    case 'translate': case 'tr':    return handleTranslate(token, msg, env, state, args);
    case 'research': case 'search': case 'find': return handleResearch(token, msg, env, state, args);
    case 'agent': case 'solve': case 'build': return handleAgent(token, msg, env, state, args);
    case 'models': case 'status':   return handleModelStatus(token, msg);

    // ─── Power Commands ───────────────────────────────────────
    case 'debug':                   return handleDebug(token, msg, env, state, args);
    case 'optimize': case 'opt':    return handleOptimize(token, msg, env, state, args);
    case 'test':                    return handleTest(token, msg, env, state, args);
    case 'docs':                    return handleDocs(token, msg, env, state, args);
    case 'convert':                 return handleConvert(token, msg, env, state, args);
    case 'complexity': case 'bigo': return handleComplexity(token, msg, env, state, args);
    case 'security': case 'audit':  return handleSecurity(token, msg, env, state, args);
    case 'sql':                     return handleSQL(token, msg, env, state, args);
    case 'api':                     return handleAPIGen(token, msg, env, state, args);

    // ─── NEW v3.0 Premium Features ────────────────────────────
    case 'architect': case 'arch':  return handleArchitect(token, msg, env, state, args);
    case 'deploy': case 'dockerfile': case 'cicd': return handleDeploy(token, msg, env, state, args);
    case 'interview': case 'prep':  return handleInterview(token, msg, env, state, args);
    case 'diff': case 'compare':    return handleDiff(token, msg, env, state, args);
    case 'brainstorm': case 'idea': return handleBrainstorm(token, msg, env, state, args);
    case 'commit':                  return handleCommit(token, msg, env, state, args);
    case 'error': case 'err':       return handleErrorExplain(token, msg, env, state, args);
    case 'readme':                  return handleReadme(token, msg, env, state, args);
    case 'perf': case 'profile':    return handlePerf(token, msg, env, state, args);
    case 'refactor': case 'clean':  return handleRefactor(token, msg, env, state, args);
    case 'schema': case 'db':       return handleSchema(token, msg, env, state, args);
    case 'regex':                   return handleRegexGen(token, msg, env, state, args);

    // ─── Landing Page ─────────────────────────────────────────
    case 'landing': case 'page': case 'website': case 'lp': case 'html': return handleLandingPage(token, msg, env, state, args);

    // ─── Dev Tools ────────────────────────────────────────────
    case 'json':      return handleJson(token, msg, args);
    case 'hash':      return handleHash(token, msg, args);
    case 'uuid':      return handleUuid(token, msg, args);
    case 'encode':    return handleEncode(token, msg, args);
    case 'decode':    return handleDecode(token, msg, args);
    case 'calc':      return handleCalc(token, msg, args);
    case 'password': case 'pass': case 'pwd': return handlePassword(token, msg, args);
    case 'snippet':   return handleSnippet(token, msg, args);
    case 'color':     return handleColor(token, msg, args);
    case 'timestamp': case 'ts': return handleTimestamp(token, msg, args);
    case 'urlencode': return handleUrlEncode(token, msg, args);
    case 'urldecode': return handleUrlDecode(token, msg, args);
    case 'ping':      return handlePing(token, msg);

    // ─── Fun ──────────────────────────────────────────────────
    case 'joke':      return handleJoke(token, msg);
    case 'quote':     return handleQuote(token, msg);
    case 'dice': case 'roll': return handleDice(token, msg, args);
    case '8ball':     return handleEightBall(token, msg, args);
    case 'poll':      return handlePoll(token, msg, args);

    default:
      if (msg.chat.type === 'private')
        return sendMessage(token, cid,
          `❓ Unknown command \`/${cmd}\`.\n\nType /help to see all 45+ commands.`,
          { replyMarkup: inlineKeyboard([[{ text: '📋 Help', data: 'help' }, { text: '🏠 Home', data: 'home' }]]) }
        );
  }
}

// ─── AI Handlers ──────────────────────────────────────────────────────────────

async function handleAsk(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const q = args.join(' ').trim();
  if (!q) return sendMessage(token, cid, '💬 Usage: `/ask <your question>`\n\nExample: `/ask how does WASM memory management work?`');
  await incrementStat(state, 'ai_calls');
  const { result, elapsed, msgId } = await withLoader(token, cid, 'general', () => askAI(env, q));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again in a moment.');
  return sendSmartResponse(token, cid, result, state, 'answer', msg, msgId);
}

async function handleResearch(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const q = args.join(' ').trim();
  if (!q) return sendMessage(token, cid,
    '🔍 *Research Mode*\n\nUsage: `/research <topic>`\n\nExamples:\n`/research latest React 19 features`\n`/research best vector database 2025`\n`/research how does WASM memory work`\n\nSearches the web for real-time answers.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'research', () => researchAndAnswer(env, q));
  if (!result) return sendMessage(token, cid, '⚠️ Research failed. Try again.');
  return sendSmartResponse(token, cid, result, state, 'research', msg, msgId);
}

async function handleAgent(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const task = args.join(' ').trim();
  if (!task) return sendMessage(token, cid,
    '🤖 *Agent Mode*\n\nUsage: `/agent <complex task>`\n\nFor big multi-step tasks:\n`/agent build a full auth system with JWT + refresh tokens in Node.js`\n`/agent create a Python web scraper with rate limiting`\n`/agent design a distributed task queue with Redis`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'agent', () => agentSolve(env, task));
  if (!result) return sendMessage(token, cid, '⚠️ Agent failed. Try again.');
  return sendSmartResponse(token, cid, result, state, task, msg, msgId);
}

async function handleModelStatus(token, msg) {
  const info = getModelInfo();
  return sendMessage(token, msg.chat.id,
    `*🤖 AI Engine Status*\n\n*Coding:* ${info.primary}\n*Research:* ${info.research}\n*Reasoning:* ${info.reasoning}\n*Speed:* ${info.speed}\n*Context:* ${info.context}\n*Strategy:* ${info.strategy}\n*Updated:* ${info.year}\n\n✅ All systems operational`,
    { replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]) }
  );
}

async function handleReview(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, '🔬 Usage: `/review <your code>`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'review', () => reviewCode(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'code_review', msg, msgId);
}

async function handleExplain(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const concept = args.join(' ').trim();
  if (!concept) return sendMessage(token, cid, '🧠 Usage: `/explain <concept>`\n\nExamples: `/explain closures`, `/explain CAP theorem`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'explain', () => explainConcept(env, concept));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'explanation', msg, msgId);
}

async function handleFix(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, '🔧 Usage: `/fix <broken code>`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'fix', () => fixCode(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'fixed_code', msg, msgId);
}

async function handleGenerate(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid, '⚡ Usage: `/generate <what to build>`\n\nExamples:\n`/generate REST API with Node.js + JWT auth`\n`/generate React todo app with Zustand`\n`/generate binary search tree in Python`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'generate', () => generateCode(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, desc, msg, msgId);
}

async function handleSummarize(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const text = args.join(' ').trim();
  if (!text) return sendMessage(token, cid, '📋 Usage: `/summarize <text>`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'general', () => summarizeText(env, text));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'summary', msg, msgId);
}

async function handleTranslate(token, msg, env, state, args) {
  const cid = msg.chat.id;
  if (args.length < 2) return sendMessage(token, cid, '🌐 Usage: `/translate <language> <text>`\n\nExample: `/translate Bengali Hello world`');
  const [targetLang, ...rest] = args;
  const text = rest.join(' ').trim();
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'convert', () => translateText(env, text, targetLang));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'translation', msg, msgId);
}

async function handleDebug(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const input = args.join(' ').trim();
  if (!input) return sendMessage(token, cid, '🐛 Usage: `/debug <code> | <error message>`\n\nSeparate code and error with a pipe |');
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
  if (!code) return sendMessage(token, cid, '🚀 Usage: `/optimize <your code>`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'optimize', () => optimizeCode(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'optimized_code', msg, msgId);
}

async function handleTest(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, '🧪 Usage: `/test <your code>`\n\nGenerates unit + integration tests.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'test', () => generateTests(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'tests', msg, msgId);
}

async function handleDocs(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, '📝 Usage: `/docs <your code>`\n\nGenerates full documentation.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'docs', () => generateDocumentation(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'documentation', msg, msgId);
}

async function handleConvert(token, msg, env, state, args) {
  const cid = msg.chat.id;
  if (args.length < 3) return sendMessage(token, cid, '🔄 Usage: `/convert <from> <to> <code>`\n\nExample: `/convert python javascript def add(a,b): return a+b`');
  const [from, to, ...rest] = args;
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'convert', () => convertCode(env, rest.join(' '), from, to));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, `${from}_to_${to}`, msg, msgId);
}

async function handleComplexity(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, '📊 Usage: `/complexity <your code>`\n\nAnalyzes time + space complexity with optimizations.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'review', () => analyzeComplexity(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'complexity', msg, msgId);
}

async function handleSecurity(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid, '🛡️ Usage: `/security <your code>`\n\nFull OWASP security audit.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'security', () => securityAudit(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'security_audit', msg, msgId);
}

async function handleRegexGen(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid, '🔍 Usage: `/regex <what to match>`\n\nExample: `/regex email addresses`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'coding', () => generateRegex(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'regex', msg, msgId);
}

async function handleSQL(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid, '🗃️ Usage: `/sql <what you need>`\n\nExample: `/sql find top 10 users by order count with pagination`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'coding', () => generateSQL(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'query', msg, msgId);
}

async function handleAPIGen(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid, '🔌 Usage: `/api <what to build>`\n\nExample: `/api user auth REST API with JWT + refresh tokens`');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'coding', () => generateAPI(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'api', msg, msgId);
}

async function handleLandingPage(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid,
    `🎨 *Landing Page Builder*\n\nUsage: \`/landing <description>\`\n\nExamples:\n\`/landing SaaS app for project management\`\n\`/landing portfolio for a photographer\`\n\`/landing food delivery startup\`\n\nGenerates a complete, beautiful HTML file ready to host anywhere.`
  );
  await incrementStat(state, 'ai_calls');
  const { result: html, elapsed } = await withLoader(token, cid, 'landing', () => generateLandingPage(env, desc));
  if (!html) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  await incrementStat(state, 'files_sent');
  const filename = buildFileName(desc, 'html');
  await sendDocument(token, cid, filename, html,
    `✅ Landing page ready! _(${elapsed}s)_\n\n🌐 Open in browser or drop on Netlify/Vercel.\n\n_For: ${desc.slice(0, 80)}_`,
    'text/html'
  );
}

// ─── NEW v3.0 Premium Handlers ────────────────────────────────────────────────

async function handleArchitect(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid,
    '🏗️ *System Architect*\n\nUsage: `/architect <system description>`\n\nExamples:\n`/architect real-time chat app for 1M users`\n`/architect e-commerce platform with microservices`\n\nDelivers: architecture diagram, tech stack, DB schema, API contract, scaling strategy.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'architect', () => architectSystem(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'architecture', msg, msgId);
}

async function handleDeploy(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid,
    '🚀 *Deploy Config Generator*\n\nUsage: `/deploy <your app>`\n\nExamples:\n`/deploy Node.js Express API with PostgreSQL`\n`/deploy Python FastAPI app`\n\nGenerates: Dockerfile, docker-compose, GitHub Actions CI/CD pipeline.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'deploy', () => generateDeployScript(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'deploy', msg, msgId);
}

async function handleInterview(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const topic = args.join(' ').trim();
  if (!topic) return sendMessage(token, cid,
    '🎯 *Interview Prep*\n\nUsage: `/interview <topic>`\n\nExamples:\n`/interview React hooks`\n`/interview system design`\n`/interview algorithms and data structures`\n\nGenerates: top questions, answers with code, gotchas, cheat sheet.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'interview', () => interviewPrep(env, topic));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, `interview_${topic}`, msg, msgId);
}

async function handleDiff(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const input = args.join(' ').trim();
  const parts = input.split('|||');
  if (parts.length < 2) return sendMessage(token, cid,
    '↔️ *Code Diff Analyzer*\n\nUsage: `/diff <code1> ||| <code2>`\n\nSeparate the two code versions with `|||`\n\nAnalyzes: what changed, improvements, regressions, breaking changes, recommendation.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'diff', () => codeDiff(env, parts[0].trim(), parts[1].trim()));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'diff_analysis', msg, msgId);
}

async function handleBrainstorm(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const idea = args.join(' ').trim();
  if (!idea) return sendMessage(token, cid,
    '💡 *Brainstorm Mode*\n\nUsage: `/brainstorm <your idea>`\n\nExamples:\n`/brainstorm AI-powered code review tool`\n`/brainstorm developer productivity SaaS`\n\nGenerates: 10 feature ideas, 5 tech approaches, monetization, risks, MVP roadmap.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'brainstorm', () => brainstorm(env, idea));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'brainstorm', msg, msgId);
}

async function handleCommit(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const diff = args.join(' ').trim();
  if (!diff) return sendMessage(token, cid,
    '📝 *Git Commit Generator*\n\nUsage: `/commit <describe what changed>`\n\nExample: `/commit added JWT auth middleware, fixed token refresh logic, updated user model`\n\nGenerates conventional commit messages.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'commit', () => generateGitCommit(env, diff));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendMessage(token, cid, `📝 *Commit Message*\n\n\`\`\`\n${result}\n\`\`\``, { replyToMessageId: msg.message_id });
}

async function handleErrorExplain(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const error = args.join(' ').trim();
  if (!error) return sendMessage(token, cid,
    '💥 *Error Explainer*\n\nUsage: `/error <paste your error here>`\n\nExplains: what it means, causes, step-by-step fix, how to prevent it.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'error', () => explainError(env, error));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'error_analysis', msg, msgId);
}

async function handleReadme(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid,
    '📄 *README Generator*\n\nUsage: `/readme <project description>`\n\nExample: `/readme REST API for a task manager built with Node.js + PostgreSQL`\n\nGenerates complete professional README.md.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'readme', () => generateReadme(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'README', msg, msgId);
}

async function handlePerf(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid,
    '⚡ *Performance Analyzer*\n\nUsage: `/perf <your code>`\n\nAnalyzes: CPU hotspots, memory patterns, I/O bottlenecks, optimization with benchmarks.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'perf', () => performanceAnalysis(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'perf_analysis', msg, msgId);
}

async function handleRefactor(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const code = args.join(' ').trim();
  if (!code) return sendMessage(token, cid,
    '♻️ *Code Refactorer*\n\nUsage: `/refactor <your code>`\n\nApplies: SOLID, DRY, design patterns, better naming, proper types, split complex functions.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'refactor', () => refactorCode(env, code));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'refactored_code', msg, msgId);
}

async function handleSchema(token, msg, env, state, args) {
  const cid = msg.chat.id;
  const desc = args.join(' ').trim();
  if (!desc) return sendMessage(token, cid,
    '🗃️ *Database Schema Designer*\n\nUsage: `/schema <what to model>`\n\nExample: `/schema e-commerce app with users, products, orders, reviews`\n\nGenerates: SQL schema, Drizzle ORM, indexes, relationships, sample queries.');
  await incrementStat(state, 'ai_calls');
  const { result, msgId } = await withLoader(token, cid, 'schema', () => generateSchema(env, desc));
  if (!result) return sendMessage(token, cid, '⚠️ AI unavailable. Try again.');
  return sendSmartResponse(token, cid, result, state, 'schema', msg, msgId);
}

// ─── Smart Response ────────────────────────────────────────────────────────────

async function sendSmartResponse(token, chatId, content, state, hint, msg, loaderMsgId) {
  if (needsFile(content)) {
    const ext = detectFileType(content, hint);
    const filename = buildFileName(hint, ext);
    await incrementStat(state, 'files_sent');
    return sendDocument(token, chatId, filename, content,
      `📎 *${filename}*\n\n_Delivered by Salman Dev Bot_`,
      getMimeType(ext)
    );
  }
  return sendMessage(token, chatId, content, { replyToMessageId: msg?.message_id });
}

// Free-form AI chat (private or @mention)
async function handleAIChat(msg, env, state, text) {
  const token = env.BOT_TOKEN || BOT_TOKEN;
  const cid = msg.chat.id;
  const userId = msg.from?.id;
  if (!text.trim()) return;
  await incrementStat(state, 'ai_calls');
  const { result } = await withLoader(token, cid, 'general', () => chatWithMemory(env, userId, text, state));
  if (!result) return;
  return sendSmartResponse(token, cid, result, state, 'response', msg, null);
}

// ─── /start ───────────────────────────────────────────────────────────────────

async function handleStart(token, msg) {
  const cid = msg.chat.id;
  const name = msg.from?.first_name || 'developer';
  const isGroup = msg.chat.type !== 'private';

  if (isGroup) {
    return sendMessage(token, cid,
      `*Hey ${name}!* 👋 Mention me or reply to chat.\n/help for all 45+ commands.`);
  }

  return sendMessage(token, cid,
    `*Hey ${name}!* 🤖✨\n\nI'm your AI coding agent — running 2025/2026 models with live web search, full agent mode, and 45+ commands.\n\n⚡ *Ultra-fast* — Turbo Race™ fires multiple AI models in parallel, returns in seconds\n🧠 *Memory* — remembers full conversation context\n🌐 *Web search* — Groq Compound searches the internet live\n\nJust type what you need or pick a command below.`,
    {
      replyMarkup: inlineKeyboard([
        [{ text: '🤖 AI Commands', data: 'menu:ai' }, { text: '⚡ Power Tools', data: 'menu:power' }],
        [{ text: '🆕 New in v3.0', data: 'menu:new' }, { text: '🔧 Dev Tools', data: 'menu:tools' }],
        [{ text: '🔍 Research', data: 'menu:research' }, { text: '🎨 Landing Page', data: 'menu:landing' }],
        [{ text: '📋 All Commands', data: 'help' }],
      ]),
    }
  );
}

// ─── /help ────────────────────────────────────────────────────────────────────

async function handleHelp(token, msg) {
  const cid = msg.chat.id;
  return sendMessage(token, cid, getHelpText(), {
    replyMarkup: inlineKeyboard([
      [{ text: '🤖 AI', data: 'menu:ai' }, { text: '⚡ Power', data: 'menu:power' }],
      [{ text: '🆕 New v3.0', data: 'menu:new' }, { text: '🔧 Tools', data: 'menu:tools' }],
      [{ text: '🏠 Home', data: 'home' }],
    ]),
  });
}

function getHelpText() {
  return `*🤖 Salman Dev Bot v3.0 — Commands*

*Core AI*
/ask · /generate · /review · /explain · /fix
/summarize · /translate

*Research & Agent*
/research — Live web search + answer
/agent — Complex multi-step task solver
/models — AI engine status

*Power Commands*
/debug · /optimize · /test · /docs
/convert · /complexity · /security · /regex
/sql · /api

*🆕 New in v3.0*
/architect — System design + architecture
/deploy — Dockerfile + CI/CD pipeline
/interview — Interview prep guide
/diff — Compare two code versions
/brainstorm — Feature ideas + roadmap
/commit — Generate git commit messages
/error — Explain any error
/readme — Generate README.md
/perf — Performance analysis
/refactor — Clean code refactoring
/schema — Database schema designer

*Landing Page*
/landing — Generate complete HTML file

*Dev Tools*
/json · /hash · /uuid · /encode · /decode
/calc · /password · /snippet · /color
/timestamp · /urlencode · /urldecode · /ping

*Fun*
/joke · /quote · /dice · /8ball · /poll

*Other*
/stats · /lang · /terms · /help

_45+ commands · Type anything in DM — I remember context_`;
}

// ─── /lang ────────────────────────────────────────────────────────────────────

async function handleLangMenu(token, state, msg, args, lang) {
  const cid = msg.chat.id;
  const langs = { en: '🇺🇸 English', es: '🇪🇸 Español', fr: '🇫🇷 Français', de: '🇩🇪 Deutsch', pt: '🇧🇷 Português', ru: '🇷🇺 Russian', zh: '🇨🇳 中文', ar: '🇸🇦 العربية' };
  if (args[0] && langs[args[0].toLowerCase()]) {
    await setUserLang(state, msg.from.id, args[0].toLowerCase());
    return sendMessage(token, cid, `✅ Language set to ${langs[args[0].toLowerCase()]}`);
  }
  const rows = Object.entries(langs).map(([code, label]) => [{ text: label, data: `lang:${code}` }]);
  return sendMessage(token, cid, `🌍 *Language Settings*\n\nCurrent: *${langs[lang] || langs.en}*\n\nChoose your language:`,
    { replyMarkup: inlineKeyboard(rows) });
}

// ─── /stats ───────────────────────────────────────────────────────────────────

async function handleStats(token, msg, state) {
  const cid = msg.chat.id;
  const stats = await getStats(state);
  return sendMessage(token, cid,
    `*📊 Bot Statistics*\n\n` +
    `Messages: \`${stats.messages || 0}\`\n` +
    `Commands: \`${stats.commands || 0}\`\n` +
    `AI Calls: \`${stats.ai_calls || 0}\`\n` +
    `Files Sent: \`${stats.files_sent || 0}\`\n\n` +
    `_Powered by Salman Dev Bot v3.0_`,
    { replyMarkup: inlineKeyboard([[{ text: '🏠 Home', data: 'home' }]]) }
  );
}

// ─── Callback Handler ─────────────────────────────────────────────────────────

async function handleCallback(query, env, state) {
  const token = env.BOT_TOKEN || BOT_TOKEN;
  const data = query.data;
  const chatId = query.message?.chat?.id;
  const msgId = query.message?.message_id;

  if (['uuid:new', 'ts:now', 'ping'].includes(data) || data.startsWith('pwd:') || data.startsWith('snippet:') || data.startsWith('tool:'))
    return handleToolsCallback(token, query);

  if (data.startsWith('joke:') || data.startsWith('quote:') || data.startsWith('dice:') || data.startsWith('8ball:'))
    return handleFunCallback(token, query);

  if (data.startsWith('lang:')) {
    const langCode = data.split(':')[1];
    await setUserLang(state, query.from.id, langCode);
    await answerCallbackQuery(token, query.id, `Language updated!`);
    return;
  }

  await answerCallbackQuery(token, query.id);

  const menus = {
    'menu:ai': `*🤖 AI Commands*\n\n/ask — Ask anything\n/generate — Generate code\n/review — Code review\n/explain — Explain concepts\n/fix — Fix broken code\n/summarize — Summarize text\n/translate — Translate to any language`,
    'menu:power': `*⚡ Power Commands*\n\n/debug — Debug with error trace\n/optimize — Optimize code\n/test — Generate unit tests\n/docs — Generate documentation\n/convert — Convert between languages\n/complexity — Big O analysis\n/security — Security audit\n/regex — Build regex patterns\n/sql — Generate SQL queries\n/api — Build REST APIs`,
    'menu:new': `*🆕 New in v3.0*\n\n/architect — Full system design\n/deploy — Dockerfile + CI/CD\n/interview — Interview prep guide\n/diff — Compare code versions\n/brainstorm — Ideas + MVP roadmap\n/commit — Git commit generator\n/error — Error explainer\n/readme — README generator\n/perf — Performance analysis\n/refactor — Clean code refactoring\n/schema — Database schema designer`,
    'menu:research': `*🔍 Research & Agent*\n\n/research — Live web search + answer\n(Groq Compound searches the internet in real-time)\n\n/agent — Complex multi-step solver\n(Plans + executes multi-part tasks)\n\n/models — View AI engine status`,
    'menu:landing': `*🎨 Landing Page Builder*\n\nUsage: \`/landing <description>\`\n\nExamples:\n\`/landing SaaS for project management\`\n\`/landing portfolio for a designer\`\n\`/landing food delivery startup\`\n\nDelivers complete HTML file — host on Netlify/Vercel in 1 click.`,
    'menu:tools': `*🔧 Developer Tools*\n\n/json — Format & validate JSON\n/hash — SHA-256 hash\n/uuid — Generate UUIDs\n/encode & /decode — Base64\n/calc — Calculator\n/password — Password generator\n/snippet — Code snippets (10 languages)\n/color — Color converter\n/timestamp — Unix timestamp\n/urlencode & /urldecode\n/ping — Latency check`,
    'help': getHelpText(),
    'home': `*🤖 Salman Dev Bot v3.0*\n\nYour AI coding agent — 2025/2026 models, live web search, 45+ commands.\n\n⚡ *Turbo Race™* — fires all models in parallel\n🧠 *Memory* — full context per user\n🌐 *Live search* — Groq Compound\n\nType anything or use a command below.`,
  };

  const replyMarkup = inlineKeyboard([
    [{ text: '🤖 AI', data: 'menu:ai' }, { text: '⚡ Power', data: 'menu:power' }],
    [{ text: '🆕 New v3.0', data: 'menu:new' }, { text: '🔧 Tools', data: 'menu:tools' }],
    [{ text: '🔍 Research', data: 'menu:research' }, { text: '🎨 Landing', data: 'menu:landing' }],
    [{ text: '📋 All Commands', data: 'help' }],
  ]);

  const text = menus[data];
  if (text) {
    return editMessageText(token, chatId, msgId, text, { replyMarkup });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function htmlRes(html) {
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function getTermsText() {
  return `*Terms of Use*\n\n1. For development assistance only.\n2. No illegal, harmful, or malicious use.\n3. Generated code is as-is — review before production.\n4. We store: stats + language prefs. No personal data sold.\n5. Uses OpenRouter and Groq APIs for AI inference.\n6. Service may have rate limits or downtime.\n\nCreated by Md Salman Biswas.`;
}

// ─── PREMIUM DASHBOARD HTML ───────────────────────────────────────────────────

function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salman Dev Bot — AI Coding Agent</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #050508;
      --surface: #0d0d14;
      --surface2: #13131e;
      --border: #1a1a2e;
      --border2: #252540;
      --accent: #818cf8;
      --accent2: #22d3ee;
      --accent3: #a78bfa;
      --green: #34d399;
      --orange: #fb923c;
      --pink: #f472b6;
      --text: #f1f5f9;
      --muted: #64748b;
      --muted2: #94a3b8;
      --mono: 'JetBrains Mono', monospace;
      --r: 12px;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ── Canvas BG ── */
    #canvas-bg {
      position: fixed; inset: 0; z-index: 0;
      pointer-events: none;
    }

    /* ── Ambient glows ── */
    .glow-orb {
      position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
      filter: blur(80px);
      animation: orb-drift 20s ease-in-out infinite;
    }
    .glow-orb-1 { width: 700px; height: 700px; top: -200px; right: -200px; background: radial-gradient(circle, rgba(129,140,248,0.08), transparent 60%); }
    .glow-orb-2 { width: 600px; height: 600px; bottom: -200px; left: -200px; background: radial-gradient(circle, rgba(34,211,238,0.06), transparent 60%); animation-delay: -10s; }
    .glow-orb-3 { width: 400px; height: 400px; top: 40%; left: 40%; background: radial-gradient(circle, rgba(167,139,250,0.05), transparent 60%); animation-delay: -5s; }

    @keyframes orb-drift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -30px) scale(1.05); }
      66% { transform: translate(-20px, 20px) scale(0.95); }
    }

    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }

    /* ── Nav ── */
    nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 0;
      border-bottom: 1px solid var(--border);
      position: sticky; top: 0;
      background: rgba(5,5,8,0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 100;
    }
    .nav-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; width: 100%; display: flex; align-items: center; justify-content: space-between; }
    .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, var(--accent), var(--accent3));
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      box-shadow: 0 0 20px rgba(129,140,248,0.3);
    }
    .logo-text { font-weight: 800; font-size: 17px; letter-spacing: -0.5px; color: var(--text); }
    .logo-text span { color: var(--accent); }
    .nav-links { display: flex; align-items: center; gap: 32px; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
    .nav-links a:hover { color: var(--text); }
    .status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.2);
      color: var(--green); font-size: 12px; padding: 5px 12px; border-radius: 100px;
      font-family: var(--mono); font-weight: 500;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse-dot 2s infinite; }
    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

    /* ── Hero ── */
    .hero {
      padding: 100px 0 80px;
      text-align: center;
    }

    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(129,140,248,0.08);
      border: 1px solid rgba(129,140,248,0.2);
      color: var(--accent); font-size: 13px; font-weight: 500;
      padding: 6px 16px; border-radius: 100px;
      margin-bottom: 28px;
      animation: fade-in-up 0.6s ease both;
    }

    h1 {
      font-size: clamp(42px, 7vw, 80px);
      font-weight: 900; letter-spacing: -3px; line-height: 1.0;
      margin-bottom: 20px;
      animation: fade-in-up 0.6s 0.1s ease both;
    }
    .grad-text {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 50%, var(--accent3) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-sub {
      color: var(--muted2); font-size: 18px; line-height: 1.7; max-width: 560px;
      margin: 0 auto 40px; font-weight: 400;
      animation: fade-in-up 0.6s 0.2s ease both;
    }

    .cta-row {
      display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
      animation: fade-in-up 0.6s 0.3s ease both;
    }

    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 13px 26px; border-radius: 10px;
      font-size: 15px; font-weight: 600; text-decoration: none;
      transition: all 0.25s cubic-bezier(0.4,0,0.2,1); cursor: pointer; border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent), var(--accent3));
      color: #fff;
      box-shadow: 0 0 30px rgba(129,140,248,0.25), 0 4px 15px rgba(0,0,0,0.3);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(129,140,248,0.35), 0 8px 25px rgba(0,0,0,0.4); }
    .btn-secondary {
      background: var(--surface2); color: var(--text);
      border: 1px solid var(--border2);
    }
    .btn-secondary:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-1px); }

    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Speed Badge ── */
    .speed-strip {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin: 48px 0;
      padding: 14px 24px;
      background: rgba(251,146,60,0.06);
      border: 1px solid rgba(251,146,60,0.15);
      border-radius: var(--r);
      max-width: 500px; margin: 48px auto;
      animation: fade-in-up 0.6s 0.4s ease both;
    }
    .speed-strip span { font-family: var(--mono); font-size: 13px; color: var(--orange); }
    .speed-strip strong { color: var(--text); font-family: var(--mono); }

    /* ── Stats ── */
    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px; overflow: hidden;
      margin: 60px 0;
    }
    .stat-cell {
      padding: 28px 20px; text-align: center;
      border-right: 1px solid var(--border);
      transition: background 0.2s;
    }
    .stat-cell:last-child { border-right: none; }
    .stat-cell:hover { background: var(--surface2); }
    .stat-num {
      font-size: 36px; font-weight: 800; font-family: var(--mono);
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; line-height: 1;
    }
    .stat-label { font-size: 12px; color: var(--muted); margin-top: 6px; font-weight: 500; }

    /* ── Section ── */
    .section { padding: 80px 0; }
    .section-tag {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(129,140,248,0.08); border: 1px solid rgba(129,140,248,0.15);
      color: var(--accent); font-size: 12px; font-weight: 600;
      padding: 4px 12px; border-radius: 100px; letter-spacing: 0.05em;
      text-transform: uppercase; font-family: var(--mono);
      margin-bottom: 12px;
    }
    .section-title h2 {
      font-size: clamp(28px, 4vw, 42px); font-weight: 800;
      letter-spacing: -1.5px; margin-bottom: 8px;
    }
    .section-title p { color: var(--muted2); font-size: 17px; }

    /* ── Feature Cards ── */
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1px; background: var(--border); border-radius: 16px; overflow: hidden; }
    .feature-card {
      background: var(--surface);
      padding: 28px;
      transition: background 0.25s;
      position: relative; overflow: hidden;
    }
    .feature-card::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      opacity: 0; transition: opacity 0.25s;
    }
    .feature-card:hover { background: var(--surface2); }
    .feature-card:hover::before { opacity: 0.03; }
    .feature-icon {
      font-size: 32px; margin-bottom: 14px;
      display: inline-block;
      animation: float 4s ease-in-out infinite;
    }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    .feature-card:nth-child(2) .feature-icon { animation-delay: -1s; }
    .feature-card:nth-child(3) .feature-icon { animation-delay: -2s; }
    .feature-card:nth-child(4) .feature-icon { animation-delay: -3s; }
    .feature-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .feature-card p { font-size: 14px; color: var(--muted2); line-height: 1.6; }

    /* ── New Features Badge ── */
    .new-tag {
      display: inline-block; background: linear-gradient(135deg, var(--accent3), var(--pink));
      color: #fff; font-size: 10px; font-weight: 700;
      padding: 2px 7px; border-radius: 100px; margin-left: 6px;
      vertical-align: middle; letter-spacing: 0.05em;
      font-family: var(--mono);
    }

    /* ── Command Pills ── */
    .cmd-section { margin-top: 40px; }
    .cmd-group { margin-bottom: 28px; }
    .cmd-group-label {
      font-size: 11px; font-weight: 700; color: var(--muted);
      text-transform: uppercase; letter-spacing: 0.1em;
      font-family: var(--mono);
      margin-bottom: 10px;
      display: flex; align-items: center; gap: 8px;
    }
    .cmd-group-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .cmd-pills { display: flex; flex-wrap: wrap; gap: 8px; }
    .cmd-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 8px 14px;
      transition: all 0.2s;
    }
    .cmd-pill:hover { border-color: var(--accent); transform: translateY(-1px); background: var(--surface2); }
    .cmd-pill .cmd-name { font-family: var(--mono); font-size: 13px; color: var(--accent); font-weight: 500; }
    .cmd-pill .cmd-desc { font-size: 11px; color: var(--muted); }

    /* ── Models ── */
    .models-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .model-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--r); padding: 20px;
      transition: all 0.25s;
    }
    .model-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
    .model-type {
      font-size: 10px; font-weight: 700; font-family: var(--mono);
      text-transform: uppercase; letter-spacing: 0.1em;
      margin-bottom: 8px; padding: 3px 8px; border-radius: 4px;
      display: inline-block;
    }
    .model-card h3 { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
    .model-card p { font-size: 13px; color: var(--muted2); line-height: 1.5; }

    /* ── Terminal Preview ── */
    .terminal {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .terminal-header {
      padding: 12px 16px; display: flex; align-items: center; gap: 8px;
      border-bottom: 1px solid var(--border);
      background: var(--surface2);
    }
    .term-dot { width: 12px; height: 12px; border-radius: 50%; }
    .term-dot-r { background: #ff5f57; }
    .term-dot-y { background: #febc2e; }
    .term-dot-g { background: #28c840; }
    .terminal-title { font-size: 13px; color: var(--muted); font-family: var(--mono); margin-left: 8px; }
    .terminal-body { padding: 20px 24px; font-family: var(--mono); font-size: 13px; line-height: 1.8; }
    .term-prompt { color: var(--accent); }
    .term-cmd { color: var(--text); }
    .term-out { color: var(--muted2); }
    .term-success { color: var(--green); }
    .term-accent { color: var(--accent2); }
    .term-cursor { display: inline-block; width: 8px; height: 14px; background: var(--accent); animation: blink 1s step-end infinite; vertical-align: middle; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

    /* ── Sticker Section ── */
    .sticker-row {
      display: flex; flex-wrap: wrap; gap: 12px;
      justify-content: center; margin: 32px 0;
    }
    .sticker {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 100px; padding: 8px 16px;
      font-size: 14px; font-weight: 500;
      transition: all 0.2s;
    }
    .sticker:hover { transform: scale(1.05); border-color: var(--accent); box-shadow: 0 0 20px rgba(129,140,248,0.15); }
    .sticker span { font-size: 18px; }

    /* ── CTA Section ── */
    .cta-section {
      text-align: center; padding: 80px 0;
      background: radial-gradient(ellipse at center, rgba(129,140,248,0.05), transparent 70%);
    }
    .cta-section h2 { font-size: clamp(28px, 4vw, 48px); font-weight: 800; letter-spacing: -1.5px; margin-bottom: 12px; }
    .cta-section p { color: var(--muted2); font-size: 17px; margin-bottom: 32px; }

    /* ── Footer ── */
    footer {
      border-top: 1px solid var(--border);
      padding: 32px 0; text-align: center;
      color: var(--muted); font-size: 13px;
    }
    footer a { color: var(--accent); text-decoration: none; }
    footer a:hover { color: var(--text); }
    .footer-links { display: flex; justify-content: center; gap: 24px; margin-bottom: 12px; }

    /* ── Scroll reveal ── */
    .reveal { opacity: 0; transform: translateY(30px); transition: all 0.6s cubic-bezier(0.4,0,0.2,1); }
    .reveal.visible { opacity: 1; transform: translateY(0); }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .nav-links { display: none; }
      h1 { letter-spacing: -2px; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .hero { padding: 60px 0 40px; }
    }
  </style>
</head>
<body>
  <!-- Particle canvas -->
  <canvas id="canvas-bg"></canvas>

  <!-- Ambient glows -->
  <div class="glow-orb glow-orb-1"></div>
  <div class="glow-orb glow-orb-2"></div>
  <div class="glow-orb glow-orb-3"></div>

  <!-- Nav -->
  <nav>
    <div class="nav-inner">
      <a href="/" class="logo">
        <div class="logo-icon">🤖</div>
        <div class="logo-text">Salman<span>Dev</span></div>
      </a>
      <div class="nav-links">
        <a href="#features">Features</a>
        <a href="#commands">Commands</a>
        <a href="#models">Models</a>
        <a href="/terms">Terms</a>
      </div>
      <div class="status-badge"><div class="status-dot"></div> Live</div>
    </div>
  </nav>

  <!-- Hero -->
  <div class="container">
    <div class="hero">
      <div class="hero-eyebrow">
        ⚡ Turbo Race™ · 2025/2026 Models · Live Web Search
      </div>
      <h1>
        Your AI Dev<br><span class="grad-text">Coding Agent</span>
      </h1>
      <p class="hero-sub">
        45+ commands. Multiple AI models racing in parallel. Sub-3s responses. Full agent mode with live web search — built for developers who move fast.
      </p>
      <div class="cta-row">
        <a href="https://t.me/SalmanDevToolsBot" class="btn btn-primary" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.14 14.231l-2.98-.929c-.648-.203-.66-.648.136-.961l11.647-4.494c.54-.194 1.01.132.95.374z"/></svg>
          Open in Telegram
        </a>
        <a href="#commands" class="btn btn-secondary">View Commands</a>
      </div>

      <div class="speed-strip">
        <span>🚀</span>
        <strong>Turbo Race™:</strong>
        <span>fires 3 AI models simultaneously — fastest response wins</span>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid reveal">
      <div class="stat-cell"><div class="stat-num" data-count="8">0</div><div class="stat-label">AI Models</div></div>
      <div class="stat-cell"><div class="stat-num" data-count="45">0</div><div class="stat-label">Commands</div></div>
      <div class="stat-cell"><div class="stat-num">2M</div><div class="stat-label">Context Tokens</div></div>
      <div class="stat-cell"><div class="stat-num">~2s</div><div class="stat-label">Avg Response</div></div>
    </div>

    <!-- Sticker row -->
    <div class="sticker-row reveal">
      <div class="sticker"><span>⚡</span> Ultra Fast</div>
      <div class="sticker"><span>🧠</span> Memory Context</div>
      <div class="sticker"><span>🌐</span> Live Web Search</div>
      <div class="sticker"><span>🤖</span> Agent Mode</div>
      <div class="sticker"><span>📄</span> File Delivery</div>
      <div class="sticker"><span>🔒</span> Secure</div>
      <div class="sticker"><span>🆓</span> 100% Free</div>
    </div>

    <!-- Terminal Preview -->
    <div class="terminal reveal" style="margin: 0 0 80px; max-width: 700px; margin: 0 auto 80px;">
      <div class="terminal-header">
        <div class="term-dot term-dot-r"></div>
        <div class="term-dot term-dot-y"></div>
        <div class="term-dot term-dot-g"></div>
        <span class="terminal-title">Salman Dev Bot v3.0 — Live</span>
      </div>
      <div class="terminal-body" id="terminal-demo">
        <div><span class="term-prompt">you:</span> <span class="term-cmd">/landing SaaS for AI code review tool</span></div>
        <div style="margin-top:8px"><span class="term-out">🎨 Designing... </span><span class="term-accent">Qwen3 + DeepSeek racing</span></div>
        <div><span class="term-success">✅ Landing page ready! (2.4s)</span></div>
        <div style="margin-top:8px"><span class="term-prompt">you:</span> <span class="term-cmd">/architect real-time chat for 1M users</span></div>
        <div style="margin-top:4px"><span class="term-success">✅ Architecture complete! (1.8s)</span></div>
        <div><span class="term-out">→ ASCII diagram, tech stack, DB schema, scaling strategy</span></div>
        <div style="margin-top:8px"><span class="term-prompt">you:</span> <span class="term-cmd">/research latest Bun 1.2 features</span></div>
        <div style="margin-top:4px"><span class="term-accent">🌐 Groq Compound searching web...</span></div>
        <div><span class="term-success">✅ Research done! (3.1s) — live web results</span></div>
        <div style="margin-top:8px"><span class="term-prompt">›</span> <span class="term-cursor"></span></div>
      </div>
    </div>

    <!-- Features -->
    <div class="section" id="features">
      <div class="section-title reveal" style="margin-bottom: 40px;">
        <div class="section-tag">✦ Features</div>
        <h2>Everything a developer needs</h2>
        <p>Built fast, built right — no bloat, no limits</p>
      </div>
      <div class="features-grid reveal">
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Turbo Race™ Engine</h3>
          <p>Fires 3+ AI models simultaneously in parallel — the FIRST valid response wins. No waiting, no fallback delays. Pure speed.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🌐</div>
          <h3>Live Web Search</h3>
          <p>Groq Compound searches the internet in real-time. Get answers about latest frameworks, packages, and breaking changes from 2025/2026.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🧠</div>
          <h3>Conversation Memory</h3>
          <p>Remembers full context per user. Ask follow-up questions, iterate on code, build complex systems step by step over multiple messages.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <h3>Full Agent Mode</h3>
          <p>/agent for complex multi-step tasks. Plans, executes, and delivers complete solutions — entire apps, systems, and architectures.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎨</div>
          <h3>Landing Page Builder</h3>
          <p>Describe your product → complete, beautiful single-file HTML. Deploy to Netlify/Vercel in one click. Animations, responsive, production quality.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📁</div>
          <h3>Smart File Delivery</h3>
          <p>Output too long? Auto-delivered as .py/.js/.html/.ts/.md file. Zero truncation, always complete. Proper mime types and filenames.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🏗️</div>
          <h3>System Architect <span class="new-tag">NEW</span></h3>
          <p>Full architecture design: ASCII diagram, tech stack, DB schema, API contracts, scaling strategy, implementation roadmap.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>Interview Prep <span class="new-tag">NEW</span></h3>
          <p>Top questions + answers with code, common gotchas, system design questions, and a cheat sheet — for any tech topic.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💡</div>
          <h3>Brainstorm Mode <span class="new-tag">NEW</span></h3>
          <p>10 feature ideas, 5 tech approaches, monetization strategies, risk analysis, and a 90-day MVP roadmap for any idea.</p>
        </div>
      </div>
    </div>

    <!-- Commands -->
    <div class="section" id="commands">
      <div class="section-title reveal" style="margin-bottom: 40px;">
        <div class="section-tag">✦ Commands</div>
        <h2>45+ commands, all free</h2>
        <p>Everything at a slash</p>
      </div>
      <div class="cmd-section reveal">

        <div class="cmd-group">
          <div class="cmd-group-label">🤖 Core AI</div>
          <div class="cmd-pills">
            <div class="cmd-pill"><span class="cmd-name">/ask</span><span class="cmd-desc">Ask anything</span></div>
            <div class="cmd-pill"><span class="cmd-name">/generate</span><span class="cmd-desc">Generate code</span></div>
            <div class="cmd-pill"><span class="cmd-name">/review</span><span class="cmd-desc">Code review</span></div>
            <div class="cmd-pill"><span class="cmd-name">/explain</span><span class="cmd-desc">Explain concepts</span></div>
            <div class="cmd-pill"><span class="cmd-name">/fix</span><span class="cmd-desc">Fix broken code</span></div>
            <div class="cmd-pill"><span class="cmd-name">/translate</span><span class="cmd-desc">Translate text</span></div>
            <div class="cmd-pill"><span class="cmd-name">/summarize</span><span class="cmd-desc">Summarize text</span></div>
          </div>
        </div>

        <div class="cmd-group">
          <div class="cmd-group-label">🔍 Research & Agent</div>
          <div class="cmd-pills">
            <div class="cmd-pill"><span class="cmd-name">/research</span><span class="cmd-desc">Live web search</span></div>
            <div class="cmd-pill"><span class="cmd-name">/agent</span><span class="cmd-desc">Multi-step solver</span></div>
            <div class="cmd-pill"><span class="cmd-name">/models</span><span class="cmd-desc">AI engine status</span></div>
          </div>
        </div>

        <div class="cmd-group">
          <div class="cmd-group-label">⚡ Power Commands</div>
          <div class="cmd-pills">
            <div class="cmd-pill"><span class="cmd-name">/debug</span><span class="cmd-desc">Debug + error trace</span></div>
            <div class="cmd-pill"><span class="cmd-name">/optimize</span><span class="cmd-desc">Optimize code</span></div>
            <div class="cmd-pill"><span class="cmd-name">/test</span><span class="cmd-desc">Generate tests</span></div>
            <div class="cmd-pill"><span class="cmd-name">/docs</span><span class="cmd-desc">Documentation</span></div>
            <div class="cmd-pill"><span class="cmd-name">/security</span><span class="cmd-desc">Security audit</span></div>
            <div class="cmd-pill"><span class="cmd-name">/complexity</span><span class="cmd-desc">Big O analysis</span></div>
            <div class="cmd-pill"><span class="cmd-name">/convert</span><span class="cmd-desc">Convert languages</span></div>
            <div class="cmd-pill"><span class="cmd-name">/api</span><span class="cmd-desc">Build REST APIs</span></div>
            <div class="cmd-pill"><span class="cmd-name">/sql</span><span class="cmd-desc">Generate SQL</span></div>
          </div>
        </div>

        <div class="cmd-group">
          <div class="cmd-group-label">🆕 New in v3.0</div>
          <div class="cmd-pills">
            <div class="cmd-pill"><span class="cmd-name">/architect</span><span class="cmd-desc">System design</span></div>
            <div class="cmd-pill"><span class="cmd-name">/deploy</span><span class="cmd-desc">Dockerfile + CI/CD</span></div>
            <div class="cmd-pill"><span class="cmd-name">/interview</span><span class="cmd-desc">Interview prep</span></div>
            <div class="cmd-pill"><span class="cmd-name">/brainstorm</span><span class="cmd-desc">Ideas + roadmap</span></div>
            <div class="cmd-pill"><span class="cmd-name">/diff</span><span class="cmd-desc">Compare code</span></div>
            <div class="cmd-pill"><span class="cmd-name">/commit</span><span class="cmd-desc">Git commit msg</span></div>
            <div class="cmd-pill"><span class="cmd-name">/error</span><span class="cmd-desc">Explain error</span></div>
            <div class="cmd-pill"><span class="cmd-name">/readme</span><span class="cmd-desc">README generator</span></div>
            <div class="cmd-pill"><span class="cmd-name">/perf</span><span class="cmd-desc">Performance analysis</span></div>
            <div class="cmd-pill"><span class="cmd-name">/refactor</span><span class="cmd-desc">Clean code</span></div>
            <div class="cmd-pill"><span class="cmd-name">/schema</span><span class="cmd-desc">DB schema designer</span></div>
            <div class="cmd-pill"><span class="cmd-name">/landing</span><span class="cmd-desc">HTML page builder</span></div>
          </div>
        </div>

        <div class="cmd-group">
          <div class="cmd-group-label">🔧 Dev Tools</div>
          <div class="cmd-pills">
            <div class="cmd-pill"><span class="cmd-name">/json</span><span class="cmd-desc">Format JSON</span></div>
            <div class="cmd-pill"><span class="cmd-name">/hash</span><span class="cmd-desc">SHA-256</span></div>
            <div class="cmd-pill"><span class="cmd-name">/uuid</span><span class="cmd-desc">Generate UUIDs</span></div>
            <div class="cmd-pill"><span class="cmd-name">/encode</span><span class="cmd-desc">Base64</span></div>
            <div class="cmd-pill"><span class="cmd-name">/calc</span><span class="cmd-desc">Calculator</span></div>
            <div class="cmd-pill"><span class="cmd-name">/password</span><span class="cmd-desc">Password gen</span></div>
            <div class="cmd-pill"><span class="cmd-name">/snippet</span><span class="cmd-desc">Code snippets</span></div>
            <div class="cmd-pill"><span class="cmd-name">/color</span><span class="cmd-desc">Color converter</span></div>
            <div class="cmd-pill"><span class="cmd-name">/ping</span><span class="cmd-desc">Latency check</span></div>
          </div>
        </div>

      </div>
    </div>

    <!-- Models -->
    <div class="section" id="models">
      <div class="section-title reveal" style="margin-bottom: 40px;">
        <div class="section-tag">✦ AI Engine</div>
        <h2>2025/2026 Models</h2>
        <p>Auto-routes to best model per task. Turbo Race™ fires them in parallel.</p>
      </div>
      <div class="models-grid reveal">
        <div class="model-card" style="border-color: rgba(129,140,248,0.3);">
          <div class="model-type" style="background: rgba(129,140,248,0.1); color: var(--accent);">CODING</div>
          <h3>Qwen3 Coder Plus</h3>
          <p>1M context · 2025 SWE-bench SOTA · primary coding model</p>
        </div>
        <div class="model-card" style="border-color: rgba(34,211,238,0.3);">
          <div class="model-type" style="background: rgba(34,211,238,0.1); color: var(--accent2);">CODING</div>
          <h3>Kimi K2.5</h3>
          <p>1T params · Moonshot AI · elite coder + reasoning</p>
        </div>
        <div class="model-card" style="border-color: rgba(52,211,153,0.3);">
          <div class="model-type" style="background: rgba(52,211,153,0.1); color: var(--green);">RESEARCH</div>
          <h3>Groq Compound</h3>
          <p>Built-in live web search · real-time internet data · ultra fast</p>
        </div>
        <div class="model-card" style="border-color: rgba(251,146,60,0.3);">
          <div class="model-type" style="background: rgba(251,146,60,0.1); color: var(--orange);">REASONING</div>
          <h3>DeepSeek R1-0528</h3>
          <p>Chain-of-thought · best for debugging, analysis, complex reasoning</p>
        </div>
        <div class="model-card" style="border-color: rgba(244,114,182,0.3);">
          <div class="model-type" style="background: rgba(244,114,182,0.1); color: var(--pink);">SPEED</div>
          <h3>Groq Llama 4 + Qwen3</h3>
          <p>Sub-1s responses on Groq infrastructure · ultra-low latency</p>
        </div>
        <div class="model-card" style="border-color: rgba(167,139,250,0.3);">
          <div class="model-type" style="background: rgba(167,139,250,0.1); color: var(--accent3);">REASONING</div>
          <h3>Gemini 2.5 Pro</h3>
          <p>Google · 1M context · multimodal · deep reasoning fallback</p>
        </div>
      </div>
    </div>
  </div>

  <!-- CTA -->
  <div class="cta-section">
    <div class="container">
      <h2>Start building faster</h2>
      <p>Free forever. No signup. Just open Telegram and go.</p>
      <a href="https://t.me/SalmanDevToolsBot" class="btn btn-primary" target="_blank" rel="noopener" style="font-size: 16px; padding: 15px 32px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.14 14.231l-2.98-.929c-.648-.203-.66-.648.136-.961l11.647-4.494c.54-.194 1.01.132.95.374z"/></svg>
        Open @SalmanDevToolsBot
      </a>
    </div>
  </div>

  <!-- Footer -->
  <footer>
    <div class="container">
      <div class="footer-links">
        <a href="https://t.me/SalmanDevToolsBot" target="_blank">Telegram</a>
        <a href="https://github.com/salman-dev-app" target="_blank">GitHub</a>
        <a href="/terms">Terms</a>
      </div>
      <p>Created by <a href="https://github.com/salman-dev-app">Md Salman Biswas</a> · Salman Dev Bot v3.0 · Running on Cloudflare Workers</p>
    </div>
  </footer>

  <script>
    // ── Particle Canvas ──────────────────────────────────────────────────────
    const canvas = document.getElementById('canvas-bg');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.4 + 0.1;
        this.r = Math.random() * 1.5 + 0.5;
        this.color = Math.random() > 0.5 ? '129,140,248' : '34,211,238';
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + this.color + ',' + this.alpha + ')';
        ctx.fill();
      }
    }

    for (let i = 0; i < 80; i++) particles.push(new Particle());

    function animParticles() {
      ctx.clearRect(0, 0, W, H);
      // Draw lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(129,140,248,' + (0.06 * (1 - dist/120)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        particles[i].update();
        particles[i].draw();
      }
      requestAnimationFrame(animParticles);
    }
    animParticles();

    // ── Counter animation ─────────────────────────────────────────────────────
    function animateCounter(el, target) {
      let start = 0;
      const step = Math.ceil(target / 40);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        el.textContent = start + '+';
        if (start >= target) clearInterval(timer);
      }, 30);
    }

    // ── Scroll reveal ─────────────────────────────────────────────────────────
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          // Trigger counters
          e.target.querySelectorAll('[data-count]').forEach(el => {
            animateCounter(el, parseInt(el.dataset.count));
          });
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // ── Typed terminal effect ─────────────────────────────────────────────────
    const lines = [
      { cls: 'term-prompt', pre: 'you: ', text: '/landing SaaS for AI code review tool', cmd: true },
      { cls: 'term-out', text: '🎨 Designing... firing Qwen3 + DeepSeek simultaneously' },
      { cls: 'term-success', text: '✅ Landing page ready in 2.4s — HTML file delivered' },
      { cls: 'term-prompt', pre: 'you: ', text: '/architect real-time chat for 1M users', cmd: true },
      { cls: 'term-success', text: '✅ Architecture complete in 1.8s' },
      { cls: 'term-out', text: '→ ASCII diagram, tech stack, DB schema, scaling strategy' },
      { cls: 'term-prompt', pre: 'you: ', text: '/research latest Bun 1.2 features', cmd: true },
      { cls: 'term-accent', text: '🌐 Groq Compound searching the web in real-time...' },
      { cls: 'term-success', text: '✅ Research done in 3.1s — live web results included' },
    ];
  </script>
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
    body { font-family: 'Inter', sans-serif; background: #050508; color: #f1f5f9; min-height: 100vh; }
    .container { max-width: 700px; margin: 0 auto; padding: 60px 24px; }
    a { color: #818cf8; text-decoration: none; }
    a:hover { color: #f1f5f9; }
    nav { margin-bottom: 48px; }
    nav a { color: #64748b; font-size: 14px; }
    nav a:hover { color: #f1f5f9; }
    h1 { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
    .meta { color: #64748b; font-size: 14px; margin-bottom: 40px; }
    h2 { font-size: 18px; font-weight: 700; margin: 32px 0 12px; color: #a5b4fc; }
    p, li { color: #94a3b8; line-height: 1.7; font-size: 15px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.2); color: #34d399; font-size: 12px; padding: 4px 10px; border-radius: 100px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <nav><a href="/">← Back to home</a></nav>
    <div class="badge">📄 Legal</div>
    <h1>Terms of Use</h1>
    <p class="meta">Last updated: March 2026 · Salman Dev Bot v3.0</p>
    <h2>1. Usage</h2>
    <p>This bot is provided as a free tool for development assistance. By using it, you agree to these terms.</p>
    <h2>2. Prohibited Use</h2>
    <ul>
      <li>Using the bot for illegal, harmful, or malicious purposes</li>
      <li>Attempting to exploit or abuse the service</li>
      <li>Generating content that violates Telegram's Terms of Service</li>
      <li>Automated spam or bulk requests</li>
    </ul>
    <h2>3. Generated Content</h2>
    <p>All code and content generated by the AI is provided as-is. Always review generated code before production use. We are not responsible for any issues caused by AI-generated code.</p>
    <h2>4. Privacy</h2>
    <p>We store minimal data: usage statistics and language preferences. Conversation context is stored temporarily (2 hours) to enable multi-turn conversations. No personal information is collected or sold. No conversation content is stored permanently.</p>
    <h2>5. AI Providers</h2>
    <p>This service uses OpenRouter and Groq APIs for AI inference. Requests are subject to their respective terms of service and privacy policies. No identifying information is sent to these providers beyond the message content.</p>
    <h2>6. Service Availability</h2>
    <p>The service is provided free of charge and may have rate limits, downtime, or be modified at any time. We make no guarantees about uptime or response quality.</p>
    <h2>7. Contact</h2>
    <p>Created by <a href="https://github.com/salman-dev-app">Md Salman Biswas</a> · <a href="https://t.me/Otakuosenpai">@Otakuosenpai</a> on Telegram</p>
  </div>
</body>
</html>`;
}
