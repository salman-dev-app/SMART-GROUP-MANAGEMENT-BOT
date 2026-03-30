// File Helper — auto-detect when content is too long for Telegram
// Creates HTML or TXT files and sends them

export const TELEGRAM_LIMIT = 3800;

export function needsFile(content) {
  return content && content.length > TELEGRAM_LIMIT;
}

export function detectFileType(content, hint = '') {
  const h = hint.toLowerCase();
  if (h.includes('html') || content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html')) return 'html';
  if (h.includes('python') || h.includes('.py')) return 'py';
  if (h.includes('javascript') || h.includes('node') || h.includes('.js')) return 'js';
  if (h.includes('typescript') || h.includes('.ts')) return 'ts';
  if (h.includes('css') || h.includes('.css')) return 'css';
  if (h.includes('json') || h.includes('.json')) return 'json';
  if (h.includes('sql') || h.includes('.sql')) return 'sql';
  if (h.includes('bash') || h.includes('shell') || h.includes('.sh')) return 'sh';
  if (h.includes('react') || h.includes('jsx') || h.includes('.jsx')) return 'jsx';
  if (h.includes('vue') || h.includes('.vue')) return 'vue';
  if (h.includes('go') || h.includes('.go')) return 'go';
  if (h.includes('rust') || h.includes('.rs')) return 'rs';
  if (h.includes('java') || h.includes('.java')) return 'java';
  if (h.includes('c++') || h.includes('cpp') || h.includes('.cpp')) return 'cpp';
  if (h.includes('c#') || h.includes('.cs')) return 'cs';
  if (h.includes('php') || h.includes('.php')) return 'php';
  if (h.includes('ruby') || h.includes('.rb')) return 'rb';
  if (h.includes('swift') || h.includes('.swift')) return 'swift';
  if (h.includes('kotlin') || h.includes('.kt')) return 'kt';
  if (h.includes('markdown') || h.includes('.md')) return 'md';
  if (h.includes('yaml') || h.includes('.yml') || h.includes('.yaml')) return 'yaml';
  if (h.includes('dockerfile')) return 'dockerfile';
  return 'txt';
}

export function getMimeType(ext) {
  const types = {
    html: 'text/html',
    js: 'text/javascript',
    ts: 'text/typescript',
    jsx: 'text/javascript',
    vue: 'text/plain',
    css: 'text/css',
    py: 'text/x-python',
    json: 'application/json',
    sql: 'text/x-sql',
    sh: 'text/x-sh',
    go: 'text/x-go',
    rs: 'text/x-rustsrc',
    java: 'text/x-java',
    cpp: 'text/x-c++src',
    cs: 'text/x-csharp',
    php: 'text/x-php',
    rb: 'text/x-ruby',
    swift: 'text/x-swift',
    kt: 'text/x-kotlin',
    md: 'text/markdown',
    yaml: 'text/yaml',
    dockerfile: 'text/plain',
    txt: 'text/plain',
  };
  return types[ext] || 'text/plain';
}

export function buildFileName(hint, ext) {
  const base = hint
    ? hint.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)
    : 'output';
  return `${base}.${ext}`;
}

// Extract code from markdown code blocks
export function extractCode(text) {
  const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

// Wrap plain code in proper HTML file structure for landing pages
export function wrapAsPreview(html, title = 'Preview') {
  if (html.trim().startsWith('<!DOCTYPE') || html.trim().startsWith('<html')) {
    return html;
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
${html}
</body>
</html>`;
}
