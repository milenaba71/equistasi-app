/*
 * Ricerca locale nella base di conoscenza (BM25) e risposte in modalità offline.
 */

const STOP = new Set(('a ad al alla alle allo ai agli all anche avere c che chi ci come con cosa cui da dal dalla dalle dai degli dei del della delle dello di e ed è gli ha hai ho i il in io la le lei lo loro lui ma mi mia mio ne nel nella nelle nei negli no non o per perché più può quale quali quando quanto se sei si sia sono su sua sue suo sul sulla tra tu tua tuo un una uno vi voi the and of to is what how ' +
  'posso puoi devo fare fa essere sto mio mia miei dove ciao grazie vorrei sapere dimmi parlami spiegami').split(' '));

export function tokenize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem);
}

// Stemming leggero per l'italiano: unifica singolare/plurale e alcune desinenze.
function stem(w) {
  if (w.length <= 4 || /^[a-z]?\d/.test(w)) return w;
  return w.replace(/(azioni|azione|mente|ismo|ista|iste|isti|ità|ita|zioni|zione|ando|endo|are|ere|ire|ato|ata|ati|ate|ito|ita|iti|ite|ico|ica|ici|iche|ale|ali|oso|osa|osi|ose|e|i|o|a)$/, '') || w;
}

export class Index {
  constructor(docs) {
    this.docs = docs;
    this.df = new Map();
    this.items = docs.map((d) => {
      const terms = [
        ...repeat(tokenize(d.title), 5),
        ...repeat(tokenize(d.tags.join(' ')), 3),
        ...tokenize(d.text),
      ];
      const tf = new Map();
      for (const t of terms) tf.set(t, (tf.get(t) || 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) || 0) + 1);
      return { doc: d, tf, len: terms.length, title: new Set(tokenize(d.title)) };
    });
    this.avg = this.items.reduce((s, i) => s + i.len, 0) / Math.max(1, this.items.length);
  }

  search(query, k = 3) {
    const q = [...new Set(tokenize(query))];
    if (!q.length) return [];
    const N = this.items.length;
    const k1 = 1.4;
    const b = 0.7;
    return this.items
      .map((it) => {
        let score = 0;
        for (const t of q) {
          const f = it.tf.get(t);
          if (!f) continue;
          const df = this.df.get(t);
          const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
          score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * it.len) / this.avg)));
          if (it.title.has(t)) score += idf; // le parole del titolo contano di più
        }
        return { doc: it.doc, score: score * intentBoost(query, it.doc) };
      })
      .filter((r) => r.score > 0)
      .sort((a, b2) => b2.score - a.score)
      .slice(0, k);
  }
}

// Il tipo di domanda orienta verso una categoria (es. "come lo uso" → protocolli).
const INTENTS = [
  [/\b(uso|usa|usare|usarlo|applic\w*|metter\w*|mett\w*|dove|protocoll\w*|punti|tenerlo|quante ore)\b/i, 'protocollo'],
  [/\b(studi\w*|evidenz\w*|letteratura|pubblicaz\w*|ricerc\w*|scientific\w*|trial)\b/i, 'studio'],
  [/\b(eserciz\w*|riabilit\w*|fisioterap\w*|allenament\w*)\b/i, 'riabilitazione'],
  [/\b(cos.?[eè]|che cos|come funziona|cos.? fa|a cosa serve|meccanismo)\b/i, 'dispositivo'],
  [/\b(urgen\w*|emergen\w*|pericolo\w*|effetti collaterali|controindicaz\w*)\b/i, 'sicurezza'],
];
function intentBoost(query, doc) {
  return INTENTS.some(([re, cat]) => doc.cat === cat && re.test(query)) ? 1.6 : 1;
}

function repeat(arr, n) {
  return Array.from({ length: n }, () => arr).flat();
}

/* ───────── Segnali d'allarme ───────── */

const RED_FLAGS = [
  /dolore (al|nel) petto|oppressione (al|nel) petto|dolore toracico/,
  /non riesco a respirare|fatico a respirare|mi manca il (respiro|fiato)|soffoc/,
  /bocca storta|non riesco a parlare|parlo male all.improvviso|paralisi|braccio (che )?cade/,
  /perdita (improvvisa )?(di forza|della vista)|non vedo (piu|più)|vedo doppio all.improvviso/,
  /svenut|svenimento|perso i sensi|convulsion|crisi epilettica/,
  /battuto la testa|trauma cranico/,
  /mal di testa (improvviso|fortissimo|violentissimo)|il peggior mal di testa/,
  /(non|perdo il) controllo (della|di) (vescica|urina|feci)|anestesia a sella/,
  /suicid|farmi del male|togliermi la vita|non voglio piu vivere|non voglio più vivere/,
];

export function redFlag(text) {
  const t = text.toLowerCase();
  if (/suicid|farmi del male|togliermi la vita|non voglio pi[uù] vivere/.test(t)) {
    return 'Mi dispiace molto che tu stia così. Non sei solo: se pensi di farti del male chiama subito il 112, oppure il Telefono Amico 02 2327 2327. Parlarne con qualcuno adesso è la cosa più importante.';
  }
  if (RED_FLAGS.some((r) => r.test(t))) {
    return 'Quello che descrivi può essere un’emergenza: chiama subito il 112 (o il 118). Non aspettare e non guidare da solo. [[sic-urgenze]]';
  }
  return null;
}

/* ───────── Risposta offline ───────── */

export function offlineAnswer(index, query) {
  const hits = index.search(query, 2);
  if (!hits.length || hits[0].score < 1.2) {
    return 'Non ho trovato una risposta precisa nella mia base di conoscenza. Puoi riformulare la domanda? Per esempio: come si applica Equistasi, protocollo Parkinson, studi scientifici, esercizi per l’equilibrio. [[sic-limiti-assistente]]';
  }
  const q = new Set(tokenize(query));
  const out = [];
  for (const { doc } of hits.slice(0, hits[1] && hits[1].score > hits[0].score * 0.85 ? 2 : 1)) {
    const sentences = doc.text
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.replace(/^[-•]\s+/, '').trim())
      .filter((s) => s.length > 20);
    const scored = sentences
      .map((s, i) => ({ s, i, score: tokenize(s).filter((t) => q.has(t)).length + (i === 0 ? 0.5 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, doc.cat === 'protocollo' ? 6 : 3)
      .sort((a, b) => a.i - b.i);
    out.push(scored.map((x) => x.s).join(' ') + ` [[${doc.id}]]`);
  }
  return out.join('\n\n');
}
