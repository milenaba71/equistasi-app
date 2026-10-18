# equistasi-app

- `index.html` – scheda clinica con modello anatomico 3D.
- `assistente/` – **Primo, l’assistente virtuale con avatar** (vedi sotto).

## Primo – assistente virtuale Equistasi per professionisti

Un avatar con cui **si parla a voce**, in qualunque lingua (cinese compreso), pensato per professionisti sanitari
e preparatori atletici. Risponde su:
dispositivo Equistasi®, protocolli ufficiali (Parkinson, sclerosi multipla, dolore, dermatomeri, sport),
letteratura scientifica pubblicata, riabilitazione e nozioni mediche, segnali d’allarme.

### Come funziona

| Parte | File | Ruolo |
|---|---|---|
| Avatar | `assistente/js/photo-avatar.js` | Fisioterapista fotorealistica: tre video in loop (attesa, ascolto, parlato) generati con Higgsfield dallo stesso ritratto, con dissolvenza tra uno stato e l’altro |
| Avatar illustrato | `assistente/js/avatar.js` | Alternativa disegnata in SVG con labiale sincronizzato (`avatar: 'illustrato'` in `config.js`) |
| Voce | `assistente/js/voice.js` | Web Speech API: riconoscimento vocale (it-IT) e sintesi vocale, frase per frase mentre arriva la risposta |
| Base di conoscenza | `assistente/knowledge/kb.mjs` | 54 schede: dispositivo, protocolli, 16 studi Equistasi con citazione e DOI, riabilitazione, medicina, agopuntura, applicazioni esplorative, valutazione, sicurezza |
| Cervello AI | `worker/` | Cloudflare Worker che chiama Claude (Anthropic) con l’intera base di conoscenza nel prompt (prompt caching): la chiave API resta sul server |
| Modalità offline | `assistente/js/search.js` | Se il Worker non è configurato o non risponde: ricerca BM25 nella base di conoscenza locale |
| Sicurezza | `search.js` + prompt | Riconosce sintomi d’allarme (ictus, dolore al petto, svenimento…) e indica subito il 112/118 |

Ogni risposta mostra le **fonti** (schede cliccabili con citazione completa e link alla pubblicazione).
La conversazione resta solo sul telefono dell’utente (localStorage); il Worker non salva nulla.

### Conversazione a voce

Non è una chat: l’avatar occupa lo schermo e si parla con il grande pulsante **«Parla con Primo»**.
La conversazione è a mani libere: Primo ascolta, risponde a voce (con i sottotitoli) e riapre il microfono da solo;
dopo 3 ascolti a vuoto si ferma. Toccando il pulsante mentre parla lo si interrompe.
Le fonti citate compaiono sotto i sottotitoli; **Scrivi** e **Trascrizione** restano disponibili ma nascosti.

### Lingue

Menu 🌐 in alto: 44 lingue per microfono e voce (italiano, inglese, cinese mandarino e taiwanese, spagnolo, francese,
tedesco, portoghese, russo, arabo, giapponese, coreano, hindi, turco, …). All’avvio usa la lingua del telefono.
- Claude risponde sempre nella lingua scelta, traducendo la base di conoscenza (che resta in italiano).
- Testi dell’interfaccia tradotti in italiano, inglese, cinese, spagnolo, francese, tedesco, portoghese, russo,
  arabo (da destra a sinistra) e giapponese; le altre lingue usano l’inglese (`assistente/js/i18n.js`).
- La voce del browser usa la voce di sistema di quella lingua; l’avatar LiveAvatar riceve la lingua quando si apre la sessione.
- In modalità offline (senza Worker) le risposte restano in italiano.

### Accoglienza e attivazione

1. All’apertura l’avatar si presenta (tocco su «Inizia», necessario perché i browser permettano l’audio)
   e chiede se l’utente è **professionista sanitario** o **preparatore atletico**: si risponde con i pulsanti o a voce.
   Il profilo cambia il tono delle risposte (clinico o sportivo) e i suggerimenti; si cambia dal pulsante in alto.
2. Poi chiede di **scansionare il seriale di un dispositivo da studio professionale** (fotocamera, stesso lettore
   dell’app Equistasi Point) o di scriverlo. Il Worker lo cerca in Airtable (base EQUITUTTO → tabella
   *dispositivi disponibili*) e accetta solo le tipologie in `PRO_TYPES` (predefinito: **noleggio prof**).
   Se valido rilascia un gettone firmato valido 365 giorni, salvato sul telefono: senza gettone il Worker non
   risponde (né chat né avatar), così nessuno può consumare le API dall’esterno.

Configurazione del Worker:
```
npx wrangler secret put AIRTABLE_TOKEN       # token personale Airtable: scope data.records:read, accesso alla sola base EQUITUTTO
npx wrangler secret put ACTIVATION_SECRET    # stringa casuale lunga, es. openssl rand -hex 32
```
Prova: `curl -X POST https://<worker>/activate -H 'Origin: https://app.equistasi.com' -H 'Content-Type: application/json' -d '{"serial":"20230006869"}'`
→ `{"valid":true,…}` per un dispositivo «noleggio prof», `{"valid":false}` per gli altri.
Se `apiUrl` è vuoto (modalità offline) l’attivazione non viene chiesta.

### Avatar HeyGen (LiveAvatar)

HeyGen ha sostituito gli *Interactive Avatar* con **LiveAvatar** (app.liveavatar.com, piattaforma e crediti separati);
gli avatar interattivi creati prima non compaiono più nell’account HeyGen principale.
1. Accedi a https://app.liveavatar.com con il tuo account HeyGen e cerca l’avatar tra i tuoi avatar.
   Se non c’è, chiedi al supporto HeyGen la migrazione (avatar HeyGen e LiveAvatar non sono compatibili tra loro)
   oppure creane uno nuovo su LiveAvatar.
2. Copia **avatar_id** (ed eventualmente **voice_id** di una voce italiana) e la **API key** (sezione sviluppatori).
3. Nel Worker: `npx wrangler secret put LIVEAVATAR_API_KEY`, poi in `wrangler.toml` imposta `LIVEAVATAR_AVATAR_ID`
   (e `LIVEAVATAR_VOICE_ID`, meglio una voce multilingue); ripubblica con `npx wrangler deploy`.
4. In `assistente/js/config.js`: `liveAvatar: true`.

Con l’account gratuito LiveAvatar si può provare in **sandbox** (`LIVEAVATAR_SANDBOX = "true"`): gratis, ma solo con
l’avatar di prova e sessioni di circa 1 minuto. Per un avatar personalizzato e sessioni lunghe servono crediti LiveAvatar.
Il nome dell’assistente si cambia in `ASSISTANT_NAME` (Worker) e `name` (config.js).

L’avatar LiveAvatar pronuncia con labiale reale le risposte di Claude (comando *repeat*, modalità FULL con microfono
dell’avatar spento: ascolto e risposte restano dell’app). Consuma crediti LiveAvatar al minuto: la sessione si apre
al primo tocco, si chiude dopo 3 minuti senza conversazione o quando l’app va in secondo piano. Finché non è
collegato, o se non è disponibile, resta l’avatar video qui sotto con la voce del browser.
Per provare gratis: `LIVEAVATAR_SANDBOX = "true"` (sessioni di circa 1 minuto con l’avatar di prova).

### Avatar fotorealistico

I clip sono indicati in `avatarMedia` di `assistente/js/config.js`: l’app prova prima la copia nel sito
(`assistente/media/`) e poi quella sul CDN di Higgsfield. Per non dipendere dal CDN esterno:
```
sh tools/scarica-avatar.sh && git add assistente/media
```
Il labiale dei video è generico (non segue parola per parola la voce). Per un labiale perfettamente
sincronizzato servirebbe un servizio di avatar in streaming a pagamento (es. HeyGen, D-ID, Simli).

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
4. Copia l’indirizzo del Worker in `assistente/js/config.js` → `apiUrl: 'https://…workers.dev'`.

Modello: `claude-opus-5-5` con effort `low` (risposte rapide per la conversazione vocale); si cambiano con le
variabili `MODEL` ed `EFFORT` in `wrangler.toml`. È attivo il fallback lato server (`fallbacks: "default"`):
se il modello declina per un falso positivo dei filtri di sicurezza, l’API riprova automaticamente con il modello consigliato.
La base di conoscenza (circa 20.000 token) è in cache per un’ora: le domande successive costano molto meno.

### Ampliare la base di conoscenza

- **Schede scritte a mano**: aggiungi oggetti in `CORE_DOCS` di `assistente/knowledge/kb.mjs`.
- **PDF** (nuovi studi, tesi, foglietto illustrativo): mettili in una cartella, con accanto un `.json` di metadati
  (`title`, `source`, `url`, `cat`, `tags`), poi `python3 tools/pdf2kb.py cartella/` → genera `knowledge/extra.mjs`.

Dopo ogni modifica ripubblica sia il sito sia il Worker (`npx wrangler deploy`), che legge la stessa base di conoscenza.

### Agopuntura e applicazioni esplorative

- **Agopuntura**: evidenze (meta-analisi Vickers 2018, Cochrane su cefalea ed emicrania, NICE 2021), principali agopunti
  con localizzazione e cautele in gravidanza, sovrapposizione tra agopunti, trigger point e punti Equistasi (C7 = GV14 Dazhui,
  polpaccio ≈ BL57 Chengshan, tibiale anteriore = ST36 Zusanli).
- **Applicazioni esplorative** (categoria `esplorativo`, schede con bordo giallo): regole per sperimentare in sicurezza e
  razionali fisioterapici (ventre muscolare e giunzione miotendinea, antagonista nella spasticità, catene miofasciali,
  caviglia/piede/cervicale per l’equilibrio, idee per distretto, abbinamento con l’esercizio).
  Primo le presenta sempre come **non validate da studi su Equistasi e fuori dai protocolli ufficiali**, partendo dal
  protocollo standard, con un test per misurarne l’effetto e da concordare con il fisioterapista.

### Letteratura inclusa

Volpe 2014 (PLoS ONE), Spina 2016 (Restor Neurol Neurosci), Leonardi 2017 (Neurol Sci), studio pediatrico sulle
atassie 2018 (Front Neurol), Peppe 2017 (abstract MDS), Peppe 2019 (Front Neurol), Serio 2019 (Sensors),
Spolaor 2021 (Sensors), Romanato 2021 (Med Biol Eng Comput), Guiotto 2022 (Sports), Cruciani 2022 (Front Neurol),
Alashram 2023 (revisione sistematica), Spolaor 2023 (Front Sports Act Living), Buonanno 2024 (Pain Ther),
revisione sulla vibrazione focale 2025 (J Clin Med), studio registrato NCT02848898.
Le schede riportano solo dati verificati; dove un dato (es. elenco autori) non è stato verificato è scritto.

> Primo è uno strumento di supporto per professionisti e non sostituisce il giudizio clinico.
