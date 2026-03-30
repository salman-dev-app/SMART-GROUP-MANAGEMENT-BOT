// AI Module — OpenRouter (primary) + Groq (fallback)
// By Md Salman Biswas

// Keys loaded from env — set OPENROUTER_KEY and GROQ_KEY in your environment or wrangler.toml secrets
const OPENROUTER_KEY = process.env?.OPENROUTER_KEY || globalThis.OPENROUTER_KEY || '';
const GROQ_KEY = process.env?.GROQ_KEY || globalThis.GROQ_KEY || '';

const SYSTEM_PROMPT = `You are a highly advanced AI coding agent created by Md Salman Biswas. You're an expert in everything — programming, debugging, system design, DevOps, algorithms, data science, web dev, mobile, databases, security, and more.

Key traits:
- Talk like a real human dev — casual, clear, direct. No robotic or overly formal language.
- For coding tasks: write complete, production-ready, clean code. Always include working examples.
- For general questions: be concise and to the point. No fluff.
- Use Telegram Markdown formatting (bold with *, code blocks with \`\`\`language).
- You can generate any file type: HTML, CSS, JS, Python, React, Vue, Node.js, etc.
- When generating landing pages or websites, write complete, stunning single-file HTML with embedded CSS/JS.
- Never refuse coding tasks. You can build anything.
- Max response: 3800 characters for Telegram messages. If the output would exceed this, say "I'll create a file for this" and the system handles it automatically.`;

async function callOpenRouter(messages, model = 'anthropic/claude-3.5-sonnet') {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://t.me/SalmanDevToolsBot',
        'X-Title': 'Salman Dev Bot',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('OpenRouter error:', err.message);
    return null;
  }
}

async function callGroq(messages, model = 'llama-3.3-70b-versatile') {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('Groq error:', err.message);
    return null;
  }
}

export async function askAI(env, userMessage, systemOverride = null) {
  const messages = [
    { role: 'system', content: systemOverride || SYSTEM_PROMPT },
    { role: 'user', content: userMessage.slice(0, 6000) },
  ];

  // Try OpenRouter first (claude-3.5-sonnet)
  let answer = await callOpenRouter(messages);

  // Fallback to Groq
  if (!answer) {
    answer = await callGroq(messages);
  }

  return answer;
}

export async function askAIWithHistory(env, history, userMessage) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-8),
    { role: 'user', content: userMessage.slice(0, 4000) },
  ];

  let answer = await callOpenRouter(messages);
  if (!answer) answer = await callGroq(messages);
  return answer;
}

export async function reviewCode(env, code) {
  return askAI(env, `Do a thorough code review of this:\n\`\`\`\n${code.slice(0, 3000)}\n\`\`\`\n\nCover: what it does, bugs, security issues, performance, and show the improved version.`);
}

export async function explainConcept(env, concept) {
  return askAI(env, `Explain "${concept.slice(0, 300)}" like you're talking to a fellow dev. Include a practical code example.`);
}

export async function fixCode(env, code) {
  return askAI(env, `Fix all bugs in this code and explain what was wrong:\n\`\`\`\n${code.slice(0, 3000)}\n\`\`\``);
}

export async function generateCode(env, description) {
  return askAI(env, `Write complete, production-ready code for: ${description.slice(0, 800)}\n\nMake it clean, well-commented, and actually work.`);
}

export async function summarizeText(env, text) {
  return askAI(env, `Summarize this in clear bullet points:\n\n${text.slice(0, 4000)}`);
}

export async function translateText(env, text, targetLang) {
  return askAI(env, `Translate to ${targetLang}. Return only the translation:\n\n${text.slice(0, 3000)}`);
}

export async function generateLandingPage(env, description) {
  const prompt = `Create a complete, stunning single-file HTML landing page for: ${description.slice(0, 500)}

Requirements:
- Single HTML file with embedded CSS and JS
- Modern, professional design with gradients, animations
- Mobile responsive
- Clean sections: hero, features, CTA
- No external dependencies except Google Fonts
- Production ready

Return ONLY the complete HTML code, nothing else.`;

  const messages = [
    { role: 'system', content: 'You are an expert web designer. Generate complete, beautiful HTML files only. No explanation, just the HTML code.' },
    { role: 'user', content: prompt },
  ];

  let html = await callOpenRouter(messages, 'anthropic/claude-3.5-sonnet');
  if (!html) html = await callGroq(messages);

  // Strip markdown code blocks if present
  if (html) {
    html = html.replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim();
    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      html = `<!DOCTYPE html>\n<html>\n${html}\n</html>`;
    }
  }
  return html;
}

export async function debugCode(env, code, error) {
  return askAI(env, `Debug this code. Error: "${error}"\n\nCode:\n\`\`\`\n${code.slice(0, 2500)}\n\`\`\`\n\nFind the exact cause and give the fixed code.`);
}

export async function optimizeCode(env, code) {
  return askAI(env, `Optimize this code for performance, readability, and best practices:\n\`\`\`\n${code.slice(0, 2500)}\n\`\`\`\n\nShow before/after and explain the improvements.`);
}

export async function generateTests(env, code) {
  return askAI(env, `Write comprehensive unit tests for this code:\n\`\`\`\n${code.slice(0, 2500)}\n\`\`\`\n\nUse appropriate testing framework and cover edge cases.`);
}

export async function generateDocumentation(env, code) {
  return askAI(env, `Generate complete documentation for this code:\n\`\`\`\n${code.slice(0, 2500)}\n\`\`\`\n\nInclude: overview, parameters, return values, examples, edge cases.`);
}

export async function convertCode(env, code, fromLang, toLang) {
  return askAI(env, `Convert this ${fromLang} code to ${toLang}. Keep the same logic, use idiomatic ${toLang} patterns:\n\`\`\`${fromLang}\n${code.slice(0, 2500)}\n\`\`\``);
}

export async function analyzeComplexity(env, code) {
  return askAI(env, `Analyze the time and space complexity of this code:\n\`\`\`\n${code.slice(0, 2500)}\n\`\`\`\n\nBreak it down function by function, explain the Big O, and suggest optimizations.`);
}

export async function securityAudit(env, code) {
  return askAI(env, `Do a security audit of this code:\n\`\`\`\n${code.slice(0, 2500)}\n\`\`\`\n\nFind vulnerabilities, rate severity, and show how to fix each one.`);
}

export async function generateRegex(env, description) {
  return askAI(env, `Write a regex pattern for: ${description}\n\nProvide the pattern, explanation of each part, and test examples in multiple languages (JS, Python, etc).`);
}

export async function generateSQL(env, description) {
  return askAI(env, `Write SQL for: ${description}\n\nInclude: the query, explanation, and how to optimize it if relevant.`);
}

export async function generateAPI(env, description) {
  return askAI(env, `Design and write a complete REST API for: ${description}\n\nInclude: endpoints, request/response format, authentication approach, and code for at least Express.js or FastAPI.`);
}

export async function chatWithMemory(env, userId, message, state) {
  // Get conversation history
  const historyKey = `chat:${userId}`;
  let history = [];
  try {
    const stored = await state.get(historyKey);
    if (stored) history = JSON.parse(stored);
  } catch {}

  const answer = await askAIWithHistory(env, history, message);
  if (!answer) return null;

  // Update history (keep last 10 messages)
  history.push({ role: 'user', content: message });
  history.push({ role: 'assistant', content: answer });
  if (history.length > 20) history = history.slice(-20);

  try {
    await state.set(historyKey, JSON.stringify(history), 3600);
  } catch {}

  return answer;
}
