// Developer Tools Module
import { sendMessage, editMessageText, answerCallbackQuery, inlineKeyboard, sendChatAction } from '../utils/telegram.js';
import { getSnippet, getRandomSnippet } from '../data/snippets.js';
import { t } from '../data/languages.js';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function safeCalc(expr) {
  const clean = expr.replace(/\s/g, '').replace(/[×x]/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
  if (!/^[\d+\-*/.()%\s]+$/.test(clean)) return null;
  try {
    const r = Function('"use strict"; return (' + clean + ')')();
    return isFinite(r) ? r : null;
  } catch { return null; }
}

function generatePassword(len = 16, type = 'strong') {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const chars = type === 'pin' ? digits
    : type === 'simple' ? lower + upper + digits
    : lower + upper + digits + symbols;
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const HOME_BTN = [{ text: '🏠 Home', data: 'home' }];

export async function handleJson(token, msg, args) {
  const chatId = msg.chat.id;
  const input = args.join(' ').trim();
  if (!input) return sendMessage(token, chatId,
    `🗂 *JSON Formatter*\n\nUsage: \`/json {"key":"value"}\``,
    { replyMarkup: inlineKeyboard([HOME_BTN]) });
  try {
    const parsed = JSON.parse(input);
    const fmt = JSON.stringify(parsed, null, 2);
    const type = Array.isArray(parsed) ? `Array[${parsed.length}]` : typeof parsed;
    const keys = typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed).length : null;
    return sendMessage(token, chatId,
      `✅ *Valid JSON*\n\n` +
      `Type: \`${type}\`${keys !== null ? `  Keys: \`${keys}\`` : ''}\n` +
      `Size: \`${input.length} bytes\`\n\n` +
      `\`\`\`json\n${fmt.slice(0, 3000)}\n\`\`\``,
      { replyMarkup: inlineKeyboard([HOME_BTN]) });
  } catch (e) {
    return sendMessage(token, chatId,
      `❌ *Invalid JSON*\n\n\`${e.message}\``,
      { replyMarkup: inlineKeyboard([HOME_BTN]) });
  }
}

export async function handleHash(token, msg, args) {
  const chatId = msg.chat.id;
  const input = args.join(' ').trim();
  if (!input) return sendMessage(token, chatId, '❌ Usage: `/hash <text>`');
  const hash = await sha256(input);
  return sendMessage(token, chatId,
    `🔒 *SHA-256 Hash*\n\nInput: \`${input.slice(0, 60)}${input.length > 60 ? '…' : ''}\`\n\nHash:\n\`${hash}\`\n\n_256-bit · 64 hex chars_`,
    { replyMarkup: inlineKeyboard([[{ text: '🔄 Hash Another', data: 'tool:hash' }, ...HOME_BTN]]) });
}

export async function handleUuid(token, msg, args) {
  const chatId = msg.chat.id;
  const count = Math.min(parseInt(args[0]) || 3, 10);
  const uuids = Array.from({ length: count }, generateUUID);
  return sendMessage(token, chatId,
    `🆔 *UUID v4 Generator*\n\n${uuids.map((u, i) => `${i + 1}. \`${u}\``).join('\n')}\n\n_Tap to copy_`,
    { replyMarkup: inlineKeyboard([[{ text: '🔄 Generate More', data: 'uuid:new' }, ...HOME_BTN]]) });
}

export async function handleEncode(token, msg, args) {
  const chatId = msg.chat.id;
  const input = args.join(' ');
  if (!input.trim()) return sendMessage(token, chatId, '❌ Usage: `/encode <text>`');
  const encoded = btoa(unescape(encodeURIComponent(input)));
  return sendMessage(token, chatId,
    `🔤 *Base64 Encode*\n\nInput: \`${input.slice(0, 60)}\`\n\nOutput:\n\`${encoded}\``,
    { replyMarkup: inlineKeyboard([HOME_BTN]) });
}

export async function handleDecode(token, msg, args) {
  const chatId = msg.chat.id;
  const input = args.join(' ').trim();
  if (!input) return sendMessage(token, chatId, '❌ Usage: `/decode <base64>`');
  try {
    const decoded = decodeURIComponent(escape(atob(input)));
    return sendMessage(token, chatId,
      `🔤 *Base64 Decode*\n\nOutput:\n\`${decoded.slice(0, 500)}\``,
      { replyMarkup: inlineKeyboard([HOME_BTN]) });
  } catch {
    return sendMessage(token, chatId, '❌ *Invalid Base64 string.*');
  }
}

export async function handleCalc(token, msg, args) {
  const chatId = msg.chat.id;
  const expr = args.join(' ').trim();
  if (!expr) return sendMessage(token, chatId,
    `🧮 *Calculator*\n\nUsage: \`/calc (2 + 3) * 4\`\n\nSupports: \`+ - * / % ^ ()\``,
    { replyMarkup: inlineKeyboard([HOME_BTN]) });
  const result = safeCalc(expr);
  if (result === null) return sendMessage(token, chatId, '❌ *Invalid expression.* Only numbers and `+ - * / % ^ ()` allowed.');
  const display = Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, '');
  return sendMessage(token, chatId,
    `🧮 *Calculator*\n\n\`${expr}\`\n\n= *${display}*`,
    { replyMarkup: inlineKeyboard([[{ text: '🧮 Calculate Again', data: 'tool:calc' }, ...HOME_BTN]]) });
}

export async function handlePassword(token, msg, args) {
  const chatId = msg.chat.id;
  const len = Math.min(Math.max(parseInt(args[0]) || 16, 4), 128);
  const type = (args[1] || 'strong').toLowerCase();
  const labels = { strong: '🔐 Strong', simple: '🔡 Simple', pin: '🔢 PIN' };
  const passwords = Array.from({ length: 3 }, () => generatePassword(len, type));
  return sendMessage(token, chatId,
    `🔐 *Password Generator*\n\nType: ${labels[type] || labels.strong}  Length: \`${len}\`\n\n${passwords.map((p, i) => `${i + 1}. \`${p}\``).join('\n')}\n\n_Never share passwords!_`,
    { replyMarkup: inlineKeyboard([
      [{ text: '🔄 Regenerate', data: `pwd:${len}:${type}` }],
      [{ text: '🔐 Strong', data: 'pwd:16:strong' }, { text: '🔡 Simple', data: 'pwd:12:simple' }, { text: '🔢 PIN', data: 'pwd:6:pin' }],
      HOME_BTN,
    ]) });
}

export async function handleSnippet(token, msg, args) {
  const chatId = msg.chat.id;
  const langs = ['js', 'py', 'go', 'rs', 'ts', 'sql', 'bash', 'cpp', 'css', 'java'];
  const labels = { js: 'JS', py: 'Python', go: 'Go', rs: 'Rust', ts: 'TS', sql: 'SQL', bash: 'Bash', cpp: 'C++', css: 'CSS', java: 'Java' };

  if (!args[0] || args[0] === 'menu') {
    const rows = [];
    for (let i = 0; i < langs.length; i += 5)
      rows.push(langs.slice(i, i + 5).map(l => ({ text: labels[l], data: `snippet:${l}` })));
    rows.push([{ text: '🎲 Random', data: 'snippet:random' }, ...HOME_BTN]);
    return sendMessage(token, chatId,
      `💻 *Code Snippets*\n\nChoose a language:`,
      { replyMarkup: inlineKeyboard(rows) });
  }

  const lang = args[0] === 'random' ? langs[Math.floor(Math.random() * langs.length)] : args[0].toLowerCase();
  const snippet = getSnippet(lang);
  if (!snippet) return sendMessage(token, chatId, `❌ No snippet for \`${args[0]}\`\n\nAvailable: \`${langs.join(' ')}\``);
  return sendMessage(token, chatId,
    `💻 *${snippet.title}* — ${snippet.lang}\n\n\`\`\`${snippet.langKey}\n${snippet.code}\n\`\`\``,
    { replyMarkup: inlineKeyboard([
      [{ text: '🔄 Another', data: `snippet:${lang}` }, { text: '📚 All', data: 'snippet:menu' }],
      HOME_BTN,
    ]) });
}

export async function handleColor(token, msg, args) {
  const chatId = msg.chat.id;
  const input = args.join(' ').trim();
  if (!input) return sendMessage(token, chatId,
    `🎨 *Color Converter*\n\nUsage: \`/color #ff6b6b\` or \`/color rgb(255,107,107)\``);
  let rgb = null, hexStr = '';
  if (input.startsWith('#') || /^[0-9a-f]{6}$/i.test(input)) {
    rgb = hexToRgb(input.startsWith('#') ? input : `#${input}`);
    hexStr = (input.startsWith('#') ? input : `#${input}`).toUpperCase();
  } else if (/rgb\s*\(/i.test(input)) {
    const m = input.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) { rgb = { r: +m[1], g: +m[2], b: +m[3] }; hexStr = `#${[rgb.r,rgb.g,rgb.b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase()}`; }
  }
  if (!rgb) return sendMessage(token, chatId, '❌ Invalid color. Use `#RRGGBB` or `rgb(r,g,b)`');
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return sendMessage(token, chatId,
    `🎨 *Color Info*\n\nHEX: \`${hexStr}\`\nRGB: \`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\`\nHSL: \`hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)\``,
    { replyMarkup: inlineKeyboard([HOME_BTN]) });
}

export async function handleTimestamp(token, msg, args) {
  const chatId = msg.chat.id;
  const unix = args[0] ? parseInt(args[0]) : Math.floor(Date.now() / 1000);
  if (isNaN(unix)) return sendMessage(token, chatId, '❌ Invalid timestamp. Usage: `/timestamp 1700000000`');
  const d = new Date(unix * 1000);
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unix;
  const rel = diff < 60 ? `${diff}s ago` : diff < 3600 ? `${Math.floor(diff/60)}m ago` : diff < 86400 ? `${Math.floor(diff/3600)}h ago` : `${Math.floor(diff/86400)}d ago`;
  return sendMessage(token, chatId,
    `⏱ *Timestamp Converter*\n\nUnix: \`${unix}\`\nUTC:  \`${d.toUTCString()}\`\nISO:  \`${d.toISOString()}\`\nRel:  *${diff < 0 ? 'in the future' : rel}*`,
    { replyMarkup: inlineKeyboard([[{ text: '🕐 Now', data: 'ts:now' }, ...HOME_BTN]]) });
}

export async function handleUrlEncode(token, msg, args) {
  const chatId = msg.chat.id;
  const input = args.join(' ');
  if (!input.trim()) return sendMessage(token, chatId, '❌ Usage: `/urlencode <text>`');
  return sendMessage(token, chatId,
    `🔗 *URL Encode*\n\nInput: \`${input.slice(0, 100)}\`\n\nOutput:\n\`${encodeURIComponent(input)}\``,
    { replyMarkup: inlineKeyboard([HOME_BTN]) });
}

export async function handleUrlDecode(token, msg, args) {
  const chatId = msg.chat.id;
  const input = args.join(' ');
  if (!input.trim()) return sendMessage(token, chatId, '❌ Usage: `/urldecode <encoded>`');
  try {
    return sendMessage(token, chatId,
      `🔗 *URL Decode*\n\nOutput:\n\`${decodeURIComponent(input)}\``,
      { replyMarkup: inlineKeyboard([HOME_BTN]) });
  } catch { return sendMessage(token, chatId, '❌ Invalid URL-encoded string.'); }
}

export async function handleRegex(token, msg, args) {
  const chatId = msg.chat.id;
  if (args.length < 2) return sendMessage(token, chatId,
    `🔍 *Regex Tester*\n\nUsage: \`/regex <pattern> <text>\`\n\nExample:\n\`/regex \\d+ foo123 bar456\``);
  const [pattern, ...rest] = args;
  const text = rest.join(' ');
  try {
    const matches = [...text.matchAll(new RegExp(pattern, 'g'))];
    if (!matches.length) return sendMessage(token, chatId,
      `🔍 *Regex Tester*\n\nPattern: \`${pattern}\`\nText: \`${text.slice(0, 100)}\`\n\n❌ No matches`);
    return sendMessage(token, chatId,
      `🔍 *Regex Tester*\n\nPattern: \`${pattern}\`\nMatches: \`${matches.length}\`\n\n${matches.slice(0, 10).map((m, i) => `${i+1}. \`${m[0]}\` @ ${m.index}`).join('\n')}`);
  } catch (e) {
    return sendMessage(token, chatId, `❌ *Invalid regex:* \`${e.message}\``);
  }
}

export async function handlePing(token, msg) {
  const chatId = msg.chat.id;
  const start = Date.now();
  const m = await sendMessage(token, chatId, '🏓 Pinging...');
  const ms = Date.now() - start;
  const quality = ms < 100 ? '🟢 Excellent' : ms < 300 ? '🟡 Good' : '🔴 Slow';
  return sendMessage(token, chatId,
    `🏓 *Pong!*\n\nLatency: \`${ms}ms\`\nQuality: ${quality}\nStatus: 🟢 Online\nRuntime: Cloudflare Workers`,
    { replyMarkup: inlineKeyboard([[{ text: '🔄 Ping Again', data: 'ping' }, ...HOME_BTN]]) });
}

export async function handleToolsCallback(token, query) {
  const data = query.data;
  const chatId = query.message?.chat?.id;
  const msgId = query.message?.message_id;

  if (data === 'uuid:new') {
    await answerCallbackQuery(token, query.id, 'Generating UUIDs...');
    const uuids = Array.from({ length: 3 }, generateUUID);
    return editMessageText(token, chatId, msgId,
      `🆔 *UUID v4*\n\n${uuids.map((u, i) => `${i+1}. \`${u}\``).join('\n')}\n\n_Tap to copy_`,
      { replyMarkup: inlineKeyboard([[{ text: '🔄 More', data: 'uuid:new' }, ...HOME_BTN]]) });
  }

  if (data.startsWith('pwd:')) {
    const [, len, type] = data.split(':');
    await answerCallbackQuery(token, query.id, 'Generating passwords...');
    const passwords = Array.from({ length: 3 }, () => generatePassword(+len || 16, type || 'strong'));
    const labels = { strong: '🔐 Strong', simple: '🔡 Simple', pin: '🔢 PIN' };
    return editMessageText(token, chatId, msgId,
      `🔐 *Password Generator*\n\n${labels[type] || labels.strong}  Length: \`${len}\`\n\n${passwords.map((p, i) => `${i+1}. \`${p}\``).join('\n')}\n\n_Never share passwords!_`,
      { replyMarkup: inlineKeyboard([
        [{ text: '🔄 Regenerate', data: `pwd:${len}:${type}` }],
        [{ text: '🔐 Strong', data: 'pwd:16:strong' }, { text: '🔡 Simple', data: 'pwd:12:simple' }, { text: '🔢 PIN', data: 'pwd:6:pin' }],
        HOME_BTN,
      ]) });
  }

  if (data.startsWith('snippet:')) {
    const lang = data.split(':')[1];
    await answerCallbackQuery(token, query.id, 'Loading snippet...');
    const langs = ['js', 'py', 'go', 'rs', 'ts', 'sql', 'bash', 'cpp', 'css', 'java'];
    const labels = { js: 'JS', py: 'Python', go: 'Go', rs: 'Rust', ts: 'TS', sql: 'SQL', bash: 'Bash', cpp: 'C++', css: 'CSS', java: 'Java' };
    if (lang === 'menu') {
      const rows = [];
      for (let i = 0; i < langs.length; i += 5)
        rows.push(langs.slice(i, i + 5).map(l => ({ text: labels[l], data: `snippet:${l}` })));
      rows.push([{ text: '🎲 Random', data: 'snippet:random' }, ...HOME_BTN]);
      return editMessageText(token, chatId, msgId,
        `💻 *Code Snippets*\n\nChoose a language:`,
        { replyMarkup: inlineKeyboard(rows) });
    }
    const actualLang = lang === 'random' ? langs[Math.floor(Math.random() * langs.length)] : lang;
    const snippet = getSnippet(actualLang);
    if (!snippet) return answerCallbackQuery(token, query.id, 'Not found', true);
    return editMessageText(token, chatId, msgId,
      `💻 *${snippet.title}* — ${snippet.lang}\n\n\`\`\`${snippet.langKey}\n${snippet.code}\n\`\`\``,
      { replyMarkup: inlineKeyboard([
        [{ text: '🔄 Another', data: `snippet:${actualLang}` }, { text: '📚 All', data: 'snippet:menu' }],
        HOME_BTN,
      ]) });
  }

  if (data === 'ts:now') {
    const unix = Math.floor(Date.now() / 1000);
    const d = new Date(unix * 1000);
    await answerCallbackQuery(token, query.id, 'Current time');
    return editMessageText(token, chatId, msgId,
      `⏱ *Current Timestamp*\n\nUnix: \`${unix}\`\nUTC:  \`${d.toUTCString()}\`\nISO:  \`${d.toISOString()}\``,
      { replyMarkup: inlineKeyboard([[{ text: '🔄 Refresh', data: 'ts:now' }, ...HOME_BTN]]) });
  }
}
