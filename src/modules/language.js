/**
 * Language Module
 * Handles /lang command and language switching
 */

import { sendMessage } from '../utils/telegram.js';
import { t, getLangList, getLang, LANGUAGES } from '../data/languages.js';
import { getUserLang, setUserLang, getChatLang, setChatLang } from '../utils/state.js';

/**
 * /lang [code] — Show language menu or switch language
 */
export async function handleLang(botToken, state, msg, args, currentLang) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  // No arg: show language list
  if (!args || args.length === 0) {
    return showLangMenu(botToken, chatId, currentLang);
  }

  const requestedLang = args[0].toLowerCase();

  // Validate language code
  if (!LANGUAGES[requestedLang]) {
    const available = Object.keys(LANGUAGES).join(', ');
    return sendMessage(botToken, chatId,
      `❓ Unknown language code: \`${requestedLang}\`\n\nAvailable: ${available}\n\nExample: \`/lang es\``);
  }

  // Set user and chat language
  await setUserLang(state, userId, requestedLang);
  await setChatLang(state, chatId, requestedLang);

  const langData = getLang(requestedLang);

  return sendMessage(botToken, chatId,
    t(requestedLang, 'langChanged', {
      lang: langData.name,
      flag: langData.flag
    }));
}

/**
 * Show language selection menu with inline keyboard
 */
async function showLangMenu(botToken, chatId, currentLang) {
  const langList = getLangList();
  const langData = getLang(currentLang);

  let menuText = t(currentLang, 'langMenu', {
    current: langData.name,
    flag: langData.flag
  }) + '\n\n';

  menuText += langList.map(l =>
    `${l.flag} \`/lang ${l.code}\` — ${l.name}${l.code === currentLang ? ' ✅' : ''}`
  ).join('\n');

  return sendMessage(botToken, chatId, menuText);
}

/**
 * Get effective language for a user/chat context
 */
export async function getEffectiveLang(state, userId, chatId) {
  // User preference takes priority over chat setting
  const userLang = await getUserLang(state, userId);
  if (userLang && userLang !== 'en') return userLang;
  const chatLang = await getChatLang(state, chatId);
  return chatLang || 'en';
}
