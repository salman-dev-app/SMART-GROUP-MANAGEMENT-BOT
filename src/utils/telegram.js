/**
 * Telegram API wrapper utilities — Premium Edition
 * Bot: 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀
 */

//  Core API caller 

async function callApi(botToken, method, body) {
  const url = `https://api.telegram.org/bot${botToken}/${method}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!data.ok) {
      console.error(`Telegram API error [${method}]:`, data.description);
    }
    return data;
  } catch (err) {
    console.error(`Fetch error [${method}]:`, err.message);
    return { ok: false, description: err.message };
  }
}

//  Send a message 

export async function sendMessage(botToken, chatId, text, options = {}) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: options.parseMode || 'Markdown',
    disable_web_page_preview: options.disablePreview !== false,
  };
  if (options.replyMarkup)      body.reply_markup = options.replyMarkup;
  if (options.replyToMessageId) body.reply_to_message_id = options.replyToMessageId;
  if (options.extra)            Object.assign(body, options.extra);
  return callApi(botToken, 'sendMessage', body);
}

//  Edit an existing message 

export async function editMessageText(botToken, chatId, messageId, text, options = {}) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: options.parseMode || 'Markdown',
    disable_web_page_preview: true,
  };
  if (options.replyMarkup) body.reply_markup = options.replyMarkup;
  return callApi(botToken, 'editMessageText', body);
}

//  Answer a callback query 

export async function answerCallbackQuery(botToken, callbackQueryId, text = '', showAlert = false) {
  return callApi(botToken, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  });
}

//  Send a poll 

export async function sendPoll(botToken, chatId, question, options, extra = {}) {
  return callApi(botToken, 'sendPoll', {
    chat_id: chatId,
    question,
    options,
    is_anonymous: extra.anonymous !== false,
    allows_multiple_answers: extra.multipleAnswers || false,
    ...extra
  });
}

//  Delete a message 

export async function deleteMessage(botToken, chatId, messageId) {
  return callApi(botToken, 'deleteMessage', { chat_id: chatId, message_id: messageId });
}

//  Ban a chat member 

export async function banChatMember(botToken, chatId, userId, untilDate = 0) {
  return callApi(botToken, 'banChatMember', {
    chat_id: chatId, user_id: userId,
    until_date: untilDate, revoke_messages: false
  });
}

//  Unban a chat member 

export async function unbanChatMember(botToken, chatId, userId) {
  return callApi(botToken, 'unbanChatMember', {
    chat_id: chatId, user_id: userId, only_if_banned: true
  });
}

//  Restrict a chat member (mute) 

export async function restrictChatMember(botToken, chatId, userId, permissions, untilDate = 0) {
  return callApi(botToken, 'restrictChatMember', {
    chat_id: chatId, user_id: userId, permissions, until_date: untilDate
  });
}

//  Get chat member 

export async function getChatMember(botToken, chatId, userId) {
  return callApi(botToken, 'getChatMember', { chat_id: chatId, user_id: userId });
}

//  Get chat administrators 

export async function getChatAdministrators(botToken, chatId) {
  return callApi(botToken, 'getChatAdministrators', { chat_id: chatId });
}

//  Pin a message 

export async function pinChatMessage(botToken, chatId, messageId) {
  return callApi(botToken, 'pinChatMessage', {
    chat_id: chatId, message_id: messageId, disable_notification: false
  });
}

//  Get bot info 

export async function getMe(botToken) {
  return callApi(botToken, 'getMe', {});
}

//  Extract user display name 

export function getUserName(user) {
  if (!user) return 'Unknown';
  if (user.username) return `@${user.username}`;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return name || `User${user.id}`;
}

//  Build inline keyboard markup 

export function inlineKeyboard(rows) {
  return {
    inline_keyboard: rows.map(row =>
      row.map(btn => removeUndefined({
        text: btn.text,
        callback_data: btn.data || btn.callback_data,
        url: btn.url,
      }))
    )
  };
}

//  Helper: remove undefined keys 

function removeUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
