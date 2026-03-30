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
  // Truncate if too long for Telegram (4096 char limit)
  if (text.length > 4000) {
    text = text.slice(0, 3990) + '\n\n`...`';
  }
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
  if (text.length > 4000) text = text.slice(0, 3990) + '\n\n`...`';
  return call(token, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'Markdown',
    reply_markup: opts.replyMarkup,
    disable_web_page_preview: true,
  });
}

export async function sendDocument(token, chatId, filename, content, caption, mimeType = 'text/plain') {
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const encoder = new TextEncoder();

  let bodyParts = [];

  // chat_id field
  bodyParts.push(encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`));

  // caption field
  if (caption) {
    bodyParts.push(encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`));
    bodyParts.push(encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`));
  }

  // document field
  const fileContent = typeof content === 'string' ? encoder.encode(content) : content;
  bodyParts.push(encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
  bodyParts.push(fileContent);
  bodyParts.push(encoder.encode(`\r\n--${boundary}--\r\n`));

  // Combine all parts
  const totalLength = bodyParts.reduce((sum, p) => sum + p.length, 0);
  const body = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of bodyParts) {
    body.set(part, offset);
    offset += part.length;
  }

  const res = await fetch(`${API(token)}/sendDocument`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: body.buffer,
  });
  return res.json();
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
