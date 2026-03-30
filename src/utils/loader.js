/**
 * Animated loader — live-edits a Telegram message with smooth animation
 * while AI is processing, then shows completion time.
 */

import { sendMessage, editMessageText } from './telegram.js';

// Braille spinner frames — smooth rotation
const SPIN = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

// Task configs
const TASKS = {
  research:  { icon: '🔍', label: 'Researching',  steps: ['Searching web…','Reading sources…','Analyzing…','Compiling answer…'] },
  agent:     { icon: '⚡', label: 'Agent',         steps: ['Planning…','Building…','Writing code…','Reviewing…'] },
  coding:    { icon: '💻', label: 'Generating',    steps: ['Thinking…','Writing code…','Optimizing…','Finalizing…'] },
  landing:   { icon: '🎨', label: 'Designing',     steps: ['Planning layout…','Writing HTML…','Styling…','Adding polish…'] },
  review:    { icon: '🔍', label: 'Reviewing',     steps: ['Reading code…','Checking logic…','Finding issues…','Writing feedback…'] },
  debug:     { icon: '🐛', label: 'Debugging',     steps: ['Tracing error…','Analyzing cause…','Finding fix…','Writing solution…'] },
  optimize:  { icon: '⚡', label: 'Optimizing',    steps: ['Profiling…','Identifying bottlenecks…','Rewriting…','Benchmarking…'] },
  test:      { icon: '🧪', label: 'Testing',       steps: ['Reading code…','Writing unit tests…','Edge cases…','Finalizing…'] },
  docs:      { icon: '📝', label: 'Documenting',   steps: ['Reading code…','Writing docs…','Adding examples…','Formatting…'] },
  explain:   { icon: '🧠', label: 'Explaining',    steps: ['Understanding…','Breaking down…','Simplifying…','Writing…'] },
  fix:       { icon: '🔧', label: 'Fixing',        steps: ['Analyzing bug…','Tracing issue…','Applying fix…','Verifying…'] },
  convert:   { icon: '🔄', label: 'Converting',    steps: ['Parsing source…','Translating…','Adapting idioms…','Finalizing…'] },
  security:  { icon: '🛡️', label: 'Auditing',     steps: ['Scanning…','Checking vulns…','Assessing risk…','Writing report…'] },
  general:   { icon: '🤖', label: 'Thinking',      steps: ['Processing…','Reasoning…','Formulating…','Almost done…'] },
};

// Progress bar — grows from 0 to full over ~25 seconds
function bar(elapsed) {
  const filled = Math.min(Math.floor(elapsed / 25 * 10), 9);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

/**
 * Send initial loader message, start animation interval.
 * Returns { msgId, stop }
 * stop() → returns elapsed seconds string, clears interval
 */
export async function startLoader(token, chatId, taskType = 'general') {
  const cfg = TASKS[taskType] || TASKS.general;
  const startTime = Date.now();

  // Initial message
  let msgId = null;
  try {
    const sent = await sendMessage(
      token, chatId,
      `${cfg.icon} *${cfg.label}* ⠋\n\`░░░░░░░░░░\` 0s\n\n_${cfg.steps[0]}_`
    );
    msgId = sent?.result?.message_id ?? null;
  } catch { /* ignore */ }

  if (!msgId) {
    return { msgId: null, stop: () => '?' };
  }

  let frame = 0;
  let stepIdx = 0;
  let stopped = false;

  const iv = setInterval(async () => {
    if (stopped) return;
    const elapsed = ((Date.now() - startTime) / 1000);
    const elapsedStr = elapsed.toFixed(0);
    const spin = SPIN[frame % SPIN.length];
    const step = cfg.steps[stepIdx % cfg.steps.length];
    const b = bar(elapsed);
    const text = `${cfg.icon} *${cfg.label}* ${spin}\n\`${b}\` ${elapsedStr}s\n\n_${step}_`;
    try {
      await editMessageText(token, chatId, msgId, text);
    } catch {
      stopped = true;
      clearInterval(iv);
    }
    frame++;
    if (frame % 4 === 0) stepIdx++;
  }, 1200);

  function stop() {
    stopped = true;
    clearInterval(iv);
    return ((Date.now() - startTime) / 1000).toFixed(1);
  }

  return { msgId, stop };
}

/**
 * All-in-one helper:
 * 1. Sends animated loader
 * 2. Runs aiFn() in parallel with animation
 * 3. Stops animation on completion
 * 4. Edits loader message to "✅ Done in Xs" completion notice
 * 5. Returns { result, elapsed, msgId }
 */
export async function withLoader(token, chatId, taskType, aiFn) {
  const cfg = TASKS[taskType] || TASKS.general;
  const { msgId, stop } = await startLoader(token, chatId, taskType);

  const result = await aiFn();

  const elapsed = stop();

  // Edit loader to completion marker
  if (msgId) {
    try {
      await editMessageText(
        token, chatId, msgId,
        `${cfg.icon} *${cfg.label} complete* ✅  _(${elapsed}s)_`
      );
    } catch { /* message may be gone */ }
  }

  return { result, elapsed, msgId };
}
