/**
 * Fun Commands Module
 * Jokes, quotes, polls, dice, 8ball
 */

import { sendMessage, sendPoll } from '../utils/telegram.js';
import { t } from '../data/languages.js';
import { JOKES, QUOTES, EIGHT_BALL_ANSWERS } from '../data/responses.js';

/**
 * /joke — Random developer joke
 */
export async function handleJoke(botToken, msg, lang) {
  const chatId = msg.chat.id;
  const joke = JOKES[Math.floor(Math.random() * JOKES.length)];

  return sendMessage(botToken, chatId,
    `😄 *Dev Joke*\n\n${joke.setup}\n\n*${joke.punchline}*`);
}

/**
 * /quote — Random developer wisdom quote
 */
export async function handleQuote(botToken, msg, lang) {
  const chatId = msg.chat.id;
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  return sendMessage(botToken, chatId,
    `💭 *Dev Wisdom*\n\n_"${quote.text}"_\n\n— *${quote.author}*`);
}

/**
 * /poll <question> | option1 | option2 | ... — Create a poll
 */
export async function handlePoll(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const input = args.join(' ');

  if (!input.includes('|')) {
    return sendMessage(botToken, chatId,
      `📊 *Poll Creator*\n\nUsage:\n\`/poll Question | Option 1 | Option 2 | ...\`\n\nExample:\n\`/poll Favorite language? | JavaScript | Python | Rust | Go\``);
  }

  const parts = input.split('|').map(s => s.trim()).filter(Boolean);
  const question = parts[0];
  const options = parts.slice(1);

  if (!question) {
    return sendMessage(botToken, chatId, t(lang, 'needArgs'));
  }

  if (options.length < 2) {
    return sendMessage(botToken, chatId,
      '❌ Please provide at least 2 options.\n\nExample: `/poll Question | Option A | Option B`');
  }

  if (options.length > 10) {
    return sendMessage(botToken, chatId,
      '❌ Maximum 10 options per poll.');
  }

  return sendPoll(botToken, chatId, question, options);
}

/**
 * /8ball <question> — Magic 8-ball
 */
export async function handleEightBall(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const question = args.join(' ').trim();

  if (!question) {
    return sendMessage(botToken, chatId,
      '🎱 *Magic 8-Ball*\n\nUsage: `/8ball Will my code compile?`');
  }

  const answer = EIGHT_BALL_ANSWERS[Math.floor(Math.random() * EIGHT_BALL_ANSWERS.length)];

  return sendMessage(botToken, chatId,
    `🎱 *Magic 8-Ball*\n\n❓ ${question}\n\n${t(lang, 'eightBall', { answer })}`);
}

/**
 * /dice [sides] — Roll a dice
 */
export async function handleDice(botToken, msg, args, lang) {
  const chatId = msg.chat.id;
  const sides = Math.min(parseInt(args[0]) || 6, 1000);

  if (sides < 2) {
    return sendMessage(botToken, chatId, '❌ Dice must have at least 2 sides.');
  }

  const result = Math.floor(Math.random() * sides) + 1;

  // Visual representation for standard dice
  let visual = '';
  if (sides === 6) {
    const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    visual = ` ${dice[result - 1]}`;
  }

  return sendMessage(botToken, chatId,
    `${t(lang, 'diceRoll', { result, sides })}${visual}`);
}

/**
 * /about — About the bot
 */
export async function handleAbout(botToken, msg, lang) {
  const chatId = msg.chat.id;
  return sendMessage(botToken, chatId, t(lang, 'about'));
}

/**
 * /credit — Developer credit card
 */
export async function handleCredit(botToken, msg, lang) {
  const chatId = msg.chat.id;
  return sendMessage(botToken, chatId, t(lang, 'credit'), {
    parseMode: 'Markdown',
    disablePreview: true
  });
}
