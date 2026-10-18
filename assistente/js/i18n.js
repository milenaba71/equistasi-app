/*
 * Lingue dell'assistente.
 *
 * LANGS: lingue per riconoscimento vocale (codice BCP-47), voce del browser e avatar LiveAvatar
 * (codice a 2 lettere). Claude risponde in qualunque lingua: qui servono solo per voce e microfono.
 * UI: testi dell'interfaccia tradotti; per le lingue senza traduzione si usa l'inglese.
 */

export const LANGS = [
  ['it-IT', 'Italiano'], ['en-GB', 'English (UK)'], ['en-US', 'English (US)'], ['zh-CN', '中文 (普通话)'],
  ['zh-TW', '中文 (台灣)'], ['es-ES', 'Español'], ['es-MX', 'Español (México)'], ['fr-FR', 'Français'],
  ['de-DE', 'Deutsch'], ['pt-PT', 'Português'], ['pt-BR', 'Português (Brasil)'], ['ru-RU', 'Русский'],
  ['ar-SA', 'العربية'], ['ja-JP', '日本語'], ['ko-KR', '한국어'], ['hi-IN', 'हिन्दी'], ['tr-TR', 'Türkçe'],
  ['nl-NL', 'Nederlands'], ['pl-PL', 'Polski'], ['uk-UA', 'Українська'], ['ro-RO', 'Română'],
  ['el-GR', 'Ελληνικά'], ['sv-SE', 'Svenska'], ['da-DK', 'Dansk'], ['nb-NO', 'Norsk'], ['fi-FI', 'Suomi'],
  ['cs-CZ', 'Čeština'], ['sk-SK', 'Slovenčina'], ['hu-HU', 'Magyar'], ['hr-HR', 'Hrvatski'], ['sr-RS', 'Српски'],
  ['sl-SI', 'Slovenščina'], ['bg-BG', 'Български'], ['sq-AL', 'Shqip'], ['he-IL', 'עברית'], ['fa-IR', 'فارسی'],
  ['ur-PK', 'اردو'], ['bn-IN', 'বাংলা'], ['th-TH', 'ไทย'], ['vi-VN', 'Tiếng Việt'], ['id-ID', 'Bahasa Indonesia'],
  ['ms-MY', 'Bahasa Melayu'], ['tl-PH', 'Filipino'], ['sw-KE', 'Kiswahili'],
];

const RTL = ['ar', 'he', 'fa', 'ur'];

/** Lingua iniziale: quella salvata, altrimenti quella del telefono, altrimenti l'italiano. */
export function pickLang(saved) {
  const codes = LANGS.map((l) => l[0]);
  if (codes.includes(saved)) return saved;
  for (const nav of navigator.languages || [navigator.language || '']) {
    if (codes.includes(nav)) return nav;
    const base = nav.split('-')[0];
    if (base === 'zh') return /TW|HK|Hant/i.test(nav) ? 'zh-TW' : 'zh-CN';
    const hit = codes.find((c) => c.startsWith(base + '-'));
    if (hit) return hit;
  }
  return 'it-IT';
}

export const isRtl = (lang) => RTL.includes(lang.split('-')[0]);
export const langName = (lang) => (LANGS.find((l) => l[0] === lang) || [, lang])[1];

const UI = {
  it: {
    askProfile: 'Sei un professionista sanitario o un preparatore atletico?',
    start: 'Inizia', talk: 'Parla con {name}', stop: 'Fermati', listening: 'Ti ascolto…', thinking: 'Sto pensando…',
    tapToTalk: 'Tocca per parlare', keyboard: 'Scrivi', transcript: 'Trascrizione', close: 'Chiudi', send: 'Invia',
    sanitario: 'Professionista sanitario', atletico: 'Preparatore atletico', changeProfile: 'Cambia profilo',
    scan: 'Scansiona il seriale', serialPh: 'oppure scrivi il numero di serie', activate: 'Attiva',
    welcome: 'Benvenuto in Equistasi. Tocca «Inizia» e {name} si presenta.',
    intro: 'Ciao, sono {name}, l’assistente virtuale di Equistasi. Conosco il dispositivo, i protocolli, la letteratura scientifica e la riabilitazione. Prima di iniziare: sei un professionista sanitario o un preparatore atletico?',
    notUnderstood: 'Scusa, non ho capito. Sei un professionista sanitario o un preparatore atletico?',
    askSerial: 'Per attivarmi, scansiona il numero di serie di un dispositivo Equistasi da studio professionale: lo trovi sul retro del dispositivo.',
    activated: 'Perfetto, dispositivo da studio verificato: sono attivo. Tocca il pulsante e parlami.',
    invalidSerial: 'Il seriale {serial} non risulta tra i dispositivi da studio professionale. Controlla il numero o contatta Equistasi.',
    verifying: 'Verifico il dispositivo…', verifyFail: 'Verifica non riuscita: controlla la connessione e riprova.',
    badSerial: 'Numero di serie non valido.', noCamera: 'Fotocamera non disponibile: scrivi il numero di serie.',
    micDenied: 'Permesso microfono negato: tocca «Scrivi».', noSpeech: 'Non ho sentito nulla. Tocca e riprova.',
    noRecognition: 'Il riconoscimento vocale non è disponibile in questo browser: prova Chrome o Safari, oppure tocca «Scrivi».',
    greetSanitario: 'Sono {name}. Chiedimi protocolli, evidenze, ragionamento clinico, applicazioni esplorative o agopunti.',
    greetAtletico: 'Sono {name}. Chiedimi del protocollo Sport, di propriocezione, prevenzione degli infortuni e recupero.',
    disclaimer: 'Strumento di supporto per professionisti: non sostituisce il giudizio clinico. Emergenze: 112.',
    language: 'Lingua', online: 'Online', offline: 'Offline', newChat: 'Nuova conversazione',
  },
  en: {
    askProfile: 'Are you a healthcare professional or an athletic trainer?',
    start: 'Start', talk: 'Talk to {name}', stop: 'Stop', listening: 'Listening…', thinking: 'Thinking…',
    tapToTalk: 'Tap to talk', keyboard: 'Type', transcript: 'Transcript', close: 'Close', send: 'Send',
    sanitario: 'Healthcare professional', atletico: 'Athletic trainer', changeProfile: 'Change profile',
    scan: 'Scan the serial number', serialPh: 'or type the serial number', activate: 'Activate',
    welcome: 'Welcome to Equistasi. Tap “Start” and {name} will introduce itself.',
    intro: 'Hi, I’m {name}, Equistasi’s virtual assistant. I know the device, the protocols, the scientific literature and rehabilitation. Before we start: are you a healthcare professional or an athletic trainer?',
    notUnderstood: 'Sorry, I didn’t catch that. Are you a healthcare professional or an athletic trainer?',
    askSerial: 'To activate me, scan the serial number of an Equistasi professional-studio device: you’ll find it on the back of the device.',
    activated: 'Great, studio device verified: I’m active. Tap the button and talk to me.',
    invalidSerial: 'Serial {serial} is not a professional-studio device. Check the number or contact Equistasi.',
    verifying: 'Checking the device…', verifyFail: 'Check failed: verify your connection and try again.',
    badSerial: 'Invalid serial number.', noCamera: 'Camera not available: type the serial number.',
    micDenied: 'Microphone permission denied: tap “Type”.', noSpeech: 'I didn’t hear anything. Tap and try again.',
    noRecognition: 'Speech recognition is not available in this browser: try Chrome or Safari, or tap “Type”.',
    greetSanitario: 'I’m {name}. Ask me about protocols, evidence, clinical reasoning, exploratory applications or acupoints.',
    greetAtletico: 'I’m {name}. Ask me about the Sport protocol, proprioception, injury prevention and recovery.',
    disclaimer: 'Support tool for professionals: it does not replace clinical judgement. Emergencies: 112.',
    language: 'Language', online: 'Online', offline: 'Offline', newChat: 'New conversation',
  },
  zh: {
    askProfile: '你是医疗专业人员还是体能教练？',
    start: '开始', talk: '与{name}对话', stop: '停止', listening: '正在聆听…', thinking: '正在思考…',
    tapToTalk: '点击说话', keyboard: '输入文字', transcript: '对话记录', close: '关闭', send: '发送',
    sanitario: '医疗专业人员', atletico: '体能教练', changeProfile: '更换身份',
    scan: '扫描序列号', serialPh: '或输入序列号', activate: '激活',
    welcome: '欢迎使用 Equistasi。点击“开始”，{name}将进行自我介绍。',
    intro: '你好，我是{name}，Equistasi 的虚拟助手。我了解该设备、使用方案、科学文献和康复知识。开始之前：你是医疗专业人员还是体能教练？',
    notUnderstood: '抱歉，我没听清。你是医疗专业人员还是体能教练？',
    askSerial: '请扫描 Equistasi 专业工作室设备的序列号来激活我，序列号位于设备背面。',
    activated: '很好，工作室设备已验证，我已激活。点击按钮和我说话吧。',
    invalidSerial: '序列号 {serial} 不属于专业工作室设备。请检查号码或联系 Equistasi。',
    verifying: '正在验证设备…', verifyFail: '验证失败：请检查网络后重试。',
    badSerial: '序列号无效。', noCamera: '无法使用相机：请输入序列号。',
    micDenied: '麦克风权限被拒绝：请点击“输入文字”。', noSpeech: '没有听到声音，请点击后重试。',
    noRecognition: '此浏览器不支持语音识别：请使用 Chrome 或 Safari，或点击“输入文字”。',
    greetSanitario: '我是{name}。可以问我使用方案、科学证据、临床推理、探索性应用或穴位。',
    greetAtletico: '我是{name}。可以问我运动方案、本体感觉、损伤预防和恢复。',
    disclaimer: '专业人员辅助工具，不能替代临床判断。紧急情况请拨打 112。',
    language: '语言', online: '在线', offline: '离线', newChat: '新对话',
  },
  es: {
    askProfile: '¿Eres profesional sanitario o preparador físico?',
    start: 'Empezar', talk: 'Habla con {name}', stop: 'Detener', listening: 'Te escucho…', thinking: 'Pensando…',
    tapToTalk: 'Toca para hablar', keyboard: 'Escribir', transcript: 'Transcripción', close: 'Cerrar', send: 'Enviar',
    sanitario: 'Profesional sanitario', atletico: 'Preparador físico', changeProfile: 'Cambiar perfil',
    scan: 'Escanear el número de serie', serialPh: 'o escribe el número de serie', activate: 'Activar',
    welcome: 'Bienvenido a Equistasi. Toca «Empezar» y {name} se presentará.',
    intro: 'Hola, soy {name}, el asistente virtual de Equistasi. Conozco el dispositivo, los protocolos, la literatura científica y la rehabilitación. Antes de empezar: ¿eres profesional sanitario o preparador físico?',
    notUnderstood: 'Perdona, no te he entendido. ¿Eres profesional sanitario o preparador físico?',
    askSerial: 'Para activarme, escanea el número de serie de un dispositivo Equistasi profesional: está en la parte trasera.',
    activated: 'Perfecto, dispositivo profesional verificado: estoy activo. Toca el botón y háblame.',
    invalidSerial: 'El número {serial} no corresponde a un dispositivo profesional. Revisa el número o contacta con Equistasi.',
    verifying: 'Verificando el dispositivo…', verifyFail: 'No se pudo verificar: revisa la conexión e inténtalo de nuevo.',
    badSerial: 'Número de serie no válido.', noCamera: 'Cámara no disponible: escribe el número de serie.',
    micDenied: 'Permiso de micrófono denegado: toca «Escribir».', noSpeech: 'No he oído nada. Toca e inténtalo de nuevo.',
    noRecognition: 'El reconocimiento de voz no está disponible en este navegador: usa Chrome o Safari, o toca «Escribir».',
    greetSanitario: 'Soy {name}. Pregúntame por protocolos, evidencia, razonamiento clínico, aplicaciones exploratorias o acupuntos.',
    greetAtletico: 'Soy {name}. Pregúntame por el protocolo Deporte, propiocepción, prevención de lesiones y recuperación.',
    disclaimer: 'Herramienta de apoyo para profesionales: no sustituye el juicio clínico. Emergencias: 112.',
    language: 'Idioma', online: 'En línea', offline: 'Sin conexión', newChat: 'Nueva conversación',
  },
  fr: {
    askProfile: 'Êtes-vous professionnel de santé ou préparateur physique ?',
    start: 'Commencer', talk: 'Parler avec {name}', stop: 'Arrêter', listening: 'Je vous écoute…', thinking: 'Je réfléchis…',
    tapToTalk: 'Touchez pour parler', keyboard: 'Écrire', transcript: 'Transcription', close: 'Fermer', send: 'Envoyer',
    sanitario: 'Professionnel de santé', atletico: 'Préparateur physique', changeProfile: 'Changer de profil',
    scan: 'Scanner le numéro de série', serialPh: 'ou saisissez le numéro de série', activate: 'Activer',
    welcome: 'Bienvenue chez Equistasi. Touchez « Commencer » et {name} se présentera.',
    intro: 'Bonjour, je suis {name}, l’assistant virtuel d’Equistasi. Je connais le dispositif, les protocoles, la littérature scientifique et la rééducation. Avant de commencer : êtes-vous professionnel de santé ou préparateur physique ?',
    notUnderstood: 'Pardon, je n’ai pas compris. Êtes-vous professionnel de santé ou préparateur physique ?',
    askSerial: 'Pour m’activer, scannez le numéro de série d’un dispositif Equistasi professionnel : il se trouve au dos du dispositif.',
    activated: 'Parfait, dispositif professionnel vérifié : je suis actif. Touchez le bouton et parlez-moi.',
    invalidSerial: 'Le numéro {serial} ne correspond pas à un dispositif professionnel. Vérifiez-le ou contactez Equistasi.',
    verifying: 'Vérification du dispositif…', verifyFail: 'Échec de la vérification : vérifiez la connexion et réessayez.',
    badSerial: 'Numéro de série non valide.', noCamera: 'Caméra indisponible : saisissez le numéro de série.',
    micDenied: 'Accès au micro refusé : touchez « Écrire ».', noSpeech: 'Je n’ai rien entendu. Touchez et réessayez.',
    noRecognition: 'La reconnaissance vocale n’est pas disponible dans ce navigateur : essayez Chrome ou Safari, ou touchez « Écrire ».',
    greetSanitario: 'Je suis {name}. Interrogez-moi sur les protocoles, les preuves, le raisonnement clinique, les applications exploratoires ou les points d’acupuncture.',
    greetAtletico: 'Je suis {name}. Interrogez-moi sur le protocole Sport, la proprioception, la prévention des blessures et la récupération.',
    disclaimer: 'Outil d’aide pour les professionnels : il ne remplace pas le jugement clinique. Urgences : 112.',
    language: 'Langue', online: 'En ligne', offline: 'Hors ligne', newChat: 'Nouvelle conversation',
  },
  de: {
    askProfile: 'Bist du Gesundheitsfachkraft oder Athletiktrainer?',
    start: 'Starten', talk: 'Mit {name} sprechen', stop: 'Stopp', listening: 'Ich höre zu…', thinking: 'Ich denke nach…',
    tapToTalk: 'Zum Sprechen tippen', keyboard: 'Schreiben', transcript: 'Verlauf', close: 'Schließen', send: 'Senden',
    sanitario: 'Gesundheitsfachkraft', atletico: 'Athletiktrainer', changeProfile: 'Profil ändern',
    scan: 'Seriennummer scannen', serialPh: 'oder Seriennummer eingeben', activate: 'Aktivieren',
    welcome: 'Willkommen bei Equistasi. Tippe auf „Starten“ und {name} stellt sich vor.',
    intro: 'Hallo, ich bin {name}, der virtuelle Assistent von Equistasi. Ich kenne das Gerät, die Protokolle, die Fachliteratur und die Rehabilitation. Bevor wir beginnen: Bist du Gesundheitsfachkraft oder Athletiktrainer?',
    notUnderstood: 'Entschuldigung, ich habe dich nicht verstanden. Bist du Gesundheitsfachkraft oder Athletiktrainer?',
    askSerial: 'Um mich zu aktivieren, scanne die Seriennummer eines Equistasi-Praxisgeräts: Sie steht auf der Rückseite.',
    activated: 'Perfekt, Praxisgerät bestätigt: Ich bin aktiv. Tippe auf die Taste und sprich mit mir.',
    invalidSerial: 'Die Seriennummer {serial} gehört zu keinem Praxisgerät. Prüfe die Nummer oder kontaktiere Equistasi.',
    verifying: 'Gerät wird geprüft…', verifyFail: 'Prüfung fehlgeschlagen: Verbindung prüfen und erneut versuchen.',
    badSerial: 'Ungültige Seriennummer.', noCamera: 'Kamera nicht verfügbar: Seriennummer eingeben.',
    micDenied: 'Mikrofonzugriff verweigert: tippe auf „Schreiben“.', noSpeech: 'Ich habe nichts gehört. Tippe und versuche es erneut.',
    noRecognition: 'Spracherkennung ist in diesem Browser nicht verfügbar: nutze Chrome oder Safari oder tippe auf „Schreiben“.',
    greetSanitario: 'Ich bin {name}. Frag mich nach Protokollen, Evidenz, klinischem Denken, explorativen Anwendungen oder Akupunkturpunkten.',
    greetAtletico: 'Ich bin {name}. Frag mich nach dem Sport-Protokoll, Propriozeption, Verletzungsprävention und Regeneration.',
    disclaimer: 'Hilfsmittel für Fachleute: ersetzt nicht das klinische Urteil. Notfall: 112.',
    language: 'Sprache', online: 'Online', offline: 'Offline', newChat: 'Neues Gespräch',
  },
  pt: {
    askProfile: 'É profissional de saúde ou preparador físico?',
    start: 'Começar', talk: 'Fale com {name}', stop: 'Parar', listening: 'Estou a ouvir…', thinking: 'A pensar…',
    tapToTalk: 'Toque para falar', keyboard: 'Escrever', transcript: 'Transcrição', close: 'Fechar', send: 'Enviar',
    sanitario: 'Profissional de saúde', atletico: 'Preparador físico', changeProfile: 'Mudar perfil',
    scan: 'Ler o número de série', serialPh: 'ou escreva o número de série', activate: 'Ativar',
    welcome: 'Bem-vindo à Equistasi. Toque em «Começar» e {name} vai apresentar-se.',
    intro: 'Olá, sou {name}, o assistente virtual da Equistasi. Conheço o dispositivo, os protocolos, a literatura científica e a reabilitação. Antes de começar: é profissional de saúde ou preparador físico?',
    notUnderstood: 'Desculpe, não percebi. É profissional de saúde ou preparador físico?',
    askSerial: 'Para me ativar, leia o número de série de um dispositivo Equistasi profissional: está na parte de trás.',
    activated: 'Perfeito, dispositivo profissional verificado: estou ativo. Toque no botão e fale comigo.',
    invalidSerial: 'O número {serial} não corresponde a um dispositivo profissional. Verifique ou contacte a Equistasi.',
    verifying: 'A verificar o dispositivo…', verifyFail: 'Falha na verificação: verifique a ligação e tente novamente.',
    badSerial: 'Número de série inválido.', noCamera: 'Câmara indisponível: escreva o número de série.',
    micDenied: 'Acesso ao microfone negado: toque em «Escrever».', noSpeech: 'Não ouvi nada. Toque e tente novamente.',
    noRecognition: 'O reconhecimento de voz não está disponível neste navegador: use Chrome ou Safari, ou toque em «Escrever».',
    greetSanitario: 'Sou {name}. Pergunte-me sobre protocolos, evidência, raciocínio clínico, aplicações exploratórias ou acupontos.',
    greetAtletico: 'Sou {name}. Pergunte-me sobre o protocolo Desporto, propriocepção, prevenção de lesões e recuperação.',
    disclaimer: 'Ferramenta de apoio para profissionais: não substitui o julgamento clínico. Emergência: 112.',
    language: 'Idioma', online: 'Online', offline: 'Offline', newChat: 'Nova conversa',
  },
  ru: {
    askProfile: 'Вы медицинский специалист или тренер по физподготовке?',
    start: 'Начать', talk: 'Поговорить с {name}', stop: 'Стоп', listening: 'Слушаю…', thinking: 'Думаю…',
    tapToTalk: 'Нажмите, чтобы говорить', keyboard: 'Написать', transcript: 'Расшифровка', close: 'Закрыть', send: 'Отправить',
    sanitario: 'Медицинский специалист', atletico: 'Тренер по физподготовке', changeProfile: 'Сменить профиль',
    scan: 'Сканировать серийный номер', serialPh: 'или введите серийный номер', activate: 'Активировать',
    welcome: 'Добро пожаловать в Equistasi. Нажмите «Начать», и {name} представится.',
    intro: 'Здравствуйте, я {name}, виртуальный помощник Equistasi. Я знаю устройство, протоколы, научную литературу и реабилитацию. Прежде чем начать: вы медицинский специалист или тренер по физподготовке?',
    notUnderstood: 'Извините, я не понял. Вы медицинский специалист или тренер по физподготовке?',
    askSerial: 'Чтобы активировать меня, отсканируйте серийный номер профессионального устройства Equistasi: он на обратной стороне.',
    activated: 'Отлично, профессиональное устройство подтверждено: я активен. Нажмите кнопку и говорите.',
    invalidSerial: 'Номер {serial} не относится к профессиональным устройствам. Проверьте номер или свяжитесь с Equistasi.',
    verifying: 'Проверяю устройство…', verifyFail: 'Проверка не удалась: проверьте подключение и повторите.',
    badSerial: 'Неверный серийный номер.', noCamera: 'Камера недоступна: введите серийный номер.',
    micDenied: 'Доступ к микрофону запрещён: нажмите «Написать».', noSpeech: 'Я ничего не услышал. Нажмите и повторите.',
    noRecognition: 'Распознавание речи недоступно в этом браузере: используйте Chrome или Safari или нажмите «Написать».',
    greetSanitario: 'Я {name}. Спрашивайте о протоколах, доказательствах, клиническом мышлении, поисковых применениях и точках акупунктуры.',
    greetAtletico: 'Я {name}. Спрашивайте о спортивном протоколе, проприоцепции, профилактике травм и восстановлении.',
    disclaimer: 'Инструмент поддержки для специалистов: не заменяет клиническое суждение. Экстренная помощь: 112.',
    language: 'Язык', online: 'Онлайн', offline: 'Офлайн', newChat: 'Новый разговор',
  },
  ar: {
    askProfile: 'هل أنت أخصائي صحي أم مدرب لياقة بدنية؟',
    start: 'ابدأ', talk: 'تحدث مع {name}', stop: 'توقف', listening: 'أستمع إليك…', thinking: 'أفكر…',
    tapToTalk: 'اضغط للتحدث', keyboard: 'اكتب', transcript: 'نص المحادثة', close: 'إغلاق', send: 'إرسال',
    sanitario: 'أخصائي صحي', atletico: 'مدرب لياقة بدنية', changeProfile: 'تغيير الملف',
    scan: 'امسح الرقم التسلسلي', serialPh: 'أو اكتب الرقم التسلسلي', activate: 'تفعيل',
    welcome: 'مرحبًا بك في Equistasi. اضغط «ابدأ» وسيقدم {name} نفسه.',
    intro: 'مرحبًا، أنا {name}، المساعد الافتراضي لـ Equistasi. أعرف الجهاز والبروتوكولات والأدبيات العلمية وإعادة التأهيل. قبل أن نبدأ: هل أنت أخصائي صحي أم مدرب لياقة بدنية؟',
    notUnderstood: 'عذرًا، لم أفهم. هل أنت أخصائي صحي أم مدرب لياقة بدنية؟',
    askSerial: 'لتفعيلي، امسح الرقم التسلسلي لجهاز Equistasi المهني: تجده على ظهر الجهاز.',
    activated: 'ممتاز، تم التحقق من الجهاز المهني: أنا مفعّل. اضغط الزر وتحدث معي.',
    invalidSerial: 'الرقم {serial} ليس جهازًا مهنيًا. تحقق من الرقم أو تواصل مع Equistasi.',
    verifying: 'جارٍ التحقق من الجهاز…', verifyFail: 'فشل التحقق: تحقق من الاتصال وحاول مجددًا.',
    badSerial: 'رقم تسلسلي غير صالح.', noCamera: 'الكاميرا غير متاحة: اكتب الرقم التسلسلي.',
    micDenied: 'تم رفض إذن الميكروفون: اضغط «اكتب».', noSpeech: 'لم أسمع شيئًا. اضغط وحاول مجددًا.',
    noRecognition: 'التعرف على الكلام غير متاح في هذا المتصفح: جرّب Chrome أو Safari، أو اضغط «اكتب».',
    greetSanitario: 'أنا {name}. اسألني عن البروتوكولات والأدلة والاستدلال السريري والتطبيقات الاستكشافية ونقاط الوخز.',
    greetAtletico: 'أنا {name}. اسألني عن بروتوكول الرياضة والحس العميق والوقاية من الإصابات والتعافي.',
    disclaimer: 'أداة دعم للمهنيين: لا تحل محل الحكم السريري. الطوارئ: 112.',
    language: 'اللغة', online: 'متصل', offline: 'غير متصل', newChat: 'محادثة جديدة',
  },
  ja: {
    askProfile: '医療専門職ですか、それともアスレティックトレーナーですか？',
    start: '開始', talk: '{name}と話す', stop: '停止', listening: '聞いています…', thinking: '考えています…',
    tapToTalk: 'タップして話す', keyboard: '入力する', transcript: '会話の記録', close: '閉じる', send: '送信',
    sanitario: '医療専門職', atletico: 'アスレティックトレーナー', changeProfile: 'プロフィールを変更',
    scan: 'シリアル番号をスキャン', serialPh: 'またはシリアル番号を入力', activate: '有効化',
    welcome: 'Equistasi へようこそ。「開始」をタップすると{name}が自己紹介します。',
    intro: 'こんにちは、Equistasi のバーチャルアシスタント、{name}です。デバイス、プロトコル、科学文献、リハビリテーションについて知っています。始める前に、あなたは医療専門職ですか、それともアスレティックトレーナーですか？',
    notUnderstood: 'すみません、聞き取れませんでした。医療専門職ですか、それともアスレティックトレーナーですか？',
    askSerial: '有効化するには、Equistasi のプロ用デバイスのシリアル番号をスキャンしてください。デバイスの裏面にあります。',
    activated: 'プロ用デバイスを確認しました。有効になりました。ボタンをタップして話しかけてください。',
    invalidSerial: 'シリアル番号 {serial} はプロ用デバイスではありません。番号を確認するか Equistasi にお問い合わせください。',
    verifying: 'デバイスを確認しています…', verifyFail: '確認できませんでした。接続を確認して再試行してください。',
    badSerial: 'シリアル番号が無効です。', noCamera: 'カメラを使用できません。シリアル番号を入力してください。',
    micDenied: 'マイクの許可がありません。「入力する」をタップしてください。', noSpeech: '何も聞こえませんでした。タップして再試行してください。',
    noRecognition: 'このブラウザでは音声認識を使用できません。Chrome か Safari を使うか、「入力する」をタップしてください。',
    greetSanitario: '{name}です。プロトコル、エビデンス、臨床推論、探索的な応用、経穴について聞いてください。',
    greetAtletico: '{name}です。スポーツプロトコル、固有受容感覚、ケガの予防、リカバリーについて聞いてください。',
    disclaimer: '専門職向けの支援ツールであり、臨床判断に代わるものではありません。緊急時は112。',
    language: '言語', online: 'オンライン', offline: 'オフライン', newChat: '新しい会話',
  },
};

/** Traduzione di una chiave nella lingua attiva, con sostituzione di {name}, {serial}… */
export function t(lang, key, vars = {}) {
  const base = lang.split('-')[0];
  const s = (UI[base] && UI[base][key]) || UI.en[key] || UI.it[key] || key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

/** Riconosce il profilo da una risposta a voce, in molte lingue. */
export function profileFromSpeech(text) {
  const s = text.toLowerCase();
  if (/sanitar|fisioterap|medic|médic|terapist|infermier|osteopat|clinic|riabilit|doctor|physio|therap|nurse|health|santé|médecin|kiné|salud|arzt|gesundheit|saúde|врач|медицин|طبي|صحي|医|理疗|康复|护士|医療|看護/.test(s)) return 'sanitario';
  if (/preparator|preparador|atletic|athlet|allenator|entrenador|entraîneur|sport|coach|trainer|тренер|مدرب|教练|运动|体能|トレーナー|コーチ/.test(s)) return 'atletico';
  return null;
}
