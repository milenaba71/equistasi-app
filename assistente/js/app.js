import { DOCS, CATEGORIES } from '../knowledge/kb.mjs';
import { Avatar } from './avatar.js';
import { PhotoAvatar } from './photo-avatar.js';
import { LiveAvatarStage } from './live-avatar.js';
import { Speaker, Listener } from './voice.js';
import { Index, offlineAnswer, redFlag } from './search.js';
import { LANGS, pickLang, isRtl, t as tr, profileFromSpeech } from './i18n.js';

const CFG = window.ASSISTANT_CONFIG || {};
// Indirizzo del Worker (accetta anche il vecchio chatUrl che finiva con /chat)
const API = (CFG.apiUrl || (CFG.chatUrl || '').replace(/\/chat\/?$/, '')).replace(/\/$/, '');
const STORE_KEY = 'primo.chat.v1';
const VOICE_KEY = 'primo.voice';
const PROFILE_KEY = 'primo.profile';
const ACTIVATION_KEY = 'primo.activation';
const LANG_KEY = 'primo.lang';
const DOC_BY_ID = new Map(DOCS.map((d) => [d.id, d]));
const CITE_RE = /\[\[([a-z0-9-]+)\]\]/g;
const NAME = CFG.name || 'Primo';
const MAX_SILENCE = 3; // ascolti a vuoto di fila prima di fermare la conversazione

const $ = (id) => document.getElementById(id);
const log = $('log');
const input = $('input');
const subtitleEl = $('subtitle');
const statusEl = $('status');
const onboardEl = $('onboard');

let lang = pickLang(readPref(LANG_KEY) || CFG.lang);
const t = (key, vars = {}) => tr(lang, key, { name: NAME, ...vars });

const base = CFG.avatar === 'illustrato' || !CFG.avatarMedia ? new Avatar($('avatar')) : new PhotoAvatar($('avatar'), CFG.avatarMedia);
const avatar = API && CFG.liveAvatar ? new LiveAvatarStage($('avatar'), base, avatarToken) : base;
const index = new Index(DOCS);
let messages = load();
let busy = false;
let online = !!API;
let profile = ['sanitario', 'atletico'].includes(readPref(PROFILE_KEY)) ? readPref(PROFILE_KEY) : null;
let activation = readPref(ACTIVATION_KEY);
let step = null; // accoglienza in corso: start | profile | activation
let talking = false; // conversazione a voce attiva (ascolta → risponde → riascolta)
let silence = 0;
let heard = false;

const speaker = new Speaker(lang, avatar, {
  onSentence: (text) => showSubtitle(text),
  onIdle: () => {
    document.body.classList.remove('speaking');
    if (busy) return avatar.setState('thinking'); // la risposta sta ancora arrivando
    avatar.setState('idle');
    setStatus('');
    if (talking) setTimeout(listen, 250); // tocca all'utente
  },
});
speaker.setEnabled(readPref(VOICE_KEY) !== 'off');

const listener = new Listener(lang, {
  onInterim: (text) => showSubtitle(text, true),
  onFinal: (text) => {
    heard = true;
    silence = 0;
    showSubtitle(text, true);
    if (step === 'profile') return answerProfile(text);
    if (step === 'activation') return activate(text);
    send(text);
  },
  onEnd: () => {
    document.body.classList.remove('listening');
    if (heard || !talking) return;
    // nessuna parola: si riascolta qualche volta, poi ci si ferma (anche per non consumare l'avatar)
    if (++silence >= MAX_SILENCE) {
      stopTalking();
      setStatus(t('noSpeech'));
    } else if (!busy && !speaker.busy) listen();
  },
  onError: (err) => {
    if (err === 'not-allowed' || err === 'service-not-allowed') {
      stopTalking();
      setStatus(t('micDenied'));
      toggleKeyboard(true);
    }
  },
});

/* ───────── Conversazione a voce ───────── */

function startTalking() {
  if (!listener.supported) {
    setStatus(t('noRecognition'));
    return toggleKeyboard(true);
  }
  talking = true;
  silence = 0;
  document.body.classList.add('talking');
  applyUi();
  wakeAvatar();
  if (!speaker.busy && !busy) listen();
}

function stopTalking() {
  talking = false;
  document.body.classList.remove('talking', 'listening');
  listener.stop();
  speaker.stop();
  applyUi();
  if (!busy) avatar.setState('idle');
}

function listen() {
  if (!talking || busy || speaker.busy || listener.active) return;
  heard = false;
  listener.start();
  document.body.classList.add('listening');
  avatar.setState('listening');
  setStatus(t('listening'));
}

function showSubtitle(text, fromUser = false) {
  subtitleEl.textContent = text.replace(CITE_RE, '').replace(/\*\*/g, '');
  subtitleEl.classList.toggle('user', fromUser);
  if (!fromUser) document.body.classList.add('speaking');
}

/* ───────── Accoglienza: presentazione, profilo, attivazione ───────── */

const needsActivation = () => !!API && !activation;

function startOnboarding() {
  messages = [];
  save();
  log.innerHTML = '';
  showSubtitle(t('welcome'));
  showStep('start');
}

function showStep(s) {
  step = s;
  onboardEl.hidden = !s;
  document.body.classList.toggle('onboarding', !!s);
  if (!s) return;
  if (s === 'start') {
    onboardEl.innerHTML = `<button type="button" class="btn big alt" id="ob-start">${esc(t('start'))}</button>`;
    $('ob-start').onclick = () => {
      say(t('intro'));
      showStep('profile');
      startTalking(); // dopo la presentazione il microfono si apre da solo per la risposta
    };
  } else if (s === 'profile') {
    onboardEl.innerHTML = ['sanitario', 'atletico']
      .map((k, i) => `<button type="button" class="btn big${i ? '' : ' alt'}" data-profile="${k}">${esc(t(k))}</button>`)
      .join('');
    onboardEl.querySelectorAll('[data-profile]').forEach((b) => (b.onclick = () => chooseProfile(b.dataset.profile)));
  } else if (s === 'activation') {
    onboardEl.innerHTML = `
      <button type="button" class="btn big alt" id="ob-scan">${esc(t('scan'))}</button>
      <form class="ob-serial" id="ob-form">
        <input id="ob-serial" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${esc(t('serialPh'))}" aria-label="${esc(t('serialPh'))}">
        <button type="submit" class="btn">${esc(t('activate'))}</button>
      </form>`;
    $('ob-scan').onclick = scanSerial;
    $('ob-form').onsubmit = (e) => {
      e.preventDefault();
      activate($('ob-serial').value);
    };
  }
}

/** L'avatar dice una frase fuori dalla conversazione con Claude (accoglienza, avvisi). */
function say(text) {
  addBubble('assistant', text);
  speaker.say(text);
  if (!speaker.enabled) showSubtitle(text);
}

function wakeAvatar() {
  if (avatar.start) avatar.start();
}

function chooseProfile(p) {
  profile = p;
  writePref(PROFILE_KEY, p);
  applyUi();
  addBubble('user', t(p));
  listener.stop();
  speaker.stop();
  if (needsActivation()) {
    say(t('askSerial'));
    showStep('activation');
  } else finishOnboarding(true);
}

function answerProfile(text) {
  const p = profileFromSpeech(text) || (/\b(1|uno|one)\b|一/.test(text) ? 'sanitario' : /\b(2|due|two)\b|二/.test(text) ? 'atletico' : null);
  if (p) return chooseProfile(p);
  say(t('notUnderstood'));
}

async function scanSerial() {
  if (!window.EqScan) return setStatus(t('noCamera'));
  listener.stop();
  try {
    const code = await window.EqScan.open({ accept: (x) => /^[A-Z0-9-]{5,32}$/i.test(x.trim()) });
    if (code) activate(code);
  } catch {
    setStatus(t('noCamera'));
  }
}

async function activate(raw) {
  const serial = String(raw || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (serial.length < 5) return setStatus(t('badSerial'));
  setStatus(t('verifying'));
  avatar.setState('thinking');
  try {
    const res = await fetch(`${API}/activate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serial }) });
    const data = await res.json().catch(() => ({}));
    avatar.setState('idle');
    setStatus('');
    if (res.status === 500 && data.error === 'attivazione non configurata') {
      activation = 'libera'; // il Worker non richiede l'attivazione
    } else if (data.valid) {
      activation = data.activation;
    } else if (res.ok) {
      return say(t('invalidSerial', { serial }));
    } else throw new Error('http ' + res.status);
    writePref(ACTIVATION_KEY, activation);
    addBubble('user', serial);
    say(t('activated'));
    finishOnboarding(false);
  } catch {
    avatar.setState('idle');
    setStatus(t('verifyFail'));
  }
}

function finishOnboarding(greet) {
  showStep(null);
  if (greet) say(greeting());
}

const greeting = () => t(profile === 'atletico' ? 'greetAtletico' : 'greetSanitario');

/* ───────── Interfaccia ───────── */

function applyUi() {
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
  $('lbl-talk').textContent = talking ? t('stop') : t('talk');
  $('btn-talk').setAttribute('aria-label', talking ? t('stop') : t('talk'));
  $('lbl-keyboard').textContent = t('keyboard');
  $('lbl-transcript').textContent = t('transcript');
  $('ttl-transcript').textContent = t('transcript');
  $('btn-close-transcript').textContent = t('close');
  $('btn-send').setAttribute('aria-label', t('send'));
  $('btn-new').setAttribute('aria-label', t('newChat'));
  $('btn-new').title = t('newChat');
  $('disclaimer').textContent = t('disclaimer');
  input.placeholder = t('keyboard') + '…';
  const mode = $('mode');
  mode.textContent = online ? t('online') : t('offline');
  mode.className = `mode ${online ? 'on' : 'off'}`;
  const pb = $('btn-profile');
  pb.hidden = !profile;
  if (profile) {
    pb.textContent = t(profile);
    pb.title = t('changeProfile');
  }
  if (step) showStep(step); // ridisegna i pulsanti dell'accoglienza nella nuova lingua
}

function render() {
  log.innerHTML = '';
  for (const m of messages) addBubble(m.role, m.content);
  const last = [...messages].reverse().find((m) => m.role === 'assistant');
  showSubtitle(greeting());
  renderSources($('live-sources'), last ? citations(last.content) : []);
}

function citations(text) {
  const ids = [];
  for (const [, id] of text.matchAll(CITE_RE)) if (DOC_BY_ID.has(id) && !ids.includes(id)) ids.push(id);
  return ids;
}

function renderSources(container, ids) {
  container.innerHTML = '';
  for (const id of ids) {
    const d = DOC_BY_ID.get(id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `src src-${d.cat}`;
    b.textContent = d.cat === 'studio' ? `📄 ${d.title}` : d.title;
    b.onclick = () => openSource(d);
    container.appendChild(b);
  }
}

function addBubble(role, text, pending = false) {
  const li = document.createElement('li');
  li.className = `msg ${role}${pending ? ' pending' : ''}`;
  li.innerHTML = '<div class="body"></div><div class="sources"></div>';
  log.appendChild(li);
  fillBubble(li, text);
  log.scrollTop = log.scrollHeight;
  return li;
}

function fillBubble(li, text) {
  li.querySelector('.body').innerHTML = formatText(text.replace(CITE_RE, ''));
  renderSources(li.querySelector('.sources'), citations(text));
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatText(text) {
  const html = esc(text.trim())
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/[ \t]+([.,;:])/g, '$1');
  return html
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

function setStatus(text) {
  statusEl.textContent = text;
}

function toggleKeyboard(force) {
  const form = $('composer');
  const show = force ?? form.hidden;
  form.hidden = !show;
  $('btn-keyboard').setAttribute('aria-pressed', String(show));
  if (show) input.focus();
}

function autosize() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
}

/* ───────── Domanda e risposta ───────── */

async function send(text) {
  text = (text || '').trim();
  if (!text || busy) return;
  input.value = '';
  autosize();
  if (step === 'profile') return answerProfile(text);
  if (step === 'activation') return activate(text);
  if (step) return;
  listener.stop();
  speaker.stop();
  wakeAvatar();

  messages.push({ role: 'user', content: text });
  addBubble('user', text);
  showSubtitle(text, true);
  $('live-sources').innerHTML = '';
  const li = addBubble('assistant', '', true);
  busy = true;
  $('btn-send').disabled = true;
  avatar.setState('thinking');
  setStatus(t('thinking'));

  const voice = sentenceSpeaker();
  let answer = '';
  const urgent = redFlag(text);
  if (urgent) {
    answer = urgent;
    fillBubble(li, answer);
    voice.push(answer + '\n\n');
    if (online) answer += '\n\n'; // l'AI aggiunge poi il resto della risposta
  }

  try {
    if (!online) throw new Error('offline');
    let streamed = '';
    await streamChat(messages, (chunk) => {
      streamed += chunk;
      fillBubble(li, answer + streamed);
      voice.push(chunk);
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
      say(t('askSerial'));
      return showStep('activation');
    }
    if (err.message !== 'offline') {
      online = false;
      applyUi();
    }
    if (!urgent) {
      answer = offlineAnswer(index, text);
      fillBubble(li, answer);
      voice.push(answer);
    }
  }

  voice.flush();
  li.classList.remove('pending');
  renderSources($('live-sources'), citations(answer));
  messages.push({ role: 'assistant', content: answer.trim() });
  save();
  busy = false;
  $('btn-send').disabled = false;
  if (!speaker.busy) {
    avatar.setState('idle');
    setStatus('');
    if (talking) listen();
  }
}

/** Fa parlare l'avatar frase per frase mentre la risposta arriva (anche cinese e giapponese). */
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
      while ((m = buf.match(/^([\s\S]*?(?:[.!?…:;](?=\s)|[。！？；：]))\s*/)) || (m = buf.match(/^([\s\S]*?)\n\n/))) {
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
    body: JSON.stringify({ messages: history.slice(-20), profile, activation, lang }),
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

/** Gettone di sessione per l'avatar LiveAvatar (HeyGen), rilasciato dal Worker, nella lingua scelta. */
async function avatarToken() {
  const res = await fetch(`${API}/avatar/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activation, lang: lang.split('-')[0] }),
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

$('btn-talk').addEventListener('click', () => (talking ? stopTalking() : startTalking()));
$('btn-keyboard').addEventListener('click', () => toggleKeyboard());
$('btn-transcript').addEventListener('click', () => {
  $('transcript-dlg').showModal();
  log.scrollTop = log.scrollHeight;
});
$('btn-close-transcript').addEventListener('click', () => $('transcript-dlg').close());

$('composer').addEventListener('submit', (e) => {
  e.preventDefault();
  send(input.value);
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send(input.value);
  }
});
input.addEventListener('input', autosize);

const langSel = $('lang');
langSel.innerHTML = LANGS.map(([code, name]) => `<option value="${code}">${name}</option>`).join('');
langSel.value = lang;
langSel.addEventListener('change', () => {
  lang = langSel.value;
  writePref(LANG_KEY, lang);
  stopTalking();
  speaker.setLang(lang);
  listener.setLang(lang);
  if (avatar.stop) avatar.stop(); // la sessione LiveAvatar riparte nella nuova lingua
  applyUi();
  showSubtitle(step === 'start' ? t('welcome') : step ? t(step === 'profile' ? 'askProfile' : 'askSerial') : greeting());
});

const voiceBtn = $('btn-voice');
function syncVoiceBtn() {
  voiceBtn.setAttribute('aria-pressed', String(speaker.enabled));
}
voiceBtn.addEventListener('click', () => {
  speaker.setEnabled(!speaker.enabled);
  writePref(VOICE_KEY, speaker.enabled ? 'on' : 'off');
  syncVoiceBtn();
});
syncVoiceBtn();
if (!speaker.supported) voiceBtn.hidden = true;

$('btn-new').addEventListener('click', () => {
  stopTalking();
  messages = [];
  save();
  render();
});

$('btn-profile').addEventListener('click', () => {
  stopTalking();
  say(t('askProfile'));
  showStep('profile');
  startTalking();
});

applyUi();
if (!profile || needsActivation()) startOnboarding();
else render();
