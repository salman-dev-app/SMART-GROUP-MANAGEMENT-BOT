/**
 * Rule-based conversational AI engine
 * Pattern matching with intent classification and contextual responses
 */

const CONVERSATION_PATTERNS = [
  //  Greetings 
  {
    patterns: [/\b(hi|hello|hey|howdy|sup|yo|greetings|hola|salut|bonjour)\b/i],
    intent: 'greeting',
    responses: [
      "Hey there! 👋 Ready to talk dev? Ask me anything about coding!",
      "Hello! 😄 I'm DevBot — your developer assistant. What's on your mind?",
      "Hey! 💻 What are we building today?",
      "Hi! How can I help you with your code today? 🚀",
    ]
  },

  //  How are you 
  {
    patterns: [/how are you|how('s| is) it going|what'?s up|how do you do/i],
    intent: 'how_are_you',
    responses: [
      "I'm running at 100% uptime on Cloudflare Workers! ⚡ No downtime, no exceptions.",
      "All systems operational! 🟢 Ready to debug your code.",
      "Running great — no memory leaks detected! 😄 How about you?",
      "Feeling compiled and optimized! 💪 What can I help with?",
    ]
  },

  //  Thanks 
  {
    patterns: [/\b(thanks|thank you|thx|ty|cheers|appreciate)\b/i],
    intent: 'thanks',
    responses: [
      "You're welcome! 😊 Happy to help anytime.",
      "Anytime! That's what I'm here for. 🤖",
      "No problem! Feel free to ask more. 🚀",
      "Happy to help! Come back if you need anything. 👋",
    ]
  },

  //  Goodbye 
  {
    patterns: [/\b(bye|goodbye|see you|cya|later|gotta go|ttyl|gtg)\b/i],
    intent: 'goodbye',
    responses: [
      "Goodbye! Happy coding! 👋💻",
      "See you! Remember: git commit -m 'goodbye' 😄",
      "Later! May your code be bug-free! 🐛✨",
      "Take care! Don't forget to push your changes! 🚀",
    ]
  },

  //  What can you do 
  {
    patterns: [/what can you do|what are your features|capabilities|how to use/i],
    intent: 'capabilities',
    responses: [
      "I can help with:\n\n🛡️ **Moderation** – Spam filtering, warn/ban/mute\n🛠️ **Dev Tools** – `/json`, `/hash`, `/encode`, `/uuid`, `/regex`, `/snippet`\n🎉 **Fun** – `/joke`, `/quote`, `/poll`, `/8ball`\n🌍 **Multi-lang** – `/lang`\n\nType /help for all commands!",
    ]
  },

  //  JavaScript 
  {
    patterns: [/\b(javascript|js|node\.?js|node js)\b.*\b(learn|start|tutorial|guide|tips?|best practice)/i,
               /best practice.*\b(javascript|js)\b/i],
    intent: 'learn_js',
    responses: [
      "📚 **JavaScript Learning Path:**\n\n1. **Basics**: Variables, functions, loops\n2. **ES6+**: Arrow functions, destructuring, spread/rest, modules\n3. **Async**: Promises, async/await, event loop\n4. **DOM**: Browser APIs, events, fetch\n5. **Node.js**: Server-side JS, npm ecosystem\n\n**Resources:** MDN Web Docs, javascript.info, Node.js docs\n\nTry `/snippet js` for code examples!",
    ]
  },

  //  Python 
  {
    patterns: [/\b(python|py)\b.*\b(learn|start|tutorial|guide|tips?|best practice)/i,
               /best practice.*\bpython\b/i],
    intent: 'learn_python',
    responses: [
      "🐍 **Python Learning Path:**\n\n1. **Basics**: Data types, functions, OOP\n2. **Standard Library**: collections, itertools, pathlib\n3. **Modern Python**: dataclasses, type hints, walrus operator\n4. **Async**: asyncio, aiohttp\n5. **Testing**: pytest, unittest\n\n**Resources:** docs.python.org, Real Python, Python Cookbook\n\nTry `/snippet py` for examples!",
    ]
  },

  //  Git 
  {
    patterns: [/\bgit\b.*(help|command|tips?|cheat|workflow|reset|rebase|merge|conflict|undo|commit|push|pull)/i,
               /(git|version control|vcs).*(how|what|explain)/i,
               /help.*\bgit\b/i],
    intent: 'git_help',
    responses: [
      "🔧 **Essential Git Commands:**\n\n```\ngit init              # Initialize repo\ngit clone <url>       # Clone repo\ngit status            # Check changes\ngit add .             # Stage all\ngit commit -m \"msg\"   # Commit\ngit push origin main  # Push\ngit pull              # Pull latest\ngit branch -b feat    # New branch\ngit merge feat        # Merge branch\ngit stash             # Stash changes\ngit log --oneline     # View history\ngit reset --hard HEAD # Undo changes\n```\n\n💡 Tip: Use `git rebase -i HEAD~3` to squash commits!",
    ]
  },

  //  Docker 
  {
    patterns: [/\bdocker\b.*(help|command|tips?|cheat|compose|container|image|build)/i,
               /(docker|container|containerize).*(how|what|explain|example)/i],
    intent: 'docker_help',
    responses: [
      "🐳 **Docker Quick Reference:**\n\n```\ndocker build -t app .      # Build image\ndocker run -p 3000:3000 app # Run container\ndocker ps                  # List containers\ndocker stop <id>           # Stop container\ndocker logs <id>           # View logs\ndocker exec -it <id> sh   # Shell into container\ndocker-compose up -d       # Start compose\ndocker system prune        # Clean up\n```\n\n**Example Dockerfile:**\n```dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE 3000\nCMD [\"node\", \"server.js\"]\n```",
    ]
  },

  //  REST API 
  {
    patterns: [/(rest|restful|api).*(design|best practice|principle|guide|tips?)/i,
               /how.*(design|build|create).*(api|rest|endpoint)/i],
    intent: 'rest_api',
    responses: [
      "🌐 **REST API Best Practices:**\n\n✅ Use nouns in endpoints: `/users` not `/getUsers`\n✅ HTTP methods: GET=read, POST=create, PUT=replace, PATCH=update, DELETE=remove\n✅ Proper status codes: 200, 201, 400, 401, 403, 404, 500\n✅ Version your API: `/api/v1/users`\n✅ Use pagination: `?page=1&limit=20`\n✅ Return consistent JSON structure\n✅ Validate inputs & sanitize outputs\n✅ Use HTTPS always\n\n**Example response structure:**\n```json\n{\n  \"data\": {...},\n  \"meta\": { \"page\": 1, \"total\": 100 },\n  \"error\": null\n}\n```",
    ]
  },

  //  Debugging 
  {
    patterns: [/\b(debug|debugging|bug|error|fix|troubleshoot)\b.*(how|tips?|help|strategy|approach)/i,
               /how.*(find|fix|solve).*(bug|error|issue|problem)/i],
    intent: 'debugging',
    responses: [
      "🐛 **Debugging Strategies:**\n\n1. **Reproduce it**: Minimal reproducible example\n2. **Isolate**: Comment out code, binary search the bug\n3. **Read the error**: Stack trace → file → line number\n4. **Console/logs**: Add strategic logging\n5. **Rubber duck**: Explain the problem out loud\n6. **Check assumptions**: Verify your data/types\n7. **Google the exact error**: You're not alone!\n8. **Stack Overflow**: 99% it's been asked before\n9. **Sleep on it**: Fresh eyes catch bugs\n10. **Ask for help**: Describe what you tried!\n\n💡 Tools: Browser DevTools, debugger statements, Postman, curl",
    ]
  },

  //  Database 
  {
    patterns: [/(database|sql|nosql|postgres|mysql|mongodb|redis).*(tips?|best practice|choose|compare|difference)/i,
               /sql vs nosql|relational vs document/i],
    intent: 'database',
    responses: [
      "🗄️ **Database Selection Guide:**\n\n**SQL (PostgreSQL, MySQL):**\n✅ Complex relationships & joins\n✅ ACID transactions\n✅ Structured data with schema\n✅ Analytics & reporting\n\n**NoSQL - Document (MongoDB):**\n✅ Flexible schema\n✅ Nested/hierarchical data\n✅ Rapid prototyping\n\n**NoSQL - Key-Value (Redis):**\n✅ Caching, sessions\n✅ Pub/Sub messaging\n✅ Ultra-low latency\n\n**General tips:**\n• Index columns you filter/sort by\n• Avoid N+1 queries (use JOINs or batch loads)\n• Use connection pooling\n• Plan your schema before coding!",
    ]
  },

  //  Security 
  {
    patterns: [/(security|secure|xss|sql injection|csrf|authentication|authorization|jwt|oauth).*(tips?|best practice|guide|how)/i,
               /how.*(secure|protect|prevent).*(app|api|website|endpoint)/i],
    intent: 'security',
    responses: [
      "🔐 **Web Security Essentials:**\n\n**Authentication:**\n• Use bcrypt/argon2 for password hashing\n• Implement MFA/2FA\n• Short-lived JWTs + refresh tokens\n• HTTPS everywhere\n\n**Input Validation:**\n• Validate all inputs server-side\n• Parameterized queries (prevent SQL injection)\n• Sanitize HTML (prevent XSS)\n• CSRF tokens for forms\n\n**Headers:**\n```\nContent-Security-Policy\nX-Frame-Options: DENY\nX-Content-Type-Options: nosniff\nStrict-Transport-Security\n```\n\n**General:**\n• Never store secrets in code → use env vars\n• Rate limiting on all endpoints\n• Log security events\n• Keep dependencies updated",
    ]
  },

  //  Performance 
  {
    patterns: [/(performance|optimize|speed|fast|slow|latency|bottleneck).*(tips?|improve|how|guide)/i,
               /how.*(improve|increase|optimize).*(performance|speed)/i],
    intent: 'performance',
    responses: [
      "⚡ **Performance Optimization Tips:**\n\n**Backend:**\n• Cache aggressively (Redis, CDN)\n• Database indexes & query optimization\n• Connection pooling\n• Async I/O, avoid blocking operations\n• Horizontal scaling\n\n**Frontend:**\n• Lazy load images & routes\n• Code splitting & tree shaking\n• Minimize/compress assets\n• Use CDN for static files\n• Browser caching headers\n\n**Measurement first:**\n```\n# Backend profiling\nNode.js: --prof flag, Clinic.js\nPython: cProfile, py-spy\n\n# Frontend\nChrome DevTools Lighthouse\nWeb Vitals (CLS, LCP, FID)\n```\n💡 Profile first, optimize later!",
    ]
  },

  //  Cloud/Serverless 
  {
    patterns: [/(cloudflare|aws|gcp|azure|serverless|workers|lambda|edge).*(tips?|guide|difference|explain|how)/i],
    intent: 'cloud',
    responses: [
      "☁️ **Serverless/Edge Computing:**\n\n**Cloudflare Workers:**\n• V8 isolates, ~0ms cold start\n• 100k req/day free\n• Global edge network\n• KV, D1, R2, Durable Objects\n\n**AWS Lambda:**\n• 1M req/month free\n• Multiple runtimes\n• Great ecosystem\n• Cold start: 100ms-1s\n\n**When to use serverless:**\n✅ Event-driven workloads\n✅ Variable/spiky traffic\n✅ Simple CRUD APIs\n❌ Long-running processes (>15min)\n❌ Heavy CPU workloads\n\n**This bot runs on Cloudflare Workers!** It's perfect for Telegram bots — webhook-based, stateless, fast. 🚀",
    ]
  },

  //  TypeScript 
  {
    patterns: [/\btypescript\b.*(tips?|guide|learn|help|best practice|vs javascript)/i,
               /typescript vs javascript|should i use typescript/i],
    intent: 'typescript',
    responses: [
      "🔷 **TypeScript Benefits & Tips:**\n\n**Why TypeScript?**\n✅ Catch errors at compile time\n✅ Better IDE autocomplete\n✅ Self-documenting code\n✅ Easier refactoring\n✅ Type inference (less boilerplate)\n\n**Essential tips:**\n```typescript\n// Use strict mode\n{ \"strict\": true } // tsconfig.json\n\n// Prefer interfaces for objects\ninterface User { id: number; name: string; }\n\n// Use union types\ntype Status = 'active' | 'inactive' | 'banned';\n\n// Utility types\ntype PartialUser = Partial<User>;\ntype ReadonlyUser = Readonly<User>;\ntype UserKeys = keyof User;\n```\nTry `/snippet ts` for more examples!",
    ]
  },

  //  Code review 
  {
    patterns: [/(code review|pr|pull request).*(tips?|best practice|how|guide)/i,
               /how.*(review|write).*(code|pr|pull request)/i],
    intent: 'code_review',
    responses: [
      "👀 **Code Review Best Practices:**\n\n**As a reviewer:**\n✅ Be kind, critique code not people\n✅ Ask questions instead of making demands\n✅ Explain the 'why' of suggestions\n✅ Approve/request changes clearly\n✅ Limit to ~400 LOC per review\n\n**As an author:**\n✅ Small, focused PRs\n✅ Write good PR descriptions\n✅ Self-review first\n✅ Respond to all comments\n✅ Test before submitting\n\n**PR template:**\n```\n## What changed?\n## Why?\n## How to test?\n## Screenshots (if UI)\n```",
    ]
  },

  //  Bot / Telegram 
  {
    patterns: [/(telegram|bot|webhook|polling).*(how|make|build|create|setup)/i,
               /how.*(make|build|create).*(telegram bot|bot)/i],
    intent: 'telegram_bot',
    responses: [
      "🤖 **Building Telegram Bots:**\n\n**1. Create your bot:**\n• Message @BotFather on Telegram\n• Use `/newbot` command\n• Get your `BOT_TOKEN`\n\n**2. Choose deployment:**\n• **Cloudflare Workers** (this bot!) – free, fast, global\n• **Railway/Render** – easy Node.js/Python hosting\n• **VPS** – full control\n\n**3. Set webhook:**\n```\ncurl -X POST \\\n  https://api.telegram.org/bot{TOKEN}/setWebhook \\\n  -d url=https://your-worker.dev/webhook\n```\n\n**4. Handle updates:**\nReceive POST requests, parse `message` object, call `sendMessage` API.\n\nThis bot is open source — check the README for deployment!",
    ]
  },

  //  Regex 
  {
    patterns: [/(regex|regular expression).*(help|explain|how|tips?|learn|guide)/i],
    intent: 'regex_help',
    responses: [
      "🔍 **Regex Quick Reference:**\n\n```\n.       Any character (except newline)\n*       0 or more\n+       1 or more\n?       0 or 1 (optional)\n{n,m}   Between n and m times\n^       Start of string\n$       End of string\n[abc]   Character class\n[^abc]  Negated class\n(...)   Capture group\n(?:...) Non-capture group\n\\d      Digit [0-9]\n\\w      Word char [a-zA-Z0-9_]\n\\s      Whitespace\n\\b      Word boundary\n```\n\n**Common patterns:**\n```regex\nEmail:     ^[\\w.-]+@[\\w.-]+\\.\\w{2,}$\nURL:       https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]+\nDate:      \\d{4}-\\d{2}-\\d{2}\nUUID:      [0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}\n```\nTest regex with `/regex` command!",
    ]
  },

  //  Random 
  {
    patterns: [/\b(random|fun fact|interesting|did you know)\b/i],
    intent: 'fun_fact',
    responses: [
      "💡 **Dev Fun Fact:** The first computer bug was an actual bug! In 1947, Grace Hopper found a moth in the Harvard Mark II computer, causing a malfunction. The term 'debugging' was born! 🦋",
      "💡 **Dev Fun Fact:** The Python language was named after Monty Python's Flying Circus, not the snake! 🐍🎭",
      "💡 **Dev Fun Fact:** The average developer spends 50% of programming time debugging their own code. The 'printf debugging' technique is still used by seasoned engineers! 🖨️",
      "💡 **Dev Fun Fact:** JavaScript was created in just 10 days by Brendan Eich in 1995. It was originally called 'Mocha', then 'LiveScript', before becoming JavaScript! ⚡",
      "💡 **Dev Fun Fact:** Git was created by Linus Torvalds in 2005 in just 10 days to manage the Linux kernel source code. He named it after himself — a British slang for 'unpleasant person'! 😄",
    ]
  },

  //  Feeling stuck 
  {
    patterns: [/\b(stuck|frustrated|help me|lost|confused|don'?t understand|what.*do)\b.*\b(code|bug|problem|issue)\b/i,
               /\b(i'?m? ?(stuck|lost|confused))\b/i],
    intent: 'stuck',
    responses: [
      "💪 Don't worry! Every developer gets stuck. Here's what to try:\n\n1. **Take a break** — Walk away for 10 min, seriously works!\n2. **Rubber duck it** — Explain the problem out loud\n3. **Google the exact error** message\n4. **Simplify** — Comment out code until it works, then add back\n5. **Check the docs** — RTFM saves the day 📖\n6. **Ask here!** — Paste your error and I'll help!\n\nYou've got this! 🚀",
    ]
  },

  //  Best programming language 
  {
    patterns: [/(best|which|what).*(programming|coding).*(language|lang)/i,
               /(should i|what).*(learn|use|pick|choose).*(language|lang|programming)/i],
    intent: 'best_language',
    responses: [
      "🗺️ **Language Recommendations by Goal:**\n\n**Web Frontend:** JavaScript/TypeScript (no choice! 😄)\n**Web Backend:** Node.js, Python, Go, Java\n**Mobile:** Swift (iOS), Kotlin (Android), Flutter/Dart (cross-platform)\n**Data Science/AI:** Python (dominant)\n**Systems/Performance:** Rust, C, C++\n**DevOps/Scripting:** Bash, Python, Go\n**Game Dev:** C#, C++, Lua\n\n**Beginner?** → Start with Python or JavaScript\n**Job market?** → JavaScript/TypeScript or Python\n**Performance?** → Go or Rust\n\n*The best language is the one that solves your problem!* 🎯",
    ]
  },

  //  Fallback / General 
  {
    patterns: [/.*/],
    intent: 'fallback',
    responses: [
      "I'm not sure I understand that fully, but I'm a developer-focused bot! 🤖\n\nTry asking me about:\n• Git, Docker, REST APIs\n• Python, JavaScript, TypeScript, Go\n• Security, performance, debugging\n• Or use `/help` to see all commands!",
      "That's an interesting one! 🤔 I work best with developer questions.\n\nTry: 'How do I debug JavaScript?' or use `/snippet js` for code examples!\n\nType `/help` for all features.",
    ]
  }
];

/**
 * Match a message to a conversational pattern
 * @param {string} text
 * @returns {{ intent: string, response: string } | null}
 */
export function matchConversation(text) {
  if (!text || text.startsWith('/')) return null;

  const lower = text.toLowerCase().trim();

  for (const entry of CONVERSATION_PATTERNS) {
    for (const pattern of entry.patterns) {
      if (pattern.test(lower)) {
        const responses = entry.responses;
        return {
          intent: entry.intent,
          response: responses[Math.floor(Math.random() * responses.length)]
        };
      }
    }
  }
  return null;
}
