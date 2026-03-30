/**
 * Loader — animated loading indicator
 * Created by Md Salman Biswas
 */

import { sendMessage, editMessageText } from './telegram.js';

// Slick spinner frames
const SPIN = ['◐','◓','◑','◒'];
const DOTS = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

const TASKS = {
  research:    { icon: '🔍', label: 'Searching',     steps: ['Searching…','Reading…','Analyzing…'] },
  agent:       { icon: '🤖', label: 'Working',       steps: ['Planning…','Executing…','Finalizing…'] },
  coding:      { icon: '💻', label: 'Generating',    steps: ['Writing…','Optimizing…','Done…'] },
  generate:    { icon: '⚡', label: 'Generating',    steps: ['Writing…','Polishing…','Done…'] },
  landing:     { icon: '🎨', label: 'Building',      steps: ['Layout…','Styling…','Final touches…'] },
  review:      { icon: '🔬', label: 'Reviewing',     steps: ['Reading…','Checking…','Writing report…'] },
  debug:       { icon: '🐛', label: 'Debugging',     steps: ['Tracing…','Root cause…','Fixing…'] },
  optimize:    { icon: '🚀', label: 'Optimizing',    steps: ['Profiling…','Rewriting…','Done…'] },
  test:        { icon: '🧪', label: 'Generating',    steps: ['Writing tests…','Edge cases…','Done…'] },
  docs:        { icon: '📝', label: 'Documenting',   steps: ['Writing…','Examples…','Done…'] },
  explain:     { icon: '🧠', label: 'Explaining',    steps: ['Breaking down…','Simplifying…','Done…'] },
  fix:         { icon: '🔧', label: 'Fixing',        steps: ['Finding bug…','Applying fix…','Done…'] },
  convert:     { icon: '🔄', label: 'Converting',    steps: ['Translating…','Adapting…','Done…'] },
  security:    { icon: '🛡️', label: 'Auditing',     steps: ['Scanning…','Risk assessment…','Done…'] },
  architect:   { icon: '🏗️', label: 'Designing',   steps: ['Analyzing…','Planning…','Done…'] },
  interview:   { icon: '🎯', label: 'Preparing',    steps: ['Writing questions…','Answers…','Done…'] },
  deploy:      { icon: '🚀', label: 'Generating',    steps: ['Dockerfile…','CI/CD…','Done…'] },
  brainstorm:  { icon: '💡', label: 'Brainstorming', steps: ['Ideas…','Evaluating…','Done…'] },
  refactor:    { icon: '♻️', label: 'Refactoring',  steps: ['Analyzing…','Restructuring…','Done…'] },
  schema:      { icon: '🗃️', label: 'Designing',    steps: ['Modeling…','Relationships…','Done…'] },
  perf:        { icon: '⚡', label: 'Analyzing',     steps: ['Profiling…','Benchmarking…','Done…'] },
  commit:      { icon: '📝', label: 'Generating',    steps: ['Reading diff…','Done…'] },
  readme:      { icon: '📄', label: 'Generating',    steps: ['Writing…','Done…'] },
  diff:        { icon: '↔️', label: 'Comparing',    steps: ['Diffing…','Analyzing…','Done…'] },
  error:       { icon: '💥', label: 'Analyzing',    steps: ['Parsing…','Root cause…','Done…'] },
  general:     { icon: '🤖', label: 'Thinking',      steps: ['Processing…','Almost done…'] },
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
      `${cfg.icon} _${cfg.steps[0]}_`
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
        `${cfg.icon} _${step} ${spin}_`
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
      await editMessageText(token, chatId, msgId, `${cfg.icon} _Done in ${elapsed}s_`);
    } catch {}
  }

  return { result, elapsed, msgId };
}
