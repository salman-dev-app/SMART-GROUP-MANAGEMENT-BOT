/**
 *   Language Module — Premium Edition       
 *   10 Languages · Inline Keyboard Picker   
 */

import { sendMessage, editMessageText, answerCallbackQuery, inlineKeyboard } from '../utils/telegram.js';
import { t, getLangList, getLang, LANGUAGES } from '../data/languages.js';
import { getUserLang, setUserLang, getChatLang, setChatLang } from '../utils/state.js';

/**
 * /lang [code] — Show inline language picker or switch language
 */
export async function handleLang(botToken, state, msg, args, currentLang) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!args || args.length === 0) {
    return showLangMenu(botToken, chatId, currentLang);
  }

  const requestedLang = args[0].toLowerCase();
  if (!LANGUAGES[requestedLang]) {
    const available = Object.keys(LANGUAGES).join(' · ');
    return sendMessage(botToken, chatId,
      `❓ *Unknown Language Code*\n\nAvailable: \`${available}\`\n\nExample: \`/lang hi\``,
      { replyMarkup: inlineKeyboard([[{ text: '🌍 Show Language Menu', data: 'lang:menu' }]]) }
    );
  }

  await setUserLang(state, userId, requestedLang);
  await setChatLang(state, chatId, requestedLang);
  const langData = getLang(requestedLang);

  return sendMessage(botToken, chatId,
    t(requestedLang, 'langChanged', { lang: langData.name, flag: langData.flag }),
    {
      replyMarkup: inlineKeyboard([
        [{ text: '🌍 Change Language', data: 'lang:menu' }],
        [{ text: '🏠 Home', data: 'start:home' }]
      ])
    }
  );
}

/**
 * Show the premium inline language selection keyboard
 */
export async function showLangMenu(botToken, chatId, currentLang, msgId = null) {
  const langData = getLang(currentLang);

  const text =
    `🌍 \n` +
    `    *𝗟𝗮𝗻𝗴𝘂𝗮𝗴𝗲 𝗦𝗲𝗹𝗲𝗰𝘁𝗼𝗿* 🗣️\n` +
    `\n\n` +
    `📍 Current: *${langData.name}* ${langData.flag}\n\n` +
    `_Tap a language to switch:_`;

  // Build a beautiful 2-column grid of language buttons
  const langList = getLangList();
  const rows = [];
  for (let i = 0; i < langList.length; i += 2) {
    const row = [];
    const l1  = langList[i];
    const l2  = langList[i + 1];
    row.push({
      text: `${l1.flag} ${l1.name}${l1.code === currentLang ? ' ✅' : ''}`,
      data: `lang:set:${l1.code}`
    });
    if (l2) {
      row.push({
        text: `${l2.flag} ${l2.name}${l2.code === currentLang ? ' ✅' : ''}`,
        data: `lang:set:${l2.code}`
      });
    }
    rows.push(row);
  }
  rows.push([{ text: '🏠 Back to Home', data: 'start:home' }]);

  const markup = inlineKeyboard(rows);

  if (msgId) {
    return editMessageText(botToken, chatId, msgId, text, { replyMarkup: markup });
  }
  return sendMessage(botToken, chatId, text, { replyMarkup: markup });
}

/**
 * Handle language callback queries
 */
export async function handleLangCallback(botToken, query, state) {
  const data   = query.data || '';
  const chatId = query.message?.chat?.id;
  const msgId  = query.message?.message_id;
  const userId = query.from?.id;

  // lang:menu — show the picker
  if (data === 'lang:menu') {
    const currentLang = await getEffectiveLang(state, userId, chatId);
    await answerCallbackQuery(botToken, query.id);
    return showLangMenu(botToken, chatId, currentLang, msgId);
  }

  // lang:set:xx — switch language
  if (data.startsWith('lang:set:')) {
    const langCode = data.split(':')[2];
    if (!LANGUAGES[langCode]) {
      return answerCallbackQuery(botToken, query.id, '❌ Unknown language', true);
    }

    await setUserLang(state, userId, langCode);
    await setChatLang(state, chatId, langCode);

    const langData = getLang(langCode);
    await answerCallbackQuery(botToken, query.id, `✅ Switched to ${langData.name} ${langData.flag}!`);
    return showLangMenu(botToken, chatId, langCode, msgId);
  }
}

/**
 * Get effective language for a user/chat context
 */
export async function getEffectiveLang(state, userId, chatId) {
  const userLang = await getUserLang(state, userId);
  if (userLang && userLang !== 'en') return userLang;
  const chatLang = await getChatLang(state, chatId);
  return chatLang || 'en';
}
