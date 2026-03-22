/**
 * Multi-language support data
 * Bot: 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀
 * Developer: Md Salman Biswas (salman-dev-app)
 * Supported: English (en), Spanish (es), French (fr), German (de),
 *            Portuguese (pt), Russian (ru), Chinese (zh), Arabic (ar)
 */

export const LANGUAGES = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    strings: {
      welcome: `👋 *Welcome to 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀!*\n\nI'm your premium developer-focused assistant. Here's what I can do:\n\n🛡️ *Moderation* – Spam filtering, warnings, bans\n💬 *Chat* – Answer dev questions conversationally\n🛠️ *Dev Tools* – Format JSON, test APIs, code snippets\n🎉 *Fun* – Jokes, quotes, polls\n🌍 *Multi-lang* – Switch language with /lang\n👨‍💻 *Developer* – /credit to meet the creator\n\nType /help to see all commands!`,
      help: `📚 *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 Command Reference*\n\n*🛡️ Moderation (Admins)*\n/warn @user [reason] – Warn a user\n/ban @user [reason] – Ban a user\n/unban @user – Unban a user\n/mute @user [minutes] – Mute a user\n/unmute @user – Unmute a user\n/warnings @user – Check warnings\n/clearwarns @user – Clear all warnings\n\n*🛠️ Developer Tools*\n/json <data> – Format & validate JSON\n/encode <text> – Base64 encode\n/decode <text> – Base64 decode\n/hash <text> – Generate SHA-256 hash\n/regex <pattern> <text> – Test regex\n/snippet <language> – Get code snippet\n/timestamp [unix] – Convert timestamp\n/uuid – Generate UUID\n/color <hex/rgb> – Convert color codes\n/urlencode <text> – URL encode\n/urldecode <text> – URL decode\n/escape <text> – Escape HTML entities\n\n*💬 Conversation*\nJust chat with me! I understand dev topics.\n\n*🎉 Fun*\n/joke – Random developer joke\n/quote – Dev wisdom quote\n/poll <question> | opt1 | opt2 ... – Create a poll\n/8ball <question> – Ask the magic 8-ball\n/dice [sides] – Roll a dice\n\n*🌍 Language*\n/lang – Show language menu\n/lang <code> – Set language (en/es/fr/de/pt/ru/zh/ar)\n\n*ℹ️ Info*\n/start – Welcome message\n/help – This help message\n/stats – Bot statistics\n/about – About this bot\n/credit – Meet the developer\n/ping – Check bot latency`,
      unknownCommand: "❓ Unknown command. Type /help to see all available commands.",
      noPermission: "🚫 You don't have permission to use this command. Only admins can do that.",
      userNotFound: "❓ User not found. Please reply to a message or use @username.",
      warnSuccess: "⚠️ *{user}* has been warned. [{count}/3 warnings]\n📝 Reason: {reason}",
      warnBan: "🔨 *{user}* has been automatically banned after {count} warnings.",
      banSuccess: "🔨 *{user}* has been banned.\n📝 Reason: {reason}",
      unbanSuccess: "✅ *{user}* has been unbanned.",
      muteSuccess: "🔇 *{user}* has been muted for {duration} minutes.",
      unmuteSuccess: "🔊 *{user}* has been unmuted.",
      spamDetected: "🚨 Spam detected from *{user}*. Message removed.",
      spamWarned: "⚠️ *{user}* – Please don't spam. This is your warning.",
      warningsCleared: "✅ Warnings for *{user}* have been cleared.",
      warningsList: "📋 *{user}* has {count} warning(s).",
      noWarnings: "✅ *{user}* has no warnings.",
      langChanged: "✅ Language changed to {lang} {flag}",
      langMenu: "🌍 *Select a Language*\n\nCurrent: {current} {flag}\n\nAvailable languages:",
      statsTitle: "📊 *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 Statistics*",
      statsCommands: "Commands processed: {count}",
      statsMessages: "Messages analyzed: {count}",
      statsSpam: "Spam blocked: {count}",
      statsWarnings: "Warnings issued: {count}",
      statsBans: "Users banned: {count}",
      about: `ℹ️ *About 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🤖 A premium developer-focused Telegram bot\n⚡ Powered by Cloudflare Workers (free tier)\n🧠 Rule-based AI conversations (no external API)\n🌍 8 language support\n🛡️ Smart spam moderation & auto-ban\n\n*Version:* 2.0.0\n*Runtime:* Cloudflare Workers\n*License:* MIT\n\n👨‍💻 *Built by:* [Md Salman Biswas](https://github.com/salman-dev-app)\nType /credit to see full developer profile.`,
      credit: `👨‍💻 *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 — Developer Credit*\n\n━━━━━━━━━━━━━━━━━━━━━━\n🏆 *Md Salman Biswas*\n🎯 Senior Software Engineer\n━━━━━━━━━━━━━━━━━━━━━━\n\n📌 *Specialization:*\nBuilding highly scalable, secure & maintainable enterprise applications\n\n🛠️ *Core Expertise:*\n• Extensive Tech Stack (Frontend & Backend)\n• Global Enterprise Standards\n• Mobile First Architecture\n• 100% Clean Code (SOLID & DRY)\n• Fast Execution & Optimized Systems\n• Cloud Infrastructure (Docker, AWS)\n\n🌐 *Connect:*\n📧 mdsalmanhelp@gmail.com\n💬 [Telegram](https://t.me/Otakuosenpai)\n📘 [Facebook](https://facebook.com/salmandevapp)\n📱 [WhatsApp](https://wa.me/8801840933137)\n🐙 [GitHub](https://github.com/salman-dev-app)\n\n━━━━━━━━━━━━━━━━━━━━━━\n_© 2024-2026 Md Salman Biswas. All rights reserved._`,
      ping: "🏓 Pong! Latency: {latency}ms",
      jsonValid: "✅ *Valid JSON*\n\n```json\n{formatted}\n```",
      jsonInvalid: "❌ *Invalid JSON*\n\nError: {error}",
      uuidGenerated: "🔑 *Generated UUID*\n\n`{uuid}`",
      hashGenerated: "🔐 *SHA-256 Hash*\n\nInput: `{input}`\nHash: `{hash}`",
      encodedResult: "🔤 *Base64 Encoded*\n\nInput: `{input}`\nOutput: `{output}`",
      decodedResult: "🔤 *Base64 Decoded*\n\nInput: `{input}`\nOutput: `{output}`",
      regexMatch: "✅ *Regex Match Found*\n\nPattern: `{pattern}`\nMatches: {matches}",
      regexNoMatch: "❌ *No Regex Match*\n\nPattern: `{pattern}`\nText: `{text}`",
      regexError: "❌ *Invalid Regex Pattern*\n\nError: {error}",
      timestampResult: "🕐 *Timestamp Conversion*\n\nUnix: `{unix}`\nUTC: `{utc}`\nLocal: `{local}`",
      colorResult: "🎨 *Color Conversion*\n\nInput: `{input}`\nHEX: `{hex}`\nRGB: `{rgb}`\nHSL: `{hsl}`",
      colorInvalid: "❌ Invalid color format. Use #RRGGBB or rgb(r,g,b)",
      urlEncoded: "🔗 *URL Encoded*\n\nOutput: `{output}`",
      urlDecoded: "🔗 *URL Decoded*\n\nOutput: `{output}`",
      htmlEscaped: "🔒 *HTML Escaped*\n\nOutput: `{output}`",
      snippetNotFound: "❓ No snippet found for `{lang}`. Available: js, py, go, rs, ts, java, cpp, sql, bash, css",
      diceRoll: "🎲 You rolled a *{result}* (d{sides})",
      eightBall: "🎱 *{answer}*",
      pollCreated: "📊 *Poll created!*",
      pollQuestion: "*{question}*",
      needArgs: "❓ Please provide the required arguments. Type /help for usage.",
    }
  },

  es: {
    name: 'Español',
    flag: '🇪🇸',
    strings: {
      welcome: `👋 *¡Bienvenido a 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀!*\n\nSoy tu asistente premium enfocado en desarrollo. Aquí lo que puedo hacer:\n\n🛡️ *Moderación* – Filtro de spam, advertencias, bans\n💬 *Chat* – Respondo preguntas de dev\n🛠️ *Herramientas Dev* – Formatear JSON, snippets, etc.\n🎉 *Diversión* – Chistes, citas, encuestas\n🌍 *Multi-idioma* – Cambia idioma con /lang\n👨‍💻 *Desarrollador* – /credit para conocer al creador\n\n¡Escribe /help para ver todos los comandos!`,
      help: `📚 *Referencia de Comandos DevBot*\n\n*🛡️ Moderación (Admins)*\n/warn @user [razón] – Advertir usuario\n/ban @user [razón] – Banear usuario\n/unban @user – Desbanear usuario\n/mute @user [min] – Silenciar usuario\n/unmute @user – Quitar silencio\n/warnings @user – Ver advertencias\n/clearwarns @user – Limpiar advertencias\n\n*🛠️ Herramientas Dev*\n/json <data> – Formatear y validar JSON\n/encode <texto> – Codificar en Base64\n/decode <texto> – Decodificar Base64\n/hash <texto> – Hash SHA-256\n/regex <patrón> <texto> – Probar regex\n/snippet <lenguaje> – Obtener snippet\n/timestamp [unix] – Convertir timestamp\n/uuid – Generar UUID\n/color <hex/rgb> – Convertir colores\n\n*🎉 Diversión*\n/joke – Chiste de desarrollador\n/quote – Cita de sabiduría dev\n/poll <pregunta> | op1 | op2 – Crear encuesta\n/8ball <pregunta> – Bola mágica\n/dice [caras] – Tirar dados\n\n*🌍 Idioma*\n/lang – Menú de idiomas\n/lang <código> – Cambiar idioma`,
      unknownCommand: "❓ Comando desconocido. Escribe /help para ver los comandos disponibles.",
      noPermission: "🚫 No tienes permiso para usar este comando. Solo los admins pueden hacerlo.",
      userNotFound: "❓ Usuario no encontrado. Responde a un mensaje o usa @usuario.",
      warnSuccess: "⚠️ *{user}* ha sido advertido. [{count}/3 advertencias]\n📝 Razón: {reason}",
      warnBan: "🔨 *{user}* ha sido baneado automáticamente tras {count} advertencias.",
      banSuccess: "🔨 *{user}* ha sido baneado.\n📝 Razón: {reason}",
      unbanSuccess: "✅ *{user}* ha sido desbaneado.",
      muteSuccess: "🔇 *{user}* ha sido silenciado por {duration} minutos.",
      unmuteSuccess: "🔊 *{user}* ha sido silenciado.",
      spamDetected: "🚨 Spam detectado de *{user}*. Mensaje eliminado.",
      spamWarned: "⚠️ *{user}* – Por favor no hagas spam. Esta es tu advertencia.",
      warningsCleared: "✅ Las advertencias de *{user}* han sido limpiadas.",
      warningsList: "📋 *{user}* tiene {count} advertencia(s).",
      noWarnings: "✅ *{user}* no tiene advertencias.",
      langChanged: "✅ Idioma cambiado a {lang} {flag}",
      langMenu: "🌍 *Selecciona un Idioma*\n\nActual: {current} {flag}\n\nIdiomas disponibles:",
      statsTitle: "📊 *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 Estadísticas*",
      statsCommands: "Comandos procesados: {count}",
      statsMessages: "Mensajes analizados: {count}",
      statsSpam: "Spam bloqueado: {count}",
      statsWarnings: "Advertencias emitidas: {count}",
      statsBans: "Usuarios baneados: {count}",
      about: `ℹ️ *Acerca de 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🤖 Bot premium de Telegram para desarrolladores\n⚡ Impulsado por Cloudflare Workers\n🧠 IA conversacional basada en reglas\n🌍 8 idiomas soportados\n\n👨‍💻 *Creado por:* [Md Salman Biswas](https://github.com/salman-dev-app)\nEscribe /credit para ver el perfil del desarrollador.`,
      credit: `👨‍💻 *Crédito del Desarrollador — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🏆 *Md Salman Biswas*\n🎯 Ingeniero de Software Senior\n\n🌐 mdsalmanhelp@gmail.com\n💬 [Telegram](https://t.me/Otakuosenpai)\n📘 [Facebook](https://facebook.com/salmandevapp)\n📱 [WhatsApp](https://wa.me/8801840933137)\n🐙 [GitHub](https://github.com/salman-dev-app)\n\n_© 2024-2026 Md Salman Biswas._`,
      ping: "🏓 ¡Pong! Latencia: {latency}ms",
      jsonValid: "✅ *JSON Válido*\n\n```json\n{formatted}\n```",
      jsonInvalid: "❌ *JSON Inválido*\n\nError: {error}",
      uuidGenerated: "🔑 *UUID Generado*\n\n`{uuid}`",
      hashGenerated: "🔐 *Hash SHA-256*\n\nEntrada: `{input}`\nHash: `{hash}`",
      encodedResult: "🔤 *Codificado en Base64*\n\nEntrada: `{input}`\nSalida: `{output}`",
      decodedResult: "🔤 *Decodificado de Base64*\n\nEntrada: `{input}`\nSalida: `{output}`",
      regexMatch: "✅ *Coincidencia Regex*\n\nPatrón: `{pattern}`\nCoincidencias: {matches}",
      regexNoMatch: "❌ *Sin Coincidencia Regex*\n\nPatrón: `{pattern}`\nTexto: `{text}`",
      regexError: "❌ *Patrón Regex Inválido*\n\nError: {error}",
      timestampResult: "🕐 *Conversión de Timestamp*\n\nUnix: `{unix}`\nUTC: `{utc}`",
      colorResult: "🎨 *Conversión de Color*\n\nEntrada: `{input}`\nHEX: `{hex}`\nRGB: `{rgb}`\nHSL: `{hsl}`",
      colorInvalid: "❌ Formato de color inválido. Usa #RRGGBB o rgb(r,g,b)",
      urlEncoded: "🔗 *URL Codificada*\n\nSalida: `{output}`",
      urlDecoded: "🔗 *URL Decodificada*\n\nSalida: `{output}`",
      htmlEscaped: "🔒 *HTML Escapado*\n\nSalida: `{output}`",
      snippetNotFound: "❓ No hay snippet para `{lang}`. Disponibles: js, py, go, rs, ts, java, cpp, sql, bash, css",
      diceRoll: "🎲 Sacaste un *{result}* (d{sides})",
      eightBall: "🎱 *{answer}*",
      pollCreated: "📊 *¡Encuesta creada!*",
      pollQuestion: "*{question}*",
      needArgs: "❓ Por favor proporciona los argumentos requeridos. Escribe /help para uso.",
    }
  },

  fr: {
    name: 'Français',
    flag: '🇫🇷',
    strings: {
      welcome: `👋 *Bienvenue sur 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀!*\n\nJe suis votre assistant premium pour développeurs. Voici ce que je peux faire:\n\n🛡️ *Modération* – Filtre spam, avertissements, bans\n💬 *Chat* – Répondre aux questions dev\n🛠️ *Outils Dev* – Formater JSON, snippets, etc.\n🎉 *Fun* – Blagues, citations, sondages\n🌍 *Multi-langue* – Changer de langue avec /lang\n👨‍💻 *Développeur* – /credit pour rencontrer le créateur\n\nTapez /help pour voir toutes les commandes!`,
      help: `📚 *Référence des Commandes DevBot*\n\n*🛡️ Modération (Admins)*\n/warn @user [raison] – Avertir un utilisateur\n/ban @user [raison] – Bannir un utilisateur\n/mute @user [min] – Mettre en sourdine\n\n*🛠️ Outils Dev*\n/json <données> – Formater JSON\n/encode <texte> – Encoder en Base64\n/decode <texte> – Décoder Base64\n/hash <texte> – Hash SHA-256\n/uuid – Générer UUID\n\n*🎉 Fun*\n/joke – Blague de développeur\n/quote – Citation de sagesse\n/poll <question> | op1 | op2 – Créer sondage`,
      unknownCommand: "❓ Commande inconnue. Tapez /help pour voir les commandes disponibles.",
      noPermission: "🚫 Vous n'avez pas la permission d'utiliser cette commande.",
      userNotFound: "❓ Utilisateur introuvable.",
      warnSuccess: "⚠️ *{user}* a été averti. [{count}/3 avertissements]\n📝 Raison: {reason}",
      warnBan: "🔨 *{user}* a été automatiquement banni après {count} avertissements.",
      banSuccess: "🔨 *{user}* a été banni.\n📝 Raison: {reason}",
      unbanSuccess: "✅ *{user}* a été débanni.",
      muteSuccess: "🔇 *{user}* a été mis en sourdine pour {duration} minutes.",
      unmuteSuccess: "🔊 *{user}* n'est plus en sourdine.",
      spamDetected: "🚨 Spam détecté de *{user}*. Message supprimé.",
      spamWarned: "⚠️ *{user}* – Pas de spam. C'est votre avertissement.",
      warningsCleared: "✅ Avertissements de *{user}* effacés.",
      warningsList: "📋 *{user}* a {count} avertissement(s).",
      noWarnings: "✅ *{user}* n'a aucun avertissement.",
      langChanged: "✅ Langue changée en {lang} {flag}",
      langMenu: "🌍 *Sélectionner une Langue*\n\nActuelle: {current} {flag}\n\nLangues disponibles:",
      statsTitle: "📊 *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 Statistiques*",
      statsCommands: "Commandes traitées: {count}",
      statsMessages: "Messages analysés: {count}",
      statsSpam: "Spam bloqué: {count}",
      statsWarnings: "Avertissements émis: {count}",
      statsBans: "Utilisateurs bannis: {count}",
      about: `ℹ️ *À propos de 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🤖 Bot Telegram premium pour développeurs\n⚡ Propulsé par Cloudflare Workers\n🌍 8 langues supportées\n\n👨‍💻 *Créé par:* [Md Salman Biswas](https://github.com/salman-dev-app)\nTapez /credit pour voir le profil complet.`,
      credit: `👨‍💻 *Crédit Développeur — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*

━━━━━━━━━━━━━━━━━━━━━━
🏆 *Md Salman Biswas*
🎯 Ingénieur Logiciel Senior
━━━━━━━━━━━━━━━━━━━━━━

📌 *Spécialisation:*
Applications d'entreprise évolutives, sécurisées et maintenables

🌐 *Contact:*
📧 mdsalmanhelp@gmail.com
💬 [Telegram](https://t.me/Otakuosenpai)
📘 [Facebook](https://facebook.com/salmandevapp)
📱 [WhatsApp](https://wa.me/8801840933137)
🐙 [GitHub](https://github.com/salman-dev-app)

━━━━━━━━━━━━━━━━━━━━━━
_© 2024-2026 Md Salman Biswas. Tous droits réservés._`,
      credit: `👨‍💻 *Crédit Développeur — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🏆 *Md Salman Biswas*\n🎯 Ingénieur Logiciel Senior\n\n🌐 mdsalmanhelp@gmail.com\n💬 [Telegram](https://t.me/Otakuosenpai)\n📘 [Facebook](https://facebook.com/salmandevapp)\n📱 [WhatsApp](https://wa.me/8801840933137)\n🐙 [GitHub](https://github.com/salman-dev-app)\n\n_© 2024-2026 Md Salman Biswas._`,
      ping: "🏓 Pong! Latence: {latency}ms",
      jsonValid: "✅ *JSON Valide*\n\n```json\n{formatted}\n```",
      jsonInvalid: "❌ *JSON Invalide*\n\nErreur: {error}",
      uuidGenerated: "🔑 *UUID Généré*\n\n`{uuid}`",
      hashGenerated: "🔐 *Hash SHA-256*\n\nEntrée: `{input}`\nHash: `{hash}`",
      encodedResult: "🔤 *Encodé en Base64*\n\nEntrée: `{input}`\nSortie: `{output}`",
      decodedResult: "🔤 *Décodé de Base64*\n\nEntrée: `{input}`\nSortie: `{output}`",
      regexMatch: "✅ *Correspondance Regex*\n\nMotif: `{pattern}`\nCorrespondances: {matches}",
      regexNoMatch: "❌ *Aucune Correspondance*\n\nMotif: `{pattern}`",
      regexError: "❌ *Motif Regex Invalide*\n\nErreur: {error}",
      timestampResult: "🕐 *Conversion Timestamp*\n\nUnix: `{unix}`\nUTC: `{utc}`",
      colorResult: "🎨 *Conversion Couleur*\n\nEntrée: `{input}`\nHEX: `{hex}`\nRGB: `{rgb}`\nHSL: `{hsl}`",
      colorInvalid: "❌ Format couleur invalide.",
      urlEncoded: "🔗 *URL Encodée*\n\nSortie: `{output}`",
      urlDecoded: "🔗 *URL Décodée*\n\nSortie: `{output}`",
      htmlEscaped: "🔒 *HTML Échappé*\n\nSortie: `{output}`",
      snippetNotFound: "❓ Aucun snippet pour `{lang}`.",
      diceRoll: "🎲 Vous avez obtenu *{result}* (d{sides})",
      eightBall: "🎱 *{answer}*",
      pollCreated: "📊 *Sondage créé!*",
      pollQuestion: "*{question}*",
      needArgs: "❓ Veuillez fournir les arguments requis.",
    }
  },

  de: {
    name: 'Deutsch',
    flag: '🇩🇪',
    strings: {
      welcome: `👋 *Willkommen bei 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀!*\n\nIch bin dein premium entwicklerorientierter Assistent:\n\n🛡️ *Moderation* – Spam-Filter, Warnungen, Bans\n💬 *Chat* – Dev-Fragen beantworten\n🛠️ *Dev-Tools* – JSON formatieren, Snippets, etc.\n🎉 *Spaß* – Witze, Zitate, Abstimmungen\n🌍 *Mehrsprachig* – Sprache mit /lang ändern\n👨‍💻 *Entwickler* – /credit um den Ersteller kennenzulernen\n\n/help für alle Befehle!`,
      help: `📚 *DevBot Befehlsreferenz*\n\n/warn @user – Benutzer verwarnen\n/ban @user – Benutzer bannen\n/json – JSON formatieren\n/uuid – UUID generieren\n/joke – Entwicklerwitz\n/lang – Sprache ändern`,
      unknownCommand: "❓ Unbekannter Befehl. /help für verfügbare Befehle.",
      noPermission: "🚫 Keine Berechtigung für diesen Befehl.",
      userNotFound: "❓ Benutzer nicht gefunden.",
      warnSuccess: "⚠️ *{user}* wurde verwarnt. [{count}/3]\n📝 Grund: {reason}",
      warnBan: "🔨 *{user}* wurde nach {count} Verwarnungen gebannt.",
      banSuccess: "🔨 *{user}* wurde gebannt.\n📝 Grund: {reason}",
      unbanSuccess: "✅ *{user}* wurde entbannt.",
      muteSuccess: "🔇 *{user}* wurde für {duration} Minuten stummgeschaltet.",
      unmuteSuccess: "🔊 *{user}* wurde entstummt.",
      spamDetected: "🚨 Spam von *{user}* erkannt. Nachricht gelöscht.",
      spamWarned: "⚠️ *{user}* – Kein Spam bitte.",
      warningsCleared: "✅ Verwarnungen von *{user}* gelöscht.",
      warningsList: "📋 *{user}* hat {count} Verwarnung(en).",
      noWarnings: "✅ *{user}* hat keine Verwarnungen.",
      langChanged: "✅ Sprache geändert zu {lang} {flag}",
      langMenu: "🌍 *Sprache auswählen*\n\nAktuell: {current} {flag}\n\nVerfügbare Sprachen:",
      statsTitle: "📊 *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 Statistiken*",
      statsCommands: "Verarbeitete Befehle: {count}",
      statsMessages: "Analysierte Nachrichten: {count}",
      statsSpam: "Spam blockiert: {count}",
      statsWarnings: "Verwarnungen: {count}",
      statsBans: "Gebannte Benutzer: {count}",
      about: `ℹ️ *Über 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🤖 Premium Telegram Bot für Entwickler\n⚡ Cloudflare Workers\n🌍 8 Sprachen\n\n👨‍💻 *Erstellt von:* [Md Salman Biswas](https://github.com/salman-dev-app)\n/credit für vollständiges Profil.`,
      credit: `👨‍💻 *Entwickler-Credits — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*

━━━━━━━━━━━━━━━━━━━━━━
🏆 *Md Salman Biswas*
🎯 Senior Software Engineer
━━━━━━━━━━━━━━━━━━━━━━

📌 *Spezialisierung:*
Skalierbare, sichere und wartbare Unternehmensanwendungen

🌐 *Kontakt:*
📧 mdsalmanhelp@gmail.com
💬 [Telegram](https://t.me/Otakuosenpai)
📘 [Facebook](https://facebook.com/salmandevapp)
📱 [WhatsApp](https://wa.me/8801840933137)
🐙 [GitHub](https://github.com/salman-dev-app)

━━━━━━━━━━━━━━━━━━━━━━
_© 2024-2026 Md Salman Biswas. Alle Rechte vorbehalten._`,
      credit: `👨‍💻 *Entwickler-Credits — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🏆 *Md Salman Biswas*\n🎯 Senior Software Engineer\n\n🌐 mdsalmanhelp@gmail.com\n💬 [Telegram](https://t.me/Otakuosenpai)\n📘 [Facebook](https://facebook.com/salmandevapp)\n📱 [WhatsApp](https://wa.me/8801840933137)\n🐙 [GitHub](https://github.com/salman-dev-app)\n\n_© 2024-2026 Md Salman Biswas._`,
      ping: "🏓 Pong! Latenz: {latency}ms",
      jsonValid: "✅ *Gültiges JSON*\n\n```json\n{formatted}\n```",
      jsonInvalid: "❌ *Ungültiges JSON*\n\nFehler: {error}",
      uuidGenerated: "🔑 *UUID Generiert*\n\n`{uuid}`",
      hashGenerated: "🔐 *SHA-256 Hash*\n\nEingabe: `{input}`\nHash: `{hash}`",
      encodedResult: "🔤 *Base64 Kodiert*\n\nEingabe: `{input}`\nAusgabe: `{output}`",
      decodedResult: "🔤 *Base64 Dekodiert*\n\nEingabe: `{input}`\nAusgabe: `{output}`",
      regexMatch: "✅ *Regex Treffer*\n\nMuster: `{pattern}`\nTreffer: {matches}",
      regexNoMatch: "❌ *Kein Regex Treffer*\n\nMuster: `{pattern}`",
      regexError: "❌ *Ungültiges Regex Muster*\n\nFehler: {error}",
      timestampResult: "🕐 *Zeitstempel Konvertierung*\n\nUnix: `{unix}`\nUTC: `{utc}`",
      colorResult: "🎨 *Farb-Konvertierung*\n\nEingabe: `{input}`\nHEX: `{hex}`\nRGB: `{rgb}`",
      colorInvalid: "❌ Ungültiges Farbformat.",
      urlEncoded: "🔗 *URL Kodiert*\n\nAusgabe: `{output}`",
      urlDecoded: "🔗 *URL Dekodiert*\n\nAusgabe: `{output}`",
      htmlEscaped: "🔒 *HTML Escaped*\n\nAusgabe: `{output}`",
      snippetNotFound: "❓ Kein Snippet für `{lang}`.",
      diceRoll: "🎲 Du hast *{result}* gewürfelt (d{sides})",
      eightBall: "🎱 *{answer}*",
      pollCreated: "📊 *Umfrage erstellt!*",
      pollQuestion: "*{question}*",
      needArgs: "❓ Bitte gib die erforderlichen Argumente an.",
    }
  },

  pt: {
    name: 'Português',
    flag: '🇧🇷',
    strings: {
      welcome: `👋 *Bem-vindo ao 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀!*\n\nSou seu assistente premium focado em desenvolvimento:\n\n🛡️ *Moderação* – Filtro de spam, avisos, bans\n💬 *Chat* – Responder perguntas de dev\n🛠️ *Ferramentas Dev* – Formatar JSON, snippets\n🎉 *Diversão* – Piadas, citações, enquetes\n🌍 *Multi-idioma* – Mudar idioma com /lang\n👨‍💻 *Desenvolvedor* – /credit para conhecer o criador\n\n/help para todos os comandos!`,
      help: `📚 *Referência de Comandos DevBot*\n\n/warn @user – Avisar usuário\n/ban @user – Banir usuário\n/json – Formatar JSON\n/uuid – Gerar UUID\n/joke – Piada de dev\n/lang – Mudar idioma`,
      unknownCommand: "❓ Comando desconhecido. Digite /help para comandos disponíveis.",
      noPermission: "🚫 Sem permissão para usar este comando.",
      userNotFound: "❓ Usuário não encontrado.",
      warnSuccess: "⚠️ *{user}* foi avisado. [{count}/3]\n📝 Motivo: {reason}",
      warnBan: "🔨 *{user}* foi banido após {count} avisos.",
      banSuccess: "🔨 *{user}* foi banido.\n📝 Motivo: {reason}",
      unbanSuccess: "✅ *{user}* foi desbanido.",
      muteSuccess: "🔇 *{user}* foi silenciado por {duration} minutos.",
      unmuteSuccess: "🔊 *{user}* foi dessilenciado.",
      spamDetected: "🚨 Spam detectado de *{user}*. Mensagem removida.",
      spamWarned: "⚠️ *{user}* – Sem spam. Este é seu aviso.",
      warningsCleared: "✅ Avisos de *{user}* foram limpos.",
      warningsList: "📋 *{user}* tem {count} aviso(s).",
      noWarnings: "✅ *{user}* não tem avisos.",
      langChanged: "✅ Idioma mudado para {lang} {flag}",
      langMenu: "🌍 *Selecionar Idioma*\n\nAtual: {current} {flag}",
      statsTitle: "📊 *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 Estatísticas*",
      statsCommands: "Comandos processados: {count}",
      statsMessages: "Mensagens analisadas: {count}",
      statsSpam: "Spam bloqueado: {count}",
      statsWarnings: "Avisos emitidos: {count}",
      statsBans: "Usuários banidos: {count}",
      about: `ℹ️ *Sobre 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🤖 Bot Telegram premium para desenvolvedores\n⚡ Cloudflare Workers\n🌍 8 idiomas\n\n👨‍💻 *Criado por:* [Md Salman Biswas](https://github.com/salman-dev-app)\n/credit para ver o perfil completo.`,
      credit: `👨‍💻 *Crédito do Desenvolvedor — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*

━━━━━━━━━━━━━━━━━━━━━━
🏆 *Md Salman Biswas*
🎯 Engenheiro de Software Sênior
━━━━━━━━━━━━━━━━━━━━━━

📌 *Especialização:*
Aplicações empresariais escaláveis, seguras e manuteníveis

🌐 *Contato:*
📧 mdsalmanhelp@gmail.com
💬 [Telegram](https://t.me/Otakuosenpai)
📘 [Facebook](https://facebook.com/salmandevapp)
📱 [WhatsApp](https://wa.me/8801840933137)
🐙 [GitHub](https://github.com/salman-dev-app)

━━━━━━━━━━━━━━━━━━━━━━
_© 2024-2026 Md Salman Biswas. Todos os direitos reservados._`,
      credit: `👨‍💻 *Crédito do Desenvolvedor — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🏆 *Md Salman Biswas*\n🎯 Engenheiro de Software Sênior\n\n🌐 mdsalmanhelp@gmail.com\n💬 [Telegram](https://t.me/Otakuosenpai)\n📘 [Facebook](https://facebook.com/salmandevapp)\n📱 [WhatsApp](https://wa.me/8801840933137)\n🐙 [GitHub](https://github.com/salman-dev-app)\n\n_© 2024-2026 Md Salman Biswas._`,
      ping: "🏓 Pong! Latência: {latency}ms",
      jsonValid: "✅ *JSON Válido*\n\n```json\n{formatted}\n```",
      jsonInvalid: "❌ *JSON Inválido*\n\nErro: {error}",
      uuidGenerated: "🔑 *UUID Gerado*\n\n`{uuid}`",
      hashGenerated: "🔐 *Hash SHA-256*\n\nEntrada: `{input}`\nHash: `{hash}`",
      encodedResult: "🔤 *Codificado em Base64*\n\nEntrada: `{input}`\nSaída: `{output}`",
      decodedResult: "🔤 *Decodificado de Base64*\n\nEntrada: `{input}`\nSaída: `{output}`",
      regexMatch: "✅ *Regex Correspondeu*\n\nPadrão: `{pattern}`\nCorrespondências: {matches}",
      regexNoMatch: "❌ *Sem Correspondência*\n\nPadrão: `{pattern}`",
      regexError: "❌ *Padrão Regex Inválido*\n\nErro: {error}",
      timestampResult: "🕐 *Conversão de Timestamp*\n\nUnix: `{unix}`\nUTC: `{utc}`",
      colorResult: "🎨 *Conversão de Cor*\n\nEntrada: `{input}`\nHEX: `{hex}`\nRGB: `{rgb}`",
      colorInvalid: "❌ Formato de cor inválido.",
      urlEncoded: "🔗 *URL Codificada*\n\nSaída: `{output}`",
      urlDecoded: "🔗 *URL Decodificada*\n\nSaída: `{output}`",
      htmlEscaped: "🔒 *HTML Escapado*\n\nSaída: `{output}`",
      snippetNotFound: "❓ Nenhum snippet para `{lang}`.",
      diceRoll: "🎲 Você tirou *{result}* (d{sides})",
      eightBall: "🎱 *{answer}*",
      pollCreated: "📊 *Enquete criada!*",
      pollQuestion: "*{question}*",
      needArgs: "❓ Por favor forneça os argumentos necessários.",
    }
  },

  ru: {
    name: 'Русский',
    flag: '🇷🇺',
    strings: {
      welcome: `👋 *Добро пожаловать в 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀!*\n\nЯ ваш премиум-помощник для разработчиков:\n\n🛡️ *Модерация* – Фильтр спама, предупреждения, баны\n💬 *Чат* – Отвечаю на вопросы по разработке\n🛠️ *Dev-инструменты* – Форматирование JSON, сниппеты\n🎉 *Развлечения* – Шутки, цитаты, опросы\n🌍 *Мультиязычность* – Смена языка через /lang\n👨‍💻 *Разработчик* – /credit чтобы познакомиться с создателем\n\n/help для всех команд!`,
      help: `📚 *Команды DevBot*\n\n/warn @user – Предупредить\n/ban @user – Забанить\n/json – Форматировать JSON\n/uuid – Генерировать UUID\n/joke – Шутка разработчика\n/lang – Сменить язык`,
      unknownCommand: "❓ Неизвестная команда. /help для списка команд.",
      noPermission: "🚫 Нет прав для использования этой команды.",
      userNotFound: "❓ Пользователь не найден.",
      warnSuccess: "⚠️ *{user}* получил предупреждение. [{count}/3]\n📝 Причина: {reason}",
      warnBan: "🔨 *{user}* автоматически забанен после {count} предупреждений.",
      banSuccess: "🔨 *{user}* забанен.\n📝 Причина: {reason}",
      unbanSuccess: "✅ *{user}* разбанен.",
      muteSuccess: "🔇 *{user}* замолчен на {duration} минут.",
      unmuteSuccess: "🔊 *{user}* размолчен.",
      spamDetected: "🚨 Спам от *{user}* обнаружен. Сообщение удалено.",
      spamWarned: "⚠️ *{user}* – Не спамьте. Это ваше предупреждение.",
      warningsCleared: "✅ Предупреждения *{user}* очищены.",
      warningsList: "📋 У *{user}* {count} предупреждений.",
      noWarnings: "✅ У *{user}* нет предупреждений.",
      langChanged: "✅ Язык изменён на {lang} {flag}",
      langMenu: "🌍 *Выбор языка*\n\nТекущий: {current} {flag}",
      statsTitle: "📊 *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 Статистика*",
      statsCommands: "Обработано команд: {count}",
      statsMessages: "Проанализировано сообщений: {count}",
      statsSpam: "Заблокировано спама: {count}",
      statsWarnings: "Выдано предупреждений: {count}",
      statsBans: "Забанено пользователей: {count}",
      about: `ℹ️ *О 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🤖 Премиум Telegram бот для разработчиков\n⚡ Cloudflare Workers\n🌍 8 языков\n\n👨‍💻 *Создан:* [Md Salman Biswas](https://github.com/salman-dev-app)\n/credit для полного профиля.`,
      credit: `👨‍💻 *Кредиты — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*

━━━━━━━━━━━━━━━━━━━━━━
🏆 *Md Salman Biswas*
🎯 Старший инженер-программист
━━━━━━━━━━━━━━━━━━━━━━

📌 *Специализация:*
Масштабируемые, безопасные и поддерживаемые корпоративные приложения

🌐 *Контакты:*
📧 mdsalmanhelp@gmail.com
💬 [Telegram](https://t.me/Otakuosenpai)
📘 [Facebook](https://facebook.com/salmandevapp)
📱 [WhatsApp](https://wa.me/8801840933137)
🐙 [GitHub](https://github.com/salman-dev-app)

━━━━━━━━━━━━━━━━━━━━━━
_© 2024-2026 Md Salman Biswas. Все права защищены._`,
      credit: `👨‍💻 *Кредиты — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🏆 *Md Salman Biswas*\n🎯 Старший инженер-программист\n\n🌐 mdsalmanhelp@gmail.com\n💬 [Telegram](https://t.me/Otakuosenpai)\n📘 [Facebook](https://facebook.com/salmandevapp)\n📱 [WhatsApp](https://wa.me/8801840933137)\n🐙 [GitHub](https://github.com/salman-dev-app)\n\n_© 2024-2026 Md Salman Biswas._`,
      ping: "🏓 Понг! Задержка: {latency}мс",
      jsonValid: "✅ *Корректный JSON*\n\n```json\n{formatted}\n```",
      jsonInvalid: "❌ *Некорректный JSON*\n\nОшибка: {error}",
      uuidGenerated: "🔑 *Сгенерирован UUID*\n\n`{uuid}`",
      hashGenerated: "🔐 *SHA-256 Хэш*\n\nВход: `{input}`\nХэш: `{hash}`",
      encodedResult: "🔤 *Кодировано в Base64*\n\nВход: `{input}`\nВыход: `{output}`",
      decodedResult: "🔤 *Декодировано из Base64*\n\nВход: `{input}`\nВыход: `{output}`",
      regexMatch: "✅ *Совпадение Regex*\n\nПаттерн: `{pattern}`\nСовпадения: {matches}",
      regexNoMatch: "❌ *Нет совпадений Regex*\n\nПаттерн: `{pattern}`",
      regexError: "❌ *Неверный паттерн Regex*\n\nОшибка: {error}",
      timestampResult: "🕐 *Конвертация времени*\n\nUnix: `{unix}`\nUTC: `{utc}`",
      colorResult: "🎨 *Конвертация цвета*\n\nВход: `{input}`\nHEX: `{hex}`\nRGB: `{rgb}`",
      colorInvalid: "❌ Неверный формат цвета.",
      urlEncoded: "🔗 *URL Закодирован*\n\nВыход: `{output}`",
      urlDecoded: "🔗 *URL Декодирован*\n\nВыход: `{output}`",
      htmlEscaped: "🔒 *HTML Экранирован*\n\nВыход: `{output}`",
      snippetNotFound: "❓ Нет сниппета для `{lang}`.",
      diceRoll: "🎲 Вы бросили *{result}* (d{sides})",
      eightBall: "🎱 *{answer}*",
      pollCreated: "📊 *Опрос создан!*",
      pollQuestion: "*{question}*",
      needArgs: "❓ Пожалуйста, укажите необходимые аргументы.",
    }
  },

  zh: {
    name: '中文',
    flag: '🇨🇳',
    strings: {
      welcome: `👋 *欢迎使用 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀！*\n\n我是您的高级开发者专属助手：\n\n🛡️ *管理* – 垃圾信息过滤、警告、封禁\n💬 *聊天* – 回答开发相关问题\n🛠️ *开发工具* – JSON 格式化、代码片段等\n🎉 *娱乐* – 笑话、名言、投票\n🌍 *多语言* – 使用 /lang 切换语言\n👨‍💻 *开发者* – /credit 了解创作者\n\n输入 /help 查看所有命令！`,
      help: `📚 *DevBot 命令参考*\n\n/warn @user – 警告用户\n/ban @user – 封禁用户\n/json – 格式化 JSON\n/uuid – 生成 UUID\n/joke – 开发者笑话\n/lang – 切换语言`,
      unknownCommand: "❓ 未知命令。输入 /help 查看可用命令。",
      noPermission: "🚫 您没有权限使用此命令。",
      userNotFound: "❓ 未找到用户。",
      warnSuccess: "⚠️ *{user}* 已被警告。[{count}/3]\n📝 原因：{reason}",
      warnBan: "🔨 *{user}* 在 {count} 次警告后被自动封禁。",
      banSuccess: "🔨 *{user}* 已被封禁。\n📝 原因：{reason}",
      unbanSuccess: "✅ *{user}* 已被解封。",
      muteSuccess: "🔇 *{user}* 已被禁言 {duration} 分钟。",
      unmuteSuccess: "🔊 *{user}* 已被解除禁言。",
      spamDetected: "🚨 检测到 *{user}* 发送垃圾信息。消息已删除。",
      spamWarned: "⚠️ *{user}* – 请勿发送垃圾信息。这是您的警告。",
      warningsCleared: "✅ *{user}* 的警告已清除。",
      warningsList: "📋 *{user}* 有 {count} 条警告。",
      noWarnings: "✅ *{user}* 没有警告。",
      langChanged: "✅ 语言已更改为 {lang} {flag}",
      langMenu: "🌍 *选择语言*\n\n当前：{current} {flag}",
      statsTitle: "📊 *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 统计*",
      statsCommands: "处理的命令：{count}",
      statsMessages: "分析的消息：{count}",
      statsSpam: "拦截的垃圾信息：{count}",
      statsWarnings: "发出的警告：{count}",
      statsBans: "封禁的用户：{count}",
      about: `ℹ️ *关于 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🤖 面向开发者的高级 Telegram 机器人\n⚡ 由 Cloudflare Workers 驱动\n🌍 支持8种语言\n\n👨‍💻 *开发者:* [Md Salman Biswas](https://github.com/salman-dev-app)\n输入 /credit 查看完整个人资料。`,
      credit: `👨‍💻 *开发者信息 — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*

━━━━━━━━━━━━━━━━━━━━━━
🏆 *Md Salman Biswas*
🎯 高级软件工程师
━━━━━━━━━━━━━━━━━━━━━━

📌 *专业方向:*
构建高度可扩展、安全且可维护的企业级应用

🌐 *联系方式:*
📧 mdsalmanhelp@gmail.com
💬 [Telegram](https://t.me/Otakuosenpai)
📘 [Facebook](https://facebook.com/salmandevapp)
📱 [WhatsApp](https://wa.me/8801840933137)
🐙 [GitHub](https://github.com/salman-dev-app)

━━━━━━━━━━━━━━━━━━━━━━
_© 2024-2026 Md Salman Biswas. 版权所有。_`,
      credit: `👨‍💻 *开发者信息 — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🏆 *Md Salman Biswas*\n🎯 高级软件工程师\n\n🌐 mdsalmanhelp@gmail.com\n💬 [Telegram](https://t.me/Otakuosenpai)\n📘 [Facebook](https://facebook.com/salmandevapp)\n📱 [WhatsApp](https://wa.me/8801840933137)\n🐙 [GitHub](https://github.com/salman-dev-app)\n\n_© 2024-2026 Md Salman Biswas._`,
      ping: "🏓 Pong！延迟：{latency}ms",
      jsonValid: "✅ *有效 JSON*\n\n```json\n{formatted}\n```",
      jsonInvalid: "❌ *无效 JSON*\n\n错误：{error}",
      uuidGenerated: "🔑 *生成的 UUID*\n\n`{uuid}`",
      hashGenerated: "🔐 *SHA-256 哈希*\n\n输入：`{input}`\n哈希：`{hash}`",
      encodedResult: "🔤 *Base64 编码*\n\n输入：`{input}`\n输出：`{output}`",
      decodedResult: "🔤 *Base64 解码*\n\n输入：`{input}`\n输出：`{output}`",
      regexMatch: "✅ *正则匹配*\n\n模式：`{pattern}`\n匹配：{matches}",
      regexNoMatch: "❌ *无正则匹配*\n\n模式：`{pattern}`",
      regexError: "❌ *无效正则模式*\n\n错误：{error}",
      timestampResult: "🕐 *时间戳转换*\n\nUnix：`{unix}`\nUTC：`{utc}`",
      colorResult: "🎨 *颜色转换*\n\n输入：`{input}`\nHEX：`{hex}`\nRGB：`{rgb}`",
      colorInvalid: "❌ 无效颜色格式。",
      urlEncoded: "🔗 *URL 编码*\n\n输出：`{output}`",
      urlDecoded: "🔗 *URL 解码*\n\n输出：`{output}`",
      htmlEscaped: "🔒 *HTML 转义*\n\n输出：`{output}`",
      snippetNotFound: "❓ 没有 `{lang}` 的代码片段。",
      diceRoll: "🎲 您投出了 *{result}*（d{sides}）",
      eightBall: "🎱 *{answer}*",
      pollCreated: "📊 *投票已创建！*",
      pollQuestion: "*{question}*",
      needArgs: "❓ 请提供必要参数。",
    }
  },

  ar: {
    name: 'العربية',
    flag: '🇸🇦',
    strings: {
      welcome: `👋 *مرحباً بك في 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀!*\n\nأنا مساعدك المتميز للمطورين:\n\n🛡️ *الإشراف* – تصفية الرسائل المزعجة، التحذيرات، الحظر\n💬 *محادثة* – الإجابة على أسئلة التطوير\n🛠️ *أدوات المطور* – تنسيق JSON، مقاطع الكود\n🎉 *متعة* – نكات، اقتباسات، استطلاعات\n🌍 *متعدد اللغات* – تغيير اللغة بـ /lang\n👨‍💻 *المطور* – /credit للتعرف على المنشئ\n\nاكتب /help لرؤية جميع الأوامر!`,
      help: `📚 *مرجع أوامر DevBot*\n\n/warn @user – تحذير مستخدم\n/ban @user – حظر مستخدم\n/json – تنسيق JSON\n/uuid – إنشاء UUID\n/joke – نكتة مطور\n/lang – تغيير اللغة`,
      unknownCommand: "❓ أمر غير معروف. اكتب /help لرؤية الأوامر المتاحة.",
      noPermission: "🚫 ليس لديك صلاحية لاستخدام هذا الأمر.",
      userNotFound: "❓ المستخدم غير موجود.",
      warnSuccess: "⚠️ تم تحذير *{user}*. [{count}/3]\n📝 السبب: {reason}",
      warnBan: "🔨 تم حظر *{user}* تلقائياً بعد {count} تحذيرات.",
      banSuccess: "🔨 تم حظر *{user}*.\n📝 السبب: {reason}",
      unbanSuccess: "✅ تم رفع حظر *{user}*.",
      muteSuccess: "🔇 تم كتم *{user}* لمدة {duration} دقائق.",
      unmuteSuccess: "🔊 تم رفع كتم *{user}*.",
      spamDetected: "🚨 تم اكتشاف رسائل مزعجة من *{user}*. تم حذف الرسالة.",
      spamWarned: "⚠️ *{user}* – لا ترسل رسائل مزعجة. هذا تحذيرك.",
      warningsCleared: "✅ تم مسح تحذيرات *{user}*.",
      warningsList: "📋 لدى *{user}* {count} تحذير(ات).",
      noWarnings: "✅ لا توجد تحذيرات لـ *{user}*.",
      langChanged: "✅ تم تغيير اللغة إلى {lang} {flag}",
      langMenu: "🌍 *اختر لغة*\n\nالحالية: {current} {flag}",
      statsTitle: "📊 *𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀 إحصائيات*",
      statsCommands: "الأوامر المعالجة: {count}",
      statsMessages: "الرسائل المحللة: {count}",
      statsSpam: "الرسائل المزعجة المحظورة: {count}",
      statsWarnings: "التحذيرات الصادرة: {count}",
      statsBans: "المستخدمون المحظورون: {count}",
      about: `ℹ️ *حول 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🤖 بوت تيليجرام متميز للمطورين\n⚡ مدعوم بـ Cloudflare Workers\n🌍 8 لغات\n\n👨‍💻 *المطور:* [Md Salman Biswas](https://github.com/salman-dev-app)\nاكتب /credit لرؤية الملف الكامل.`,
      credit: `👨‍💻 *تقدير المطور — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*

━━━━━━━━━━━━━━━━━━━━━━
🏆 *Md Salman Biswas*
🎯 مهندس برمجيات أول
━━━━━━━━━━━━━━━━━━━━━━

📌 *التخصص:*
بناء تطبيقات مؤسسية قابلة للتوسع وآمنة وقابلة للصيانة

🌐 *التواصل:*
📧 mdsalmanhelp@gmail.com
💬 [Telegram](https://t.me/Otakuosenpai)
📘 [Facebook](https://facebook.com/salmandevapp)
📱 [WhatsApp](https://wa.me/8801840933137)
🐙 [GitHub](https://github.com/salman-dev-app)

━━━━━━━━━━━━━━━━━━━━━━
_© 2024-2026 Md Salman Biswas. جميع الحقوق محفوظة._`,
      credit: `👨‍💻 *تقدير المطور — 𝗦𝗮𝗹𝗺𝗮𝗻-𝗗𝗲𝘃 𝗧𝗼𝗼𝗹𝘀*\n\n🏆 *Md Salman Biswas*\n🎯 مهندس برمجيات أول\n\n🌐 mdsalmanhelp@gmail.com\n💬 [Telegram](https://t.me/Otakuosenpai)\n📘 [Facebook](https://facebook.com/salmandevapp)\n📱 [WhatsApp](https://wa.me/8801840933137)\n🐙 [GitHub](https://github.com/salman-dev-app)\n\n_© 2024-2026 Md Salman Biswas._`,
      ping: "🏓 Pong! الكمون: {latency}ms",
      jsonValid: "✅ *JSON صالح*\n\n```json\n{formatted}\n```",
      jsonInvalid: "❌ *JSON غير صالح*\n\nخطأ: {error}",
      uuidGenerated: "🔑 *UUID مُنشأ*\n\n`{uuid}`",
      hashGenerated: "🔐 *SHA-256 هاش*\n\nالإدخال: `{input}`\nالهاش: `{hash}`",
      encodedResult: "🔤 *مُشفر بـ Base64*\n\nالإدخال: `{input}`\nالإخراج: `{output}`",
      decodedResult: "🔤 *مفكوك من Base64*\n\nالإدخال: `{input}`\nالإخراج: `{output}`",
      regexMatch: "✅ *تطابق Regex*\n\nالنمط: `{pattern}`\nالتطابقات: {matches}",
      regexNoMatch: "❌ *لا تطابق Regex*\n\nالنمط: `{pattern}`",
      regexError: "❌ *نمط Regex غير صالح*\n\nخطأ: {error}",
      timestampResult: "🕐 *تحويل الطابع الزمني*\n\nUnix: `{unix}`\nUTC: `{utc}`",
      colorResult: "🎨 *تحويل اللون*\n\nالإدخال: `{input}`\nHEX: `{hex}`\nRGB: `{rgb}`",
      colorInvalid: "❌ تنسيق لون غير صالح.",
      urlEncoded: "🔗 *URL مُشفر*\n\nالإخراج: `{output}`",
      urlDecoded: "🔗 *URL مفكوك*\n\nالإخراج: `{output}`",
      htmlEscaped: "🔒 *HTML مُهرَّب*\n\nالإخراج: `{output}`",
      snippetNotFound: "❓ لا يوجد مقطع كود لـ `{lang}`.",
      diceRoll: "🎲 رمي *{result}* (d{sides})",
      eightBall: "🎱 *{answer}*",
      pollCreated: "📊 *تم إنشاء الاستطلاع!*",
      pollQuestion: "*{question}*",
      needArgs: "❓ يرجى توفير الوسائط المطلوبة.",
    }
  }
};

export const DEFAULT_LANG = 'en';

export function getLang(langCode) {
  return LANGUAGES[langCode] || LANGUAGES[DEFAULT_LANG];
}

export function t(langCode, key, vars = {}) {
  const lang = getLang(langCode);
  let str = lang.strings[key] || LANGUAGES[DEFAULT_LANG].strings[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}

export function getLangList() {
  return Object.entries(LANGUAGES).map(([code, data]) => ({
    code,
    name: data.name,
    flag: data.flag
  }));
}
