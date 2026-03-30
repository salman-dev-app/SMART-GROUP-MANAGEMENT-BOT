/**
 * AI Engine v3.0 — MAXIMUM SPEED AGENT
 * Ultra-fast parallel racing: fires multiple models simultaneously, takes the FIRST valid response
 * Strategy: No waiting — race the fastest providers head-to-head
 * Created by Md Salman Biswas
 */

// Read key from: env object passed in → process.env → globalThis (in that order)
let _envRef = null;
const getKey = (name) => _envRef?.[name] || process.env?.[name] || globalThis[name] || '';
export function setEnv(e) { if (e) _envRef = e; }

// ─── In-memory response cache (TTL: 5 min for identical requests) ─────────────
const _cache = new Map();
function cacheGet(key) {
  const e = _cache.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { _cache.delete(key); return null; }
  return e.val;
}
function cacheSet(key, val, ttlMs = 300000) {
  if (_cache.size > 200) { // Prevent memory leak
    const oldest = [..._cache.keys()].slice(0, 50);
    oldest.forEach(k => _cache.delete(k));
  }
  _cache.set(key, { val, exp: Date.now() + ttlMs });
}

// ─── Model Roster (2025/2026 — real verified IDs) ───────────────────────────
const OR = { // OpenRouter models
  // Coding titans
  qwen3:     'qwen/qwen3-coder-plus',
  kimi:      'moonshotai/kimi-k2.5',
  ds3:       'deepseek/deepseek-v3.2',
  ds3fast:   'deepseek/deepseek-v3.1-terminus',
  // Reasoning
  r1:        'deepseek/deepseek-r1-0528',
  gemini:    'google/gemini-2.5-pro',
  // Speed
  qflash:    'qwen/qwen3-coder-flash',
  grok:      'x-ai/grok-4.1-fast',
  // Free fallback
  free:      'qwen/qwen3-coder:free',
};

const GQ = { // Groq models (ultra-low latency)
  compound:  'compound-beta',          // Groq Compound — has live web search!
  compoundM: 'compound-beta-mini',     // Faster compound
  llama4:    'meta-llama/llama-4-maverick-17b-128e-instruct',
  llama33:   'llama-3.3-70b-versatile',
  qwen3:     'qwen/qwen3-32b',
  kimi:      'moonshotai/kimi-k2-instruct',
};

// ─── System Prompts ──────────────────────────────────────────────────────────
const SYS_AGENT = [
  'You are an expert developer assistant. Be direct and concise.',
  'Rules:',
  '- Answer immediately. No preamble ("Sure!", "Great!", "Of course!"). Just answer.',
  '- Do NOT narrate your thinking. Do NOT say what you are about to do — just do it.',
  '- Write complete, runnable code. No stubs, no TODOs, no placeholder comments.',
  '- If output exceeds 3500 chars, start the response with [FILE_NEEDED] on its own line.',
  '- Format for Telegram: *bold* for headings, ```lang\\ncode\\n``` for code blocks.',
  '- Use latest stable libraries and modern best practices.',
].join('\n');

const SYS_RESEARCH = [
  'You are a research assistant. Answer directly with accurate, up-to-date information.',
  'Do not narrate your process. Provide the answer immediately.',
  'For technical topics include concise code examples.',
].join('\n');

const SYS_FAST = 'Answer directly and concisely. No preamble. Code must be complete and runnable.';

// ─── Output cleaner: strips AI reasoning/thinking leakage ───────────────────
function cleanOutput(text) {
  if (!text) return text;
  // Strip <think>...</think> blocks (DeepSeek R1, Qwen3 thinking mode, etc.)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Strip ```thinking ... ``` fenced blocks
  text = text.replace(/```thinking[\s\S]*?```/gi, '');
  // Strip leading reasoning monologue lines that models sometimes emit
  // These are lines that start with the AI narrating its own thought process
  text = text.replace(/^(Okay[,.].*|Alright[,.].*|Let me (think|tackle|start|break|analyze|work|figure|plan|consider|look).*|First[, ]I .*|So[, ](I need|let me|the user).*|I need to (make sure|think|analyze|start|plan|consider).*|The user (wants|asked|needs|is asking).*|Looking at this.*|To (generate|create|build|solve|handle|tackle|make).*)\n/gim, '');
  // Collapse 3+ blank lines to 2
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

// ─── Core API Callers ────────────────────────────────────────────────────────
async function callOR(messages, model, opts = {}) {
  const key = getKey('OPENROUTER_KEY');
  if (!key) return null;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), opts.timeout || 30000); // 30s max
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://t.me/SalmanDevToolsBot',
        'X-Title': 'SalmanDevBot-v3',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens || 8000,
        temperature: opts.temp ?? 0.7,
        stream: false,
      }),
      signal: ac.signal,
    });
    clearTimeout(t);
    if (!r.ok) { const e = await r.text(); console.error(`OR[${model}] ${r.status}:`, e.slice(0,150)); return null; }
    const d = await r.json();
    const raw = d?.choices?.[0]?.message?.content?.trim() || null;
    return cleanOutput(raw);
  } catch (e) {
    if (e.name !== 'AbortError') console.error(`OR[${model}]:`, e.message);
    return null;
  }
}

async function callGroq(messages, model, opts = {}) {
  const key = getKey('GROQ_KEY');
  if (!key) return null;
  try {
    const ac = new AbortController();
    const isCompound = model.includes('compound');
    const t = setTimeout(() => ac.abort(), isCompound ? 40000 : 18000); // Groq is FAST
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens || 6000,
        temperature: opts.temp ?? 0.7,
      }),
      signal: ac.signal,
    });
    clearTimeout(t);
    if (!r.ok) { const e = await r.text(); console.error(`GQ[${model}] ${r.status}:`, e.slice(0,150)); return null; }
    const d = await r.json();
    const raw = d?.choices?.[0]?.message?.content?.trim() || null;
    return cleanOutput(raw);
  } catch (e) {
    if (e.name !== 'AbortError') console.error(`GQ[${model}]:`, e.message);
    return null;
  }
}

// ─── TURBO RACE: Fire ALL models simultaneously, return FIRST valid ──────────
// This is the secret to sub-3s responses: don't wait for any single model
async function turboRace(calls) {
  return new Promise((resolve) => {
    let done = false;
    let pending = calls.length;
    if (!pending) { resolve(null); return; }

    calls.forEach(fn => {
      fn().then(res => {
        if (!done && res && res.trim().length > 15) {
          done = true;
          resolve(res);
        }
        if (--pending === 0 && !done) resolve(null);
      }).catch(() => {
        if (--pending === 0 && !done) resolve(null);
      });
    });
  });
}

// ─── Smart Router — task-optimized parallel racing ───────────────────────────
async function route(messages, task = 'general', opts = {}) {
  // Check cache for non-creative tasks
  if (!opts.noCache && task !== 'research') {
    const cacheKey = task + ':' + JSON.stringify(messages).slice(0, 200);
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
  }

  let result = null;

  switch (task) {

    case 'coding':
    case 'generate':
    case 'landing':
    case 'ui':
      // TIER 1: Race 3 fast coders simultaneously
      result = await turboRace([
        () => callGroq(messages, GQ.qwen3, opts),       // Groq qwen3 — FASTEST
        () => callOR(messages, OR.ds3, opts),            // DeepSeek V3.2 — fast + smart
        () => callGroq(messages, GQ.llama33, opts),      // Llama 3.3 on Groq
      ]);
      if (!result) result = await turboRace([
        () => callOR(messages, OR.qwen3, opts),          // Qwen3 Coder Plus
        () => callOR(messages, OR.kimi, opts),           // Kimi K2.5
        () => callGroq(messages, GQ.kimi, opts),         // Kimi on Groq
        () => callOR(messages, OR.free, opts),
      ]);
      break;

    case 'research':
      // Groq Compound has native web search — run it with a fast fallback
      result = await turboRace([
        () => callGroq(messages, GQ.compound, { ...opts, timeout: 40000 }),
        () => callGroq(messages, GQ.compoundM, { ...opts, timeout: 35000 }),
      ]);
      if (!result) result = await turboRace([
        () => callOR(messages, OR.r1, opts),
        () => callGroq(messages, GQ.llama33, opts),
        () => callOR(messages, OR.gemini, opts),
      ]);
      break;

    case 'reasoning':
    case 'debug':
    case 'review':
    case 'security':
      result = await turboRace([
        () => callGroq(messages, GQ.qwen3, opts),         // Fastest reasoner on Groq
        () => callOR(messages, OR.ds3fast, opts),          // DeepSeek fast
      ]);
      if (!result) result = await turboRace([
        () => callOR(messages, OR.r1, opts),               // DeepSeek R1 reasoning
        () => callOR(messages, OR.qwen3, opts),
        () => callGroq(messages, GQ.kimi, opts),
        () => callOR(messages, OR.free, opts),
      ]);
      break;

    case 'fast':
    case 'chat':
    case 'translate':
    case 'summarize':
      // Pure speed — Groq is under 1s on these
      result = await turboRace([
        () => callGroq(messages, GQ.llama4, opts),        // Llama 4 — fastest
        () => callGroq(messages, GQ.qwen3, opts),
        () => callGroq(messages, GQ.llama33, opts),
      ]);
      if (!result) result = await turboRace([
        () => callOR(messages, OR.qflash, opts),
        () => callOR(messages, OR.free, opts),
      ]);
      break;

    default: // general
      result = await turboRace([
        () => callGroq(messages, GQ.qwen3, opts),
        () => callOR(messages, OR.ds3fast, opts),
        () => callGroq(messages, GQ.llama33, opts),
      ]);
      if (!result) result = await turboRace([
        () => callOR(messages, OR.qwen3, opts),
        () => callOR(messages, OR.free, opts),
        () => callGroq(messages, GQ.compound, opts),
      ]);
  }

  // Cache result (not for creative/research tasks)
  if (result && !opts.noCache && task !== 'research' && task !== 'landing') {
    const cacheKey = task + ':' + JSON.stringify(messages).slice(0, 200);
    cacheSet(cacheKey, result, 300000); // 5 min TTL
  }

  return result;
}

// ─── Task detector ────────────────────────────────────────────────────────────
function detectTask(msg) {
  const m = msg.toLowerCase();
  if (/research|latest|2025|2026|search|find.*current|what.*new|current/.test(m)) return 'research';
  if (/generat|creat|write|build|implement|make|scaffold/.test(m)) return 'coding';
  if (/debug|fix.*error|broken|crash|traceback|exception|why.*fail/.test(m)) return 'debug';
  if (/review|audit|check.*code|analyze/.test(m)) return 'review';
  if (/translat|翻译|перевод/.test(m)) return 'translate';
  if (/summariz|sum.*up|tldr/.test(m)) return 'summarize';
  if (/landing|html.*page|website|ui|design|css/.test(m)) return 'landing';
  if (/explain|how.*work|what.*is|concept/.test(m)) return 'reasoning';
  return 'coding'; // default to coding (fastest path)
}

// ─── Exported AI Functions ────────────────────────────────────────────────────

export async function askAI(env, msg, sysOverride = null) {
  const task = detectTask(msg);
  return route([
    { role: 'system', content: sysOverride || SYS_AGENT },
    { role: 'user', content: msg.slice(0, 8000) },
  ], task, { maxTokens: 8000 });
}

export async function chatWithMemory(env, userId, message, state) {
  const hKey = `chat:${userId}`;
  let history = [];
  try { const s = await state.get(hKey); if (s) history = JSON.parse(s); } catch {}

  const task = detectTask(message);
  const msgs = [
    { role: 'system', content: SYS_AGENT },
    ...history.slice(-10), // Last 5 exchanges
    { role: 'user', content: message.slice(0, 6000) },
  ];

  const answer = await route(msgs, task, { maxTokens: 8000, noCache: true });
  if (!answer) return null;

  // Persist history async (don't block response)
  history.push({ role: 'user', content: message.slice(0, 500) });
  history.push({ role: 'assistant', content: answer.slice(0, 1500) });
  if (history.length > 20) history = history.slice(-20);
  state.set(hKey, JSON.stringify(history), 7200).catch(() => {});

  return answer;
}

export async function reviewCode(env, code) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Code review:\n\`\`\`\n${code.slice(0,6000)}\n\`\`\`\nCover: what it does, bugs, security, performance, improved version with explanations.` },
  ], 'review', { maxTokens: 8000 });
}

export async function explainConcept(env, concept) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Explain "${concept.slice(0,400)}" deeply: concept, internals, practical 2025/2026 code examples, when to use, common pitfalls.` },
  ], 'reasoning', { maxTokens: 8000 });
}

export async function fixCode(env, code) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Find ALL bugs and fix:\n\`\`\`\n${code.slice(0,6000)}\n\`\`\`\nShow complete fixed version + explain what was wrong.` },
  ], 'debug', { maxTokens: 8000 });
}

export async function generateCode(env, desc) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Write complete, production-ready code for: ${desc.slice(0,1000)}\n\nRequirements:\n- Complete and runnable, not a skeleton\n- Latest 2025/2026 syntax and best practices\n- Proper error handling\n- Brief inline comments for complex parts\n- Best library/framework for this task` },
  ], 'coding', { maxTokens: 10000 });
}

export async function summarizeText(env, text) {
  return route([
    { role: 'system', content: SYS_FAST },
    { role: 'user', content: `Summarize concisely with key points:\n\n${text.slice(0,6000)}` },
  ], 'summarize', { maxTokens: 3000 });
}

export async function translateText(env, text, targetLang) {
  return route([
    { role: 'system', content: 'Precise translator. Return only the translation.' },
    { role: 'user', content: `Translate to ${targetLang}:\n\n${text.slice(0,4000)}` },
  ], 'translate', { maxTokens: 4000 });
}

export async function generateLandingPage(env, desc) {
  const msgs = [
    {
      role: 'system',
      content: 'You are a professional web developer. Output ONLY raw HTML code. No explanation. No markdown. No ```html wrapper. Start your response with <!DOCTYPE html> and nothing else before it.',
    },
    {
      role: 'user',
      content: `Build a complete, production-quality single-file HTML landing page for: ${desc.slice(0,600)}

Requirements:
- All CSS and JS embedded in the single file (Google Fonts via <link> is fine)
- Dark theme with glassmorphism cards, gradient accents, subtle animations
- Sections: hero with CTA button, features grid (4-6 cards), stats row, testimonials, final CTA, footer
- Scroll-triggered entrance animations using IntersectionObserver
- Fully mobile responsive
- Clean professional typography (Inter font)

Output the complete HTML file starting with <!DOCTYPE html>`,
    },
  ];

  let html = await turboRace([
    () => callGroq(msgs, GQ.qwen3, { maxTokens: 14000, temp: 0.7 }),
    () => callOR(msgs, OR.ds3, { maxTokens: 14000, temp: 0.7, timeout: 50000 }),
  ]);
  if (!html) html = await turboRace([
    () => callOR(msgs, OR.qwen3, { maxTokens: 14000, temp: 0.7, timeout: 60000 }),
    () => callOR(msgs, OR.kimi, { maxTokens: 14000, temp: 0.7, timeout: 60000 }),
    () => callGroq(msgs, GQ.kimi, { maxTokens: 12000, temp: 0.7 }),
  ]);

  if (html) {
    // Strip any markdown code fences the model may have added despite instructions
    html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    // If model prepended thinking text before the doctype, extract only from <!DOCTYPE onward
    const doctypeIdx = html.search(/<!DOCTYPE\s+html/i);
    if (doctypeIdx > 0) html = html.slice(doctypeIdx);
    if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) html = `<!DOCTYPE html>\n${html}`;
  }
  return html;
}

export async function debugCode(env, code, error) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Debug this. Error: "${error}"\n\nCode:\n\`\`\`\n${code.slice(0,5000)}\n\`\`\`\n\nFind exact root cause, explain clearly, show complete fixed code.` },
  ], 'debug', { maxTokens: 8000 });
}

export async function optimizeCode(env, code) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Optimize for performance, readability, modern practices:\n\`\`\`\n${code.slice(0,5000)}\n\`\`\`\n\nShow before/after with Big O analysis. Use 2025/2026 patterns.` },
  ], 'review', { maxTokens: 8000 });
}

export async function generateTests(env, code) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Write comprehensive tests:\n\`\`\`\n${code.slice(0,5000)}\n\`\`\`\n\nUse best framework (Vitest/Jest for JS, pytest for Python). Cover: happy path, edge cases, error cases, boundary values.` },
  ], 'coding', { maxTokens: 8000 });
}

export async function generateDocumentation(env, code) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Generate complete docs:\n\`\`\`\n${code.slice(0,5000)}\n\`\`\`\n\nInclude: overview, API reference (each function/method, params, returns), examples, edge cases.` },
  ], 'summarize', { maxTokens: 8000 });
}

export async function convertCode(env, code, from, to) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Convert ${from} → ${to}. Keep identical logic, use idiomatic ${to} 2025 conventions:\n\`\`\`${from}\n${code.slice(0,5000)}\n\`\`\`` },
  ], 'coding', { maxTokens: 8000 });
}

export async function analyzeComplexity(env, code) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Analyze time/space complexity:\n\`\`\`\n${code.slice(0,5000)}\n\`\`\`\n\nPer-function breakdown, explain WHY each Big O, suggest optimizations with code.` },
  ], 'reasoning', { maxTokens: 6000 });
}

export async function securityAudit(env, code) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Security audit:\n\`\`\`\n${code.slice(0,5000)}\n\`\`\`\n\nFind: injection vulns, auth flaws, data exposure, OWASP issues. Rate severity (Critical/High/Medium/Low), show secure fix for each.` },
  ], 'security', { maxTokens: 8000 });
}

export async function generateRegex(env, desc) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Write regex for: ${desc}\n\nProvide: pattern, breakdown of each part, matching examples, non-matching examples, JS/Python/Go usage.` },
  ], 'fast', { maxTokens: 3000 });
}

export async function generateSQL(env, desc) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Write SQL for: ${desc}\n\nInclude: formatted query, explanation, indexes for performance, PostgreSQL/MySQL/SQLite differences if relevant.` },
  ], 'coding', { maxTokens: 5000 });
}

export async function generateAPI(env, desc) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Build complete REST API for: ${desc}\n\nAll endpoints with HTTP methods, request/response schemas, auth middleware, error handling, full working code (Hono for JS, FastAPI for Python).` },
  ], 'coding', { maxTokens: 10000 });
}

export async function researchAndAnswer(env, query) {
  const msgs = [
    { role: 'system', content: SYS_RESEARCH },
    { role: 'user', content: `Research and answer thoroughly: ${query}` },
  ];
  // Groq Compound has native web search
  let r = await turboRace([
    () => callGroq(msgs, GQ.compound, { maxTokens: 6000, timeout: 40000 }),
    () => callGroq(msgs, GQ.compoundM, { maxTokens: 6000, timeout: 35000 }),
  ]);
  if (!r) r = await route([
    { role: 'system', content: SYS_RESEARCH },
    { role: 'user', content: `Using knowledge through 2025-2026, thoroughly research: ${query}\n\nBe specific, include latest versions, APIs, real examples.` },
  ], 'reasoning', { maxTokens: 6000 });
  return r;
}

export async function agentSolve(env, task) {
  return route([
    { role: 'system', content: SYS_AGENT + '\n\nFor complex tasks: break into steps, execute each thoroughly, deliver complete solution.' },
    { role: 'user', content: `Task: ${task.slice(0,3000)}\n\nThink step by step, then deliver the complete solution.` },
  ], 'coding', { maxTokens: 12000, temp: 0.6, noCache: true });
}

// ─── NEW PREMIUM FEATURES ─────────────────────────────────────────────────────

export async function architectSystem(env, desc) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Design system architecture for: ${desc.slice(0,1000)}\n\nDeliver:\n1. High-level architecture diagram (ASCII)\n2. Technology stack with justifications\n3. Database schema (if applicable)\n4. API contract (if applicable)\n5. Scaling strategy\n6. Key design decisions and tradeoffs\n7. Implementation roadmap (phases)\n\nBe opinionated and specific. Use 2025/2026 tech.` },
  ], 'reasoning', { maxTokens: 10000 });
}

export async function generateDeployScript(env, desc) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Generate complete deployment configuration for: ${desc.slice(0,800)}\n\nInclude:\n- Dockerfile (multi-stage, production-optimized)\n- docker-compose.yml\n- GitHub Actions CI/CD pipeline\n- Environment variable setup\n- Health check endpoints\n- Auto-scaling config if applicable\n\nUse 2025 best practices, minimal image sizes, proper secrets management.` },
  ], 'coding', { maxTokens: 10000 });
}

export async function interviewPrep(env, topic) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Generate an interview preparation guide for: ${topic.slice(0,500)}\n\nInclude:\n1. Top 10 most asked interview questions (with difficulty: Easy/Medium/Hard)\n2. Detailed answers with code examples\n3. Common gotchas and edge cases interviewers love\n4. System design questions (if applicable)\n5. One-liner cheat sheet at the end\n\nFocus on 2024-2025 interview trends.` },
  ], 'reasoning', { maxTokens: 10000 });
}

export async function codeDiff(env, code1, code2) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Compare these two code versions:\n\nVersion A:\n\`\`\`\n${code1.slice(0,3000)}\n\`\`\`\n\nVersion B:\n\`\`\`\n${code2.slice(0,3000)}\n\`\`\`\n\nProvide:\n1. Summary of changes\n2. What was improved/worsened\n3. Performance impact\n4. Breaking changes\n5. Recommendation: use A or B and why` },
  ], 'review', { maxTokens: 6000 });
}

export async function brainstorm(env, idea) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Brainstorm and expand on: ${idea.slice(0,600)}\n\nGenerate:\n1. 10 creative feature ideas\n2. 5 potential technical approaches\n3. Monetization strategies (if applicable)\n4. Potential risks and mitigations\n5. Similar successful products for reference\n6. 90-day MVP roadmap\n\nBe creative, specific, and actionable.` },
  ], 'reasoning', { maxTokens: 8000 });
}

export async function generateGitCommit(env, diff) {
  return route([
    { role: 'system', content: 'You generate professional git commit messages. Return ONLY the commit message, nothing else.' },
    { role: 'user', content: `Generate a conventional commit message for this diff:\n\n${diff.slice(0,4000)}\n\nFormat: type(scope): description\n\nThen add a detailed body (2-3 bullet points explaining WHY these changes were made).` },
  ], 'fast', { maxTokens: 500 });
}

export async function explainError(env, error) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Explain this error and how to fix it:\n\n${error.slice(0,3000)}\n\nProvide:\n1. What this error means\n2. Most common causes\n3. Step-by-step fix\n4. How to prevent it in future\n5. Code example of the fix` },
  ], 'debug', { maxTokens: 5000 });
}

export async function generateReadme(env, desc) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Generate a professional README.md for: ${desc.slice(0,800)}\n\nInclude: badges, description, features, installation, usage examples, API docs, contributing guide, license. Use modern markdown with proper formatting, emoji for visual appeal, and real code examples.` },
  ], 'coding', { maxTokens: 8000 });
}

export async function performanceAnalysis(env, code) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Deep performance analysis:\n\`\`\`\n${code.slice(0,5000)}\n\`\`\`\n\nAnalyze:\n1. CPU bottlenecks (hot paths)\n2. Memory usage patterns (leaks, excessive allocation)\n3. I/O bottlenecks\n4. Algorithm efficiency\n5. Profiling approach for this code\n6. Optimized version with benchmarks\n7. Estimated % improvement` },
  ], 'review', { maxTokens: 8000 });
}

export async function refactorCode(env, code) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Refactor this code for maximum cleanliness and maintainability:\n\`\`\`\n${code.slice(0,5000)}\n\`\`\`\n\nApply: SOLID principles, DRY, appropriate design patterns, better naming, split complex functions, add types if missing. Show complete refactored version with comments explaining key changes.` },
  ], 'review', { maxTokens: 8000 });
}

export async function generateSchema(env, desc) {
  return route([
    { role: 'system', content: SYS_AGENT },
    { role: 'user', content: `Design a complete database schema for: ${desc.slice(0,800)}\n\nInclude:\n- SQL CREATE TABLE statements (PostgreSQL)\n- Proper data types, constraints, indexes\n- Relationships and foreign keys\n- Drizzle ORM schema (TypeScript)\n- Sample queries for common operations\n- Explanation of design decisions` },
  ], 'coding', { maxTokens: 8000 });
}

export function getModelInfo() {
  return {
    primary: 'Qwen3 Coder + Kimi K2.5 + DeepSeek V3.2',
    research: 'Groq Compound (live web search)',
    reasoning: 'DeepSeek R1-0528 + Gemini 2.5 Pro',
    speed: 'Groq Llama 4 + Qwen3 32B (sub-1s)',
    context: '1M–2M tokens',
    strategy: 'Turbo Race™ — all models fire simultaneously',
    year: '2025/2026',
  };
}
