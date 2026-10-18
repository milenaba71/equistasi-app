/*
 * Voce: sintesi (l'avatar parla) e riconoscimento (l'utente parla), con le Web Speech API del browser.
 */

const PREFERRED = ['google italiano', 'federica', 'alice', 'elsa', 'paola', 'isabella', 'emma'];

export class Speaker {
  constructor(lang, avatar, { onIdle } = {}) {
    this.lang = lang;
    this.avatar = avatar;
    this.onIdle = onIdle || (() => {});
    this.enabled = 'speechSynthesis' in window;
    this.supported = this.enabled;
    this.queue = [];
    this.speaking = false;
    this.voice = null;
    if (this.supported) {
      const pick = () => (this.voice = pickVoice(speechSynthesis.getVoices(), lang));
      pick();
      speechSynthesis.addEventListener('voiceschanged', pick);
    }
  }

  setEnabled(on) {
    this.enabled = on && this.supported;
    if (!this.enabled) this.stop();
  }

  /** Accoda una frase da pronunciare. */
  say(text) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return;
    if (!this.enabled) return;
    this.queue.push(clean);
    if (!this.speaking) this.next();
  }

  get busy() {
    return this.speaking || this.queue.length > 0;
  }

  stop() {
    this.queue = [];
    if (this.supported) speechSynthesis.cancel();
    this.speaking = false;
    this.avatar.setState('idle');
  }

  next() {
    const text = this.queue.shift();
    if (!text) {
      this.speaking = false;
      this.avatar.setBabble(false);
      this.onIdle();
      return;
    }
    this.speaking = true;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = this.lang;
    if (this.voice) u.voice = this.voice;
    u.rate = 1.02;
    u.pitch = 1.05;
    let gotBoundary = false;
    let babbleTimer;
    u.onstart = () => {
      this.avatar.setState('speaking');
      // Alcuni browser (es. Android) non inviano i confini di parola: in quel caso bocca "generica".
      babbleTimer = setTimeout(() => !gotBoundary && this.avatar.setBabble(true), 350);
    };
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      gotBoundary = true;
      this.avatar.setBabble(false);
      const word = text.slice(e.charIndex, e.charIndex + (e.charLength || 0)) || text.slice(e.charIndex).split(/\s/)[0];
      this.avatar.speakWord(word);
    };
    const done = () => {
      clearTimeout(babbleTimer);
      this.next();
    };
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  }
}

function pickVoice(voices, lang) {
  const base = lang.slice(0, 2);
  const same = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(base));
  for (const name of PREFERRED) {
    const v = same.find((x) => x.name.toLowerCase().includes(name));
    if (v) return v;
  }
  return same.find((v) => v.lang === lang) || same[0] || null;
}

export class Listener {
  constructor(lang, { onInterim, onFinal, onEnd, onError }) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!SR;
    this.active = false;
    if (!SR) return;
    const r = new SR();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    let finalText = '';
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      onInterim && onInterim((finalText + ' ' + interim).trim());
    };
    r.onerror = (e) => onError && onError(e.error);
    r.onend = () => {
      this.active = false;
      const text = finalText.trim();
      finalText = '';
      if (text) onFinal && onFinal(text);
      onEnd && onEnd();
    };
    this.rec = r;
  }

  start() {
    if (!this.supported || this.active) return;
    try {
      this.rec.start();
      this.active = true;
    } catch {
      /* già in ascolto */
    }
  }

  stop() {
    if (this.supported && this.active) this.rec.stop();
  }
}
