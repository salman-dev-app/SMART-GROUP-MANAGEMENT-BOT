/**
 * AI Engine — Full Agent Mode
 * Primary:  OpenRouter → auto-routes to best available model
 * Fallback: Groq compound (has built-in web search!)
 * Research: Groq compound-beta / Tavily search API
 */

// Keys loaded from env
const getKey = (name) => process.env?.[name] || globalThis[name] || '';

// ─── Model Roster (2025/2026 — real IDs verified from API) ──────────────────
const MODELS = {
  // Flagship coding — best SWE-bench scores
  coding:    'qwen/qwen3-coder-plus',          // Qwen3 Coder — 1M ctx, coding SOTA
  coding2:   'moonshotai/kimi-k2.5',           // Kimi K2.5 — 1T params, coding beast
  coding3:   'deepseek/deepseek-v3.2',         // DeepSeek V3.2 — ultra fast + smart
  // Reasoning / research
  reasoning: 'deepseek/deepseek-r1-0528',      // DeepSeek R1 — chain-of-thought reasoning
  reasoning2:'google/gemini-2.5-pro',          // Gemini 2.5 Pro — 1M ctx, multimodal
  // Speed / chat
  fast:      'qwen/qwen3-coder-flash',         // Fast coder
  fast2:     'deepseek/deepseek-v3.1-terminus',// Fast + smart
  // Agents
  agent:     'x-ai/grok-4.1-fast',             // Grok 4.1 — 2M ctx, agentic
  // Free fallback
  free:      'qwen/qwen3-coder:free',           // Free tier
};

// Groq models (ultra-fast inference, some with built-in tools)
const GROQ_MODELS = {
  compound:  'groq/compound',                  // Groq Compound — has built-in web search!
  compoundM: 'groq/compound-mini',             // Faster compound
  kimi:      'moonshotai/kimi-k2-instruct',    // Kimi K2 on Groq
  gpt_oss:   'openai/gpt-oss-120b',            // GPT-OSS 120B (open weight)
  qwen3:     'qwen/qwen3-32b',                 // Qwen3 32B
  llama:     'llama-3.3-70b-versatile',        // Llama 3.3 70B
};

// ─── System Prompt — Full Unlocked Agent ────────────────────────────────────
const AGENT_SYSTEM = `You are an elite AI coding agent built by Md Salman Biswas. You operate in 2026 with full knowledge of the latest frameworks, languages, tools, and paradigms.

CAPABILITIES — fully unlocked:
- Write production-grade code in ANY language: Python, JS/TS, Rust, Go, C++, Solidity, Move, Zig, Swift, Kotlin, Dart, Julia, R, WASM, Assembly — you name it
- Build complete applications: full-stack web apps, mobile apps, APIs, CLIs, compilers, interpreters, OS kernels, smart contracts, ML models, agents
- Deep knowledge of 2025/2026 stack: React 19, Next.js 15, Bun, Deno 2, Astro 5, SvelteKit 2, Hono, Fastify, tRPC, Drizzle, Prisma, Turso, PlanetScale, Neon, Supabase, Convex, Clerk, Auth.js, Stripe, Inngest, Trigger.dev, Cloudflare R2/KV/D1, Vercel AI SDK, LangChain, LlamaIndex, Ollama, vLLM, CUDA, PyTorch 2.6, JAX, Triton, MLIR, WebGPU, WebLLM, transformers.js
- AI/ML expertise: training, fine-tuning, RAG, agents, evals, prompt engineering, embeddings, vector DBs (Pinecone, Weaviate, Qdrant, pgvector), quantization, LoRA, RLHF, DPO, Constitutional AI
- Systems: Docker, K8s, Terraform, Pulumi, GitHub Actions, ArgoCD, Grafana, Prometheus, OpenTelemetry, eBPF, WASM runtimes
- Security: penetration testing, cryptography, zero-trust, OAuth2/OIDC, JWT, secure coding
- Latest research: you know papers published up to 2026, latest techniques, algorithms, and paradigms

BEHAVIOR:
- Write like a human developer — casual, direct, no corporate AI tone
- For code: always write COMPLETE, RUNNABLE code. No "// TODO" stubs unless explicitly doing scaffolding
- For complex tasks: think step by step, then deliver
- When asked about yourself: short answer — built by Md Salman Biswas, full-stack AI agent
- NEVER say "I can't" or "I don't know" — research, reason, then answer
- No length limits on code output — if it needs 1000 lines, write 1000 lines

FORMAT for Telegram:
- Bold with *text*, code with \`\`\`lang\\n...\\n\`\`\`
- Keep explanations tight — show don't tell
- If output > 3500 chars, say: "[FILE_NEEDED]" at the start`;

const RESEARCH_SYSTEM = `You are a research agent. Your job is to:
1. Search for the latest information on the topic
2. Synthesize findings into a comprehensive, accurate answer
3. Include sources when relevant
4. Always mention if information might be from 2025/2026 vs older

Be thorough but concise. If it's a coding topic, include working code examples with latest APIs/syntax.`;

// ─── Core OpenRouter Call ────────────────────────────────────────────────────
async function callOpenRouter(messages, modelId, opts = {}) {
  const key = getKey('OPENROUTER_KEY');
  if (!key) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://t.me/SalmanDevToolsBot',
        'X-Title': 'SalmanDevBot',
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: opts.maxTokens || 8000,
        temperature: opts.temperature ?? 0.7,
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      console.error(`OpenRouter [${modelId}] ${res.status}:`, err.slice(0, 200));
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`OpenRouter [${modelId}] timeout`);
    } else {
      console.error(`OpenRouter [${modelId}] error:`, err.message);
    }
    return null;
  }
}

// ─── Groq Call (with compound for web search) ────────────────────────────────
async function callGroq(messages, modelId, opts = {}) {
  const key = getKey('GROQ_KEY');
  if (!key) return null;
  try {
    const isCompound = modelId === GROQ_MODELS.compound || modelId === GROQ_MODELS.compoundM;
    const body = {
      model: modelId,
      messages,
      max_tokens: opts.maxTokens || 6000,
      temperature: opts.temperature ?? 0.7,
    };
    // Groq compound has built-in web search via tool_use — no explicit tools needed
    // It auto-searches when needed based on the query

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), isCompound ? 55000 : 30000);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      console.error(`Groq [${modelId}] ${res.status}:`, err.slice(0, 200));
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`Groq [${modelId}] timeout`);
    } else {
      console.error(`Groq [${modelId}] error:`, err.message);
    }
    return null;
  }
}

// ─── Smart Router — tries models in priority order ────────────────────────────
async function smartRoute(messages, task = 'general', opts = {}) {
  let attempts;

  switch (task) {
    case 'coding':
    case 'generate':
      attempts = [
        () => callOpenRouter(messages, MODELS.coding, opts),
        () => callOpenRouter(messages, MODELS.coding2, opts),
        () => callOpenRouter(messages, MODELS.coding3, opts),
        () => callGroq(messages, GROQ_MODELS.kimi, opts),
        () => callGroq(messages, GROQ_MODELS.gpt_oss, opts),
        () => callOpenRouter(messages, MODELS.free, opts),
      ];
      break;
    case 'research':
      attempts = [
        () => callGroq(messages, GROQ_MODELS.compound, opts),      // has web search!
        () => callGroq(messages, GROQ_MODELS.compoundM, opts),
        () => callOpenRouter(messages, MODELS.reasoning, opts),
        () => callOpenRouter(messages, MODELS.reasoning2, opts),
        () => callGroq(messages, GROQ_MODELS.gpt_oss, opts),
      ];
      break;
    case 'reasoning':
    case 'debug':
      attempts = [
        () => callOpenRouter(messages, MODELS.reasoning, opts),
        () => callOpenRouter(messages, MODELS.coding2, opts),
        () => callGroq(messages, GROQ_MODELS.kimi, opts),
        () => callOpenRouter(messages, MODELS.coding3, opts),
        () => callGroq(messages, GROQ_MODELS.qwen3, opts),
      ];
      break;
    case 'fast':
    case 'chat':
      attempts = [
        () => callOpenRouter(messages, MODELS.fast, opts),
        () => callGroq(messages, GROQ_MODELS.qwen3, opts),
        () => callGroq(messages, GROQ_MODELS.llama, opts),
        () => callOpenRouter(messages, MODELS.fast2, opts),
        () => callOpenRouter(messages, MODELS.free, opts),
      ];
      break;
    case 'landing':
    case 'ui':
      attempts = [
        () => callOpenRouter(messages, MODELS.coding, opts),
        () => callOpenRouter(messages, MODELS.coding2, opts),
        () => callOpenRouter(messages, MODELS.reasoning2, opts),
        () => callGroq(messages, GROQ_MODELS.gpt_oss, opts),
        () => callOpenRouter(messages, MODELS.free, opts),
      ];
      break;
    default:
      attempts = [
        () => callOpenRouter(messages, MODELS.coding, opts),
        () => callGroq(messages, GROQ_MODELS.compound, opts),
        () => callOpenRouter(messages, MODELS.coding3, opts),
        () => callGroq(messages, GROQ_MODELS.kimi, opts),
        () => callOpenRouter(messages, MODELS.free, opts),
      ];
  }

  for (const attempt of attempts) {
    const result = await attempt();
    if (result && result.length > 10) return result;
  }
  return null;
}

// ─── Web Research using Groq Compound ────────────────────────────────────────
export async function webResearch(query) {
  const messages = [
    { role: 'system', content: RESEARCH_SYSTEM },
    { role: 'user', content: `Research and answer thoroughly: ${query}` },
  ];
  // Groq compound has native web search — best for research
  let result = await callGroq(messages, GROQ_MODELS.compound, { maxTokens: 6000 });
  if (!result) result = await callGroq(messages, GROQ_MODELS.compoundM, { maxTokens: 6000 });
  if (!result) {
    // Fallback: OpenRouter with reasoning model
    result = await callOpenRouter([
      { role: 'system', content: RESEARCH_SYSTEM },
      { role: 'user', content: `Using your training data up to 2025-2026, thoroughly research and answer: ${query}\n\nBe specific, include latest versions, APIs, and real examples.` },
    ], MODELS.reasoning, { maxTokens: 6000 });
  }
  return result;
}

// ─── Main AI entry points ─────────────────────────────────────────────────────

export async function askAI(env, userMessage, systemOverride = null) {
  const messages = [
    { role: 'system', content: systemOverride || AGENT_SYSTEM },
    { role: 'user', content: userMessage.slice(0, 8000) },
  ];

  // Detect task type from message
  const task = detectTask(userMessage);
  return smartRoute(messages, task, { maxTokens: 8000 });
}

function detectTask(msg) {
  const m = msg.toLowerCase();
  if (m.includes('research') || m.includes('latest') || m.includes('2025') || m.includes('2026') ||
      m.includes('search') || m.includes('find') || m.includes('what is new') || m.includes('current'))
    return 'research';
  if (m.includes('generate') || m.includes('create') || m.includes('write') || m.includes('build') ||
      m.includes('code') || m.includes('implement') || m.includes('make'))
    return 'coding';
  if (m.includes('debug') || m.includes('fix') || m.includes('error') || m.includes('why') ||
      m.includes('explain') || m.includes('analyze') || m.includes('review'))
    return 'reasoning';
  if (m.includes('landing') || m.includes('html') || m.includes('css') || m.includes('ui') ||
      m.includes('design') || m.includes('website') || m.includes('page'))
    return 'landing';
  return 'coding';
}

export async function chatWithMemory(env, userId, message, state) {
  const historyKey = `chat:${userId}`;
  let history = [];
  try {
    const stored = await state.get(historyKey);
    if (stored) history = JSON.parse(stored);
  } catch {}

  const task = detectTask(message);
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    ...history.slice(-12),
    { role: 'user', content: message.slice(0, 6000) },
  ];

  const answer = await smartRoute(messages, task, { maxTokens: 8000 });
  if (!answer) return null;

  history.push({ role: 'user', content: message });
  history.push({ role: 'assistant', content: answer.slice(0, 2000) }); // save compressed
  if (history.length > 24) history = history.slice(-24);
  try { await state.set(historyKey, JSON.stringify(history), 7200); } catch {}

  return answer;
}

export async function reviewCode(env, code) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Do a thorough code review:\n\`\`\`\n${code.slice(0, 6000)}\n\`\`\`\n\nCover: what it does, bugs, security issues, performance, and show the improved version with explanations.` },
  ];
  return smartRoute(messages, 'reasoning', { maxTokens: 8000 });
}

export async function explainConcept(env, concept) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Explain "${concept.slice(0, 400)}" in depth. Include: the concept, how it works internally, practical code examples with latest 2025/2026 syntax, when to use it, common pitfalls.` },
  ];
  return smartRoute(messages, 'reasoning', { maxTokens: 8000 });
}

export async function fixCode(env, code) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Find ALL bugs and fix this code. Show the complete fixed version:\n\`\`\`\n${code.slice(0, 6000)}\n\`\`\`\n\nExplain what was wrong and why your fix is correct.` },
  ];
  return smartRoute(messages, 'reasoning', { maxTokens: 8000 });
}

export async function generateCode(env, description) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Write complete, production-ready code for: ${description.slice(0, 1000)}\n\nRequirements:\n- Complete and runnable, not a skeleton\n- Use latest 2025/2026 syntax and best practices\n- Handle errors properly\n- Add brief inline comments for complex parts\n- Use the best library/framework for this task` },
  ];
  return smartRoute(messages, 'coding', { maxTokens: 10000 });
}

export async function summarizeText(env, text) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Summarize this concisely with the key points:\n\n${text.slice(0, 6000)}` },
  ];
  return smartRoute(messages, 'fast', { maxTokens: 4000 });
}

export async function translateText(env, text, targetLang) {
  const messages = [
    { role: 'system', content: 'You are a precise translator. Return only the translation, nothing else.' },
    { role: 'user', content: `Translate to ${targetLang}:\n\n${text.slice(0, 4000)}` },
  ];
  return smartRoute(messages, 'fast', { maxTokens: 4000 });
}

export async function generateLandingPage(env, description) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert web designer and developer. Generate ONLY complete HTML code — no explanation, no markdown, just the raw HTML file.',
    },
    {
      role: 'user',
      content: `Create a stunning, complete single-file HTML landing page for: ${description.slice(0, 600)}

Requirements:
- Single HTML file with ALL CSS and JS embedded (no external dependencies except Google Fonts)
- Modern 2025 design: dark or light theme, glassmorphism or gradient aesthetic
- Smooth CSS animations and transitions
- Fully mobile responsive
- Sections: hero with CTA, features/benefits (3-6 items), social proof or stats, final CTA, footer
- Professional typography using Google Fonts
- Working scroll animations (Intersection Observer)
- Clean semantic HTML5
- Production quality — looks like a $5000 website

Return ONLY the HTML starting with <!DOCTYPE html>`,
    },
  ];

  let html = await smartRoute(messages, 'landing', { maxTokens: 12000, temperature: 0.8 });
  if (html) {
    html = html.replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim();
    if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) {
      html = `<!DOCTYPE html>\n${html}`;
    }
  }
  return html;
}

export async function debugCode(env, code, error) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Debug this. Error: "${error}"\n\nCode:\n\`\`\`\n${code.slice(0, 5000)}\n\`\`\`\n\nFind the exact root cause, explain it clearly, then show the complete fixed code.` },
  ];
  return smartRoute(messages, 'reasoning', { maxTokens: 8000 });
}

export async function optimizeCode(env, code) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Optimize this code for performance, readability, and modern best practices:\n\`\`\`\n${code.slice(0, 5000)}\n\`\`\`\n\nShow before/after with benchmarks or Big O analysis. Use 2025/2026 patterns.` },
  ];
  return smartRoute(messages, 'reasoning', { maxTokens: 8000 });
}

export async function generateTests(env, code) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Write comprehensive tests for this code:\n\`\`\`\n${code.slice(0, 5000)}\n\`\`\`\n\nUse the appropriate framework (Vitest/Jest for JS, pytest for Python, etc). Cover: happy path, edge cases, error cases, boundary values.` },
  ];
  return smartRoute(messages, 'coding', { maxTokens: 8000 });
}

export async function generateDocumentation(env, code) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Generate complete documentation for this code:\n\`\`\`\n${code.slice(0, 5000)}\n\`\`\`\n\nInclude: overview, installation, API reference for each function/method, parameters, return values, examples, edge cases.` },
  ];
  return smartRoute(messages, 'fast', { maxTokens: 8000 });
}

export async function convertCode(env, code, fromLang, toLang) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Convert this ${fromLang} code to ${toLang}. Keep identical logic, use idiomatic ${toLang} patterns and 2025 conventions:\n\`\`\`${fromLang}\n${code.slice(0, 5000)}\n\`\`\`` },
  ];
  return smartRoute(messages, 'coding', { maxTokens: 8000 });
}

export async function analyzeComplexity(env, code) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Analyze the time and space complexity:\n\`\`\`\n${code.slice(0, 5000)}\n\`\`\`\n\nBreak it down per function, explain WHY each Big O is what it is, and suggest specific optimizations with code.` },
  ];
  return smartRoute(messages, 'reasoning', { maxTokens: 6000 });
}

export async function securityAudit(env, code) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Security audit this code:\n\`\`\`\n${code.slice(0, 5000)}\n\`\`\`\n\nFind: injection vulnerabilities, auth flaws, data exposure, OWASP issues, insecure deps. Rate severity (Critical/High/Medium/Low), explain impact, show the secure fix for each.` },
  ];
  return smartRoute(messages, 'reasoning', { maxTokens: 8000 });
}

export async function generateRegex(env, description) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Write a regex for: ${description}\n\nProvide: the pattern, a breakdown of each part, test cases that match, test cases that DON'T match, and usage examples in JavaScript, Python, and Go.` },
  ];
  return smartRoute(messages, 'fast', { maxTokens: 4000 });
}

export async function generateSQL(env, description) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Write SQL for: ${description}\n\nInclude: the query with formatting, explanation of each clause, indexes that would help performance, and variations (PostgreSQL, MySQL, SQLite differences if relevant).` },
  ];
  return smartRoute(messages, 'coding', { maxTokens: 6000 });
}

export async function generateAPI(env, description) {
  const messages = [
    { role: 'system', content: AGENT_SYSTEM },
    { role: 'user', content: `Design and build a complete REST API for: ${description}\n\nInclude: all endpoints with HTTP methods, request/response schemas, auth middleware, error handling, and full working code (use Hono or Express for JS, FastAPI for Python — choose the best fit).` },
  ];
  return smartRoute(messages, 'coding', { maxTokens: 10000 });
}

// ─── Research Mode — uses Groq Compound with web search ──────────────────────
export async function researchAndAnswer(env, query) {
  return webResearch(query);
}

// ─── Agent Task Decomposer — breaks complex tasks into steps ─────────────────
export async function agentSolve(env, task) {
  const messages = [
    {
      role: 'system',
      content: `${AGENT_SYSTEM}

When given a complex task:
1. Break it into clear steps
2. Execute each step thoroughly
3. Combine into a complete solution
4. Always deliver working, complete code`,
    },
    {
      role: 'user',
      content: `Task: ${task.slice(0, 3000)}\n\nThink through this step by step, then deliver the complete solution.`,
    },
  ];
  return smartRoute(messages, 'coding', { maxTokens: 12000, temperature: 0.6 });
}

// Export model info for status display
export function getModelInfo() {
  return {
    primary: 'Qwen3 Coder Plus + Kimi K2.5 + DeepSeek V3.2',
    research: 'Groq Compound (web search) + DeepSeek R1',
    reasoning: 'DeepSeek R1-0528 + Gemini 2.5 Pro',
    speed: 'Qwen3 Coder Flash + Grok 4.1 Fast',
    context: '1M–2M tokens',
    year: '2025/2026',
  };
}
