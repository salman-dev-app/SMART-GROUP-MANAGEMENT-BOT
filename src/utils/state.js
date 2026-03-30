export class StateManager {
  constructor(kv) {
    this.kv = kv;
    this.mem = new Map();
  }

  async get(key) {
    if (this.kv) return this.kv.get(key);
    return this.mem.get(key) ?? null;
  }

  async set(key, value, ttl) {
    if (this.kv) return this.kv.put(key, String(value), ttl ? { expirationTtl: ttl } : {});
    this.mem.set(key, String(value));
  }

  async delete(key) {
    if (this.kv) return this.kv.delete(key);
    this.mem.delete(key);
  }

  async increment(key, by = 1) {
    const cur = parseInt(await this.get(key) || '0');
    await this.set(key, cur + by);
    return cur + by;
  }
}

export async function getUserLang(state, userId) {
  return (await state.get(`lang:${userId}`)) || 'en';
}

export async function setUserLang(state, userId, lang) {
  return state.set(`lang:${userId}`, lang);
}

export async function incrementStat(state, key) {
  return state.increment(`stat:${key}`);
}

export async function getStats(state) {
  const [messages, commands, ai_calls, files_sent] = await Promise.all([
    state.get('stat:messages'),
    state.get('stat:commands'),
    state.get('stat:ai_calls'),
    state.get('stat:files_sent'),
  ]);
  return {
    messages: parseInt(messages || 0),
    commands: parseInt(commands || 0),
    ai_calls: parseInt(ai_calls || 0),
    files_sent: parseInt(files_sent || 0),
  };
}
