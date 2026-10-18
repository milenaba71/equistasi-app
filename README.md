# equistasi-app

- `index.html` – scheda clinica con modello anatomico 3D.
- `assistente/` – **Stasi, l’assistente virtuale con avatar** (vedi sotto).

## Stasi – assistente virtuale Equistasi

Un avatar animato che parla con l’utente, a voce o per iscritto, e risponde su:
dispositivo Equistasi®, protocolli ufficiali (Parkinson, sclerosi multipla, dolore, dermatomeri, sport),
letteratura scientifica pubblicata, riabilitazione e nozioni mediche, segnali d’allarme.

### Come funziona

| Parte | File | Ruolo |
|---|---|---|
| Avatar | `assistente/js/avatar.js` | SVG animato: respiro, sguardo, ciglia, stati (ascolto, pensiero, parola), labiale dai confini di parola della sintesi vocale |
| Voce | `assistente/js/voice.js` | Web Speech API: riconoscimento vocale (it-IT) e sintesi vocale, frase per frase mentre arriva la risposta |
| Base di conoscenza | `assistente/knowledge/kb.mjs` | 44 schede: dispositivo, protocolli, 16 studi Equistasi con citazione e DOI, riabilitazione, medicina, valutazione, sicurezza |
| Cervello AI | `worker/` | Cloudflare Worker che chiama Claude (Anthropic) con l’intera base di conoscenza nel prompt (prompt caching): la chiave API resta sul server |
| Modalità offline | `assistente/js/search.js` | Se il Worker non è configurato o non risponde: ricerca BM25 nella base di conoscenza locale |
| Sicurezza | `search.js` + prompt | Riconosce sintomi d’allarme (ictus, dolore al petto, svenimento…) e indica subito il 112/118 |

Ogni risposta mostra le **fonti** (schede cliccabili con citazione completa e link alla pubblicazione).
La conversazione resta solo sul telefono dell’utente (localStorage); il Worker non salva nulla.

### Avvio locale

```
python3 -m http.server 8000
```
e apri http://localhost:8000/assistente/ (modalità offline finché non configuri il Worker).
Il microfono funziona in Chrome, Edge e Safari (serve HTTPS o localhost).

### Attivare l’intelligenza artificiale (Worker)

1. Crea una chiave su https://platform.claude.com e un account Cloudflare (piano gratuito sufficiente).
2. ```
   cd worker
   npm install
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler deploy
   ```
3. In `worker/wrangler.toml` metti in `ALLOWED_ORIGINS` gli indirizzi da cui si apre l’app.
4. Copia l’indirizzo del Worker in `assistente/js/config.js` → `chatUrl: 'https://…workers.dev/chat'`.

Modello: `claude-opus-5-5` con effort `low` (risposte rapide per la conversazione vocale); si cambiano con le
variabili `MODEL` ed `EFFORT` in `wrangler.toml`. È attivo il fallback lato server (`fallbacks: "default"`):
se il modello declina per un falso positivo dei filtri di sicurezza, l’API riprova automaticamente con il modello consigliato.
La base di conoscenza (circa 15.000 token) è in cache per un’ora: le domande successive costano molto meno.

### Ampliare la base di conoscenza

- **Schede scritte a mano**: aggiungi oggetti in `CORE_DOCS` di `assistente/knowledge/kb.mjs`.
- **PDF** (nuovi studi, tesi, foglietto illustrativo): mettili in una cartella, con accanto un `.json` di metadati
  (`title`, `source`, `url`, `cat`, `tags`), poi `python3 tools/pdf2kb.py cartella/` → genera `knowledge/extra.mjs`.

Dopo ogni modifica ripubblica sia il sito sia il Worker (`npx wrangler deploy`), che legge la stessa base di conoscenza.

### Letteratura inclusa

Volpe 2014 (PLoS ONE), Spina 2016 (Restor Neurol Neurosci), Leonardi 2017 (Neurol Sci), studio pediatrico sulle
atassie 2018 (Front Neurol), Peppe 2017 (abstract MDS), Peppe 2019 (Front Neurol), Serio 2019 (Sensors),
Spolaor 2021 (Sensors), Romanato 2021 (Med Biol Eng Comput), Guiotto 2022 (Sports), Cruciani 2022 (Front Neurol),
Alashram 2023 (revisione sistematica), Spolaor 2023 (Front Sports Act Living), Buonanno 2024 (Pain Ther),
revisione sulla vibrazione focale 2025 (J Clin Med), studio registrato NCT02848898.
Le schede riportano solo dati verificati; dove un dato (es. elenco autori) non è stato verificato è scritto.

> Stasi fornisce informazioni generali e non sostituisce medico o fisioterapista.
