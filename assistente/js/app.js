import { DOCS, CATEGORIES } from '../knowledge/kb.mjs';
import { Avatar } from './avatar.js';
import { PhotoAvatar } from './photo-avatar.js';
import { LiveAvatarStage } from './live-avatar.js';
import { Speaker, Listener } from './voice.js';
import { Index, offlineAnswer, redFlag } from './search.js';

const CFG = window.ASSISTANT_CONFIG || {};
// Indirizzo del Worker (accetta anche il vecchio chatUrl che finiva con /chat)
const API = (CFG.apiUrl || (CFG.chatUrl || '').replace(/\/chat\/?$/, '')).replace(/\/$/, '');
const STORE_KEY = 'stasi.chat.v1';
const VOICE_KEY = 'stasi.voice';
const PROFILE_KEY = 'stasi.profile';
const ACTIVATION_KEY = 'stasi.activation';
const DOC_BY_ID = new Map(DOCS.map((d) => [d.id, d]));
const CITE_RE = /\[\[([a-z0-9-]+)\]\]/g;
const NAME = CFG.name || 'Stasi';

const PROFILES = {
  sanitario: {
    label: 'Professionista sanitario',
    short: 'Sanitario',
    greeting: `Sono ${NAME}. Posso aiutarti con i protocolli Equistasi, le evidenze scientifiche, il ragionamento clinico, le applicazioni esplorative e gli agopunti. Scrivimi o parlami.`,
    suggestions: [
      'Protocollo SM per la spasticità: quali punti?',
      'Evidenze su Equistasi nel Parkinson',
      'Il protocollo non dà beneficio: alternative esplorative?',
      'Quali test uso per misurare i risultati?',
      'Agopunti che coincidono con i punti Equistasi',
      'Protocollo dolore cronico con il metamero',
    ],
  },
  atletico: {
    label: 'Preparatore atletico',
    short: 'Atletico',
    greeting: `Sono ${NAME}. Posso aiutarti con il protocollo Sport, la propriocezione, la prevenzione degli infortuni e il recupero degli atleti. Scrivimi o parlami.`,
    suggestions: [
      'Protocollo Sport: dove e per quanto tempo?',
      'Equistasi e prevenzione del crociato',
      'Esercizi propriocettivi con il dispositivo',
      'Come misuro l’effetto su equilibrio e salto?',
      'In gara: quante ore al massimo?',
      'Recupero e variabilità cardiaca (HRV)',
    ],
  },
};

const INTRO = `Ciao, sono ${NAME}, la fisioterapista virtuale di Equistasi. Conosco il dispositivo, i protocolli, la letteratura scientifica e la riabilitazione. Prima di iniziare: sei un professionista sanitario o un preparatore atletico?`;
const ASK_SERIAL = 'Per attivarmi, scansiona il numero di serie di un dispositivo Equistasi da studio professionale: lo trovi sul retro del dispositivo.';
const ACTIVATED = 'Perfetto, dispositivo da studio verificato: sono attiva. Come posso aiutarti?';

const $ = (id) => document.getElementById(id);
const log = $('log');
const input = $('input');
const statusEl = $('status');
const onboardEl = $('onboard');

const base = CFG.avatar === 'illustrato' || !CFG.avatarMedia ? new Avatar($('avatar')) : new PhotoAvatar($('avatar'), CFG.avatarMedia);
const avatar = API && CFG.liveAvatar ? new LiveAvatarStage($('avatar'), base, avatarToken) : base;
const index = new Index(DOCS);
let messages = load();
let busy = false;
let lastByVoice = false;
let online = !!API;
let profile = PROFILES[readPref(PROFILE_KEY)] ? readPref(PROFILE_KEY) : null;
let activation = readPref(ACTIVATION_KEY);
let step = null; // passo dell'accoglienza in corso: start | profile | activation

const speaker = new Speaker(CFG.lang || 'it-IT', avatar, {
  onIdle: () => {
    if (busy) return avatar.setState('thinking'); // la risposta sta ancora arrivando
    avatar.setState('idle');
    setStatus('');
    if (CFG.handsFree && lastByVoice && listener.supported) listener.start();
  },
});
speaker.setEnabled(readPref(VOICE_KEY) !== 'off');

const listener = new Listener(CFG.lang || 'it-IT', {
  onInterim: (t) => {
    input.value = t;
    autosize();
  },
  onFinal: (t) => {
    lastByVoice = true;
    if (step === 'profile') return answerProfile(t);
    if (step === 'activation') return activate(t);
    send(t);
  },
  onEnd: () => {
    $('btn-mic').classList.remove('on');
    if (!busy && !speaker.busy) avatar.setState('idle');
  },
  onError: (err) => {
    if (err === 'not-allowed' || err === 'service-not-allowed') setStatus('Permesso microfono negato: puoi scrivere.');
    else if (err === 'no-speech') setStatus('Non ho sentito nulla. Riprova.');
  },
});

/* ───────── Accoglienza: presentazione, profilo, attivazione ───────── */

const needsActivation = () => !!API && !activation;

function startOnboarding() {
  messages = [];
  save();
  log.innerHTML = '';
  $('chips').innerHTML = '';
  showStep('start');
}

function showStep(s) {
  step = s;
  onboardEl.hidden = !s;
  document.body.classList.toggle('onboarding', !!s);
  if (!s) return;
  if (s === 'start') {
    addBubble('assistant', `Benvenuto in Equistasi. Tocca «Inizia» e ${NAME} si presenta.`);
    onboardEl.innerHTML = '<button type="button" class="btn big" id="ob-start">Inizia</button>';
    $('ob-start').onclick = () => {
      wakeAvatar();
      say(INTRO);
      showStep('profile');
    };
  } else if (s === 'profile') {
    onboardEl.innerHTML = Object.entries(PROFILES)
      .map(([k, p]) => `<button type="button" class="btn big" data-profile="${k}">${p.label}</button>`)
      .join('');
    onboardEl.querySelectorAll('[data-profile]').forEach((b) => (b.onclick = () => chooseProfile(b.dataset.profile)));
  } else if (s === 'activation') {
    onboardEl.innerHTML = `
      <button type="button" class="btn big" id="ob-scan">Scansiona il seriale</button>
      <form class="ob-serial" id="ob-form">
        <input id="ob-serial" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="oppure scrivi il numero di serie" aria-label="Numero di serie">
        <button type="submit" class="btn">Attiva</button>
      </form>`;
    $('ob-scan').onclick = scanSerial;
    $('ob-form').onsubmit = (e) => {
      e.preventDefault();
      activate($('ob-serial').value);
    };
  }
}

/** Presentazione con la voce (va chiamata da un tocco: i browser bloccano l'audio senza interazione). */
function say(text) {
  addBubble('assistant', text);
  scrollDown();
  speaker.say(text);
}

function wakeAvatar() {
  if (avatar.start) avatar.start();
}

function chooseProfile(p) {
  if (!PROFILES[p]) return;
  profile = p;
  writePref(PROFILE_KEY, p);
  updateProfileBtn();
  addBubble('user', PROFILES[p].label);
  speaker.stop();
  if (needsActivation()) {
    say(ASK_SERIAL);
    showStep('activation');
  } else finishOnboarding();
}

function answerProfile(text) {
  const t = text.toLowerCase();
  if (/sanitar|fisioterap|medic|terapist|infermier|osteopat|clinic|logoped|riabilit/.test(t)) return chooseProfile('sanitario');
  if (/preparator|atletic|allenator|sport|coach|personal trainer|mister/.test(t)) return chooseProfile('atletico');
  say('Scusa, non ho capito. Sei un professionista sanitario o un preparatore atletico?');
}

async function scanSerial() {
  if (!window.EqScan) return setStatus('Fotocamera non disponibile: scrivi il numero di serie.');
  try {
    const code = await window.EqScan.open({ accept: (t) => /^[A-Z0-9-]{5,32}$/i.test(t.trim()) });
    if (code) activate(code);
  } catch (err) {
    setStatus(err.message === 'denied' ? 'Permesso fotocamera negato: scrivi il numero di serie.' : 'Fotocamera non disponibile: scrivi il numero di serie.');
  }
}

async function activate(raw) {
  const serial = String(raw || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (serial.length < 5) return setStatus('Numero di serie non valido.');
  setStatus('Verifico il dispositivo…');
  avatar.setState('thinking');
  try {
    const res = await fetch(`${API}/activate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serial }) });
    const data = await res.json().catch(() => ({}));
    avatar.setState('idle');
    if (res.status === 500 && data.error === 'attivazione non configurata') {
      activation = 'libera'; // il Worker non richiede l'attivazione
    } else if (data.valid) {
      activation = data.activation;
    } else if (res.ok) {
      setStatus('');
      return say(`Il seriale ${serial} non risulta tra i dispositivi da studio professionale. Controlla il numero o contatta Equistasi.`);
    } else throw new Error('http ' + res.status);
    writePref(ACTIVATION_KEY, activation);
    setStatus('');
    addBubble('user', `Seriale ${serial}`);
    say(ACTIVATED);
    finishOnboarding(false);
  } catch {
    avatar.setState('idle');
    setStatus('Verifica non riuscita: controlla la connessione e riprova.');
  }
}

function finishOnboarding(greet = true) {
  showStep(null);
  if (greet) say(PROFILES[profile].greeting);
  renderChips();
}

/* ───────── Interfaccia ───────── */

function render() {
  log.innerHTML = '';
  addBubble('assistant', profile ? PROFILES[profile].greeting : '');
  for (const m of messages) addBubble(m.role, m.content);
  renderChips();
  updateMode();
  scrollDown();
}

function renderChips() {
  const chips = $('chips');
  chips.innerHTML = '';
  if (messages.length || !profile || step) return;
  for (const s of PROFILES[profile].suggestions) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = s;
    b.onclick = () => {
      lastByVoice = false;
      send(s);
    };
    chips.appendChild(b);
  }
}

function updateProfileBtn() {
  const b = $('btn-profile');
  b.hidden = !profile;
  if (profile) b.textContent = PROFILES[profile].short;
}

function addBubble(role, text, pending = false) {
  const li = document.createElement('li');
  li.className = `msg ${role}${pending ? ' pending' : ''}`;
  const body = document.createElement('div');
  body.className = 'body';
  li.appendChild(body);
  const src = document.createElement('div');
  src.className = 'sources';
  li.appendChild(src);
  log.appendChild(li);
  fillBubble(li, text);
  return li;
}

function fillBubble(li, text) {
  const ids = [];
  const shown = text.replace(CITE_RE, (_, id) => {
    if (DOC_BY_ID.has(id) && !ids.includes(id)) ids.push(id);
    return '';
  });
  li.querySelector('.body').innerHTML = formatText(shown);
  const src = li.querySelector('.sources');
  src.innerHTML = '';
  for (const id of ids) {
    const d = DOC_BY_ID.get(id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `src src-${d.cat}`;
    b.textContent = d.cat === 'studio' ? `📄 ${d.title}` : d.title;
    b.onclick = () => openSource(d);
    src.appendChild(b);
  }
}

function formatText(t) {
  const esc = t
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/[ \t]+([.,;:])/g, '$1');
  return esc
    .split(/\n{2,}/)
    .map((p) => {
      const lines = p.split('\n');
      if (lines.every((l) => /^\s*([-•*]|\d+[.)])\s+/.test(l))) {
        return '<ul>' + lines.map((l) => `<li>${l.replace(/^\s*([-•*]|\d+[.)])\s+/, '')}</li>`).join('') + '</ul>';
      }
      return `<p>${lines.join('<br>')}</p>`;
    })
    .join('');
}

function openSource(d) {
  $('src-cat').textContent = CATEGORIES[d.cat] || d.cat;
  $('src-title').textContent = d.title;
  $('src-ref').textContent = d.source;
  $('src-text').innerHTML = formatText(d.text);
  const a = $('src-link');
  a.hidden = !d.url;
  if (d.url) a.href = d.url;
  $('source-dlg').showModal();
}

function setStatus(t) {
  statusEl.textContent = t;
}

function updateMode() {
  const el = $('mode');
  el.textContent = online ? 'Online' : 'Offline';
  el.className = `mode ${online ? 'on' : 'off'}`;
  el.title = online ? 'Risposte generate dall’intelligenza artificiale sulla base di conoscenza Equistasi' : 'Risposte dalla base di conoscenza locale (servizio AI non configurato o non raggiungibile)';
}

function scrollDown() {
  log.scrollTop = log.scrollHeight;
}

function autosize() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
}

/* ───────── Conversazione ───────── */

async function send(text) {
  text = (text || '').trim();
  if (!text || busy) return;
  if (step) {
    // durante l'accoglienza la casella di testo risponde alla domanda in corso
    input.value = '';
    if (step === 'profile') return answerProfile(text);
    if (step === 'activation') return activate(text);
    return;
  }
  listener.stop();
  speaker.stop();
  wakeAvatar();
  input.value = '';
  autosize();
  $('chips').innerHTML = '';

  messages.push({ role: 'user', content: text });
  addBubble('user', text);
  const li = addBubble('assistant', '', true);
  scrollDown();
  busy = true;
  $('btn-send').disabled = true;
  avatar.setState('thinking');
  setStatus('Sto pensando…');

  const voice = sentenceSpeaker();
  let answer = '';
  const urgent = redFlag(text);
  if (urgent) {
    answer = urgent;
    fillBubble(li, answer);
    voice.push(answer);
    if (online) answer += '\n\n'; // l'AI aggiunge poi il resto della risposta
  }

  try {
    if (!online) throw new Error('offline');
    let streamed = '';
    await streamChat(messages, (chunk) => {
      streamed += chunk;
      fillBubble(li, answer + streamed);
      voice.push(chunk);
      scrollDown();
      if (!speaker.busy) setStatus('');
    });
    answer += streamed;
  } catch (err) {
    if (err.message === 'activation') {
      // attivazione scaduta o revocata: si torna alla scansione del seriale
      messages.pop();
      li.remove();
      busy = false;
      $('btn-send').disabled = false;
      activation = null;
      writePref(ACTIVATION_KEY, '');
      say(ASK_SERIAL);
      return showStep('activation');
    }
    if (err.message !== 'offline') {
      online = false;
      updateMode();
    }
    if (!urgent) {
      answer = offlineAnswer(index, text);
      fillBubble(li, answer);
      voice.push(answer);
    }
  }

  voice.flush();
  li.classList.remove('pending');
  messages.push({ role: 'assistant', content: answer.trim() });
  save();
  busy = false;
  $('btn-send').disabled = false;
  scrollDown();
  if (!speaker.busy) {
    avatar.setState('idle');
    setStatus('');
  }
}

/** Legge ad alta voce la risposta frase per frase, mentre arriva. */
function sentenceSpeaker() {
  let buf = '';
  const speak = (s) => {
    const clean = s.replace(CITE_RE, '').replace(/\*\*/g, '').replace(/^\s*[-•*]\s+/gm, '').trim();
    if (clean) speaker.say(clean);
  };
  return {
    push(chunk) {
      buf += chunk;
      let m;
      while ((m = buf.match(/^([\s\S]*?[.!?…:])(\s+|\n)/)) || (m = buf.match(/^([\s\S]*?)\n\n/))) {
        speak(m[1]);
        buf = buf.slice(m[0].length);
      }
    },
    flush() {
      speak(buf);
      buf = '';
    },
  };
}

async function streamChat(history, onText) {
  const res = await fetch(`${API}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history.slice(-20), profile, activation }),
  });
  if (res.status === 401) throw new Error('activation');
  if (!res.ok || !res.body) throw new Error('http ' + res.status);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let got = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 2);
      if (!line.startsWith('data:')) continue;
      const ev = JSON.parse(line.slice(5));
      if (ev.error) {
        if (!got) throw new Error(ev.error);
        onText(`\n\n(${ev.error})`);
      } else if (ev.t) {
        got = true;
        onText(ev.t);
      }
    }
  }
  if (!got) throw new Error('risposta vuota');
}

/** Gettone di sessione per l'avatar LiveAvatar (HeyGen), rilasciato dal Worker. */
async function avatarToken() {
  const res = await fetch(`${API}/avatar/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activation }),
  });
  if (!res.ok) throw new Error('avatar ' + res.status);
  return (await res.json()).sessionToken;
}

/* ───────── Memoria locale (solo su questo dispositivo) ───────── */

function load() {
  try {
    const m = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(m) ? m.filter((x) => x && typeof x.content === 'string') : [];
  } catch {
    return [];
  }
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    /* archiviazione non disponibile */
  }
}
function readPref(k) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function writePref(k, v) {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* archiviazione non disponibile */
  }
}

/* ───────── Eventi ───────── */

$('composer').addEventListener('submit', (e) => {
  e.preventDefault();
  lastByVoice = false;
  send(input.value);
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    lastByVoice = false;
    send(input.value);
  }
});
input.addEventListener('input', autosize);

$('btn-mic').addEventListener('click', () => {
  if (!listener.supported) {
    setStatus('Il riconoscimento vocale non è disponibile in questo browser: prova con Chrome o Safari, oppure scrivi.');
    return;
  }
  if (listener.active) {
    listener.stop();
    return;
  }
  speaker.stop(); // interrompe l'avatar se sta parlando
  if (!step) wakeAvatar();
  listener.start();
  $('btn-mic').classList.add('on');
  avatar.setState('listening');
  setStatus('Ti ascolto…');
});

const voiceBtn = $('btn-voice');
function syncVoiceBtn() {
  voiceBtn.setAttribute('aria-pressed', String(speaker.enabled));
  voiceBtn.setAttribute('aria-label', speaker.enabled ? 'Voce dell’avatar attiva' : 'Voce dell’avatar disattivata');
}
voiceBtn.addEventListener('click', () => {
  speaker.setEnabled(!speaker.enabled);
  writePref(VOICE_KEY, speaker.enabled ? 'on' : 'off');
  syncVoiceBtn();
});
syncVoiceBtn();
if (!speaker.supported) voiceBtn.hidden = true;

$('btn-new').addEventListener('click', () => {
  speaker.stop();
  listener.stop();
  messages = [];
  save();
  render();
});

$('btn-profile').addEventListener('click', () => {
  speaker.stop();
  listener.stop();
  messages = [];
  save();
  log.innerHTML = '';
  $('chips').innerHTML = '';
  wakeAvatar();
  say('Dimmi pure: sei un professionista sanitario o un preparatore atletico?');
  showStep('profile');
});

setStatus(`Ciao! Sono ${NAME}.`);
updateMode();
updateProfileBtn();
if (!profile || needsActivation()) {
  startOnboarding();
} else {
  render();
  // Saluto vocale al primo tocco (i browser permettono l'audio solo dopo un'interazione).
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (messages.length || step || e.target.closest('button, textarea, input')) return;
      wakeAvatar();
      speaker.say(PROFILES[profile].greeting);
    },
    { once: true }
  );
}
