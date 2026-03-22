#!/usr/bin/env node
/**
 * Local test suite for DevBot modules (no Telegram API calls)
 * Tests: spam detection, conversation matching, dev tools, language strings
 */

import { analyzeSpam } from '../src/modules/moderation.js';
import { matchConversation } from '../src/data/conversations.js';
import { getSnippet, getAvailableLangs } from '../src/data/snippets.js';
import { t, getLangList, LANGUAGES } from '../src/data/languages.js';
import { JOKES, QUOTES, EIGHT_BALL_ANSWERS } from '../src/data/responses.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(`${msg || 'Expected equal'}: "${a}" !== "${b}"`);
}

// ── Spam Detection Tests ─────────────────────────────────────

console.log('\n🔍 Spam Detection Tests');

test('Detects crypto spam', () => {
  const result = analyzeSpam('Buy bitcoin now and earn 100x profit guaranteed!');
  assert(result.isSpam, 'Should detect crypto spam');
});

test('Detects Telegram invite spam', () => {
  const result = analyzeSpam('Join my channel t.me/freecryptogroup');
  assert(result.isSpam, 'Should detect t.me link spam');
});

test('Detects excessive caps', () => {
  const result = analyzeSpam('THIS IS SCREAMING AND IS DEFINITELY SPAM FOR SURE');
  assert(result.isSpam, 'Should detect ALL CAPS');
});

test('Detects repeated characters', () => {
  const result = analyzeSpam('hellllllllllloooooooo');
  assert(result.isSpam, 'Should detect character flooding');
});

test('Allows normal dev message', () => {
  const result = analyzeSpam('Does anyone know how to use async/await in JavaScript?');
  assert(!result.isSpam, 'Normal message should pass');
});

test('Allows code snippet', () => {
  const result = analyzeSpam('const x = await fetch("https://api.example.com/data")');
  assert(!result.isSpam, 'Code snippet should pass');
});

test('Allows error message', () => {
  const result = analyzeSpam('TypeError: Cannot read property of undefined at line 42');
  assert(!result.isSpam, 'Error message should pass');
});

test('Detects multi-URL spam', () => {
  const result = analyzeSpam('check https://spam1.com and https://spam2.com and https://spam3.com');
  assert(result.isSpam, 'Multiple URLs should be flagged');
});

// ── Conversation Engine Tests ────────────────────────────────

console.log('\n💬 Conversation Engine Tests');

test('Matches greeting', () => {
  const result = matchConversation('hello there!');
  assert(result !== null, 'Should match greeting');
  assertEqual(result.intent, 'greeting');
});

test('Matches how are you', () => {
  const result = matchConversation("how's it going?");
  assert(result !== null, 'Should match how_are_you');
  assertEqual(result.intent, 'how_are_you');
});

test('Matches JavaScript tips', () => {
  const result = matchConversation('What are the best practices for JavaScript?');
  assert(result !== null, 'Should match JS question');
});

test('Matches Python tutorial request', () => {
  const result = matchConversation('How do I start learning Python?');
  assert(result !== null, 'Should match Python learning');
});

test('Matches git help', () => {
  const result = matchConversation('can you help me with git commands?');
  assert(result !== null, 'Should match git help');
  assertEqual(result.intent, 'git_help');
});

test('Matches Docker question', () => {
  const result = matchConversation('How do I build a Docker container?');
  assert(result !== null, 'Should match Docker question');
});

test('Matches security tips', () => {
  const result = matchConversation('How do I secure my API?');
  assert(result !== null, 'Should match security question');
});

test('Skips commands', () => {
  const result = matchConversation('/help');
  assert(result === null, 'Commands should return null');
});

test('Returns fallback for unknown', () => {
  const result = matchConversation('Tell me about quantum physics in space');
  assert(result !== null, 'Should always return something (fallback)');
  assertEqual(result.intent, 'fallback');
});

test('Matches thanks', () => {
  const result = matchConversation('thanks a lot!');
  assert(result !== null, 'Should match thanks');
  assertEqual(result.intent, 'thanks');
});

// ── Code Snippets Tests ──────────────────────────────────────

console.log('\n📝 Code Snippets Tests');

const langs = ['js', 'py', 'go', 'rs', 'ts', 'java', 'cpp', 'sql', 'bash', 'css'];

for (const lang of langs) {
  test(`Gets ${lang} snippet`, () => {
    const snippet = getSnippet(lang);
    assert(snippet !== null, `Should return snippet for ${lang}`);
    assert(snippet.code.length > 10, 'Code should not be empty');
    assert(snippet.title.length > 0, 'Title should not be empty');
  });
}

test('Returns null for unknown language', () => {
  const snippet = getSnippet('brainfuck');
  assert(snippet === null, 'Unknown language should return null');
});

test('Case-insensitive lang lookup', () => {
  const snippet = getSnippet('JS');
  assert(snippet !== null, 'Should work with uppercase JS');
});

// ── Language System Tests ────────────────────────────────────

console.log('\n🌍 Language System Tests');

const supportedLangs = ['en', 'es', 'fr', 'de', 'pt', 'ru', 'zh', 'ar'];

for (const langCode of supportedLangs) {
  test(`Language ${langCode} has all required keys`, () => {
    const lang = LANGUAGES[langCode];
    assert(lang, `Language ${langCode} should exist`);
    assert(lang.strings.welcome, 'Should have welcome string');
    assert(lang.strings.help, 'Should have help string');
    assert(lang.strings.noPermission, 'Should have noPermission string');
    assert(lang.strings.jsonValid, 'Should have jsonValid string');
    assert(lang.strings.about, 'Should have about string');
    assert(lang.strings.credit, 'Should have credit string');
  });
}

test('t() function replaces variables', () => {
  const result = t('en', 'warnSuccess', { user: 'TestUser', count: 2, reason: 'spam' });
  assert(result.includes('TestUser'), 'Should replace {user}');
  assert(result.includes('2'), 'Should replace {count}');
  assert(result.includes('spam'), 'Should replace {reason}');
  assert(!result.includes('{user}'), 'Should not have unreplaced vars');
});

test('t() falls back to English for missing key', () => {
  // German has minimal strings, 'about' exists in en
  const result = t('de', 'about');
  assert(result.length > 0, 'Should return something');
});

test('Bot name appears in English welcome', () => {
  const result = t('en', 'welcome');
  assert(result.includes('𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀'), 'Welcome should have bot name');
});

test('Developer credit contains Salman info', () => {
  const result = t('en', 'credit');
  assert(result.includes('Md Salman Biswas'), 'Credit should have dev name');
  assert(result.includes('github.com/salman-dev-app'), 'Credit should have GitHub link');
  assert(result.includes('mdsalmanhelp@gmail.com'), 'Credit should have email');
  assert(result.includes('t.me/Otakuosenpai'), 'Credit should have Telegram');
  assert(result.includes('facebook.com/salmandevapp'), 'Credit should have Facebook');
});

test('Credit exists in all 8 languages', () => {
  const langs = ['en', 'es', 'fr', 'de', 'pt', 'ru', 'zh', 'ar'];
  for (const lang of langs) {
    const result = t(lang, 'credit');
    assert(result.includes('Md Salman Biswas'), `${lang}: credit should have dev name`);
    assert(result.includes('github.com/salman-dev-app'), `${lang}: credit should have GitHub`);
  }
});

test('Bot name in Spanish welcome', () => {
  const result = t('es', 'welcome');
  assert(result.includes('𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀'), 'Spanish welcome should have bot name');
});

test('getLangList returns all languages', () => {
  const list = getLangList();
  assertEqual(list.length, 8, 'Should have 8 languages');
  assert(list.every(l => l.code && l.name && l.flag), 'All entries should have code, name, flag');
});

// ── Content Tests ────────────────────────────────────────────

console.log('\n🎉 Content Tests');

test('Has enough jokes', () => {
  assert(JOKES.length >= 20, `Should have at least 20 jokes, has ${JOKES.length}`);
  assert(JOKES.every(j => j.setup && j.punchline), 'All jokes need setup and punchline');
});

test('Has enough quotes', () => {
  assert(QUOTES.length >= 20, `Should have at least 20 quotes, has ${QUOTES.length}`);
  assert(QUOTES.every(q => q.text && q.author), 'All quotes need text and author');
});

test('Has enough 8-ball answers', () => {
  assert(EIGHT_BALL_ANSWERS.length >= 20, 'Should have at least 20 8-ball answers');
});

// ── JSON handling tests ──────────────────────────────────────

console.log('\n🔧 Utility Tests');

test('JSON formatting logic', () => {
  const input = '{"name":"DevBot","version":2}';
  const parsed = JSON.parse(input);
  const formatted = JSON.stringify(parsed, null, 2);
  assert(formatted.includes('\n'), 'Should have newlines');
  assert(formatted.includes('  '), 'Should have indentation');
});

test('URL encoding', () => {
  const encoded = encodeURIComponent('hello world & more');
  assert(encoded === 'hello%20world%20%26%20more', 'Should URL encode correctly');
});

test('URL decoding', () => {
  const decoded = decodeURIComponent('hello%20world%20%26%20more');
  assert(decoded === 'hello world & more', 'Should URL decode correctly');
});

test('Base64 encode/decode roundtrip', () => {
  const original = 'Hello, Developer! 🚀';
  const encoded = btoa(unescape(encodeURIComponent(original)));
  const decoded = decodeURIComponent(escape(atob(encoded)));
  assert(decoded === original, `Roundtrip failed: ${decoded} !== ${original}`);
});

test('Regex matching', () => {
  const regex = new RegExp('\\d+', 'g');
  const matches = [...'foo123bar456'.matchAll(regex)];
  assertEqual(matches.length, 2, 'Should find 2 numeric matches');
});

test('Color HEX to RGB', () => {
  const hex = '#ff6b6b';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  assert(result, 'Should parse hex color');
  assertEqual(parseInt(result[1], 16), 255, 'R should be 255');
  assertEqual(parseInt(result[2], 16), 107, 'G should be 107');
});

// ── Summary ──────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
}
