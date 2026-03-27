/**
 *   Fun Module — Premium Edition
 *   Jokes · Quotes · Dice · 8Ball · Polls
 */

import { sendMessage, sendPoll, editMessageText, answerCallbackQuery, inlineKeyboard } from '../utils/telegram.js';
import { t } from '../data/languages.js';
import { JOKES, QUOTES, EIGHT_BALL_ANSWERS, STICKERS } from '../data/responses.js';

//  Send a sticker

async function sendSticker(botToken, chatId, fileId) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendSticker`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, sticker: fileId })
    });
    return await res.json();
  } catch (e) {
    console.error('sendSticker error:', e.message);
  }
}

//  Send dice animation (Telegram native)

async function sendNativeDice(botToken, chatId, emoji = '🎲') {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendDice`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, emoji })
    });
    return await res.json();
  } catch (e) {
    console.error('sendDice error:', e.message);
    return null;
  }
}

//  Random pick helper

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// /joke — Premium joke with inline buttons

export async function handleJoke(botToken, msg, lang) {
  const chatId = msg.chat.id;
  const joke = pick(JOKES);

  const text =
    `🎭 \n` +
    `      *𝗗𝗲𝘃 𝗝𝗼𝗸𝗲 𝗼𝗳 𝘁𝗵𝗲 𝗗𝗮𝘆* 😂\n` +
    `\n\n` +
    `🤔 ${joke.setup}\n\n` +
    `💥 *${joke.punchline}*\n\n` +
    ``;

  const markup = inlineKeyboard([
    [
      { text: '😂 Another Joke', data: 'joke:new' },
      { text: '💭 Get Quote', data: 'quote:new' },
    ],
    [
      { text: '🎲 Roll Dice', data: 'dice:6' },
      { text: '🎱 Ask 8-Ball', data: '8ball:random' },
    ]
  ]);

  // Send laugh sticker first
  await sendSticker(botToken, chatId, STICKERS.laugh);
  return sendMessage(botToken, chatId, text, { replyMarkup: markup });
}

// /quote — Premium quote with inline buttons

export async function handleQuote(botToken, msg, lang) {
  const chatId = msg.chat.id;
  const quote = pick(QUOTES);

  const text =
    `💎 \n` +
    `     *𝗗𝗲𝘃 𝗪𝗶𝘀𝗱𝗼𝗺* 🧠\n` +
    `\n\n` +
    `_"${quote.text}"_\n\n` +
    `✍️ — *${quote.author}*\n\n` +
    ``;

  const markup = inlineKeyboard([
    [
      { text: '💎 Another Quote', data: 'quote:new' },
      { text: '😂 Tell a Joke', data: 'joke:new' },
    ],
    [
      { text: '🔖 Share Wisdom', data: 'quote:share' },
    ]
  ]);

  await sendSticker(botToken, chatId, STICKERS.think);
  return sendMessage(botToken, chatId, text, { replyMarkup: markup });
}

// /poll — Create a poll with preview

export async function handlePoll(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = args.join(' ');

  if (!input.includes('|')) {
    const text =
      `📊 *𝗣𝗼𝗹𝗹 𝗖𝗿𝗲𝗮𝘁𝗼𝗿*\n\n` +
      `\n` +
      `  Format:                \n` +
      `  /poll Question |       \n` +
      `        Option1 |        \n` +
      `        Option2 |        \n` +
      `        Option3          \n` +
      `\n\n` +
      `*Example:*\n` +
      `\`/poll Best language? | JS | Python | Go | Rust\``;

    return sendMessage(botToken, chatId, text, {
      replyMarkup: inlineKeyboard([[
        { text: '📝 How to use?', data: 'poll:help' }
      ]])
    });
  }

  const parts = input.split('|').map(s => s.trim()).filter(Boolean);
  const question = parts[0];
  const options  = parts.slice(1);

  if (!question) return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  if (options.length < 2) return sendMessage(botToken, chatId,
    '❌ *At least 2 options required!*\n`/poll Q | A | B`');
  if (options.length > 10) return sendMessage(botToken, chatId,
    '❌ *Maximum 10 options allowed.*');

  await sendMessage(botToken, chatId,
    `📊 *𝗣𝗼𝗹𝗹 𝗖𝗿𝗲𝗮𝘁𝗲𝗱!* ✅\n\n🗳️ *${question}*\n\n${options.map((o, i) => `${['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'][i]} ${o}`).join('\n')}\n\n_Tap below to vote! 👇_`
  );
  return sendPoll(botToken, chatId, question, options);
}

// /8ball — Premium magic 8-ball with inline buttons

export async function handleEightBall(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const question = args.join(' ').trim();

  if (!question) {
    return sendMessage(botToken, chatId,
      `🎱 *𝗠𝗮𝗴𝗶𝗰 𝟴-𝗕𝗮𝗹𝗹*\n\n_Ask me anything!_\n\n*Usage:*\n\`/8ball Will my code compile?\``,
      { replyMarkup: inlineKeyboard([[{ text: '🎱 Ask Something Random', data: '8ball:random' }]]) }
    );
  }

  const answer = pick(EIGHT_BALL_ANSWERS);
  const isPositive = answer.startsWith('✅');
  const isNegative = answer.startsWith('❌');
  const mood = isPositive ? '🟢' : isNegative ? '🔴' : '🟡';

  const text =
    `🎱 \n` +
    `       *𝗠𝗮𝗴𝗶𝗰 𝟴-𝗕𝗮𝗹𝗹* 🔮\n` +
    `\n\n` +
    `❓ _${question}_\n\n` +
    `${mood} *${answer}*\n\n` +
    ``;

  const markup = inlineKeyboard([
    [
      { text: '🔮 Ask Again', data: `8ball:${encodeURIComponent(question).slice(0, 50)}` },
      { text: '🎲 Roll Dice', data: 'dice:6' },
    ],
    [
      { text: '😂 Tell a Joke', data: 'joke:new' },
    ]
  ]);

  return sendMessage(botToken, chatId, text, { replyMarkup: markup });
}

// /dice — Premium animated dice with Telegram native dice

export async function handleDice(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = (args[0] || '6').toLowerCase();

  // Special emoji dice modes
  const emojiMap = {
    'dart':    '🎯',
    'bowl':    '🎳',
    'casino':  '🎰',
    'basket':  '🏀',
    'soccer':  '⚽',
    'football':'⚽',
    'slot':    '🎰',
  };

  // If user requests a special type
  if (emojiMap[input]) {
    const emoji = emojiMap[input];
    const diceResult = await sendNativeDice(botToken, chatId, emoji);
    const val = diceResult?.result?.dice?.value || '?';

    const labels = {
      '🎯': `🎯 *𝗗𝗮𝗿𝘁!* Scored: *${val}*`,
      '🎳': `🎳 *𝗕𝗼𝘄𝗹𝗶𝗻𝗴!* Knocked: *${val}*`,
      '🎰': `🎰 *𝗦𝗹𝗼𝘁 𝗠𝗮𝗰𝗵𝗶𝗻𝗲!* Result: *${val}*`,
      '🏀': `🏀 *𝗕𝗮𝘀𝗸𝗲𝘁𝗯𝗮𝗹𝗹!* Score: *${val}*`,
      '⚽': `⚽ *𝗙𝗼𝗼𝘁𝗯𝗮𝗹𝗹!* Score: *${val}*`,
    };

    return sendMessage(botToken, chatId,
      (labels[emoji] || `🎲 Result: *${val}*`) + '\n\n_Nice roll!_ 🎊',
      {
        replyMarkup: inlineKeyboard([
          [{ text: '🔄 Roll Again', data: `dice:${input}` }],
          [{ text: '🎲 Classic Dice', data: 'dice:6' }, { text: '🎯 Dart', data: 'dice:dart' }]
        ])
      }
    );
  }

  // Standard number dice
  const sides = Math.min(parseInt(input) || 6, 1000);
  if (sides < 2) return sendMessage(botToken, chatId, '❌ Dice must have at least 2 sides.');

  // Use Telegram's native animated 🎲 for standard 6-sided
  if (sides === 6) {
    const diceResult = await sendNativeDice(botToken, chatId, '🎲');
    const val = diceResult?.result?.dice?.value || Math.floor(Math.random() * 6) + 1;
    const diceEmoji = ['⚀','⚁','⚂','⚃','⚄','⚅'][val - 1] || '🎲';

    return sendMessage(botToken, chatId,
      `🎲 *𝗗𝗶𝗰𝗲 𝗥𝗼𝗹𝗹𝗲𝗱!*\n\n` +
      `${diceEmoji} *You rolled: ${val}*\n` +
      `${val === 6 ? '🎉 *MAXIMUM!* Lucky you!' : val === 1 ? '😬 *Snake eyes!*' : '_Not bad!_'}`,
      {
        replyMarkup: inlineKeyboard([
          [
            { text: '🔄 Roll Again', data: 'dice:6' },
            { text: '🎯 Dart', data: 'dice:dart' },
          ],
          [
            { text: '🎳 Bowl', data: 'dice:bowl' },
            { text: '🎰 Casino', data: 'dice:casino' },
          ],
          [
            { text: '🏀 Basketball', data: 'dice:basket' },
            { text: '⚽ Football', data: 'dice:soccer' },
          ]
        ])
      }
    );
  }

  // Custom-sided dice
  const result = Math.floor(Math.random() * sides) + 1;
  const percent = Math.round((result / sides) * 100);
  const bar = '█'.repeat(Math.round(percent / 10)) + '░'.repeat(10 - Math.round(percent / 10));

  return sendMessage(botToken, chatId,
    `🎲 *𝗗𝟮𝟬-𝗦𝗶𝗱𝗲𝗱 𝗗𝗶𝗰𝗲* (d${sides})\n\n` +
    `🎯 *Result: ${result}* / ${sides}\n\n` +
    `[${bar}] ${percent}%\n\n` +
    `_${result === sides ? '🏆 Maximum roll!' : result === 1 ? '😬 Minimum roll!' : '🎲 Good roll!'}_`,
    {
      replyMarkup: inlineKeyboard([
        [
          { text: `🔄 Roll d${sides} Again`, data: `dice:${sides}` },
          { text: '🎲 Roll d6', data: 'dice:6' },
        ]
      ])
    }
  );
}

// /about — Premium about card

export async function handleAbout(botToken, msg, lang) {
  const chatId = msg.chat.id;

  const text =
    `🤖 \n` +
    `  *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 v3.0* ✨\n` +
    `\n\n` +
    `⚡ *Runtime:* Cloudflare Workers\n` +
    `🧠 *AI:* Rule-based NLP Engine\n` +
    `🌍 *Languages:* 10 Supported\n` +
    `🛡️ *Moderation:* Smart Anti-Spam\n` +
    `🔐 *Security:* Password Generator\n` +
    `🛠️ *Tools:* 15+ Dev Utilities\n` +
    `📦 *Version:* \`3.0.0\`\n` +
    `📜 *License:* MIT\n\n` +
    `\n` +
    `👨‍💻 Built by [Md Salman Biswas](https://github.com/salman-dev-app)`;

  const markup = inlineKeyboard([
    [
      { text: '👨‍💻 Developer', data: 'credit:show' },
      { text: '📊 Live Stats', data: 'stats:show' },
    ],
    [
      { text: '🐙 GitHub', url: 'https://github.com/salman-dev-app' },
      { text: '💬 Telegram', url: 'https://t.me/Otakuosenpai' },
    ]
  ]);

  return sendMessage(botToken, chatId, text, { replyMarkup: markup });
}

// /credit — Premium developer card

export async function handleCredit(botToken, msg, lang) {
  const chatId = msg.chat.id;

  const text =
    `👨‍💻 \n` +
    `     *𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿 𝗖𝗮𝗿𝗱* 🏆\n` +
    `\n\n` +
    `🏆 *𝙈𝙙 𝙎𝙖𝙡𝙢𝙖𝙣 𝘽𝙞𝙨𝙬𝙖𝙨*\n` +
    `🎯 𝙎𝙚𝙣𝙞𝙤𝙧 𝙎𝙤𝙛𝙩𝙬𝙖𝙧𝙚 𝙀𝙣𝙜𝙞𝙣𝙚𝙚𝙧\n\n` +
    `🛠️ *𝗦𝗽𝗲𝗰𝗶𝗮𝗹𝗶𝘇𝗮𝘁𝗶𝗼𝗻:*\n` +
    ` 🏗️ Scalable Enterprise Apps\n` +
    ` ☁️ Cloud Architecture (AWS, CF)\n` +
    ` 📱 Mobile-First Architecture\n` +
    ` 🧹 Clean Code (SOLID & DRY)\n` +
    ` 🐳 Docker & DevOps\n\n` +
    `\n` +
    `_© 2024–2026 Md Salman Biswas_`;

  const markup = inlineKeyboard([
    [
      { text: '🐙 GitHub', url: 'https://github.com/salman-dev-app' },
      { text: '💬 Telegram', url: 'https://t.me/Otakuosenpai' },
    ],
    [
      { text: '📘 Facebook', url: 'https://facebook.com/salmandevapp' },
      { text: '📱 WhatsApp', url: 'https://wa.me/8801840933137' },
    ],
    [
      { text: '📧 Email', url: 'mailto:mdsalmanhelp@gmail.com' },
    ]
  ]);

  return sendMessage(botToken, chatId, text, { replyMarkup: markup });
}

// Callback handlers for fun module

export async function handleFunCallback(botToken, query, state) {
  const data    = query.data || '';
  const chatId  = query.message?.chat?.id;
  const msgId   = query.message?.message_id;
  const userId  = query.from?.id;

  //  joke:new
  if (data === 'joke:new') {
    await answerCallbackQuery(botToken, query.id, '😂 Here comes a new joke!');
    const joke = pick(JOKES);
    const text =
      `🎭 \n` +
      `      *𝗗𝗲𝘃 𝗝𝗼𝗸𝗲* 😂\n` +
      `\n\n` +
      `🤔 ${joke.setup}\n\n` +
      `💥 *${joke.punchline}*\n\n` +
      ``;
    return editMessageText(botToken, chatId, msgId, text, {
      replyMarkup: inlineKeyboard([
        [{ text: '😂 Another', data: 'joke:new' }, { text: '💭 Quote', data: 'quote:new' }],
        [{ text: '🎲 Dice', data: 'dice:6' }, { text: '🎱 8-Ball', data: '8ball:random' }]
      ])
    });
  }

  //  quote:new
  if (data === 'quote:new') {
    await answerCallbackQuery(botToken, query.id, '💎 Fresh wisdom incoming!');
    const quote = pick(QUOTES);
    const text =
      `💎 \n` +
      `     *𝗗𝗲𝘃 𝗪𝗶𝘀𝗱𝗼𝗺* 🧠\n` +
      `\n\n` +
      `_"${quote.text}"_\n\n` +
      `✍️ — *${quote.author}*\n\n` +
      ``;
    return editMessageText(botToken, chatId, msgId, text, {
      replyMarkup: inlineKeyboard([
        [{ text: '💎 Another', data: 'quote:new' }, { text: '😂 Joke', data: 'joke:new' }],
      ])
    });
  }

  //  8ball:random
  if (data === '8ball:random') {
    await answerCallbackQuery(botToken, query.id, '🔮 The ball is thinking...');
    const questions = [
      'Will my code work in production?',
      'Should I use tabs or spaces?',
      'Is JavaScript a real language?',
      'Will this PR get approved?',
      'Should I rewrite it in Rust?',
    ];
    const question = pick(questions);
    const answer   = pick(EIGHT_BALL_ANSWERS);
    const isPos = answer.startsWith('✅');
    const isNeg = answer.startsWith('❌');
    const mood  = isPos ? '🟢' : isNeg ? '🔴' : '🟡';

    const text =
      `🎱 \n` +
      `       *𝗠𝗮𝗴𝗶𝗰 𝟴-𝗕𝗮𝗹𝗹* 🔮\n` +
      `\n\n` +
      `❓ _${question}_\n\n` +
      `${mood} *${answer}*\n\n` +
      ``;
    return editMessageText(botToken, chatId, msgId, text, {
      replyMarkup: inlineKeyboard([
        [{ text: '🔮 Ask Again', data: '8ball:random' }, { text: '😂 Joke', data: 'joke:new' }]
      ])
    });
  }

  //  dice:*
  if (data.startsWith('dice:')) {
    const diceType = data.split(':')[1];
    await answerCallbackQuery(botToken, query.id, '🎲 Rolling...');

    const emojiMap = { dart: '🎯', bowl: '🎳', casino: '🎰', basket: '🏀', soccer: '⚽' };

    if (emojiMap[diceType]) {
      const emoji = emojiMap[diceType];
      const res   = await sendNativeDice(botToken, chatId, emoji);
      const val   = res?.result?.dice?.value || '?';
      return sendMessage(botToken, chatId,
        `${emoji} *Rolled: ${val}!* 🎊`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🔄 Again', data: `dice:${diceType}` }, { text: '🎲 Classic', data: 'dice:6' }]
          ])
        }
      );
    }

    const sides = parseInt(diceType) || 6;
    if (sides === 6) {
      const res = await sendNativeDice(botToken, chatId, '🎲');
      const val = res?.result?.dice?.value || Math.ceil(Math.random() * 6);
      const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
      return sendMessage(botToken, chatId,
        `🎲 *Rolled ${faces[val-1]} — ${val}!*\n${val===6?'🎉 MAX!':val===1?'😬 Min!':''}`,
        {
          replyMarkup: inlineKeyboard([
            [{ text: '🔄 Again', data: 'dice:6' }, { text: '🎯 Dart', data: 'dice:dart' }],
            [{ text: '🎰 Casino', data: 'dice:casino' }, { text: '🎳 Bowl', data: 'dice:bowl' }]
          ])
        }
      );
    }

    const result = Math.floor(Math.random() * sides) + 1;
    return sendMessage(botToken, chatId,
      `🎲 *d${sides}: ${result}* / ${sides}`,
      { replyMarkup: inlineKeyboard([[{ text: '🔄 Again', data: `dice:${sides}` }]]) }
    );
  }

  //  poll:help
  if (data === 'poll:help') {
    await answerCallbackQuery(botToken, query.id);
    return editMessageText(botToken, chatId, msgId,
      `📊 *𝗣𝗼𝗹𝗹 𝗛𝗲𝗹𝗽*\n\n*Format:*\n\`/poll Question | Option1 | Option2 | Option3\`\n\n*Example:*\n\`/poll Fav language? | JS | Python | Go\``,
      { replyMarkup: inlineKeyboard([[{ text: '⬅️ Back', data: 'poll:back' }]]) }
    );
  }

  //  credit:show
  if (data === 'credit:show') {
    await answerCallbackQuery(botToken, query.id, '👨‍💻 Loading developer card...');
    const text =
      `👨‍💻 \n` +
      `     *𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿 𝗖𝗮𝗿𝗱* 🏆\n` +
      `\n\n` +
      `🏆 *𝙈𝙙 𝙎𝙖𝙡𝙢𝙖𝙣 𝘽𝙞𝙨𝙬𝙖𝙨*\n` +
      `🎯 Senior Software Engineer\n\n` +
      `🌐 [GitHub](https://github.com/salman-dev-app) · [Telegram](https://t.me/Otakuosenpai)\n\n` +
      ``;
    return editMessageText(botToken, chatId, msgId, text, {
      replyMarkup: inlineKeyboard([
        [{ text: '🐙 GitHub', url: 'https://github.com/salman-dev-app' }],
        [{ text: '⬅️ Back', data: 'about:show' }]
      ])
    });
  }
}
