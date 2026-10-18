/*
 * Avatar in tempo reale con LiveAvatar (HeyGen, ex "Interactive Avatar").
 *
 * L'avatar pronuncia con la sua voce e un labiale reale le risposte di Claude (comando "repeat"):
 * il "cervello" resta il nostro Worker con la base di conoscenza Equistasi.
 * Finché la sessione non è pronta, o se non è disponibile, si vede l'avatar di riserva
 * (la fisioterapista in video, photo-avatar.js) e parla la voce del browser.
 *
 * Una sessione consuma crediti LiveAvatar al minuto: si chiude da sola dopo IDLE_MS senza
 * conversazione o quando l'app va in secondo piano, e si riapre alla domanda successiva.
 */

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@heygen/liveavatar-web-sdk@0.0.19/+esm';
const IDLE_MS = 3 * 60 * 1000;

export class LiveAvatarStage {
  /**
   * @param {HTMLElement} el contenitore dell'avatar
   * @param {object} fallback avatar di riserva (PhotoAvatar o Avatar)
   * @param {() => Promise<string>} getToken chiede al Worker un gettone di sessione
   */
  constructor(el, fallback, getToken) {
    this.el = el;
    this.fallback = fallback;
    this.getToken = getToken;
    this.session = null;
    this.ready = false;
    this.starting = null;
    this.pending = new Map(); // fine del parlato atteso, per frase
    this.idleTimer = null;
    this.video = document.createElement('video');
    this.video.className = 'la-video';
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.setAttribute('playsinline', '');
    el.appendChild(this.video);
    document.addEventListener('visibilitychange', () => document.hidden && this.stop());
    window.addEventListener('pagehide', () => this.stop());
  }

  /** Avvia la sessione (da chiamare dopo un tocco dell'utente, per poter riprodurre l'audio). */
  start() {
    if (this.ready) return Promise.resolve(true);
    if (this.starting) return this.starting;
    this.starting = this._start()
      .then(() => true)
      .catch((err) => {
        console.warn('LiveAvatar non disponibile:', err && err.message);
        this.stop();
        return false;
      })
      .finally(() => (this.starting = null));
    return this.starting;
  }

  async _start() {
    const [{ LiveAvatarSession, SessionEvent, AgentEventsEnum }, token] = await Promise.all([import(SDK_URL), this.getToken()]);
    // Microfono dell'avatar spento: ascolto e risposte li gestisce l'app (riconoscimento vocale + Claude).
    const session = new LiveAvatarSession(token, { voiceChat: { defaultMuted: true }, autoKeepAlive: true });
    this.session = session;
    session.on(SessionEvent.SESSION_STREAM_READY, () => {
      session.attach(this.video);
      this.video.play().catch(() => {});
      this.ready = true;
      this.el.classList.add('live');
    });
    session.on(SessionEvent.SESSION_DISCONNECTED, () => this._reset());
    session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => this.fallback.setState('speaking'));
    session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, (e) => this._spoken(e && e.source_event_id));
    await session.start();
    // Aspetta il video (max 15 s) prima di dichiararsi pronto.
    const t0 = Date.now();
    while (!this.ready) {
      if (Date.now() - t0 > 15000) throw new Error('timeout video');
      await new Promise((r) => setTimeout(r, 150));
    }
    this._touch();
  }

  /** Fa pronunciare una frase all'avatar; si risolve quando ha finito di parlarla. */
  speak(text) {
    if (!this.ready) return Promise.reject(new Error('non pronto'));
    this._touch();
    return new Promise((resolve) => {
      const id = this.session.repeat(text);
      // Riserva se l'evento di fine non arriva: circa 75 ms a carattere + 2 s.
      const timer = setTimeout(() => this._spoken(id), 2000 + text.length * 75);
      this.pending.set(id, () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  _spoken(id) {
    const done = (id && this.pending.get(id)) || this.pending.values().next().value;
    if (!done) return;
    for (const [k, v] of this.pending) if (v === done) this.pending.delete(k);
    done();
  }

  interrupt() {
    if (this.ready) this.session.interrupt();
    for (const done of this.pending.values()) done();
    this.pending.clear();
  }

  _touch() {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.stop(), IDLE_MS);
  }

  stop() {
    clearTimeout(this.idleTimer);
    const s = this.session;
    this._reset();
    if (s) s.stop().catch(() => {});
  }

  _reset() {
    this.session = null;
    this.ready = false;
    this.el.classList.remove('live');
    for (const done of this.pending.values()) done();
    this.pending.clear();
  }

  // Stessa interfaccia degli altri avatar: gli stati si mostrano sull'avatar di riserva
  // (visibile quando la sessione non è attiva) e come cornice colorata.
  setState(state) {
    this.fallback.setState(state);
  }
  speakWord(w, d) {
    this.fallback.speakWord(w, d);
  }
  setBabble(on) {
    this.fallback.setBabble(on);
  }
}
