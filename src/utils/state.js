/**
 * In-memory state store using Cloudflare Workers KV
 * Falls back to in-memory Map if KV is not configured (for local dev)
 */

// TTL constants (seconds)
const TTL = {
  SPAM_WINDOW: 60,        // 1 minute window for rate limiting
  MUTE: 24 * 3600,        // Max 24h mute
  SESSION: 7 * 24 * 3600, // 7 days for user prefs
};

/**
 * StateManager wraps KV or in-memory storage
 */
export class StateManager {
  constructor(kvNamespace = null) {
    this.kv = kvNamespace;
    this.memory = new Map(); // fallback for local dev
  }

  async get(key) {
    try {
      if (this.kv) {
        const val = await this.kv.get(key, 'json');
        return val;
      }
    } catch {}
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttlSeconds = 0) {
    try {
      if (this.kv) {
        const options = ttlSeconds > 0 ? { expirationTtl: ttlSeconds } : {};
        await this.kv.put(key, JSON.stringify(value), options);
        return;
      }
    } catch {}
    this.memory.set(key, {
      value,
      expires: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0
    });
  }

  async delete(key) {
    try {
      if (this.kv) {
        await this.kv.delete(key);
        return;
      }
    } catch {}
    this.memory.delete(key);
  }

  async increment(key, by = 1, ttlSeconds = TTL.SPAM_WINDOW) {
    const current = (await this.get(key)) || 0;
    const next = current + by;
    await this.set(key, next, ttlSeconds);
    return next;
  }
}

//  User warnings management 

export async function getWarnings(state, userId, chatId) {
  const key = `warn:${chatId}:${userId}`;
  return (await state.get(key)) || 0;
}

export async function addWarning(state, userId, chatId) {
  const key = `warn:${chatId}:${userId}`;
  const current = (await state.get(key)) || 0;
  const next = current + 1;
  await state.set(key, next, TTL.SESSION);
  return next;
}

export async function clearWarnings(state, userId, chatId) {
  const key = `warn:${chatId}:${userId}`;
  await state.delete(key);
}

//  User language preferences 

export async function getUserLang(state, userId) {
  const key = `lang:${userId}`;
  return (await state.get(key)) || 'en';
}

export async function setUserLang(state, userId, lang) {
  const key = `lang:${userId}`;
  await state.set(key, lang, TTL.SESSION);
}

export async function getChatLang(state, chatId) {
  const key = `lang:chat:${chatId}`;
  return (await state.get(key)) || 'en';
}

export async function setChatLang(state, chatId, lang) {
  const key = `lang:chat:${chatId}`;
  await state.set(key, lang, TTL.SESSION);
}

//  Spam / Rate limiting 

export async function checkSpamRate(state, userId, chatId, limit = 5) {
  const key = `spam:${chatId}:${userId}`;
  const count = await state.increment(key, 1, TTL.SPAM_WINDOW);
  return count > limit;
}

export async function resetSpamRate(state, userId, chatId) {
  const key = `spam:${chatId}:${userId}`;
  await state.delete(key);
}

//  Mute tracking 

export async function setMuted(state, userId, chatId, minutes) {
  const key = `mute:${chatId}:${userId}`;
  await state.set(key, true, minutes * 60);
}

export async function isMuted(state, userId, chatId) {
  const key = `mute:${chatId}:${userId}`;
  return !!(await state.get(key));
}

export async function removeMute(state, userId, chatId) {
  const key = `mute:${chatId}:${userId}`;
  await state.delete(key);
}

//  Global statistics 

export async function incrementStat(state, statKey) {
  const key = `stats:${statKey}`;
  const val = (await state.get(key)) || 0;
  await state.set(key, val + 1);
  return val + 1;
}

export async function getStats(state) {
  const keys = ['commands', 'messages', 'spam', 'warnings', 'bans'];
  const stats = {};
  for (const k of keys) {
    stats[k] = (await state.get(`stats:${k}`)) || 0;
  }
  return stats;
}
