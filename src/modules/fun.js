// Fun Module
import { sendMessage, editMessageText, answerCallbackQuery, inlineKeyboard, sendDice, sendPoll } from '../utils/telegram.js';

const JOKES = [
  { q: 'Why do programmers prefer dark mode?', a: 'Because light attracts bugs.' },
  { q: 'How many programmers does it take to change a light bulb?', a: 'None. That\'s a hardware problem.' },
  { q: 'Why did the developer go broke?', a: 'Because he used up all his cache.' },
  { q: 'A SQL query walks into a bar...', a: '...walks up to two tables and asks "Can I join you?"' },
  { q: 'Why do Java developers wear glasses?', a: 'Because they don\'t C#.' },
  { q: 'What do you call a programmer from Finland?', a: 'Nerdic.' },
  { q: 'Why did the programmer quit his job?', a: 'Because he didn\'t get arrays.' },
  { q: 'What\'s a computer\'s favorite snack?', a: 'Microchips.' },
  { q: 'Why do programmers hate nature?', a: 'It has too many bugs and no debugging tool.' },
  { q: 'A byte walks into a bar looking sad.', a: 'Bartender: "What\'s wrong?" Byte: "I had a bit flip."' },
  { q: 'Why is it called "object-oriented" programming?', a: 'Because programmers are very object-ive.' },
  { q: 'What did the git commit say to the branch?', a: '"I\'m committed to you."' },
  { q: 'Why did the developer leave the restaurant?', a: 'Because the food had too many cookies.' },
  { q: 'What\'s a programmer\'s favorite hangout place?', a: 'Foo Bar.' },
  { q: 'How do you comfort a JavaScript bug?', a: 'You console it.' },
];

const QUOTES = [
  { text: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', author: 'Martin Fowler' },
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { text: 'Experience is the name everyone gives to their mistakes.', author: 'Oscar Wilde' },
  { text: 'In order to be irreplaceable, one must always be different.', author: 'Coco Chanel' },
  { text: 'Java is to JavaScript what car is to Carpet.', author: 'Chris Heilmann' },
  { text: 'Knowledge is power.', author: 'Francis Bacon' },
  { text: 'Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday\'s code.', author: 'Dan Salomon' },
  { text: 'Perfection is achieved not when there is nothing more to add, but rather when there is nothing more to take away.', author: 'Antoine de Saint-Exupery' },
  { text: 'Code is like humor. When you have to explain it, it\'s bad.', author: 'Cory House' },
  { text: 'Programming isn\'t about what you know; it\'s about what you can figure out.', author: 'Chris Pine' },
  { text: 'The best error message is the one that never shows up.', author: 'Thomas Fuchs' },
  { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  { text: 'Walking on water and developing software from a specification are easy if both are frozen.', author: 'Edward V. Berard' },
  { text: 'It\'s not a bug — it\'s an undocumented feature.', author: 'Anonymous' },
  { text: 'Clean code always looks like it was written by someone who cares.', author: 'Robert C. Martin' },
];

const BALL_ANSWERS = [
  '✅ It is certain', '✅ Without a doubt', '✅ Yes, definitely',
  '✅ You may rely on it', '✅ Most likely', '✅ Outlook good',
  '⚖️ Reply hazy, try again', '⚖️ Ask again later', '⚖️ Cannot predict now',
  '❌ Don\'t count on it', '❌ My reply is no', '❌ Very doubtful',
  '✅ Signs point to yes', '❌ Outlook not so good', '⚖️ Concentrate and ask again',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const HOME_BTN = [{ text: '🏠 Home', data: 'home' }];

export async function handleJoke(token, msg) {
  const chatId = msg.chat.id;
  const joke = pick(JOKES);
  return sendMessage(token, chatId,
    `😄 *Dev Joke*\n\n🤔 ${joke.q}\n\n💡 *${joke.a}*`,
    { replyMarkup: inlineKeyboard([
      [{ text: '😄 Another', data: 'joke:new' }, { text: '💡 Quote', data: 'quote:new' }],
      HOME_BTN,
    ]) });
}

export async function handleQuote(token, msg) {
  const chatId = msg.chat.id;
  const q = pick(QUOTES);
  return sendMessage(token, chatId,
    `💡 *Dev Quote*\n\n_"${q.text}"_\n\n— *${q.author}*`,
    { replyMarkup: inlineKeyboard([
      [{ text: '💡 Another', data: 'quote:new' }, { text: '😄 Joke', data: 'joke:new' }],
      HOME_BTN,
    ]) });
}

export async function handleDice(token, msg, args) {
  const chatId = msg.chat.id;
  const input = (args[0] || '6').toLowerCase();

  const emojiMap = { dart: '🎯', bowl: '🎳', casino: '🎰', basket: '🏀', soccer: '⚽' };

  if (emojiMap[input]) {
    const res = await sendDice(token, chatId, emojiMap[input]);
    const val = res?.result?.dice?.value || '?';
    return sendMessage(token, chatId,
      `${emojiMap[input]} *Rolled:* \`${val}\``,
      { replyMarkup: inlineKeyboard([
        [{ text: '🔄 Again', data: `dice:${input}` }, { text: '🎲 d6', data: 'dice:6' }],
        HOME_BTN,
      ]) });
  }

  const sides = Math.min(parseInt(input) || 6, 1000);
  if (sides < 2) return sendMessage(token, chatId, '❌ Minimum 2 sides.');

  if (sides === 6) {
    const res = await sendDice(token, chatId, '🎲');
    const val = res?.result?.dice?.value || Math.ceil(Math.random() * 6);
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return sendMessage(token, chatId,
      `🎲 *Rolled:* ${faces[val - 1]} — \`${val}\`\n${val === 6 ? '🎉 Maximum!' : val === 1 ? '😬 Minimum!' : ''}`,
      { replyMarkup: inlineKeyboard([
        [{ text: '🔄 Roll Again', data: 'dice:6' }, { text: '🎯 Dart', data: 'dice:dart' }],
        [{ text: '🎳 Bowl', data: 'dice:bowl' }, { text: '🎰 Casino', data: 'dice:casino' }],
        HOME_BTN,
      ]) });
  }

  const result = Math.floor(Math.random() * sides) + 1;
  return sendMessage(token, chatId,
    `🎲 *d${sides}:* \`${result}\` / ${sides}${result === sides ? ' 🎉 Max!' : result === 1 ? ' 😬 Min!' : ''}`,
    { replyMarkup: inlineKeyboard([
      [{ text: `🔄 Roll d${sides}`, data: `dice:${sides}` }, { text: '🎲 d6', data: 'dice:6' }],
      HOME_BTN,
    ]) });
}

export async function handleEightBall(token, msg, args) {
  const chatId = msg.chat.id;
  const question = args.join(' ').trim();
  if (!question) return sendMessage(token, chatId,
    `🎱 *Magic 8-Ball*\n\nAsk me a yes/no question!\n\nUsage: \`/8ball Will my code work?\``,
    { replyMarkup: inlineKeyboard([[{ text: '🎱 Ask Random', data: '8ball:random' }, ...HOME_BTN]]) });
  const answer = pick(BALL_ANSWERS);
  return sendMessage(token, chatId,
    `🎱 *Magic 8-Ball*\n\n❓ _${question}_\n\n${answer}`,
    { replyMarkup: inlineKeyboard([
      [{ text: '🔮 Ask Again', data: `8ball:${encodeURIComponent(question.slice(0, 50))}`}],
      HOME_BTN,
    ]) });
}

export async function handlePoll(token, msg, args) {
  const chatId = msg.chat.id;
  const input = args.join(' ');
  if (!input.includes('|')) return sendMessage(token, chatId,
    `📊 *Create Poll*\n\nFormat:\n\`/poll Question | Option 1 | Option 2 | Option 3\`\n\nExample:\n\`/poll Best language? | JS | Python | Go | Rust\``);
  const parts = input.split('|').map(s => s.trim()).filter(Boolean);
  const question = parts[0];
  const options = parts.slice(1);
  if (options.length < 2) return sendMessage(token, chatId, '❌ At least 2 options required.');
  if (options.length > 10) return sendMessage(token, chatId, '❌ Maximum 10 options.');
  await sendMessage(token, chatId, `📊 *Poll created!*\n\n*${question}*\n${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}`);
  return sendPoll(token, chatId, question, options);
}

export async function handleFunCallback(token, query) {
  const data = query.data;
  const chatId = query.message?.chat?.id;
  const msgId = query.message?.message_id;

  if (data === 'joke:new') {
    await answerCallbackQuery(token, query.id, '😄 Here comes one!');
    const joke = pick(JOKES);
    return editMessageText(token, chatId, msgId,
      `😄 *Dev Joke*\n\n🤔 ${joke.q}\n\n💡 *${joke.a}*`,
      { replyMarkup: inlineKeyboard([
        [{ text: '😄 Another', data: 'joke:new' }, { text: '💡 Quote', data: 'quote:new' }],
        HOME_BTN,
      ]) });
  }

  if (data === 'quote:new') {
    await answerCallbackQuery(token, query.id, '💡 Wisdom incoming!');
    const q = pick(QUOTES);
    return editMessageText(token, chatId, msgId,
      `💡 *Dev Quote*\n\n_"${q.text}"_\n\n— *${q.author}*`,
      { replyMarkup: inlineKeyboard([
        [{ text: '💡 Another', data: 'quote:new' }, { text: '😄 Joke', data: 'joke:new' }],
        HOME_BTN,
      ]) });
  }

  if (data === '8ball:random') {
    await answerCallbackQuery(token, query.id, '🎱 The ball speaks...');
    const questions = [
      'Will my code work in production?',
      'Should I use tabs or spaces?',
      'Is JavaScript a real language?',
      'Will this PR get approved?',
      'Should I rewrite it in Rust?',
      'Is it a good day to deploy on Friday?',
    ];
    const answer = pick(BALL_ANSWERS);
    return editMessageText(token, chatId, msgId,
      `🎱 *Magic 8-Ball*\n\n❓ _${pick(questions)}_\n\n${answer}`,
      { replyMarkup: inlineKeyboard([
        [{ text: '🔮 Ask Again', data: '8ball:random' }],
        HOME_BTN,
      ]) });
  }

  if (data.startsWith('8ball:') && data !== '8ball:random') {
    await answerCallbackQuery(token, query.id, '🎱 Asking again...');
    const question = decodeURIComponent(data.split(':')[1]);
    const answer = pick(BALL_ANSWERS);
    return editMessageText(token, chatId, msgId,
      `🎱 *Magic 8-Ball*\n\n❓ _${question}_\n\n${answer}`,
      { replyMarkup: inlineKeyboard([
        [{ text: '🔮 Ask Again', data: data }],
        HOME_BTN,
      ]) });
  }

  if (data.startsWith('dice:')) {
    const type = data.split(':')[1];
    await answerCallbackQuery(token, query.id, '🎲 Rolling...');
    const emojiMap = { dart: '🎯', bowl: '🎳', casino: '🎰', basket: '🏀', soccer: '⚽' };
    if (emojiMap[type]) {
      const res = await sendDice(token, chatId, emojiMap[type]);
      const val = res?.result?.dice?.value || '?';
      return sendMessage(token, chatId,
        `${emojiMap[type]} *Rolled:* \`${val}\``,
        { replyMarkup: inlineKeyboard([
          [{ text: '🔄 Again', data: `dice:${type}` }, { text: '🎲 d6', data: 'dice:6' }],
          HOME_BTN,
        ]) });
    }
    const sides = parseInt(type) || 6;
    if (sides === 6) {
      const res = await sendDice(token, chatId, '🎲');
      const val = res?.result?.dice?.value || Math.ceil(Math.random() * 6);
      const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      return sendMessage(token, chatId,
        `🎲 *Rolled:* ${faces[val - 1]} — \`${val}\``,
        { replyMarkup: inlineKeyboard([
          [{ text: '🔄 Again', data: 'dice:6' }, { text: '🎯 Dart', data: 'dice:dart' }],
          HOME_BTN,
        ]) });
    }
    const result = Math.floor(Math.random() * sides) + 1;
    return sendMessage(token, chatId,
      `🎲 *d${sides}:* \`${result}\` / ${sides}`,
      { replyMarkup: inlineKeyboard([
        [{ text: `🔄 d${sides}`, data: `dice:${sides}` }, ...HOME_BTN],
      ]) });
  }
}
