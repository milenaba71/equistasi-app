/*
 * Avatar fotorealistico: la fisioterapista Equistasi.
 *
 * Tre brevi video in loop (attesa, ascolto, parlato), generati dallo stesso ritratto e che
 * iniziano e finiscono sulla stessa posa: l'avatar passa dall'uno all'altro con una dissolvenza.
 * Stessa interfaccia di Avatar (avatar.js), così app.js li usa indifferentemente.
 * Se i video non si caricano resta il ritratto, con un leggero movimento di respiro.
 *
 * media: { poster, idle, listening, speaking }; ogni voce è un indirizzo o un elenco di indirizzi
 * provati in ordine (es. prima la copia nel sito, poi quella su Higgsfield).
 */

const CLIP_FOR_STATE = { idle: 'idle', thinking: 'idle', listening: 'listening', speaking: 'speaking' };

export class PhotoAvatar {
  constructor(el, media) {
    this.el = el;
    el.classList.add('photo');
    el.innerHTML = `
      <img class="pa-poster" alt="Stasi, fisioterapista Equistasi">
      <span class="pa-think" aria-hidden="true"><i></i><i></i><i></i></span>`;
    const poster = el.querySelector('.pa-poster');
    const posters = list(media.poster);
    poster.onerror = () => posters.length && (poster.src = posters.shift());
    poster.src = posters.shift();
    this.videos = {};
    for (const name of ['idle', 'listening', 'speaking']) {
      if (!media[name]) continue;
      const v = document.createElement('video');
      v.className = 'pa-clip';
      for (const url of list(media[name])) {
        const src = document.createElement('source');
        src.src = url;
        src.type = 'video/mp4';
        v.appendChild(src);
      }
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.preload = 'auto';
      v.setAttribute('aria-hidden', 'true');
      // L'errore dell'ultima sorgente significa che il clip non è disponibile.
      v.lastElementChild.addEventListener('error', () => delete this.videos[name]);
      el.insertBefore(v, el.querySelector('.pa-think'));
      this.videos[name] = v;
    }
    this.current = null;
    this.state = 'idle';
    this.setState('idle');
  }

  setState(state) {
    this.state = state;
    this.el.dataset.state = state;
    const name = CLIP_FOR_STATE[state] || 'idle';
    const next = this.videos[name] || this.videos.idle;
    if (!next || next === this.current) return;
    const prev = this.current;
    this.current = next;
    if (name !== 'idle') next.currentTime = 0; // i clip partono dalla posa del ritratto
    next.play().then(
      () => {
        next.classList.add('on');
        if (prev) {
          setTimeout(() => {
            if (prev === this.current) return;
            prev.classList.remove('on');
            prev.pause();
          }, 300);
        }
      },
      () => {
        // Riproduzione automatica bloccata (risparmio energetico): resta il ritratto.
        this.current = prev;
      }
    );
  }

  // Il labiale è nel video "speaking": questi metodi servono solo per compatibilità con Avatar.
  speakWord() {}
  setBabble() {}
}

function list(v) {
  return (Array.isArray(v) ? v : [v]).filter(Boolean);
}
