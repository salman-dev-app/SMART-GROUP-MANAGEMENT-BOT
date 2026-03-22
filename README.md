# 🤖 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 — Developer Telegram Bot on Cloudflare Workers

A powerful, **fully modular** Telegram bot designed for developer-focused groups, running **100% free** on Cloudflare Workers. No external AI APIs, no paid services — just clean rule-based intelligence and great developer tooling.

> **Built by [Md Salman Biswas](https://github.com/salman-dev-app)** — Senior Software Engineer  
> 📧 mdsalmanhelp@gmail.com · 📱 [Telegram](https://t.me/Otakuosenpai) · [Facebook](https://facebook.com/salmandevapp)

---

## ✨ Feature Overview

| Category | Features |
|---|---|
| 🛡️ **Smart Moderation** | Spam filter, warn/ban/mute/unban, auto-ban on 3 warnings |
| 💬 **Conversational AI** | 15+ dev topics with rule-based pattern matching |
| 🛠️ **Developer Tools** | JSON format, Base64, SHA-256, UUID, Regex, Timestamps, Color, URL encode |
| 📝 **Code Snippets** | 10 languages: JS, Python, Go, Rust, TypeScript, Java, C++, SQL, Bash, CSS |
| 🎉 **Fun Commands** | 30+ jokes, 30+ quotes, polls, magic 8-ball, dice |
| 🌍 **Multi-Language** | 8 languages: EN, ES, FR, DE, PT, RU, ZH, AR |
| 💾 **Persistent State** | KV-backed warnings, user language prefs, statistics |

---

## 📁 Project Structure

```
devbot/
├── src/
│   ├── index.js               # Main worker entry point & command router
│   ├── modules/
│   │   ├── moderation.js      # Spam detection, warn/ban/mute handlers
│   │   ├── devtools.js        # JSON, hash, encode, regex, color, uuid…
│   │   ├── fun.js             # Jokes, quotes, polls, 8ball, dice
│   │   └── language.js        # Language switching logic
│   ├── data/
│   │   ├── languages.js       # All 8 language string tables
│   │   ├── conversations.js   # Rule-based NLP pattern engine
│   │   ├── snippets.js        # Code snippets for 10 languages
│   │   └── responses.js       # Jokes, quotes, 8-ball answers
│   └── utils/
│       ├── telegram.js        # Telegram Bot API wrapper
│       └── state.js           # KV/in-memory state manager
├── scripts/
│   ├── setup-webhook.mjs      # Webhook registration helper
│   ├── delete-webhook.mjs     # Webhook removal helper
│   └── test.mjs               # 54-test test suite
├── wrangler.toml              # Cloudflare Workers config
└── package.json
```

---

## 🚀 Quick Deployment Guide

### Prerequisites

- Node.js 18+
- A Cloudflare account (free)
- A Telegram account

---

### Step 1 — Create Your Bot

1. Open Telegram, search for **@BotFather**
2. Send `/newbot` and follow prompts
3. Copy your **BOT_TOKEN** (looks like `123456789:ABCdef...`)
4. Send `/setprivacy` → select your bot → choose **Disable** (so it can read group messages)

---

### Step 2 — Set Up Cloudflare Workers

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

---

### Step 3 — Clone & Configure

```bash
# Navigate into the project
cd devbot

# Install dev dependencies
npm install

# Create the KV namespace for persistent state
npm run kv:create
# → Copy the `id` from the output

npm run kv:create:preview
# → Copy the `preview_id` from the output
```

Edit `wrangler.toml` and replace the KV namespace IDs:

```toml
[[kv_namespaces]]
binding = "BOT_KV"
id = "paste-your-id-here"
preview_id = "paste-your-preview-id-here"

[vars]
BOT_USERNAME = "YourBotUsername"  # without @
```

---

### Step 4 — Set Secrets

```bash
# Required: your Telegram bot token
wrangler secret put BOT_TOKEN
# → Paste your token when prompted

# Optional but recommended: protects webhook from unauthorized calls
wrangler secret put WEBHOOK_SECRET
# → Enter a random string like: openssl rand -hex 32
```

---

### Step 5 — Deploy

```bash
npm run deploy
```

You'll see output like:
```
✅ Deployed to: https://devbot.yourname.workers.dev
```

---

### Step 6 — Register Webhook

```bash
BOT_TOKEN=your_token \
WORKER_URL=https://devbot.yourname.workers.dev \
npm run setup-webhook
```

Or visit in your browser:
```
https://devbot.yourname.workers.dev/setup
```

---

### Step 7 — Add Bot to Group

1. Add your bot to your Telegram developer group
2. **Promote it to Admin** (required for moderation: ban, mute, delete messages)
3. Send `/start` — you should receive the welcome message

---

## 💬 All Commands

### 📌 General

| Command | Description |
|---|---|
| `/start` | Show welcome message |
| `/help` | Full command reference |
| `/about` | About 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 |
| `/credit` | Developer profile & contact |
| `/ping` | Latency check |
| `/stats` | Bot usage statistics |

### 🛡️ Moderation *(admins only)*

| Command | Description |
|---|---|
| `/warn @user [reason]` | Warn a user (auto-bans at 3 warnings) |
| `/ban @user [reason]` | Ban a user immediately |
| `/unban @user` | Unban a user |
| `/mute @user [minutes]` | Mute a user (default: 10 min) |
| `/unmute @user` | Unmute a user |
| `/warnings @user` | Check warning count |
| `/clearwarns @user` | Clear all warnings |

> 💡 Tip: Reply to a message and use `/warn` without @user to warn that user.

### 🛠️ Developer Tools

| Command | Example |
|---|---|
| `/json <data>` | `/json {"key": "val"}` |
| `/encode <text>` | `/encode Hello World` |
| `/decode <b64>` | `/decode SGVsbG8=` |
| `/hash <text>` | `/hash my_password` |
| `/uuid` | Generates 3 UUID v4s |
| `/regex <pattern> <text>` | `/regex \d+ foo123` |
| `/snippet <lang>` | `/snippet py` |
| `/timestamp [unix]` | `/timestamp 1700000000` |
| `/color <hex/rgb>` | `/color #ff6b6b` |
| `/urlencode <text>` | `/urlencode hello world` |
| `/urldecode <text>` | `/urldecode hello%20world` |
| `/escape <html>` | `/escape <script>alert(1)</script>` |

**Snippet languages:** `js`, `py`, `go`, `rs`, `ts`, `java`, `cpp`, `sql`, `bash`, `css`

### 🎉 Fun

| Command | Description |
|---|---|
| `/joke` | Random developer joke |
| `/quote` | Developer wisdom quote |
| `/poll Q \| A \| B \| C` | Create a Telegram poll |
| `/8ball <question>` | Magic 8-ball answer |
| `/dice [sides]` | Roll dice (default d6) |

### 🌍 Language

| Command | Description |
|---|---|
| `/lang` | Show language menu |
| `/lang en` | Switch to English 🇺🇸 |
| `/lang es` | Switch to Español 🇪🇸 |
| `/lang fr` | Switch to Français 🇫🇷 |
| `/lang de` | Switch to Deutsch 🇩🇪 |
| `/lang pt` | Switch to Português 🇧🇷 |
| `/lang ru` | Switch to Русский 🇷🇺 |
| `/lang zh` | Switch to 中文 🇨🇳 |
| `/lang ar` | Switch to العربية 🇸🇦 |

---

## 💡 Conversational Topics

DevBot understands natural dev questions without commands:

| Topic | Example Query |
|---|---|
| JavaScript | "What are best practices for JavaScript?" |
| Python | "How do I start learning Python?" |
| Git | "Help me with git commands" |
| Docker | "How do I build a Docker container?" |
| REST API | "How do I design a REST API?" |
| Security | "How do I secure my API?" |
| Performance | "How do I improve performance?" |
| TypeScript | "Should I use TypeScript?" |
| Databases | "SQL vs NoSQL?" |
| Debugging | "How do I debug my code?" |
| Cloudflare | "Explain Cloudflare Workers" |
| Regex | "Help me with regex" |
| Code Review | "How to do a good code review?" |
| Telegram Bots | "How do I make a Telegram bot?" |

---

## 🧠 Auto-Moderation Rules

The bot **automatically detects and removes** spam:

| Rule | Trigger |
|---|---|
| 🔗 Telegram invite links | `t.me/channelname` |
| 💰 Crypto/scam patterns | "earn 100x profit", "free token" |
| 🔤 Excessive ALL CAPS | >80% uppercase in >20 char messages |
| 🔄 Repeated chars | Same char 10+ times in a row |
| 🌊 URL flooding | 3+ URLs in one message |
| ⚡ Rate limiting | >8 messages per minute |

**Warning progression:**
```
1st warning  → ⚠️ User warned
2nd warning  → ⚠️ User warned again
3rd warning  → 🔨 Auto-ban
```

---

## 🔧 Local Development

```bash
# Start local dev server (uses in-memory state, no KV required)
npm run dev

# View real-time logs from deployed worker
npm run logs

# Run all tests
npm test
```

For local testing with a real webhook, use [ngrok](https://ngrok.com/):

```bash
# In terminal 1: start local worker
npm run dev

# In terminal 2: expose locally
ngrok http 8787

# Set webhook to ngrok URL
BOT_TOKEN=xxx WORKER_URL=https://abc123.ngrok.io npm run setup-webhook
```

---

## ⚡ Cloudflare Workers Free Tier Limits

| Resource | Free Limit | DevBot Usage |
|---|---|---|
| Requests/day | 100,000 | ✅ Very low for a bot |
| CPU time | 10ms/request | ✅ All operations <5ms |
| Memory | 128MB | ✅ ~2MB typical |
| KV reads/day | 100,000 | ✅ Minimal per message |
| KV writes/day | 1,000 | ✅ Only on state changes |
| Workers | Unlimited | ✅ |

A typical developer group with 100 active users generates ~5,000 requests/day — well within the free tier.

---

## 🔐 Security

- **Webhook secret**: Set `WEBHOOK_SECRET` to reject requests not from Telegram
- **Admin verification**: All moderation commands verify admin status via Telegram API
- **No external AI APIs**: Fully self-contained, no data leaves Cloudflare
- **No user data storage**: Only stores warning counts and language preferences

---

## 🛠️ Extending DevBot

### Add a new command

```javascript
// In src/index.js, add to the switch block:
case 'mycommand':
  return handleMyCommand(token, msg, args, lang);
```

### Add a new language

```javascript
// In src/data/languages.js, add to LANGUAGES:
export const LANGUAGES = {
  // ... existing languages ...
  hi: {
    name: 'हिन्दी',
    flag: '🇮🇳',
    strings: {
      welcome: '👋 *DevBot में आपका स्वागत है!*',
      // ... all required keys ...
    }
  }
};
```

### Add new conversation patterns

```javascript
// In src/data/conversations.js, add to CONVERSATION_PATTERNS:
{
  patterns: [/\bkubernetes|k8s\b.*(tips?|help|guide)/i],
  intent: 'kubernetes',
  responses: [
    "🚢 **Kubernetes Quick Guide:** ..."
  ]
}
```

### Add code snippets

```javascript
// In src/data/snippets.js, add to CODE_SNIPPETS:
swift: {
  label: 'Swift',
  snippets: [{
    title: '📱 Codable Protocol',
    code: `struct User: Codable { ... }`
  }]
}
```

---

## 📊 Architecture Diagram

```
Telegram User
     │
     │ Message/Command
     ▼
Telegram Servers
     │
     │ POST /webhook
     ▼
Cloudflare Workers (Edge)
     │
     ├─── Auto-moderation check
     │         │
     │    [spam detected] → deleteMessage + warn
     │
     ├─── Command router
     │    ├── /json, /encode, /hash, ... → devtools.js
     │    ├── /warn, /ban, /mute, ...    → moderation.js
     │    ├── /joke, /poll, /8ball, ...  → fun.js
     │    └── /lang, /start, /help       → language.js
     │
     ├─── Conversational NLP
     │    └── Pattern matching → matchConversation()
     │
     └─── State (KV)
          ├── Warnings: warn:chatId:userId
          ├── Language: lang:userId, lang:chat:chatId
          └── Stats:    stats:commands, stats:spam, ...
```

---

## 📜 License

MIT License — Free to use, modify, and deploy.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Run tests: `npm test`
4. Submit a pull request

---

---

## 👨‍💻 Developer

**Md Salman Biswas** — Senior Software Engineer

| | |
|---|---|
| 🐙 GitHub | [github.com/salman-dev-app](https://github.com/salman-dev-app) |
| 📧 Email | mdsalmanhelp@gmail.com |
| 💬 Telegram | [@Otakuosenpai](https://t.me/Otakuosenpai) |
| 📘 Facebook | [salmandevapp](https://facebook.com/salmandevapp) |
| 🌐 Expertise | Scalable enterprise apps, cloud architecture, open-source |

*Built with ❤️ for the developer community. Running on Cloudflare Workers — fast, free, and global.*
