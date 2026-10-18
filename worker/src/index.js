/*
 * Equistasi Assistente – Cloudflare Worker.
 *
 * Riceve la conversazione dall'app (POST /chat), aggiunge l'intera base di conoscenza
 * come prompt di sistema (con prompt caching) e restituisce la risposta di Claude in
 * streaming (Server-Sent Events). La chiave API resta qui, come secret del Worker:
 * non arriva mai al browser.
 *
 * Risposta: eventi SSE `data: {"t":"..."}` (testo), poi `data: {"done":true}`,
 * oppure `data: {"error":"..."}`.
 */
import Anthropic from '@anthropic-ai/sdk';
import { DOCS, KB_VERSION, kbAsText } from '../../assistente/knowledge/kb.mjs';

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 20; // messaggi della conversazione inviati al modello
const MAX_CHARS = 4000; // lunghezza massima di ogni messaggio dell'utente

const SYSTEM_PROMPT = `Sei "Stasi", l'assistente virtuale di Equistasi: un avatar che parla con pazienti, sportivi, caregiver e professionisti sanitari. Rispondi nella lingua dell'utente (di solito italiano).

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

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return json({ ok: true, kb: KB_VERSION, docs: DOC_IDS.size, model: env.MODEL || MODEL }, 200, cors);
    }
    if (url.pathname !== '/chat' || request.method !== 'POST') return json({ error: 'not found' }, 404, cors);
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origin not allowed' }, 403, cors);
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY mancante' }, 500, cors);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'JSON non valido' }, 400, cors);
    }
    const messages = sanitize(body && body.messages);
    if (!messages) return json({ error: 'conversazione non valida' }, 400, cors);

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
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral', ttl: '1h' } }],
          messages,
        });
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            await send({ t: event.delta.text });
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          await send({ t: 'Su questo argomento non posso aiutarti. Per domande su salute e terapie rivolgiti al tuo medico.' });
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
  },
};

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
