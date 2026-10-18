/*
 * Equistasi Assistente – Cloudflare Worker.
 *
 * Riceve la conversazione dall'app (POST /chat), aggiunge l'intera base di conoscenza
 * come prompt di sistema (con prompt caching) e restituisce la risposta di Claude in
 * streaming (Server-Sent Events). La chiave API resta qui, come secret del Worker:
 * non arriva mai al browser.
 *
 * Altri endpoint: POST /activate (seriale del dispositivo da studio → gettone di attivazione),
 * POST /avatar/token (sessione dell'avatar LiveAvatar di HeyGen).
 *
 * Risposta di /chat: eventi SSE `data: {"t":"..."}` (testo), poi `data: {"done":true}`,
 * oppure `data: {"error":"..."}`.
 */
import Anthropic from '@anthropic-ai/sdk';
import { DOCS, KB_VERSION, kbAsText } from '../../assistente/knowledge/kb.mjs';

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 20; // messaggi della conversazione inviati al modello
const MAX_CHARS = 4000; // lunghezza massima di ogni messaggio dell'utente

const SYSTEM_PROMPT = `Sei "{{NOME}}", l'assistente virtuale di Equistasi: un avatar fisioterapista che affianca professionisti sanitari e preparatori atletici che usano Equistasi in studio. Rispondi nella lingua dell'utente (di solito italiano).

Cosa sai: tutto ciò che è nella base di conoscenza qui sotto (dispositivo Equistasi®, protocolli ufficiali, letteratura scientifica pubblicata, riabilitazione, nozioni mediche, sicurezza) più le tue conoscenze mediche e riabilitative generali, che usi quando la base di conoscenza non basta.

Come rispondi:
- Le tue risposte vengono lette ad alta voce dall'avatar: frasi brevi e naturali, tono caldo e chiaro, niente tabelle, niente markdown pesante. Di norma 2–6 frasi; elenchi brevi solo per istruzioni passo-passo. Se l'utente vuole approfondire, approfondisci.
- Per Equistasi usa solo i dati della base di conoscenza: punti di applicazione, tempi, studi. Non inventare studi, numeri, autori, indicazioni o controindicazioni. Se un'informazione non c'è, dillo e suggerisci di chiedere a Equistasi (info@equistasi.com), al medico o al foglietto illustrativo.
- Sulle evidenze sii onesto: gli studi su Equistasi sono incoraggianti ma per lo più piccoli o pilota. Non dire che "cura" o "guarisce". Presentalo come complemento alla riabilitazione e alle terapie.
- Quando usi un documento della base di conoscenza, cita il suo id alla fine della frase in questo formato esatto: [[id-documento]] (es. [[lit-volpe-2014]]). L'app li trasforma in schede "Fonte" e non li legge ad alta voce. Non citare id inesistenti.
- Non fai diagnosi e non prescrivi farmaci; non dire mai di sospendere o cambiare una terapia. Puoi spiegare, orientare e proporre esercizi generali sicuri, ricordando di adattarli con il fisioterapista.
- Sicurezza prima di tutto: se l'utente descrive sintomi d'allarme (segni di ictus, dolore al petto, difficoltà respiratoria, svenimento, trauma cranico, perdita di controllo di vescica/intestino con debolezza alle gambe, pensieri di farsi del male) inizia la risposta dicendo di chiamare subito il 112/118, senza giri di parole.
- Fai una domanda di chiarimento se serve per dare un'indicazione corretta (es. quale patologia, quale zona del dolore, quale protocollo).
- Applicazioni esplorative (categoria "esplorativo") e agopunti: puoi proporle quando l'utente chiede alternative o quando il protocollo ufficiale non dà beneficio, ma dichiara sempre che NON fanno parte dei protocolli ufficiali e non sono validate da studi su Equistasi, spiega il razionale fisioterapico, indica come misurare se funzionano e invita a deciderle con il fisioterapista. Parti sempre dal protocollo ufficiale. Non dire che Equistasi "sostituisce" l'agopuntura e ricorda che l'agopuntura con aghi la esegue un medico.
- Non chiedere dati personali identificativi.

Base di conoscenza (versione ${KB_VERSION}):

${kbAsText(DOCS)}`;

const DOC_IDS = new Set(DOCS.map((d) => d.id));

// Profilo scelto all'apertura dell'app: si aggiunge DOPO la base di conoscenza, così la cache resta valida.
const PROFILES = {
  sanitario: `Stai parlando con un PROFESSIONISTA SANITARIO (fisioterapista, medico, terapista, infermiere…). Usa linguaggio tecnico e anatomico preciso, cita gli studi con dettagli di disegno e limiti, proponi ragionamento clinico (valutazione, scelta dei punti, misure di esito, progressione), e quando utile le applicazioni esplorative con il loro razionale. Ricorda comunque i limiti delle evidenze.`,
  atletico: `Stai parlando con un PREPARATORE ATLETICO o allenatore. Concentrati su prestazione, controllo neuromuscolare, propriocezione, prevenzione degli infortuni, recupero e protocollo Sport/Elvy, con linguaggio tecnico sportivo. Per dolore, infortuni o patologie invita a coinvolgere medico o fisioterapista.`,
};

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return json({ ok: true, kb: KB_VERSION, docs: DOC_IDS.size, model: env.MODEL || MODEL, liveAvatar: !!env.LIVEAVATAR_API_KEY }, 200, cors);
    }
    if (request.method !== 'POST' || !['/chat', '/activate', '/avatar/token'].includes(url.pathname)) {
      return json({ error: 'not found' }, 404, cors);
    }
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origin not allowed' }, 403, cors);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'JSON non valido' }, 400, cors);
    }

    if (url.pathname === '/activate') return activate(body, env, cors);

    // Chat e avatar solo con un dispositivo da studio attivato (se l'attivazione è configurata).
    if (env.ACTIVATION_SECRET && !(await verifyActivation(body && body.activation, env))) {
      return json({ error: 'attivazione richiesta', code: 'activation' }, 401, cors);
    }
    if (url.pathname === '/avatar/token') return avatarToken(body, env, cors);
    return chat(body, env, ctx, cors);
  },
};

function chat(body, env, ctx, cors) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY mancante' }, 500, cors);
  const messages = sanitize(body && body.messages);
  if (!messages) return json({ error: 'conversazione non valida' }, 400, cors);
  const system = [{ type: 'text', text: SYSTEM_PROMPT.replace('{{NOME}}', env.ASSISTANT_NAME || 'Primo'), cache_control: { type: 'ephemeral', ttl: '1h' } }];
  const extra = [];
  if (PROFILES[body.profile]) extra.push(PROFILES[body.profile]);
  const lang = typeof body.lang === 'string' && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(body.lang) ? body.lang : null;
  if (lang && !lang.startsWith('it')) {
    extra.push(`Lingua della conversazione: ${lang} (codice BCP-47). Rispondi SEMPRE in questa lingua, anche se la base di conoscenza è in italiano: traduci contenuti e termini (lascia invariati nomi propri, titoli delle pubblicazioni e i marcatori [[id]]). Se l'utente scrive in un'altra lingua, rispondi nella sua.`);
  }
  if (extra.length) system.push({ type: 'text', text: extra.join('\n\n') });

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined });
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const send = (obj) => writer.write(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

  const run = async () => {
    try {
      const stream = client.beta.messages.stream({
        model: env.MODEL || MODEL,
        max_tokens: 4000,
        // Chat vocale: risposte rapide. Il pensiero adattivo resta attivo (non disattivabile su questo modello).
        output_config: { effort: env.EFFORT || 'low' },
        // Se il modello declina per un falso positivo dei filtri di sicurezza, l'API riprova con il modello consigliato.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        // La base di conoscenza è identica per tutte le richieste: viene messa in cache.
        system,
        messages,
      });
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          await send({ t: event.delta.text });
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal') {
        await send({ t: 'Su questo argomento non posso aiutarti. Per domande su salute e terapie rivolgiti al medico.' });
      }
      await send({ done: true });
    } catch (err) {
      const status = err && err.status;
      await send({ error: status === 429 || status === 529 ? 'Servizio occupato, riprova tra poco.' : 'Errore del servizio.' });
      console.error('anthropic error', status, err && err.message);
    } finally {
      await writer.close();
    }
  };
  // Lo streaming continua dopo che la Response è stata restituita.
  ctx.waitUntil(run());

  return new Response(readable, {
    headers: { ...cors, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/* ───────── Attivazione con il seriale di un dispositivo da studio professionale ─────────
 * Cerca il seriale nella tabella "dispositivi disponibili" della base Airtable EQUITUTTO e
 * controlla che la sua tipologia sia tra quelle professionali (PRO_TYPES, default "noleggio prof").
 * Se valido restituisce un gettone firmato (HMAC) che l'app allega a ogni richiesta. */

const ACTIVATION_DAYS = 365;

async function activate(body, env, cors) {
  const serial = String((body && body.serial) || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (serial.length < 5 || serial.length > 32) return json({ valid: false, reason: 'formato' }, 200, cors);
  if (!env.AIRTABLE_TOKEN || !env.ACTIVATION_SECRET) return json({ error: 'attivazione non configurata' }, 500, cors);

  const types = (env.PRO_TYPES || 'noleggio prof').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const typeCheck = types.map((t) => `FIND('${t.replace(/'/g, '')}', LOWER(ARRAYJOIN({tipologia}, ',')))`).join(',');
  // Il seriale è già ripulito (solo A-Z, 0-9, -): niente rischio di iniezione nella formula.
  const formula = `AND(SUBSTITUTE(UPPER({Seriale}&''),' ','')='${serial}', OR(${typeCheck}))`;
  const base = env.AIRTABLE_BASE || 'appI8mMIC0khEkLqK';
  const table = env.AIRTABLE_TABLE || 'tblmeCftgU0TrG0ck';
  const q = new URL(`https://api.airtable.com/v0/${base}/${table}`);
  q.searchParams.set('filterByFormula', formula);
  q.searchParams.set('maxRecords', '1');
  q.searchParams.append('fields[]', 'Seriale');

  const res = await fetch(q, { headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` } });
  if (!res.ok) {
    console.error('airtable', res.status, await res.text());
    return json({ error: 'verifica non disponibile' }, 502, cors);
  }
  const data = await res.json();
  if (!data.records || !data.records.length) return json({ valid: false }, 200, cors);
  const exp = Date.now() + ACTIVATION_DAYS * 864e5;
  return json({ valid: true, activation: await sign({ s: serial, exp }, env.ACTIVATION_SECRET), expires: exp }, 200, cors);
}

async function sign(payload, secret) {
  const data = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${data}.${b64url(await hmac(data, secret))}`;
}

async function verifyActivation(token, env) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [data, mac] = token.split('.');
  const expected = b64url(await hmac(data, env.ACTIVATION_SECRET));
  if (expected.length !== mac.length) return false;
  let diff = 0;
  for (let i = 0; i < mac.length; i++) diff |= mac.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(data)));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
}

function b64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s) {
  return Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
}

/* ───────── Avatar LiveAvatar (HeyGen) ─────────
 * Crea un gettone di sessione FULL per l'avatar configurato; l'app lo usa con @heygen/liveavatar-web-sdk
 * e fa pronunciare all'avatar le risposte di Claude (repeat). La chiave LiveAvatar resta qui. */

async function avatarToken(body, env, cors) {
  if (!env.LIVEAVATAR_API_KEY || !env.LIVEAVATAR_AVATAR_ID) return json({ error: 'LiveAvatar non configurato' }, 404, cors);
  // Lingua scelta nell'app (codice a 2-3 lettere, es. it, en, zh); altrimenti quella predefinita.
  const lang = body && typeof body.lang === 'string' && /^[a-z]{2,3}$/.test(body.lang) ? body.lang : null;
  const persona = { language: lang || env.LIVEAVATAR_LANGUAGE || 'it' };
  if (env.LIVEAVATAR_VOICE_ID) persona.voice_id = env.LIVEAVATAR_VOICE_ID;
  if (env.LIVEAVATAR_CONTEXT_ID) persona.context_id = env.LIVEAVATAR_CONTEXT_ID;
  const payload = { mode: 'FULL', avatar_id: env.LIVEAVATAR_AVATAR_ID, avatar_persona: persona };
  if (env.LIVEAVATAR_SANDBOX === 'true') payload.is_sandbox = true;

  const res = await fetch(`${env.LIVEAVATAR_API_URL || 'https://api.liveavatar.com'}/v1/sessions/token`, {
    method: 'POST',
    headers: { 'X-API-KEY': env.LIVEAVATAR_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('liveavatar', res.status, text);
    return json({ error: 'avatar non disponibile' }, 502, cors);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }
  const d = data.data || data;
  const token = d.session_token || d.token;
  if (!token) {
    console.error('liveavatar risposta inattesa', text);
    return json({ error: 'avatar non disponibile' }, 502, cors);
  }
  return json({ sessionToken: token }, 200, cors);
}

/** Tiene solo messaggi user/assistant di testo, alternati, che iniziano e finiscono con l'utente. */
function sanitize(input) {
  if (!Array.isArray(input) || input.length === 0) return null;
  const out = [];
  for (const m of input.slice(-MAX_TURNS)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return null;
    const text = m.content.trim().slice(0, m.role === 'user' ? MAX_CHARS : MAX_CHARS * 3);
    if (!text) continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += '\n\n' + text;
    else out.push({ role: m.role, content: text });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  if (!out.length || out[out.length - 1].role !== 'user') return null;
  return out;
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes('*') || allowed.includes(origin);
  const h = { 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' };
  if (ok) h['Access-Control-Allow-Origin'] = origin || '*';
  return h;
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}
