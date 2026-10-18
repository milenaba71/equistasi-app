/*
 * Avatar "Stasi": SVG animato senza librerie.
 *  - respiro, battito delle ciglia, sguardo che segue il puntatore e piccoli movimenti spontanei;
 *  - stati: idle | listening | thinking | speaking;
 *  - labiale: forme della bocca (visemi) calcolate dalle lettere della parola pronunciata.
 */

const SVG = `
<svg viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stasi, assistente Equistasi">
  <defs>
    <linearGradient id="av-skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6d3bd"/><stop offset="1" stop-color="#eebc9f"/>
    </linearGradient>
    <linearGradient id="av-coat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3e6f0"/>
    </linearGradient>
    <linearGradient id="av-hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4a2f27"/><stop offset="1" stop-color="#2c1a15"/>
    </linearGradient>
  </defs>

  <g id="av-body">
    <path d="M40 340 C44 278 92 252 150 252 C208 252 256 278 260 340 Z" fill="url(#av-coat)"/>
    <path d="M118 256 L150 312 L182 256 C172 252 128 252 118 256 Z" fill="#29235C"/>
    <path d="M128 254 L150 296 L172 254" fill="none" stroke="#4BA6A3" stroke-width="4" stroke-linejoin="round"/>
    <path d="M118 256 L104 340 M182 256 L196 340" stroke="#cdd2e1" stroke-width="2.5"/>
    <rect x="198" y="286" width="34" height="20" rx="4" fill="#29235C"/>
    <text x="215" y="300" font-family="Open Sans, sans-serif" font-size="9" font-weight="800" fill="#fff" text-anchor="middle">EQ</text>
  </g>

  <g id="av-head">
    <rect x="134" y="210" width="32" height="46" rx="12" fill="#e7b293"/>
    <path id="av-hair-back" d="M78 150 C70 74 116 48 152 48 C196 48 232 78 224 152 C222 196 214 226 206 238 L94 238 C84 222 78 196 78 150 Z" fill="url(#av-hair)"/>
    <ellipse cx="86" cy="164" rx="11" ry="17" fill="#eebc9f"/>
    <ellipse cx="214" cy="164" rx="11" ry="17" fill="#eebc9f"/>
    <path d="M90 140 C90 92 116 72 150 72 C184 72 210 92 210 140 C210 200 186 236 150 236 C114 236 90 200 90 140 Z" fill="url(#av-skin)"/>
    <path id="av-fringe" d="M86 140 C84 88 118 60 156 62 C196 64 218 96 214 138 C200 116 186 98 168 92 C150 112 116 122 88 140 Z" fill="url(#av-hair)"/>

    <g id="av-brows" fill="none" stroke="#3a241d" stroke-width="5" stroke-linecap="round">
      <path id="av-brow-l" d="M106 134 Q120 126 134 132"/>
      <path id="av-brow-r" d="M166 132 Q180 126 194 134"/>
    </g>

    <g id="av-eye-l">
      <ellipse cx="120" cy="156" rx="13" ry="10" fill="#fff"/>
      <g class="av-pupil"><circle cx="120" cy="156" r="7" fill="#3b6f8f"/><circle cx="120" cy="156" r="3.4" fill="#132430"/><circle cx="122.5" cy="153.5" r="1.8" fill="#fff"/></g>
      <path d="M106 155 Q120 142 134 155" fill="none" stroke="#3a241d" stroke-width="2.6" stroke-linecap="round"/>
    </g>
    <g id="av-eye-r">
      <ellipse cx="180" cy="156" rx="13" ry="10" fill="#fff"/>
      <g class="av-pupil"><circle cx="180" cy="156" r="7" fill="#3b6f8f"/><circle cx="180" cy="156" r="3.4" fill="#132430"/><circle cx="182.5" cy="153.5" r="1.8" fill="#fff"/></g>
      <path d="M166 155 Q180 142 194 155" fill="none" stroke="#3a241d" stroke-width="2.6" stroke-linecap="round"/>
    </g>

    <path d="M150 162 Q146 182 141 190 Q150 195 159 190" fill="none" stroke="#d39a7c" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="110" cy="190" rx="12" ry="7" fill="#f2a59a" opacity=".45"/>
    <ellipse cx="190" cy="190" rx="12" ry="7" fill="#f2a59a" opacity=".45"/>
    <path id="av-mouth" d="" fill="#7a2638" stroke="#c4566e" stroke-width="2.4" stroke-linejoin="round"/>
  </g>

  <g id="av-think" opacity="0">
    <circle cx="236" cy="96" r="5" fill="#4BA6A3"/><circle cx="252" cy="80" r="7" fill="#4BA6A3"/><circle cx="272" cy="60" r="9" fill="#4BA6A3"/>
  </g>
</svg>`;

// Visemi: w = semilarghezza, h = apertura, s = sorriso
const VISEMES = {
  rest: { w: 17, h: 0, s: 5 },
  A: { w: 15, h: 15, s: 2 },
  E: { w: 19, h: 8, s: 4 },
  I: { w: 18, h: 5, s: 5 },
  O: { w: 10, h: 13, s: 1 },
  U: { w: 8, h: 7, s: 0 },
  M: { w: 15, h: 0, s: 2 },
  F: { w: 16, h: 3, s: 2 },
  C: { w: 15, h: 6, s: 3 },
};

function visemeFor(ch) {
  if ('aàá'.includes(ch)) return 'A';
  if ('eèé'.includes(ch)) return 'E';
  if ('iìíy'.includes(ch)) return 'I';
  if ('oòó'.includes(ch)) return 'O';
  if ('uùú'.includes(ch)) return 'U';
  if ('mbp'.includes(ch)) return 'M';
  if ('fv'.includes(ch)) return 'F';
  if (/[a-z]/.test(ch)) return 'C';
  return null;
}

export class Avatar {
  constructor(el) {
    this.el = el;
    el.innerHTML = SVG;
    const q = (s) => el.querySelector(s);
    this.head = q('#av-head');
    this.body = q('#av-body');
    this.mouth = q('#av-mouth');
    this.eyes = [q('#av-eye-l'), q('#av-eye-r')];
    this.pupils = [...el.querySelectorAll('.av-pupil')];
    this.brows = q('#av-brows');
    this.think = q('#av-think');

    this.state = 'idle';
    this.mouthNow = { ...VISEMES.rest };
    this.mouthTarget = VISEMES.rest;
    this.visemeQueue = []; // [{v, until}]
    this.gaze = { x: 0, y: 0 };
    this.gazeTarget = { x: 0, y: 0 };
    this.pointerAt = 0;
    this.nextBlink = performance.now() + 1500;
    this.blinkUntil = 0;
    this.nextGlance = performance.now() + 3000;
    this.babble = false;
    this.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width * 1.5);
      const dy = (e.clientY - (r.top + r.height * 0.45)) / (r.height * 1.5);
      this.gazeTarget = { x: clamp(dx, -1, 1), y: clamp(dy, -1, 1) };
      this.pointerAt = performance.now();
    });

    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  setState(state) {
    this.state = state;
    this.el.dataset.state = state;
    this.think.setAttribute('opacity', state === 'thinking' ? '1' : '0');
    if (state !== 'speaking') {
      this.visemeQueue = [];
      this.babble = false;
    }
  }

  /** Muove la bocca per pronunciare la parola (chiamato a ogni confine di parola della sintesi vocale). */
  speakWord(word, durationMs) {
    const letters = [...word.toLowerCase()].map(visemeFor).filter(Boolean);
    if (!letters.length) return;
    const per = clamp((durationMs || letters.length * 75) / letters.length, 45, 120);
    let t = performance.now();
    this.visemeQueue = letters.map((v) => ({ v, until: (t += per) }));
  }

  /** Movimento della bocca generico quando il browser non fornisce i confini di parola. */
  setBabble(on) {
    this.babble = on;
  }

  frame(now) {
    const t = now / 1000;
    const st = this.state;

    // Respiro
    const breath = this.reduced ? 0 : Math.sin(t * 1.6) * 1.2;
    this.body.setAttribute('transform', `translate(0 ${breath.toFixed(2)})`);

    // Testa: inclinazione per stato + piccolo dondolio
    let tilt = 0;
    let nod = 0;
    if (!this.reduced) {
      tilt = Math.sin(t * 0.7) * 1.2;
      if (st === 'listening') tilt += 5;
      if (st === 'thinking') tilt -= 3;
      if (st === 'speaking') nod = Math.sin(t * 5.2) * 1.2;
    }
    this.head.setAttribute('transform', `translate(0 ${(breath * 0.6 + nod).toFixed(2)}) rotate(${tilt.toFixed(2)} 150 230)`);

    // Sguardo
    if (st === 'thinking') this.gazeTarget = { x: 0.55, y: -0.7 };
    else if (now - this.pointerAt > 2500 && now > this.nextGlance) {
      this.gazeTarget = st === 'listening' || st === 'speaking'
        ? { x: (Math.random() - 0.5) * 0.3, y: (Math.random() - 0.5) * 0.2 }
        : { x: (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.5) * 0.6 };
      this.nextGlance = now + 1500 + Math.random() * 3000;
    }
    this.gaze.x += (this.gazeTarget.x - this.gaze.x) * 0.12;
    this.gaze.y += (this.gazeTarget.y - this.gaze.y) * 0.12;
    const px = (this.gaze.x * 5).toFixed(2);
    const py = (this.gaze.y * 3.5).toFixed(2);
    this.pupils.forEach((p) => p.setAttribute('transform', `translate(${px} ${py})`));

    // Battito delle ciglia
    if (now > this.nextBlink) {
      this.blinkUntil = now + 130;
      this.nextBlink = now + 2200 + Math.random() * 4000;
    }
    const lid = now < this.blinkUntil ? 0.08 : 1;
    this.eyes.forEach((e, i) => {
      const cx = i ? 180 : 120;
      e.setAttribute('transform', `translate(${cx} 156) scale(1 ${lid}) translate(${-cx} -156)`);
    });

    // Sopracciglia
    const browY = st === 'listening' ? -4 : st === 'thinking' ? -2 : 0;
    this.brows.setAttribute('transform', `translate(0 ${browY})`);

    // Bocca
    let target = VISEMES.rest;
    if (st === 'speaking') {
      while (this.visemeQueue.length && this.visemeQueue[0].until < now) this.visemeQueue.shift();
      if (this.visemeQueue.length) target = VISEMES[this.visemeQueue[0].v];
      else if (this.babble) {
        const k = Math.floor(t * 11) % 5;
        target = VISEMES[['A', 'E', 'M', 'O', 'I'][k]];
      }
    } else if (st === 'listening') target = { w: 16, h: 1, s: 6 };
    else if (st === 'thinking') target = { w: 12, h: 0, s: 1 };
    const m = this.mouthNow;
    const k = 0.35;
    m.w += (target.w - m.w) * k;
    m.h += (target.h - m.h) * k;
    m.s += (target.s - m.s) * k;
    this.mouth.setAttribute('d', mouthPath(m));

    requestAnimationFrame(this.frame);
  }
}

function mouthPath({ w, h, s }) {
  const y = 210;
  const L = `${(150 - w).toFixed(1)} ${(y - s * 0.4).toFixed(1)}`;
  const R = `${(150 + w).toFixed(1)} ${(y - s * 0.4).toFixed(1)}`;
  const up = (y - h * 0.3 + s * 0.5).toFixed(1);
  const low = (y + h + s).toFixed(1);
  return `M${L} Q150 ${up} ${R} Q150 ${low} ${L} Z`;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
