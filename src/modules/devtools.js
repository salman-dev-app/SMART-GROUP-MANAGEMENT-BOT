/**
 * Developer Tools Module
 * JSON format, Base64, Hash, Regex, Timestamps, UUID, Colors, URL encoding
 */

import { sendMessage } from '../utils/telegram.js';
import { t } from '../data/languages.js';
import { getSnippet, getAvailableLangs } from '../data/snippets.js';

// ── SHA-256 via Web Crypto API (available in CF Workers) ──────

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── UUID v4 generation ────────────────────────────────────────

function generateUUID() {
  // Use crypto.randomUUID if available (CF Workers has it)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ── Color utilities ───────────────────────────────────────────

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function parseRgbString(str) {
  const match = str.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (!match) return null;
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
}

// ── HTML escaping ─────────────────────────────────────────────

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── Command Handlers ─────────────────────────────────────────

/**
 * /json <data> — Format and validate JSON
 */
export async function handleJson(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = args.join(' ').trim();

  if (!input) {
    return sendMessage(botToken, chatId,
      '🛠️ *JSON Formatter*\n\nUsage: `/json {"key": "value"}`\n\nPaste your JSON after the command to format and validate it.');
  }

  try {
    const parsed = JSON.parse(input);
    const formatted = JSON.stringify(parsed, null, 2);

    // Truncate if too long
    const display = formatted.length > 3000
      ? formatted.substring(0, 3000) + '\n... (truncated)'
      : formatted;

    return sendMessage(botToken, chatId, t(lang, 'jsonValid', { formatted: display }));
  } catch (err) {
    return sendMessage(botToken, chatId,
      t(lang, 'jsonInvalid', { error: err.message }));
  }
}

/**
 * /encode <text> — Base64 encode
 */
export async function handleEncode(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = args.join(' ');

  if (!input.trim()) {
    return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  }

  const encoded = btoa(unescape(encodeURIComponent(input)));
  return sendMessage(botToken, chatId,
    t(lang, 'encodedResult', {
      input: input.length > 50 ? input.substring(0, 50) + '...' : input,
      output: encoded
    }));
}

/**
 * /decode <text> — Base64 decode
 */
export async function handleDecode(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = args.join(' ').trim();

  if (!input) {
    return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  }

  try {
    const decoded = decodeURIComponent(escape(atob(input)));
    return sendMessage(botToken, chatId,
      t(lang, 'decodedResult', {
        input: input.length > 50 ? input.substring(0, 50) + '...' : input,
        output: decoded.length > 500 ? decoded.substring(0, 500) + '...' : decoded
      }));
  } catch {
    return sendMessage(botToken, chatId, '❌ Invalid Base64 string.');
  }
}

/**
 * /hash <text> — SHA-256 hash
 */
export async function handleHash(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = args.join(' ');

  if (!input.trim()) {
    return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  }

  const hash = await sha256(input);
  return sendMessage(botToken, chatId,
    t(lang, 'hashGenerated', {
      input: input.length > 50 ? input.substring(0, 50) + '...' : input,
      hash
    }));
}

/**
 * /uuid — Generate a UUID v4
 */
export async function handleUuid(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const uuids = Array.from({ length: 3 }, () => generateUUID());

  return sendMessage(botToken, chatId,
    `🔑 *Generated UUIDs (v4)*\n\n` +
    uuids.map(u => `\`${u}\``).join('\n'));
}

/**
 * /regex <pattern> <text> — Test regex
 */
export async function handleRegex(botToken, msg, args, lang) {
  const chatId = msg.chat.id;

  if (args.length < 2) {
    return sendMessage(botToken, chatId,
      '🔍 *Regex Tester*\n\nUsage: `/regex <pattern> <text>`\n\nExample: `/regex ^\\d+ hello123 world456`');
  }

  const pattern = args[0];
  const text = args.slice(1).join(' ');

  try {
    const regex = new RegExp(pattern, 'g');
    const matches = [...text.matchAll(regex)];

    if (matches.length === 0) {
      return sendMessage(botToken, chatId,
        t(lang, 'regexNoMatch', {
          pattern,
          text: text.length > 100 ? text.substring(0, 100) + '...' : text
        }));
    }

    const matchList = matches
      .slice(0, 10)
      .map((m, i) => `${i + 1}. \`${m[0]}\` at index ${m.index}`)
      .join('\n');

    return sendMessage(botToken, chatId,
      t(lang, 'regexMatch', {
        pattern,
        matches: `\n${matchList}${matches.length > 10 ? `\n... and ${matches.length - 10} more` : ''}`
      }));
  } catch (err) {
    return sendMessage(botToken, chatId,
      t(lang, 'regexError', { error: err.message }));
  }
}

/**
 * /snippet <language> — Get code snippet
 */
export async function handleSnippet(botToken, msg, args, lang) {
  const chatId = msg.chat.id;

  if (!args[0]) {
    const langs = getAvailableLangs().join(', ');
    return sendMessage(botToken, chatId,
      `📝 *Code Snippets*\n\nUsage: \`/snippet <language>\`\n\nAvailable: ${langs}`);
  }

  const snippet = getSnippet(args[0]);
  if (!snippet) {
    return sendMessage(botToken, chatId,
      t(lang, 'snippetNotFound', { lang: args[0] }));
  }

  return sendMessage(botToken, chatId,
    `${snippet.title}\n\n\`\`\`${snippet.langKey}\n${snippet.code}\n\`\`\``);
}

/**
 * /timestamp [unix] — Convert timestamp
 */
export async function handleTimestamp(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  let unix;

  if (args[0]) {
    unix = parseInt(args[0]);
    if (isNaN(unix)) {
      return sendMessage(botToken, chatId, '❌ Invalid timestamp. Provide a Unix timestamp in seconds.');
    }
  } else {
    unix = Math.floor(Date.now() / 1000);
  }

  const date = new Date(unix * 1000);
  const utc = date.toUTCString();
  const iso = date.toISOString();
  const relative = getRelativeTime(unix);

  return sendMessage(botToken, chatId,
    `🕐 *Timestamp Conversion*\n\nUnix: \`${unix}\`\nUTC: \`${utc}\`\nISO: \`${iso}\`\nRelative: ${relative}`);
}

function getRelativeTime(unix) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unix;
  const abs = Math.abs(diff);
  const future = diff < 0;

  if (abs < 60) return `${abs} seconds ${future ? 'from now' : 'ago'}`;
  if (abs < 3600) return `${Math.floor(abs / 60)} minutes ${future ? 'from now' : 'ago'}`;
  if (abs < 86400) return `${Math.floor(abs / 3600)} hours ${future ? 'from now' : 'ago'}`;
  return `${Math.floor(abs / 86400)} days ${future ? 'from now' : 'ago'}`;
}

/**
 * /color <hex|rgb> — Convert color formats
 */
export async function handleColor(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = args.join(' ').trim();

  if (!input) {
    return sendMessage(botToken, chatId,
      '🎨 *Color Converter*\n\nUsage:\n`/color #ff6b6b`\n`/color rgb(255,107,107)`');
  }

  let rgb = null;
  let hexStr = '';

  if (input.startsWith('#') || /^[0-9a-f]{6}$/i.test(input)) {
    rgb = hexToRgb(input.startsWith('#') ? input : `#${input}`);
    hexStr = input.startsWith('#') ? input.toUpperCase() : `#${input.toUpperCase()}`;
  } else if (input.toLowerCase().startsWith('rgb')) {
    rgb = parseRgbString(input);
    if (rgb) {
      hexStr = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`.toUpperCase();
    }
  }

  if (!rgb) {
    return sendMessage(botToken, chatId, t(lang, 'colorInvalid'));
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return sendMessage(botToken, chatId,
    t(lang, 'colorResult', {
      input,
      hex: hexStr,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    }));
}

/**
 * /urlencode <text> — URL encode
 */
export async function handleUrlEncode(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = args.join(' ');
  if (!input.trim()) return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  const output = encodeURIComponent(input);
  return sendMessage(botToken, chatId, t(lang, 'urlEncoded', { output }));
}

/**
 * /urldecode <text> — URL decode
 */
export async function handleUrlDecode(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = args.join(' ');
  if (!input.trim()) return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  try {
    const output = decodeURIComponent(input);
    return sendMessage(botToken, chatId, t(lang, 'urlDecoded', { output }));
  } catch {
    return sendMessage(botToken, chatId, '❌ Invalid URL-encoded string.');
  }
}

/**
 * /escape <text> — Escape HTML entities
 */
export async function handleEscape(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = args.join(' ');
  if (!input.trim()) return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  const output = escapeHtml(input);
  return sendMessage(botToken, chatId, t(lang, 'htmlEscaped', { output }));
}

/**
 * /ping — Latency check
 */
export async function handlePing(botToken, msg, lang) {
  const chatId = msg.chat.id;
  const start = Date.now();
  const sentMsg = await sendMessage(botToken, chatId, '🏓 Pinging...');
  const latency = Date.now() - start;
  return sendMessage(botToken, chatId, t(lang, 'ping', { latency }));
}
