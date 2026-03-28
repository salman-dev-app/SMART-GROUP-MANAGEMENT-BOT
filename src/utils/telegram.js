const API = (token) => `https://api.telegram.org/bot${token}`;

async function call(token, method, body) {
  const res = await fetch(`${API(token)}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clean(body)),
  });
  return res.json();
}

function clean(obj) {
  if (typeof obj !== 'object' || !obj) return obj;
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  );
}

export async function sendMessage(token, chatId, text, opts = {}) {
  return call(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: opts.replyMarkup,
    reply_to_message_id: opts.replyToMessageId,
    disable_web_page_preview: true,
  });
}

export async function editMessageText(token, chatId, messageId, text, opts = {}) {
  return call(token, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'Markdown',
    reply_markup: opts.replyMarkup,
    disable_web_page_preview: true,
  });
}

export async function answerCallbackQuery(token, queryId, text = '', alert = false) {
  return call(token, 'answerCallbackQuery', {
    callback_query_id: queryId,
    text: text || undefined,
    show_alert: alert || undefined,
  });
}

export async function sendDice(token, chatId, emoji = '🎲') {
  return call(token, 'sendDice', { chat_id: chatId, emoji });
}

export async function sendPoll(token, chatId, question, options) {
  return call(token, 'sendPoll', {
    chat_id: chatId,
    question,
    options,
    is_anonymous: false,
  });
}

export async function sendChatAction(token, chatId, action = 'typing') {
  return call(token, 'sendChatAction', { chat_id: chatId, action });
}

export function inlineKeyboard(rows) {
  return {
    inline_keyboard: rows.map(row =>
      row.map(btn => btn.url
        ? { text: btn.text, url: btn.url }
        : { text: btn.text, callback_data: btn.data }
      )
    ),
  };
}

export function getUserName(from) {
  if (!from) return 'User';
  return from.first_name || from.username || 'User';
}
