export const LANGS = {
  en: {
    name: 'English', flag: '🇺🇸',
    start_title: '👋 *Hey {name}!*',
    start_body: 'Welcome to *DevMind* — your AI developer companion.\n\nPowered by *Llama 3.1* running on Cloudflare\'s global GPU network.',
    start_features: '🤖 *AI Chat* — Ask anything, get smart answers\n💻 *Code Review* — AI reviews your code\n🔧 *Dev Tools* — JSON, hash, UUID, calc & more\n🎮 *Fun* — Jokes, quotes, dice, polls\n🌐 *3 Languages* — English, Hindi, Bangla',
    start_cta: 'Choose what you need 👇',
    ask_prompt: '💬 *Ask AI Anything*\n\nUsage: `/ask <your question>`\n\nExamples:\n`/ask explain REST API`\n`/ask what is recursion`\n`/ask how to center in CSS`',
    review_prompt: '🔍 *AI Code Review*\n\nUsage: `/review <your code>`\n\nExample:\n`/review function add(a,b){ return a+b }`',
    explain_prompt: '📖 *Explain Concept*\n\nUsage: `/explain <topic>`\n\nExamples:\n`/explain closures`\n`/explain Big O notation`',
    fix_prompt: '🔧 *Fix My Code*\n\nUsage: `/fix <broken code>`\n\nPaste your buggy code and AI will fix it.',
    summarize_prompt: '📝 *Summarize Text*\n\nUsage: `/summarize <text>`\n\nPaste any text and get a concise summary.',
    translate_prompt: '🌍 *Translate Text*\n\nUsage: `/translate <lang> <text>`\n\nExample:\n`/translate Bengali Hello world`',
    thinking: '🤔 *Thinking...*',
    no_args: '❌ Please provide input. Type /help for usage.',
    ai_error: '⚠️ AI is busy. Please try again in a moment.',
    lang_menu: '🌐 *Select Language*\n\nCurrent: *{current}* {flag}',
    lang_changed: '✅ Language set to *{lang}* {flag}',
  },
  hi: {
    name: 'हिंदी', flag: '🇮🇳',
    start_title: '👋 *नमस्ते {name}!*',
    start_body: '*DevMind* में आपका स्वागत है — आपका AI डेवलपर साथी।\n\nCloudflare के GPU नेटवर्क पर *Llama 3.1* द्वारा संचालित।',
    start_features: '🤖 *AI चैट* — कुछ भी पूछें\n💻 *कोड रिव्यू* — AI से कोड चेक कराएं\n🔧 *डेव टूल्स* — JSON, हैश, UUID और अधिक\n🎮 *मज़ा* — जोक्स, कोट्स, डाइस\n🌐 *3 भाषाएं* — English, हिंदी, বাংলা',
    start_cta: 'क्या चाहिए चुनें 👇',
    ask_prompt: '💬 *AI से पूछें*\n\nउपयोग: `/ask <आपका सवाल>`\n\nउदाहरण:\n`/ask REST API क्या है`\n`/ask recursion समझाएं`',
    review_prompt: '🔍 *AI कोड रिव्यू*\n\nउपयोग: `/review <आपका कोड>`',
    explain_prompt: '📖 *समझाएं*\n\nउपयोग: `/explain <विषय>`',
    fix_prompt: '🔧 *कोड ठीक करें*\n\nउपयोग: `/fix <टूटा कोड>`',
    summarize_prompt: '📝 *सारांश*\n\nउपयोग: `/summarize <टेक्स्ट>`',
    translate_prompt: '🌍 *अनुवाद*\n\nउपयोग: `/translate <भाषा> <टेक्स्ट>`',
    thinking: '🤔 *सोच रहा हूं...*',
    no_args: '❌ कृपया इनपुट दें। /help देखें।',
    ai_error: '⚠️ AI अभी व्यस्त है। थोड़ी देर बाद कोशिश करें।',
    lang_menu: '🌐 *भाषा चुनें*\n\nवर्तमान: *{current}* {flag}',
    lang_changed: '✅ भाषा बदली: *{lang}* {flag}',
  },
  bn: {
    name: 'বাংলা', flag: '🇧🇩',
    start_title: '👋 *হ্যালো {name}!*',
    start_body: '*DevMind*-এ আপনাকে স্বাগতম — আপনার AI ডেভেলপার সহকারী।\n\nCloudflare-এর GPU নেটওয়ার্কে *Llama 3.1* দ্বারা পরিচালিত।',
    start_features: '🤖 *AI চ্যাট* — যেকোনো প্রশ্ন করুন\n💻 *কোড রিভিউ* — AI দিয়ে কোড চেক করুন\n🔧 *ডেভ টুলস* — JSON, হ্যাশ, UUID এবং আরও\n🎮 *মজা* — জোকস, কোটস, ডাইস\n🌐 *৩টি ভাষা* — English, হিন্দি, বাংলা',
    start_cta: 'কী দরকার বেছে নিন 👇',
    ask_prompt: '💬 *AI-কে জিজ্ঞেস করুন*\n\nব্যবহার: `/ask <আপনার প্রশ্ন>`\n\nউদাহরণ:\n`/ask REST API কী`\n`/ask recursion বোঝাও`',
    review_prompt: '🔍 *AI কোড রিভিউ*\n\nব্যবহার: `/review <আপনার কোড>`',
    explain_prompt: '📖 *ব্যাখ্যা করুন*\n\nব্যবহার: `/explain <বিষয়>`',
    fix_prompt: '🔧 *কোড ঠিক করুন*\n\nব্যবহার: `/fix <ভাঙা কোড>`',
    summarize_prompt: '📝 *সারসংক্ষেপ*\n\nব্যবহার: `/summarize <টেক্সট>`',
    translate_prompt: '🌍 *অনুবাদ*\n\nব্যবহার: `/translate <ভাষা> <টেক্সট>`',
    thinking: '🤔 *ভাবছি...*',
    no_args: '❌ অনুগ্রহ করে ইনপুট দিন। /help দেখুন।',
    ai_error: '⚠️ AI এখন ব্যস্ত। একটু পরে আবার চেষ্টা করুন।',
    lang_menu: '🌐 *ভাষা নির্বাচন করুন*\n\nবর্তমান: *{current}* {flag}',
    lang_changed: '✅ ভাষা পরিবর্তিত: *{lang}* {flag}',
  },
};

export function t(lang, key, vars = {}) {
  const strings = LANGS[lang] || LANGS.en;
  let str = strings[key] ?? LANGS.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, v);
  return str;
}

export function getLangList() {
  return Object.entries(LANGS).map(([code, l]) => ({ code, name: l.name, flag: l.flag }));
}
