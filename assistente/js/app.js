import { DOCS, CATEGORIES } from '../knowledge/kb.mjs';
import { Avatar } from './avatar.js';
import { PhotoAvatar } from './photo-avatar.js';
import { Speaker, Listener } from './voice.js';
import { Index, offlineAnswer, redFlag } from './search.js';

const CFG = window.ASSISTANT_CONFIG || {};
const STORE_KEY = 'stasi.chat.v1';
const VOICE_KEY = 'stasi.voice';
const DOC_BY_ID = new Map(DOCS.map((d) => [d.id, d]));
const CITE_RE = /\[\[([a-z0-9-]+)\]\]/g;

const GREETING = 'Ciao, sono Stasi, l’assistente di Equistasi. Puoi chiedermi come funziona il dispositivo, come applicarlo per Parkinson, sclerosi multipla, dolore o sport, cosa dicono gli studi scientifici, oppure consigli di riabilitazione. Scrivi o tocca il microfono e parla.';
const SUGGESTIONS = [
  'Cos’è Equistasi e come funziona?',
  'Come lo uso per il Parkinson?',
  'Cosa dicono gli studi scientifici?',
  'Ho dolore al ginocchio: dove lo applico?',
  'Esercizi per migliorare l’equilibrio',
  'Protocollo per lo sport',
];

const $ = (id) => document.getElementById(id);
const log = $('log');
const input = $('input');
const statusEl = $('status');

const avatar = CFG.avatar === 'illustrato' || !CFG.avatarMedia ? new Avatar($('avatar')) : new PhotoAvatar($('avatar'), CFG.avatarMedia);
const index = new Index(DOCS);
let messages = load();
let busy = false;
let lastByVoice = false;
let online = !!CFG.chatUrl;

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
    send(t);
  },
  onEnd: () => {
    $('btn-mic').classList.remove('on');
    if (!busy && !speaker.busy) avatar.setState('idle');
  },
  onError: (err) => {
    if (err === 'not-allowed' || err === 'service-not-allowed') setStatus('Permesso microfono negato: puoi scrivere la domanda.');
    else if (err === 'no-speech') setStatus('Non ho sentito nulla. Riprova.');
  },
});

/* ───────── Interfaccia ───────── */

function render() {
  log.innerHTML = '';
  addBubble('assistant', GREETING, false);
  for (const m of messages) addBubble(m.role, m.content, false);
  renderChips();
  updateMode();
  scrollDown();
}

function renderChips() {
  const chips = $('chips');
  chips.innerHTML = '';
  if (messages.length) return;
  for (const s of SUGGESTIONS) {
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

function addBubble(role, text, pending) {
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
  listener.stop();
  speaker.stop();
  input.value = '';
  autosize();
  $('chips').innerHTML = '';

  messages.push({ role: 'user', content: text });
  addBubble('user', text, false);
  const li = addBubble('assistant', '', true);
  scrollDown();
  busy = true;
  $('btn-send').disabled = true;
  avatar.setState('thinking');
  setStatus('Sto pensando…');

  const say = sentenceSpeaker();
  let answer = '';
  const urgent = redFlag(text);
  if (urgent) {
    answer = urgent;
    fillBubble(li, answer);
    say.push(answer);
    if (online) answer += '\n\n'; // l'AI aggiunge poi il resto della risposta
  }

  try {
    if (!online) throw new Error('offline');
    let streamed = '';
    await streamChat(messages, (chunk) => {
      streamed += chunk;
      fillBubble(li, answer + streamed);
      say.push(chunk);
      scrollDown();
      if (!speaker.busy) setStatus('');
    });
    answer += streamed;
  } catch (err) {
    if (err.message !== 'offline') {
      online = false;
      updateMode();
    }
    if (!urgent) {
      answer = offlineAnswer(index, text);
      fillBubble(li, answer);
      say.push(answer);
    }
  }

  say.flush();
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
  const res = await fetch(CFG.chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history.slice(-20) }),
  });
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

// Saluto vocale al primo tocco (i browser permettono l'audio solo dopo un'interazione).
document.addEventListener(
  'pointerdown',
  (e) => {
    if (messages.length || e.target.closest('button, textarea')) return;
    speaker.say(GREETING);
  },
  { once: true }
);

render();
