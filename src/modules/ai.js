// AI Module — Cloudflare Workers AI (Llama 3.1 8B)
// Production: env.AI.run() — free 10,000 neurons/day on Cloudflare GPUs
// Local: smart rule-based fallback engine

const SYSTEM_PROMPT = `You are DevMind, a smart and friendly AI assistant for developers.
You help with coding questions, debugging, code review, and explaining programming concepts.
Keep answers concise and practical. Format for Telegram using Markdown.
Use code blocks for code. Be direct, helpful, and professional. Max 2500 characters.`;

// Rule-based fallback for local testing
function ruleBasedAI(prompt) {
  const p = prompt.toLowerCase().trim();

  if (p.match(/^(hi|hello|hey|howdy|sup)\b/))
    return '👋 *Hello!* I\'m DevMind. Ask me anything about coding, or use /help to see all commands.';

  if (p.includes('async') && p.includes('await')) return `*Async/Await* handles asynchronous code cleanly:

\`\`\`js
// Callback (messy)
fetch(url, (err, data) => { ... });

// Promise chain
fetch(url).then(r => r.json()).then(data => ...);

// Async/await (cleanest)
async function getData(url) {
  const res = await fetch(url);
  return await res.json();
}
\`\`\`

Under the hood it uses Promises. Use \`try/catch\` for error handling.`;

  if (p.includes('fibonacci') || p.includes('fib')) return `*Fibonacci* — three ways:

\`\`\`js
// Recursive (slow — O(2^n))
const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);

// Memoized (fast — O(n))
function fib(n, m = {}) {
  if (n in m) return m[n];
  if (n <= 1) return n;
  return m[n] = fib(n-1,m) + fib(n-2,m);
}

// Iterative (best — O(n) time, O(1) space)
function fib(n) {
  let [a, b] = [0, 1];
  for (let i = 0; i < n; i++) [a,b] = [b, a+b];
  return a;
}
\`\`\``;

  if (p.includes('sort') && p.includes('array')) return `*Sorting arrays* in JavaScript:

\`\`\`js
// Numbers (ascending)
[3,1,4,1,5].sort((a, b) => a - b);  // [1,1,3,4,5]

// Numbers (descending)
[3,1,4].sort((a, b) => b - a);       // [4,3,1]

// Strings
['banana','apple'].sort();           // alphabetical

// Objects by property
users.sort((a, b) => a.age - b.age);
\`\`\``;

  if (p.includes('reverse') && p.includes('string')) return `*Reverse a string:*

\`\`\`js
// JavaScript
'hello'.split('').reverse().join('')  // 'olleh'

// ES2023 (toReversed doesn't work on strings, use split)
[...'hello'].reverse().join('')
\`\`\`

\`\`\`python
# Python
s[::-1]   # 'olleh'
''.join(reversed(s))
\`\`\``;

  if (p.includes('big o') || p.includes('time complexity')) return `*Big O Complexity* — fastest to slowest:

| O(1) | Constant | Array index |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Single loop |
| O(n log n) | Linearithmic | Merge sort |
| O(n²) | Quadratic | Nested loops |
| O(2ⁿ) | Exponential | Recursive fib |

*Goal:* Always prefer O(1) or O(log n).`;

  if (p.includes('git')) return `*Essential Git Commands:*

\`\`\`bash
git init / git clone <url>
git add . && git commit -m "msg"
git push origin main / git pull
git branch feat / git checkout feat
git merge feat / git rebase main
git stash / git stash pop
git log --oneline --graph
git diff / git status
git reset --hard HEAD~1   # undo last commit
git cherry-pick <hash>
\`\`\``;

  if (p.includes('docker')) return `*Docker quick reference:*

\`\`\`bash
docker build -t myapp .
docker run -p 3000:3000 myapp
docker ps                    # list running
docker exec -it <id> sh      # enter container
docker-compose up -d

# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci --production
COPY . .
CMD ["node", "server.js"]
\`\`\``;

  if (p.includes('sql') && p.includes('join')) return `*SQL JOINs:*

\`\`\`sql
-- INNER: matching rows only
SELECT * FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT: all users, even without orders
SELECT * FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- FULL OUTER: everything
SELECT * FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;
\`\`\``;

  if (p.includes('promise')) return `*Promises in JavaScript:*

\`\`\`js
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve('done!'), 1000);
});

// Then/catch
p.then(val => console.log(val))
 .catch(err => console.error(err));

// Parallel execution
const [a, b] = await Promise.all([p1, p2]);

// First to resolve
const fastest = await Promise.race([p1, p2]);

// All settle (no throw)
const results = await Promise.allSettled([p1, p2]);
\`\`\``;

  if ((p.includes('css') || p.includes('flex')) && p.includes('center')) return `*CSS Centering — modern ways:*

\`\`\`css
/* Flexbox */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

/* Grid (simplest) */
.container {
  display: grid;
  place-items: center;
  height: 100vh;
}

/* Absolute positioning */
.item {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}
\`\`\``;

  if (p.includes('react')) return `*React* — core concepts:

*Components:* Reusable UI pieces
*JSX:* HTML-like syntax in JS
*State:* Data that changes (\`useState\`)
*Props:* Data passed to child components
*Effects:* Side effects (\`useEffect\`)

\`\`\`jsx
function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\``;

  if (p.includes('typescript') || p.includes(' ts ')) return `*TypeScript* basics:

\`\`\`ts
// Types
type User = { id: number; name: string; email?: string };

// Interface
interface API {
  get(url: string): Promise<Response>;
}

// Generic function
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Union & intersection
type ID = string | number;
type Admin = User & { role: 'admin' };

// Enum
enum Status { Active, Inactive, Pending }
\`\`\``;

  return `🤖 *DevMind AI*

I'm running in *local mode*. In production on Cloudflare Workers, I use *Llama 3.1 8B* for real AI answers.

Try these:
\`/ask what is async await\`
\`/ask how to sort array\`
\`/ask git commands\`
\`/ask big O notation\`
\`/ask how docker works\`
\`/ask css center element\`
\`/ask typescript basics\`
\`/ask react hooks\``;
}

export async function askAI(env, prompt) {
  // Production: Cloudflare Workers AI — Llama 3.1 8B (free tier!)
  if (env.AI) {
    try {
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt.slice(0, 3000) },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });
      const text = response?.response || response?.result?.response || '';
      return text.trim() || null;
    } catch (err) {
      console.error('Workers AI error:', err.message);
      // Fall through to rule-based
    }
  }
  return ruleBasedAI(prompt);
}

export async function reviewCode(env, code) {
  const prompt = `Review this code concisely:
1. What it does (1 line)
2. Issues/bugs found
3. Specific improvements
4. Fixed version if needed

\`\`\`
${code.slice(0, 2000)}
\`\`\``;
  return askAI(env, prompt);
}

export async function explainConcept(env, concept) {
  return askAI(env, `Explain "${concept.slice(0, 200)}" for a developer in simple terms. Include a short code example if relevant.`);
}

export async function fixCode(env, code) {
  return askAI(env, `Find and fix bugs in this code. Show the fixed version with a brief explanation of what was wrong:\n\`\`\`\n${code.slice(0, 2000)}\n\`\`\``);
}

export async function generateCode(env, description) {
  return askAI(env, `Write clean, production-ready code for: ${description.slice(0, 500)}\nInclude brief comments for complex parts.`);
}

export async function summarizeText(env, text) {
  return askAI(env, `Summarize this text in 3-5 bullet points:\n\n${text.slice(0, 3000)}`);
}

export async function translateText(env, text, targetLang) {
  return askAI(env, `Translate the following text to ${targetLang}. Return only the translation:\n\n${text.slice(0, 2000)}`);
}
