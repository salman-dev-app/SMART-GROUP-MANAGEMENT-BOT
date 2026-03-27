/**
 *   Developer Tools Module — Premium Edition
 *   JSON · Hash · UUID · Regex · Color · Calc · Passwd
 */

import { sendMessage, editMessageText, answerCallbackQuery, inlineKeyboard } from '../utils/telegram.js';
import { t } from '../data/languages.js';
import { getSnippet, getAvailableLangs } from '../data/snippets.js';

//  SHA-256

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

//  MD5-like (simple checksum, not crypto)
// Telegram bots can't use real MD5 in Workers easily, so we do SHA-256 for both

//  UUID v4

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

//  Color

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
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

function parseRgbString(str) {
  const m = str.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  return m ? { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) } : null;
}

//  HTML escape

function escapeHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}

//  Password generator

function generatePassword(length = 16, opts = {}) {
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits  = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let chars = lower;
  if (opts.upper   !== false) chars += upper;
  if (opts.digits  !== false) chars += digits;
  if (opts.special)           chars += special;

  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}

//  Safe calculator

function safeCalc(expr) {
  // Allow only numbers and basic operators
  const cleaned = expr.replace(/\s/g, '').replace(/[xX×]/g, '*').replace(/[÷]/g, '/');
  if (!/^[\d+\-*/().%\s^]+$/.test(cleaned)) return null;

  // Convert ^ to ** for exponentiation
  const safe = cleaned.replace(/\^/g, '**');

  try {
    // Using Function constructor with restricted scope
    const result = Function('"use strict"; return (' + safe + ')')();
    if (!isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

// Command Handlers

/**
 * /json — Format & validate JSON
 */
export async function handleJson(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input  = args.join(' ').trim();

  if (!input) {
    return sendMessage(botToken, chatId,
      `🛠️ *𝗝𝗦𝗢𝗡 𝗙𝗼𝗿𝗺𝗮𝘁𝘁𝗲𝗿 & 𝗩𝗮𝗹𝗶𝗱𝗮𝘁𝗼𝗿*\n\n` +
      `*Usage:* \`/json {"key": "value"}\`\n\n` +
      `_Paste any JSON after the command to format and validate it._`,
      { replyMarkup: inlineKeyboard([[{ text: '📖 JSON Examples', data: 'json:example' }]]) }
    );
  }

  try {
    const parsed    = JSON.parse(input);
    const formatted = JSON.stringify(parsed, null, 2);
    const display   = formatted.length > 3000
      ? formatted.substring(0, 3000) + '\n... _(truncated)_'
      : formatted;

    const keyCount  = typeof parsed === 'object' ? Object.keys(parsed).length : '—';
    const typeLabel = Array.isArray(parsed) ? `Array[${parsed.length}]` : typeof parsed;

    const text =
      `✅ *𝗩𝗮𝗹𝗶𝗱 𝗝𝗦𝗢𝗡* 🟢\n\n` +
      `📦 Type: \`${typeLabel}\`\n` +
      (typeof parsed === 'object' && !Array.isArray(parsed) ? `🔑 Keys: \`${keyCount}\`\n` : '') +
      `📏 Size: \`${input.length} bytes\`\n\n` +
      `\`\`\`json\n${display}\n\`\`\``;

    return sendMessage(botToken, chatId, text, {
      replyMarkup: inlineKeyboard([
        [
          { text: '🗜️ Minify', data: `json:minify:${Buffer.from(input).toString('base64').slice(0,100)}` },
          { text: '🔄 Re-format', data: 'json:reformat' },
        ]
      ])
    });
  } catch (err) {
    return sendMessage(botToken, chatId,
      `❌ *𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗝𝗦𝗢𝗡* 🔴\n\n` +
      `⚠️ *Error:* \`${err.message}\`\n\n` +
      `_Check your JSON syntax and try again._`,
      {
        replyMarkup: inlineKeyboard([
          [{ text: '🔍 JSON Validator Tips', data: 'json:tips' }]
        ])
      }
    );
  }
}

/**
 * /encode — Base64 encode
 */
export async function handleEncode(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input  = args.join(' ');
  if (!input.trim()) return sendMessage(botToken, chatId, t(lang, 'needArgs'));

  const encoded = btoa(unescape(encodeURIComponent(input)));
  const preview = input.length > 60 ? input.substring(0, 60) + '…' : input;

  return sendMessage(botToken, chatId,
    `🔤 *𝗕𝗮𝘀𝗲𝟲𝟰 𝗘𝗻𝗰𝗼𝗱𝗶𝗻𝗴* ✅\n\n` +
    `📥 *Input:*\n\`${preview}\`\n\n` +
    `📤 *Encoded:*\n\`${encoded}\`\n\n` +
    `📏 \`${input.length}\` chars → \`${encoded.length}\` chars`,
    {
      replyMarkup: inlineKeyboard([
        [
          { text: '🔄 Decode Back', data: `decode:${encoded.slice(0, 80)}` },
        ]
      ])
    }
  );
}

/**
 * /decode — Base64 decode
 */
export async function handleDecode(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input  = args.join(' ').trim();
  if (!input) return sendMessage(botToken, chatId, t(lang, 'needArgs'));

  try {
    const decoded = decodeURIComponent(escape(atob(input)));
    const preview = input.length > 60 ? input.substring(0, 60) + '…' : input;
    const out     = decoded.length > 500 ? decoded.substring(0, 500) + '…' : decoded;

    return sendMessage(botToken, chatId,
      `🔤 *𝗕𝗮𝘀𝗲𝟲𝟰 𝗗𝗲𝗰𝗼𝗱𝗶𝗻𝗴* ✅\n\n` +
      `📥 *Input:*\n\`${preview}\`\n\n` +
      `📤 *Decoded:*\n\`${out}\``,
      {
        replyMarkup: inlineKeyboard([
          [{ text: '🔄 Encode Again', data: 'encode:back' }]
        ])
      }
    );
  } catch {
    return sendMessage(botToken, chatId,
      `❌ *𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗕𝗮𝘀𝗲𝟲𝟰*\n\n_Make sure the string is valid Base64._`);
  }
}

/**
 * /hash — SHA-256 hash
 */
export async function handleHash(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input  = args.join(' ');
  if (!input.trim()) return sendMessage(botToken, chatId, t(lang, 'needArgs'));

  const hash    = await sha256(input);
  const preview = input.length > 50 ? input.substring(0, 50) + '…' : input;

  return sendMessage(botToken, chatId,
    `🔐 *𝗦𝗛𝗔-𝟮𝟱𝟲 𝗛𝗮𝘀𝗵* 🔒\n\n` +
    `📥 *Input:*\n\`${preview}\`\n\n` +
    `🔑 *Hash:*\n\`${hash}\`\n\n` +
    `📏 256-bit · 64 hex chars`,
    {
      replyMarkup: inlineKeyboard([
        [
          { text: '🔐 Hash Another', data: 'hash:new' },
          { text: '🔑 Generate UUID', data: 'uuid:new' },
        ]
      ])
    }
  );
}

/**
 * /uuid — Generate UUIDs
 */
export async function handleUuid(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const count  = Math.min(parseInt(args[0]) || 3, 10);
  const uuids  = Array.from({ length: count }, generateUUID);

  return sendMessage(botToken, chatId,
    `🔑 *𝗨𝗨𝗜𝗗 𝘃𝟰 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱* ✨\n\n` +
    uuids.map((u, i) => `${i + 1}\\. \`${u}\``).join('\n') +
    `\n\n📋 _Tap to copy any UUID_`,
    {
      replyMarkup: inlineKeyboard([
        [
          { text: '🔄 Generate More', data: 'uuid:new' },
          { text: '🔐 Hash Text', data: 'hash:new' },
        ]
      ])
    }
  );
}

/**
 * /regex — Regex tester
 */
export async function handleRegex(botToken, msg, args, lang) {
  const chatId = msg.chat.id;

  if (args.length < 2) {
    return sendMessage(botToken, chatId,
      `🔍 *𝗥𝗲𝗴𝗲𝘅 𝗧𝗲𝘀𝘁𝗲𝗿*\n\n` +
      `*Usage:* \`/regex <pattern> <text>\`\n\n` +
      `*Examples:*\n` +
      `\`/regex \\d+ foo123 bar456\`\n` +
      `\`/regex [A-Z]+ Hello World\`\n` +
      `\`/regex ^\\w+ first second\``,
      { replyMarkup: inlineKeyboard([[{ text: '📖 Regex Cheatsheet', data: 'regex:cheat' }]]) }
    );
  }

  const pattern = args[0];
  const text    = args.slice(1).join(' ');

  try {
    const regex   = new RegExp(pattern, 'g');
    const matches = [...text.matchAll(regex)];

    if (matches.length === 0) {
      return sendMessage(botToken, chatId,
        `❌ *𝗡𝗼 𝗠𝗮𝘁𝗰𝗵𝗲𝘀*\n\n` +
        `🔍 Pattern: \`${pattern}\`\n` +
        `📝 Text: \`${text.length > 100 ? text.substring(0, 100) + '…' : text}\`\n\n` +
        `_Try a different pattern_`,
        { replyMarkup: inlineKeyboard([[{ text: '📖 Regex Cheatsheet', data: 'regex:cheat' }]]) }
      );
    }

    const matchList = matches
      .slice(0, 10)
      .map((m, i) => `${i + 1}\\. \`${m[0]}\` @ index \`${m.index}\``)
      .join('\n');

    return sendMessage(botToken, chatId,
      `✅ *𝗥𝗲𝗴𝗲𝘅 𝗠𝗮𝘁𝗰𝗵𝗲𝘀!* 🎯\n\n` +
      `🔍 Pattern: \`${pattern}\`\n` +
      `📊 Found: \`${matches.length}\` match(es)\n\n` +
      matchList +
      (matches.length > 10 ? `\n_...and ${matches.length - 10} more_` : ''),
      { replyMarkup: inlineKeyboard([[{ text: '🔍 Test Another', data: 'regex:new' }]]) }
    );
  } catch (err) {
    return sendMessage(botToken, chatId,
      `❌ *𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗣𝗮𝘁𝘁𝗲𝗿𝗻*\n\n⚠️ \`${err.message}\``);
  }
}

/**
 * /snippet — Code snippets with language selector
 */
export async function handleSnippet(botToken, msg, args, lang) {
  const chatId = msg.chat.id;

  if (!args[0]) {
    const langs = ['js','py','go','rs','ts','java','cpp','sql','bash','css'];
    const rows  = [];
    for (let i = 0; i < langs.length; i += 3) {
      rows.push(
        langs.slice(i, i + 3).map(l => ({
          text: { js:'🟨 JS', py:'🐍 PY', go:'🔵 GO', rs:'🦀 RS', ts:'🔷 TS',
                  java:'☕ JAVA', cpp:'⚙️ C++', sql:'🗄️ SQL', bash:'🔧 BASH', css:'🎨 CSS' }[l] || l.toUpperCase(),
          data: `snippet:${l}`
        }))
      );
    }
    rows.push([{ text: '🔀 Random Snippet', data: 'snippet:random' }]);

    return sendMessage(botToken, chatId,
      `📝 *𝗖𝗼𝗱𝗲 𝗦𝗻𝗶𝗽𝗽𝗲𝘁𝘀* 💻\n\n_Choose a language:_`,
      { replyMarkup: inlineKeyboard(rows) }
    );
  }

  const langArg = args[0].toLowerCase() === 'random'
    ? ['js','py','go','rs','ts','java','cpp','sql','bash','css'][Math.floor(Math.random() * 10)]
    : args[0].toLowerCase();

  const snippet = getSnippet(langArg);
  if (!snippet) {
    return sendMessage(botToken, chatId,
      `❓ *No snippet for \`${args[0]}\`*\n\nAvailable: \`js py go rs ts java cpp sql bash css\``,
      { replyMarkup: inlineKeyboard([[{ text: '📝 Pick Language', data: 'snippet:menu' }]]) }
    );
  }

  const text =
    `📝 *𝗖𝗼𝗱𝗲 𝗦𝗻𝗶𝗽𝗽𝗲𝘁* — ${snippet.lang}\n\n` +
    `${snippet.title}\n\n` +
    `\`\`\`${snippet.langKey}\n${snippet.code}\n\`\`\``;

  return sendMessage(botToken, chatId, text, {
    replyMarkup: inlineKeyboard([
      [
        { text: '🔀 Another Snippet', data: `snippet:${langArg}` },
        { text: '📚 All Languages', data: 'snippet:menu' },
      ]
    ])
  });
}

/**
 * /timestamp — Timestamp converter
 */
export async function handleTimestamp(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  let unix;

  if (args[0]) {
    unix = parseInt(args[0]);
    if (isNaN(unix)) return sendMessage(botToken, chatId,
      `❌ *Invalid timestamp.*\n\nProvide a Unix timestamp in seconds.\nExample: \`/timestamp 1700000000\``);
  } else {
    unix = Math.floor(Date.now() / 1000);
  }

  const date     = new Date(unix * 1000);
  const utc      = date.toUTCString();
  const iso      = date.toISOString();
  const relative = getRelativeTime(unix);
  const ms       = unix * 1000;

  return sendMessage(botToken, chatId,
    `🕐 *𝗧𝗶𝗺𝗲𝘀𝘁𝗮𝗺𝗽 𝗖𝗼𝗻𝘃𝗲𝗿𝘁𝗲𝗿* ⏱️\n\n` +
    `🔢 Unix:     \`${unix}\`\n` +
    `📅 UTC:      \`${utc}\`\n` +
    `📋 ISO 8601: \`${iso}\`\n` +
    `⏱️ MS:       \`${ms}\`\n` +
    `🕰️ Relative: *${relative}*`,
    {
      replyMarkup: inlineKeyboard([
        [
          { text: '🕐 Current Time', data: 'timestamp:now' },
          { text: '🔄 Convert Another', data: 'timestamp:new' },
        ]
      ])
    }
  );
}

function getRelativeTime(unix) {
  const now  = Math.floor(Date.now() / 1000);
  const diff = now - unix;
  const abs  = Math.abs(diff);
  const fut  = diff < 0;
  if (abs < 60)    return `${abs}s ${fut ? 'from now' : 'ago'}`;
  if (abs < 3600)  return `${Math.floor(abs / 60)}m ${fut ? 'from now' : 'ago'}`;
  if (abs < 86400) return `${Math.floor(abs / 3600)}h ${fut ? 'from now' : 'ago'}`;
  return `${Math.floor(abs / 86400)}d ${fut ? 'from now' : 'ago'}`;
}

/**
 * /color — Color converter
 */
export async function handleColor(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input  = args.join(' ').trim();

  if (!input) {
    return sendMessage(botToken, chatId,
      `🎨 *𝗖𝗼𝗹𝗼𝗿 𝗖𝗼𝗻𝘃𝗲𝗿𝘁𝗲𝗿*\n\n*Usage:*\n\`/color #ff6b6b\`\n\`/color rgb(255,107,107)\``,
      { replyMarkup: inlineKeyboard([[{ text: '🎨 Try Example', data: 'color:example' }]]) }
    );
  }

  let rgb = null, hexStr = '';

  if (input.startsWith('#') || /^[0-9a-f]{6}$/i.test(input)) {
    rgb    = hexToRgb(input.startsWith('#') ? input : `#${input}`);
    hexStr = (input.startsWith('#') ? input : `#${input}`).toUpperCase();
  } else if (input.toLowerCase().startsWith('rgb')) {
    rgb = parseRgbString(input);
    if (rgb) hexStr = `#${[rgb.r, rgb.g, rgb.b].map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase()}`;
  }

  if (!rgb) return sendMessage(botToken, chatId,
    `❌ *Invalid Color Format*\n\nUse: \`#RRGGBB\` or \`rgb(r,g,b)\``);

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const brightness = Math.round((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000);
  const dark = brightness < 128;

  return sendMessage(botToken, chatId,
    `🎨 *𝗖𝗼𝗹𝗼𝗿 𝗜𝗻𝗳𝗼* ✨\n\n` +
    `🟥 HEX: \`${hexStr}\`\n` +
    `🟩 RGB: \`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\`\n` +
    `🟦 HSL: \`hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)\`\n\n` +
    `☀️ Brightness: \`${brightness}/255\` — _${dark ? 'Dark' : 'Light'} color_`,
    {
      replyMarkup: inlineKeyboard([
        [{ text: '🎨 Convert Another', data: 'color:new' }]
      ])
    }
  );
}

/**
 * /urlencode
 */
export async function handleUrlEncode(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input  = args.join(' ');
  if (!input.trim()) return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  const output = encodeURIComponent(input);
  return sendMessage(botToken, chatId,
    `🔗 *𝗨𝗥𝗟 𝗘𝗻𝗰𝗼𝗱𝗲𝗱* ✅\n\n📥 Input: \`${input}\`\n📤 Output:\n\`${output}\``,
    { replyMarkup: inlineKeyboard([[{ text: '🔄 Decode Back', data: 'urldecode:back' }]]) }
  );
}

/**
 * /urldecode
 */
export async function handleUrlDecode(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input  = args.join(' ');
  if (!input.trim()) return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  try {
    const output = decodeURIComponent(input);
    return sendMessage(botToken, chatId,
      `🔗 *𝗨𝗥𝗟 𝗗𝗲𝗰𝗼𝗱𝗲𝗱* ✅\n\n📥 Input: \`${input}\`\n📤 Output:\n\`${output}\``);
  } catch {
    return sendMessage(botToken, chatId, `❌ *Invalid URL-encoded string.*`);
  }
}

/**
 * /escape — HTML escape
 */
export async function handleEscape(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input  = args.join(' ');
  if (!input.trim()) return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  const output = escapeHtml(input);
  return sendMessage(botToken, chatId,
    `🔒 *𝗛𝗧𝗠𝗟 𝗘𝘀𝗰𝗮𝗽𝗲𝗱* ✅\n\n📥 Input: \`${input}\`\n📤 Output:\n\`${output}\``);
}

/**
 * /ping — Premium latency check
 */
export async function handlePing(botToken, msg, lang) {
  const chatId = msg.chat.id;
  const start  = Date.now();
  await sendMessage(botToken, chatId, '🏓 _Pinging..._');
  const latency = Date.now() - start;
  const bar = latency < 100 ? '🟢 Excellent' : latency < 300 ? '🟡 Good' : '🔴 Slow';

  return sendMessage(botToken, chatId,
    `🏓 *𝗣𝗼𝗻𝗴!* ⚡\n\n` +
    `📡 Latency: \`${latency}ms\`\n` +
    `${bar}\n\n` +
    `🟢 Status: *Online*\n` +
    `⚙️ Runtime: Cloudflare Workers\n` +
    `🕐 Time: \`${new Date().toUTCString()}\``,
    { replyMarkup: inlineKeyboard([[{ text: '🔄 Ping Again', data: 'ping:again' }]]) }
  );
}

/**
 * /calc — Calculator
 */
export async function handleCalc(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const expr   = args.join(' ').trim();

  if (!expr) {
    return sendMessage(botToken, chatId,
      `🧮 *𝗖𝗮𝗹𝗰𝘂𝗹𝗮𝘁𝗼𝗿*\n\n*Usage:* \`/calc 2 + 2\`\n\n*Supports:*\n` +
      ` \`+ - * /\` — Basic ops\n` +
      ` \`%\` — Modulo\n` +
      ` \`^\` or \`**\` — Power\n` +
      ` \`()\` — Brackets\n\n` +
      `*Examples:*\n\`/calc (2 + 3) * 4\`\n\`/calc 2^10\`\n\`/calc 355 / 113\``,
      { replyMarkup: inlineKeyboard([[{ text: '🧮 Quick Examples', data: 'calc:examples' }]]) }
    );
  }

  const result = safeCalc(expr);

  if (result === null) {
    return sendMessage(botToken, chatId,
      `❌ *𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗘𝘅𝗽𝗿𝗲𝘀𝘀𝗶𝗼𝗻*\n\n_Only numbers and \`+ - * / % ^ ()\` are allowed._`);
  }

  const isInt = Number.isInteger(result);
  const display = isInt ? result.toString() : result.toFixed(6).replace(/\.?0+$/, '');

  return sendMessage(botToken, chatId,
    `🧮 *𝗖𝗮𝗹𝗰𝘂𝗹𝗮𝘁𝗼𝗿* ✅\n\n` +
    `📐 Expression:\n\`${expr}\`\n\n` +
    `🎯 Result:\n\`${display}\``,
    {
      replyMarkup: inlineKeyboard([
        [{ text: '🧮 Calculate Again', data: 'calc:new' }]
      ])
    }
  );
}

/**
 * /password — Secure password generator
 */
export async function handlePassword(botToken, msg, args, lang) {
  const chatId = msg.chat.id;

  // Parse arguments: /password [length] [type]
  // type: simple | strong | pin
  const length  = parseInt(args[0]) || 16;
  const type    = (args[1] || 'strong').toLowerCase();

  if (length < 4 || length > 128) {
    return sendMessage(botToken, chatId,
      `❌ *Length must be between 4 and 128 characters.*`);
  }

  let passwords = [];
  let typeLabel = '';
  let opts = {};

  switch (type) {
    case 'pin':
      opts = { upper: false, digits: true, special: false };
      typeLabel = '🔢 PIN';
      break;
    case 'simple':
      opts = { upper: true, digits: true, special: false };
      typeLabel = '🔡 Simple';
      break;
    case 'strong':
    default:
      opts = { upper: true, digits: true, special: true };
      typeLabel = '🔐 Strong';
      break;
  }

  for (let i = 0; i < 3; i++) {
    passwords.push(generatePassword(length, opts));
  }

  const strength = type === 'strong' ? '🟢 Very Strong' : type === 'simple' ? '🟡 Medium' : '🔵 PIN';

  return sendMessage(botToken, chatId,
    `🔐 *𝗣𝗮𝘀𝘀𝘄𝗼𝗿𝗱 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗼𝗿* ✨\n\n` +
    `🏷️ Type: ${typeLabel}\n` +
    `📏 Length: \`${length}\`\n` +
    `💪 Strength: ${strength}\n\n` +
    passwords.map((p, i) => `${i + 1}\\. \`${p}\``).join('\n') +
    `\n\n⚠️ _Never share passwords! Tap to copy._`,
    {
      replyMarkup: inlineKeyboard([
        [
          { text: '🔄 Generate More', data: `pwd:${length}:${type}` },
        ],
        [
          { text: '🔐 Strong (16)', data: 'pwd:16:strong' },
          { text: '🔡 Simple (12)', data: 'pwd:12:simple' },
          { text: '🔢 PIN (6)', data: 'pwd:6:pin' },
        ]
      ])
    }
  );
}

// Callback handlers for devtools

export async function handleDevtoolsCallback(botToken, query) {
  const data   = query.data || '';
  const chatId = query.message?.chat?.id;
  const msgId  = query.message?.message_id;

  //  snippet:*
  if (data.startsWith('snippet:')) {
    const langArg = data.split(':')[1];
    await answerCallbackQuery(botToken, query.id, '📝 Loading snippet...');

    if (langArg === 'menu') {
      const langs = ['js','py','go','rs','ts','java','cpp','sql','bash','css'];
      const rows  = [];
      for (let i = 0; i < langs.length; i += 3) {
        rows.push(langs.slice(i, i+3).map(l => ({
          text: { js:'🟨 JS', py:'🐍 PY', go:'🔵 GO', rs:'🦀 RS', ts:'🔷 TS',
                  java:'☕ JAVA', cpp:'⚙️ C++', sql:'🗄️ SQL', bash:'🔧 BASH', css:'🎨 CSS' }[l] || l,
          data: `snippet:${l}`
        })));
      }
      rows.push([{ text: '🔀 Random', data: 'snippet:random' }]);
      return editMessageText(botToken, chatId, msgId,
        `📝 *𝗖𝗼𝗱𝗲 𝗦𝗻𝗶𝗽𝗽𝗲𝘁𝘀* 💻\n\n_Choose a language:_`,
        { replyMarkup: inlineKeyboard(rows) }
      );
    }

    const actualLang = langArg === 'random'
      ? ['js','py','go','rs','ts','java','cpp','sql','bash','css'][Math.floor(Math.random() * 10)]
      : langArg;

    const snippet = getSnippet(actualLang);
    if (!snippet) return answerCallbackQuery(botToken, query.id, '❌ Not found', true);

    return editMessageText(botToken, chatId, msgId,
      `📝 *𝗦𝗻𝗶𝗽𝗽𝗲𝘁* — ${snippet.lang}\n\n${snippet.title}\n\n\`\`\`${snippet.langKey}\n${snippet.code}\n\`\`\``,
      {
        replyMarkup: inlineKeyboard([
          [
            { text: '🔀 Another', data: `snippet:${actualLang}` },
            { text: '📚 All Langs', data: 'snippet:menu' },
          ]
        ])
      }
    );
  }

  //  uuid:new
  if (data === 'uuid:new') {
    await answerCallbackQuery(botToken, query.id, '🔑 Generating UUIDs...');
    const uuids = Array.from({ length: 3 }, generateUUID);
    return editMessageText(botToken, chatId, msgId,
      `🔑 *𝗨𝗨𝗜𝗗 𝘃𝟰 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱* ✨\n\n` +
      uuids.map((u, i) => `${i + 1}\\. \`${u}\``).join('\n'),
      { replyMarkup: inlineKeyboard([[{ text: '🔄 Generate More', data: 'uuid:new' }]]) }
    );
  }

  //  pwd:*
  if (data.startsWith('pwd:')) {
    const [, len, type] = data.split(':');
    const length = parseInt(len) || 16;
    const opts = type === 'pin' ? { upper: false, digits: true, special: false }
               : type === 'simple' ? { upper: true, digits: true, special: false }
               : { upper: true, digits: true, special: true };
    const passwords = Array.from({ length: 3 }, () => generatePassword(length, opts));
    const typeLabel = type === 'pin' ? '🔢 PIN' : type === 'simple' ? '🔡 Simple' : '🔐 Strong';
    const strength  = type === 'strong' ? '🟢 Very Strong' : type === 'simple' ? '🟡 Medium' : '🔵 PIN';
    await answerCallbackQuery(botToken, query.id, '🔐 New passwords generated!');
    return editMessageText(botToken, chatId, msgId,
      `🔐 *𝗣𝗮𝘀𝘀𝘄𝗼𝗿𝗱 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗼𝗿* ✨\n\n` +
      `🏷️ Type: ${typeLabel} | 📏 Length: \`${length}\` | 💪 ${strength}\n\n` +
      passwords.map((p, i) => `${i + 1}\\. \`${p}\``).join('\n') +
      `\n\n⚠️ _Never share passwords!_`,
      {
        replyMarkup: inlineKeyboard([
          [{ text: '🔄 Generate More', data: `pwd:${length}:${type}` }],
          [
            { text: '🔐 Strong(16)', data: 'pwd:16:strong' },
            { text: '🔡 Simple(12)', data: 'pwd:12:simple' },
            { text: '🔢 PIN(6)',     data: 'pwd:6:pin'    },
          ]
        ])
      }
    );
  }

  //  timestamp:now
  if (data === 'timestamp:now') {
    const unix = Math.floor(Date.now() / 1000);
    const date = new Date(unix * 1000);
    await answerCallbackQuery(botToken, query.id, '🕐 Current time!');
    return editMessageText(botToken, chatId, msgId,
      `🕐 *𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗧𝗶𝗺𝗲𝘀𝘁𝗮𝗺𝗽*\n\n` +
      `🔢 Unix: \`${unix}\`\n📅 UTC: \`${date.toUTCString()}\`\n📋 ISO: \`${date.toISOString()}\``,
      { replyMarkup: inlineKeyboard([[{ text: '🔄 Refresh', data: 'timestamp:now' }]]) }
    );
  }

  // Generic answer for unknown callbacks
  return answerCallbackQuery(botToken, query.id);
}
