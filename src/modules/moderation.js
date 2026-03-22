/**
 * Smart Moderation Module
 * Handles: spam detection, warn, ban, mute, admin checks
 */

import {
  banChatMember, unbanChatMember, restrictChatMember,
  getChatMember, sendMessage, deleteMessage, getUserName
} from '../utils/telegram.js';
import {
  getWarnings, addWarning, clearWarnings,
  checkSpamRate, resetSpamRate,
  setMuted, isMuted, removeMute,
  incrementStat
} from '../utils/state.js';
import { t, getLang } from '../data/languages.js';

// ── Spam detection patterns ──────────────────────────────────

const SPAM_PATTERNS = [
  // Crypto/scam promotion
  /\b(crypto|bitcoin|btc|eth|binance|coinbase)\b.*(profit|earn|invest|100x|moon|pump)/i,
  /\b(airdrop|free.?token|giveaway|limited.?offer)\b/i,
  // Telegram invite spam
  /t\.me\/[a-z0-9_+]+/i,
  // URL flood (multiple links in same message)
  /https?:\/\/[^\s]+.*https?:\/\/[^\s]+.*https?:\/\/[^\s]+/i,
  // Obvious spam phrases
  /\b(make money fast|work from home|click here now|earn \$\d+|limited time offer)\b/i,
  // Repeated characters (flood)
  /(.)\1{9,}/,
  // ALL CAPS long message detection (handled dynamically)
];

const SPAM_KEYWORDS = [
  'casino', 'pornhub', 'adult content', 'click here to earn',
  'you won', 'congratulations you have been selected',
  'send me your wallet', 'dm me for profits'
];

/**
 * Analyze message for spam
 * Returns { isSpam: bool, reason: string }
 */
export function analyzeSpam(text) {
  if (!text) return { isSpam: false };

  // Pattern matching
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { isSpam: true, reason: 'spam pattern detected' };
    }
  }

  // Keyword matching
  const lower = text.toLowerCase();
  for (const keyword of SPAM_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { isSpam: true, reason: 'spam keyword' };
    }
  }

  // ALL CAPS check (>70% caps in messages longer than 20 chars)
  if (text.length > 20) {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 10) {
      const capsRatio = (letters.replace(/[^A-Z]/g, '').length) / letters.length;
      if (capsRatio > 0.8) {
        return { isSpam: true, reason: 'excessive caps' };
      }
    }
  }

  // Message too long (>1000 chars can be flood)
  if (text.length > 1000) {
    return { isSpam: true, reason: 'message flood' };
  }

  return { isSpam: false };
}

/**
 * Check if user is an admin in the chat
 */
export async function isAdmin(botToken, chatId, userId) {
  try {
    const result = await getChatMember(botToken, chatId, userId);
    if (!result.ok) return false;
    const status = result.result?.status;
    return status === 'administrator' || status === 'creator';
  } catch {
    return false;
  }
}

/**
 * Check if bot is an admin
 */
export async function botIsAdmin(botToken, chatId, botId) {
  return isAdmin(botToken, chatId, botId);
}

/**
 * Handle incoming message for auto-moderation
 */
export async function handleAutoModeration(botToken, state, msg, lang = 'en') {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text = msg.text || msg.caption || '';

  if (!userId || !chatId) return false;

  // Skip admins from auto-moderation
  const adminCheck = await isAdmin(botToken, chatId, userId);
  if (adminCheck) return false;

  // Check mute status
  const muted = await isMuted(state, userId, chatId);
  if (muted) {
    await deleteMessage(botToken, chatId, msg.message_id);
    return true;
  }

  // Rate limiting (spam flood)
  const isRateLimited = await checkSpamRate(state, userId, chatId, 8);
  if (isRateLimited) {
    await deleteMessage(botToken, chatId, msg.message_id).catch(() => {});
    const userName = getUserName(msg.from);
    await sendMessage(botToken, chatId,
      t(lang, 'spamWarned', { user: userName }));
    await incrementStat(state, 'spam');
    // Auto-warn on rate limit
    await executeWarn(botToken, state, chatId, userId, msg.from, 'rate limiting', lang);
    return true;
  }

  // Content spam check
  if (text) {
    const { isSpam, reason } = analyzeSpam(text);
    if (isSpam) {
      await deleteMessage(botToken, chatId, msg.message_id).catch(() => {});
      const userName = getUserName(msg.from);
      await sendMessage(botToken, chatId,
        t(lang, 'spamDetected', { user: userName }));
      await incrementStat(state, 'spam');
      await executeWarn(botToken, state, chatId, userId, msg.from, reason, lang);
      return true;
    }
  }

  return false;
}

/**
 * Core warn logic (used by /warn command and auto-moderation)
 */
export async function executeWarn(botToken, state, chatId, userId, userObj, reason, lang = 'en') {
  const count = await addWarning(state, userId, chatId);
  const userName = getUserName(userObj || { id: userId });
  await incrementStat(state, 'warnings');

  if (count >= 3) {
    // Auto-ban after 3 warnings
    await banChatMember(botToken, chatId, userId);
    await clearWarnings(state, userId, chatId);
    await incrementStat(state, 'bans');
    await sendMessage(botToken, chatId,
      t(lang, 'warnBan', { user: userName, count }));
    return { warned: true, banned: true, count };
  }

  await sendMessage(botToken, chatId,
    t(lang, 'warnSuccess', { user: userName, count, reason: reason || 'No reason provided' }));
  return { warned: true, banned: false, count };
}

// ── Command Handlers ─────────────────────────────────────────

/**
 * /warn @user [reason]
 */
export async function handleWarn(botToken, state, msg, args, lang) {
  const chatId = msg.chat.id;
  const issuerId = msg.from?.id;

  if (!await isAdmin(botToken, chatId, issuerId)) {
    return sendMessage(botToken, chatId, t(lang, 'noPermission'));
  }

  const { targetId, targetUser, reason } = await resolveTarget(botToken, msg, args);
  if (!targetId) {
    return sendMessage(botToken, chatId, t(lang, 'userNotFound'));
  }

  // Admins can't be warned
  if (await isAdmin(botToken, chatId, targetId)) {
    return sendMessage(botToken, chatId, '⚠️ Cannot warn administrators.');
  }

  return executeWarn(botToken, state, chatId, targetId, targetUser, reason, lang);
}

/**
 * /ban @user [reason]
 */
export async function handleBan(botToken, state, msg, args, lang) {
  const chatId = msg.chat.id;
  const issuerId = msg.from?.id;

  if (!await isAdmin(botToken, chatId, issuerId)) {
    return sendMessage(botToken, chatId, t(lang, 'noPermission'));
  }

  const { targetId, targetUser, reason } = await resolveTarget(botToken, msg, args);
  if (!targetId) {
    return sendMessage(botToken, chatId, t(lang, 'userNotFound'));
  }

  if (await isAdmin(botToken, chatId, targetId)) {
    return sendMessage(botToken, chatId, '🚫 Cannot ban administrators.');
  }

  await banChatMember(botToken, chatId, targetId);
  await incrementStat(state, 'bans');
  const userName = getUserName(targetUser || { id: targetId });

  return sendMessage(botToken, chatId,
    t(lang, 'banSuccess', {
      user: userName,
      reason: reason || 'No reason provided'
    }));
}

/**
 * /unban @user
 */
export async function handleUnban(botToken, state, msg, args, lang) {
  const chatId = msg.chat.id;
  const issuerId = msg.from?.id;

  if (!await isAdmin(botToken, chatId, issuerId)) {
    return sendMessage(botToken, chatId, t(lang, 'noPermission'));
  }

  const { targetId, targetUser } = await resolveTarget(botToken, msg, args);
  if (!targetId) {
    return sendMessage(botToken, chatId, t(lang, 'userNotFound'));
  }

  await unbanChatMember(botToken, chatId, targetId);
  const userName = getUserName(targetUser || { id: targetId });

  return sendMessage(botToken, chatId, t(lang, 'unbanSuccess', { user: userName }));
}

/**
 * /mute @user [minutes]
 */
export async function handleMute(botToken, state, msg, args, lang) {
  const chatId = msg.chat.id;
  const issuerId = msg.from?.id;

  if (!await isAdmin(botToken, chatId, issuerId)) {
    return sendMessage(botToken, chatId, t(lang, 'noPermission'));
  }

  const { targetId, targetUser, reason } = await resolveTarget(botToken, msg, args);
  if (!targetId) {
    return sendMessage(botToken, chatId, t(lang, 'userNotFound'));
  }

  if (await isAdmin(botToken, chatId, targetId)) {
    return sendMessage(botToken, chatId, '🚫 Cannot mute administrators.');
  }

  // Parse duration (default 10 minutes)
  const durationMatch = (reason || '').match(/^(\d+)/);
  const duration = durationMatch ? parseInt(durationMatch[1]) : 10;
  const untilDate = Math.floor(Date.now() / 1000) + duration * 60;

  await restrictChatMember(botToken, chatId, targetId, {
    can_send_messages: false,
    can_send_media_messages: false,
    can_send_polls: false,
    can_send_other_messages: false,
    can_add_web_page_previews: false,
    can_change_info: false,
    can_invite_users: false,
    can_pin_messages: false
  }, untilDate);

  await setMuted(state, targetId, chatId, duration);
  const userName = getUserName(targetUser || { id: targetId });

  return sendMessage(botToken, chatId,
    t(lang, 'muteSuccess', { user: userName, duration }));
}

/**
 * /unmute @user
 */
export async function handleUnmute(botToken, state, msg, args, lang) {
  const chatId = msg.chat.id;
  const issuerId = msg.from?.id;

  if (!await isAdmin(botToken, chatId, issuerId)) {
    return sendMessage(botToken, chatId, t(lang, 'noPermission'));
  }

  const { targetId, targetUser } = await resolveTarget(botToken, msg, args);
  if (!targetId) {
    return sendMessage(botToken, chatId, t(lang, 'userNotFound'));
  }

  await restrictChatMember(botToken, chatId, targetId, {
    can_send_messages: true,
    can_send_media_messages: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true
  });

  await removeMute(state, targetId, chatId);
  const userName = getUserName(targetUser || { id: targetId });

  return sendMessage(botToken, chatId, t(lang, 'unmuteSuccess', { user: userName }));
}

/**
 * /warnings @user
 */
export async function handleWarnings(botToken, state, msg, args, lang) {
  const chatId = msg.chat.id;
  const { targetId, targetUser } = await resolveTarget(botToken, msg, args);

  if (!targetId) {
    return sendMessage(botToken, chatId, t(lang, 'userNotFound'));
  }

  const count = await getWarnings(state, targetId, chatId);
  const userName = getUserName(targetUser || { id: targetId });

  if (count === 0) {
    return sendMessage(botToken, chatId, t(lang, 'noWarnings', { user: userName }));
  }
  return sendMessage(botToken, chatId,
    t(lang, 'warningsList', { user: userName, count }));
}

/**
 * /clearwarns @user
 */
export async function handleClearWarns(botToken, state, msg, args, lang) {
  const chatId = msg.chat.id;
  const issuerId = msg.from?.id;

  if (!await isAdmin(botToken, chatId, issuerId)) {
    return sendMessage(botToken, chatId, t(lang, 'noPermission'));
  }

  const { targetId, targetUser } = await resolveTarget(botToken, msg, args);
  if (!targetId) {
    return sendMessage(botToken, chatId, t(lang, 'userNotFound'));
  }

  await clearWarnings(state, targetId, chatId);
  const userName = getUserName(targetUser || { id: targetId });

  return sendMessage(botToken, chatId, t(lang, 'warningsCleared', { user: userName }));
}

// ── Helper: Resolve target user from reply or @mention ───────

async function resolveTarget(botToken, msg, args) {
  // Priority 1: Reply to message
  if (msg.reply_to_message?.from) {
    const user = msg.reply_to_message.from;
    const reasonParts = (args || []).slice(0); // all args are reason
    return {
      targetId: user.id,
      targetUser: user,
      reason: reasonParts.join(' ') || 'No reason provided'
    };
  }

  // Priority 2: @username or user_id in args
  if (args && args.length > 0) {
    const firstArg = args[0];

    // @username mention
    if (firstArg.startsWith('@')) {
      const username = firstArg.slice(1);
      // We can't resolve username to ID directly without a DB lookup,
      // so return a placeholder – in real usage they'd reply to message
      const reason = args.slice(1).join(' ') || 'No reason provided';
      return {
        targetId: null,
        targetUser: { username },
        reason,
        unresolved: true
      };
    }

    // Numeric user_id
    const numericId = parseInt(firstArg);
    if (!isNaN(numericId)) {
      const reason = args.slice(1).join(' ') || 'No reason provided';
      try {
        const member = await getChatMember(botToken, msg.chat.id, numericId);
        const user = member?.result?.user || { id: numericId };
        return { targetId: numericId, targetUser: user, reason };
      } catch {
        return { targetId: numericId, targetUser: { id: numericId }, reason };
      }
    }
  }

  return { targetId: null, targetUser: null, reason: null };
}
