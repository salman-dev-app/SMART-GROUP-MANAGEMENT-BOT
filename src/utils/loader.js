/**
 * Ultra-fast Animated Loader v3.0
 * - Sends initial message INSTANTLY
 * - Faster animation (800ms intervals)
 * - Premium emoji stickers for each task type
 * - Auto-clears on completion
 * Created by Md Salman Biswas
 */

import { sendMessage, editMessageText } from './telegram.js';

// Slick spinner frames
const SPIN = ['◐','◓','◑','◒'];
const DOTS = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

// Premium task configs with sticker-like emoji
const TASKS = {
  research:    { icon: '🔍', emoji: '🌐', label: 'Researching',   steps: ['Searching web…','Reading sources…','Analyzing…','Compiling…'] },
  agent:       { icon: '🤖', emoji: '⚡', label: 'Agent Mode',    steps: ['Planning steps…','Executing…','Building…','Finalizing…'] },
  coding:      { icon: '💻', emoji: '🔥', label: 'Coding',        steps: ['Thinking…','Writing code…','Optimizing…','Almost done…'] },
  generate:    { icon: '⚡', emoji: '✨', label: 'Generating',     steps: ['Analyzing…','Writing…','Polishing…','Wrapping up…'] },
  landing:     { icon: '🎨', emoji: '🖌️', label: 'Designing',    steps: ['Planning layout…','Writing HTML…','CSS magic…','Final touches…'] },
  review:      { icon: '🔬', emoji: '🔍', label: 'Reviewing',     steps: ['Reading code…','Checking logic…','Finding issues…','Writing report…'] },
  debug:       { icon: '🐛', emoji: '🔧', label: 'Debugging',     steps: ['Tracing error…','Root cause…','Writing fix…','Verifying…'] },
  optimize:    { icon: '🚀', emoji: '⚡', label: 'Optimizing',    steps: ['Profiling…','Finding bottlenecks…','Rewriting…','Done!'] },
  test:        { icon: '🧪', emoji: '✅', label: 'Testing',       steps: ['Reading code…','Writing tests…','Edge cases…','Done!'] },
  docs:        { icon: '📝', emoji: '📚', label: 'Documenting',   steps: ['Reading…','Writing docs…','Examples…','Done!'] },
  explain:     { icon: '🧠', emoji: '💡', label: 'Explaining',    steps: ['Understanding…','Breaking down…','Simplifying…','Done!'] },
  fix:         { icon: '🔧', emoji: '🛠️', label: 'Fixing',       steps: ['Finding bug…','Tracing issue…','Applying fix…','Done!'] },
  convert:     { icon: '🔄', emoji: '🔀', label: 'Converting',    steps: ['Parsing…','Translating…','Adapting idioms…','Done!'] },
  security:    { icon: '🛡️', emoji: '🔒', label: 'Auditing',     steps: ['Scanning…','Checking vulns…','Risk assessment…','Report ready…'] },
  architect:   { icon: '🏗️', emoji: '📐', label: 'Architecting', steps: ['Analyzing…','Designing…','Planning…','Done!'] },
  interview:   { icon: '🎯', emoji: '🏆', label: 'Preparing',    steps: ['Loading questions…','Writing answers…','Adding tips…','Done!'] },
  deploy:      { icon: '🚀', emoji: '☁️', label: 'Deploying',    steps: ['Configuring…','Writing Dockerfile…','CI/CD…','Done!'] },
  brainstorm:  { icon: '💡', emoji: '🧠', label: 'Brainstorming', steps: ['Thinking…','Generating ideas…','Evaluating…','Done!'] },
  refactor:    { icon: '♻️', emoji: '✨', label: 'Refactoring',  steps: ['Analyzing…','Restructuring…','Cleaning…','Done!'] },
  schema:      { icon: '🗃️', emoji: '📊', label: 'Designing DB', steps: ['Modeling…','Relationships…','Indexes…','Done!'] },
  perf:        { icon: '⚡', emoji: '📈', label: 'Analyzing',     steps: ['Profiling…','Hotspots…','Benchmarking…','Done!'] },
  commit:      { icon: '📝', emoji: '✅', label: 'Writing commit', steps: ['Reading diff…','Formatting…','Done!'] },
  readme:      { icon: '📄', emoji: '🌟', label: 'Generating',   steps: ['Planning…','Writing…','Adding examples…','Done!'] },
  diff:        { icon: '↔️', emoji: '🔍', label: 'Comparing',    steps: ['Reading versions…','Diffing…','Analyzing…','Done!'] },
  error:       { icon: '💥', emoji: '🔎', label: 'Analyzing',    steps: ['Parsing error…','Root cause…','Fix…','Done!'] },
  general:     { icon: '🤖', emoji: '✨', label: 'Thinking',      steps: ['Processing…','Reasoning…','Almost done…','Done!'] },
};

// Minimal loading bar
function bar(elapsed, maxSec = 20) {
  const pct = Math.min(elapsed / maxSec, 0.95);
  const filled = Math.floor(pct * 8);
  return '█'.repeat(filled) + '░'.repeat(8 - filled);
}

/**
 * Start animated loader. Returns { msgId, stop }
 */
export async function startLoader(token, chatId, taskType = 'general') {
  const cfg = TASKS[taskType] || TASKS.general;
  const start = Date.now();

  let msgId = null;
  try {
    const r = await sendMessage(token, chatId,
      `${cfg.icon} *${cfg.label}* ${DOTS[0]}\n\`${bar(0)}\` 0s  ${cfg.emoji}\n\n_${cfg.steps[0]}_`
    );
    msgId = r?.result?.message_id ?? null;
  } catch {}

  if (!msgId) return { msgId: null, stop: () => '?' };

  let frame = 0, stepIdx = 0, stopped = false;

  const iv = setInterval(async () => {
    if (stopped) return;
    const el = (Date.now() - start) / 1000;
    const spin = DOTS[frame % DOTS.length];
    const step = cfg.steps[Math.min(stepIdx, cfg.steps.length - 1)];
    const b = bar(el);
    try {
      await editMessageText(token, chatId, msgId,
        `${cfg.icon} *${cfg.label}* ${spin}\n\`${b}\` ${el.toFixed(0)}s  ${cfg.emoji}\n\n_${step}_`
      );
    } catch { stopped = true; clearInterval(iv); }
    frame++;
    if (frame % 3 === 0) stepIdx++;
  }, 800); // 800ms for snappier feel (was 1200ms)

  return {
    msgId,
    stop() {
      stopped = true;
      clearInterval(iv);
      return ((Date.now() - start) / 1000).toFixed(1);
    }
  };
}

/**
 * All-in-one: send loader, run AI fn in parallel, stop on complete
 */
export async function withLoader(token, chatId, taskType, aiFn) {
  const cfg = TASKS[taskType] || TASKS.general;

  // Send loader and start AI simultaneously
  const [loaderResult, aiResult] = await Promise.all([
    startLoader(token, chatId, taskType),
    aiFn(),
  ]);

  const { msgId, stop } = loaderResult;
  const elapsed = stop();
  const result = aiResult;

  // Edit loader to completion
  if (msgId) {
    try {
      await editMessageText(token, chatId, msgId,
        `${cfg.icon} *${cfg.label} complete* ✅\n_${elapsed}s — powered by Salman Dev Bot_`
      );
    } catch {}
  }

  return { result, elapsed, msgId };
}
