/*
 * Base di conoscenza dell'assistente Equistasi.
 *
 * Unica fonte di verità, usata:
 *  - dal browser (ricerca locale BM25, modalità offline, schede "Fonti");
 *  - dal Worker (worker/src/index.js), che la inserisce per intero nel prompt di Claude.
 *
 * Ogni documento: { id, cat, title, source, url?, tags, text }.
 *   cat: dispositivo | protocollo | studio | riabilitazione | medicina | valutazione | sicurezza
 * Le schede "studio" riportano SOLO dati verificati sulle pubblicazioni; dove un dato
 * non è stato verificato è scritto esplicitamente.
 *
 * Per aggiungere documenti (es. nuovi studi in PDF) usa tools/pdf2kb.py: genera
 * knowledge/extra.mjs, che viene unito qui sotto.
 */
import { EXTRA_DOCS } from './extra.mjs';

export const KB_VERSION = '2026-10-18';

const CORE_DOCS = [
  /* ───────────────────────── Dispositivo ───────────────────────── */
  {
    id: 'disp-cos-e',
    cat: 'dispositivo',
    title: 'Che cos’è Equistasi®',
    source: 'Equistasi S.r.l.; descrizione riportata negli studi pubblicati (Volpe 2014, Leonardi 2017, Alashram 2023)',
    tags: ['equistasi', 'dispositivo', 'nanotecnologia', 'vibrazione', 'propriocezione', 'dispositivo medico'],
    text: `Equistasi® è un dispositivo medico indossabile (classe I secondo gli studi pubblicati), prodotto da Equistasi S.r.l. (www.equistasi.com, info@equistasi.com). È una piccola placca rettangolare composta da fibre nanotecnologiche che, alla temperatura corporea, convertono l’energia termica del corpo in microvibrazioni meccaniche focali; gli studi riportano una frequenza di circa 9000 Hz. Non ha batterie né cavi: si attiva con il calore della pelle.
Lo scopo è fornire una stimolazione meccanica focale ai recettori propriocettivi (fusi neuromuscolari, recettori cutanei e articolari) per influenzare l’informazione propriocettiva che arriva al sistema nervoso centrale e, di conseguenza, il controllo posturale, l’equilibrio e il cammino. In letteratura viene chiamato "wearable proprioceptive stabilizer", "proprioceptive focal stimulation" (PFS) o "focal mechanical vibration".
Si applica sulla pelle pulita e asciutta con un cerotto trasparente (applicatore adesivo) fornito nella confezione. Esistono versioni in silicone e in gel (la versione gel si inserisce in una custodia usa e getta). La versione per lo sport si chiama Elvy (2 × 1,5 cm, spessore 0,5 mm, con chip NFC e numero di serie univoco; tre dispositivi per kit).
I dispositivi sono strettamente personali: si adattano alla temperatura del corpo di chi li usa e non vanno scambiati.
La risposta è individuale: alcune persone percepiscono un beneficio, altre no. Equistasi non è un farmaco e non sostituisce terapie, fisioterapia o il parere del medico.`,
  },
  {
    id: 'disp-meccanismo',
    cat: 'dispositivo',
    title: 'Come agisce: propriocezione e vibrazione focale',
    source: 'Sintesi della fisiologia della vibrazione focale e degli studi Equistasi (Volpe 2014; Peppe 2019; Cruciani 2022)',
    tags: ['meccanismo', 'propriocezione', 'fusi neuromuscolari', 'afferenze', 'vibrazione focale', 'neuroplasticità'],
    text: `La propriocezione è il "senso della posizione": informa il cervello su posizione e movimento di articolazioni e muscoli. Nasce da fusi neuromuscolari (fibre afferenti Ia e II), organi tendinei del Golgi, recettori articolari e meccanocettori cutanei. Insieme a vista e sistema vestibolare (orecchio interno) permette di mantenere l’equilibrio.
La vibrazione meccanica focale applicata su un muscolo o un tendine attiva soprattutto le terminazioni primarie dei fusi (afferenze Ia). Gli studi sulla vibrazione focale in generale mostrano effetti sull’eccitabilità della corteccia sensitivo-motoria, sull’inibizione spinale e sul tono muscolare, con possibili effetti di plasticità dopo applicazioni ripetute.
Equistasi fornisce una microvibrazione continua di bassa intensità per tutto il tempo in cui è indossato. L’ipotesi è che questo segnale aggiuntivo "rinforzi" l’informazione propriocettiva quando è alterata (Parkinson, sclerosi multipla, atassie, dolore cronico, affaticamento) e migliori l’integrazione sensori-motoria. Uno studio pilota su volontari sani (Cruciani 2022) ha osservato, dopo l’applicazione, una riduzione delle oscillazioni ad alta frequenza (HFO) dei potenziali evocati somatosensoriali, interpretata come un cambiamento dell’elaborazione somatosensoriale.
I punti classici di applicazione sono la 7ª vertebra cervicale (C7) e i muscoli soleo/polpacci (tricipite surale), scelti perché coinvolti nel controllo posturale; per il dolore si usano il punto doloroso, i muscoli che sostengono la zona e la vertebra del metamero corrispondente.
Il meccanismo d’azione preciso non è ancora completamente chiarito: è un’area di ricerca aperta.`,
  },
  {
    id: 'disp-applicazione',
    cat: 'dispositivo',
    title: 'Come applicare il dispositivo (passi generali)',
    source: 'Istruzioni Equistasi nell’app Equistasi Point (da allineare sempre al foglietto illustrativo)',
    tags: ['applicazione', 'cerotto', 'silicone', 'gel', 'istruzioni', 'come si mette'],
    text: `1. Pulisci e asciuga bene la pelle nel punto indicato (niente creme, oli o sudore).
2. Individua il punto: per i trigger point premi con il polpastrello e cerca il punto più dolente, a volte un piccolo nodulo che riproduce il dolore; esplora un’area di 2–3 cm attorno al punto indicato e scegli quello più sensibile. Per le vertebre: C7 è la vertebra più sporgente alla base del collo quando pieghi la testa in avanti.
3. Versione silicone: appoggia il dispositivo al centro della parte adesiva del cerotto in dotazione e premi; applica il cerotto con il dispositivo a contatto con la pelle, centrato sul punto.
4. Versione gel: inserisci il dispositivo nella custodia usa e getta (una nuova a ogni applicazione), appoggia la custodia al centro del cerotto e applica sulla pelle.
5. Rispetta i tempi del protocollo e toglilo prima se avverti qualsiasi fastidio.
La zona dove senti il dolore ("zona riferita") non è sempre dove nasce il problema: per il dolore miofasciale il dispositivo va sul trigger point, non sulla zona di irradiazione.
Leggi sempre il foglietto illustrativo del dispositivo.`,
  },
  {
    id: 'disp-tempi',
    cat: 'dispositivo',
    title: 'Tempi di utilizzo e pausa settimanale',
    source: 'Protocolli per il paziente Equistasi, Rev. 1 – ottobre 2026',
    tags: ['tempi', 'quanto tenerlo', 'ore', 'pausa', 'settimana', 'assuefazione'],
    text: `Regola generale: massimo 5 giorni di utilizzo e almeno 2 giorni di pausa ogni settimana, per evitare che i recettori si abituino allo stimolo (adattamento).
- Applicazione standard (app Equistasi Point): 2 ore al mattino e 2 ore al pomeriggio, 5 giorni sì e 2 di riposo.
- Parkinson: primo giorno 1 ora consecutiva (preferibilmente nelle ore di maggior movimento); dal secondo giorno 2 ore al mattino e 2 al pomeriggio.
- Sclerosi multipla: settimana 1 → 1,5 ore al giorno per 5 giorni; settimane 2–4 → 2 ore al giorno per 5 giorni; se gira la testa iniziare con 15 minuti e aumentare gradualmente.
- Sport: il primo giorno 1–2 ore prima dell’attività; poi durante allenamenti o gare; massimo 4 ore totali al giorno.
- Dolore cronico: il dispositivo sulla vertebra 1 ora (fino a 2), mai fino al giorno dopo; alla prima applicazione quelli sui muscoli possono restare fino al mattino dopo (toglierli circa un’ora dopo il risveglio); poi riapplicare solo quando il dolore ritorna.
Se compare fastidio (aumento del dolore, nausea, leggero mal di testa, capogiri) va tolto subito: significa che per quel corpo il tempo è stato più lungo del necessario e il fastidio passa in pochi minuti. Se non passa, rivolgersi al medico o al farmacista.`,
  },
  {
    id: 'disp-avvertenze',
    cat: 'sicurezza',
    title: 'Avvertenze, effetti indesiderati e quando non usarlo',
    source: 'Protocolli per il paziente Equistasi; studi pubblicati (Alashram 2023: dispositivo sicuro e ben tollerato nel Parkinson)',
    tags: ['avvertenze', 'effetti collaterali', 'controindicazioni', 'sicurezza', 'nausea', 'mal di testa', 'capogiri', 'gravidanza', 'pacemaker'],
    text: `Negli studi pubblicati Equistasi è risultato sicuro e ben tollerato (revisione sistematica Alashram 2023 nel Parkinson; studi pilota nelle atassie, anche in età pediatrica).
Possibili fastidi riportati nei protocolli: aumento transitorio del dolore, nausea, leggero mal di testa, capogiri o vertigini. In questi casi il dispositivo va tolto subito; il fastidio di solito passa in pochi minuti. Riprovare il giorno dopo o con tempi più brevi. Se il fastidio persiste dopo la rimozione: medico o farmacista.
Non applicare su pelle lesionata, irritata, su ferite o su zone con dermatiti; interrompere se compare irritazione da cerotto.
Le controindicazioni ufficiali sono quelle riportate nel foglietto illustrativo: l’assistente non deve inventarne altre. In situazioni particolari (gravidanza, bambini, portatori di pacemaker o altri dispositivi impiantati, epilessia, patologie cutanee, malattie acute) chiedere sempre al medico prima dell’uso e consultare il foglietto illustrativo.
Il dispositivo non sostituisce farmaci, fisioterapia o visite: non sospendere né modificare terapie senza il medico. Alcuni farmaci possono influire sulla risposta al dispositivo (protocollo sclerosi multipla): se non si percepisce beneficio, parlarne con il medico.`,
  },
  {
    id: 'disp-acquisto-app',
    cat: 'dispositivo',
    title: 'Dove trovare protocolli, app e supporto',
    source: 'Equistasi S.r.l.',
    tags: ['acquisto', 'shop', 'app', 'equistasi point', 'contatti', 'farmacia', 'supporto'],
    text: `Negozio online: https://shop.equistasi.com. Sito: www.equistasi.com. Contatti: info@equistasi.com.
App Equistasi Point (https://app.equistasi.com): mappa dei trigger point (basata su Travell & Simons), punti di applicazione, metameri e dermatomeri, promemoria con timer, video tutorial, protocolli in PDF per Dolore, Parkinson, Sclerosi multipla, Sport. L’accesso avviene con il numero di serie del dispositivo.
Per dubbi sul codice o sull’uso: farmacista, fisioterapista o Equistasi.`,
  },

  /* ───────────────────────── Protocolli ───────────────────────── */
  {
    id: 'prot-parkinson',
    cat: 'protocollo',
    title: 'Protocollo Parkinson: equilibrio e stabilità posturale',
    source: 'Guida per il paziente Equistasi – Parkinson, Rev. 1 ottobre 2026',
    tags: ['parkinson', 'protocollo', 'c7', 'soleo', 'polpaccio', 'equilibrio', 'cadute', 'freezing'],
    text: `Tre dispositivi:
1) Settima vertebra cervicale (C7), dietro al collo (la vertebra più sporgente piegando la testa in avanti);
2) Soleo destro, nella parte posteriore della gamba alla base del polpaccio;
3) Soleo sinistro, stessa posizione sull’altra gamba.
Tempi: primo giorno 1 ora consecutiva, preferibilmente nelle ore in cui ci si muove di più; dal secondo giorno 2 ore al mattino e 2 al pomeriggio; 5 giorni di utilizzo e 2 di pausa ogni settimana.
Le guide Equistasi riassumono così gli studi: riduzione del rischio di cadute, miglioramento di stabilità posturale e propriocezione, cammino migliore (passo più lungo, meno freezing). Il materiale aziendale riporta una riduzione da 3,2 a 0,65 cadute al mese "negli studi multicentrici"; nella letteratura indicizzata il dato verificato è lo studio retrospettivo di Serio 2019 (tasso di cadute da 2,1 a 1,25, p = 0,036).
Il dispositivo va affiancato alla fisioterapia e alla terapia farmacologica, seguendo neurologo e fisioterapista. Il protocollo classico C7 + polpacci corrisponde ai dermatomeri S1-S2.`,
  },
  {
    id: 'prot-sm',
    cat: 'protocollo',
    title: 'Protocollo Sclerosi multipla (schemi A e B)',
    source: 'Guida per il paziente Equistasi – Sclerosi multipla, nata dallo studio dell’Università Federico II di Napoli',
    tags: ['sclerosi multipla', 'sm', 'spasticità', 'equilibrio', 'passo', 'protocollo', 'l5', 'gluteo', 'quadricipite', 'tibiale'],
    text: `Due schemi, scelti dal medico o dal fisioterapista.
Schema A – Equilibrio e lunghezza del passo (4 dispositivi): C7; L5 (ultima vertebra lombare); un dispositivo su ciascun polpaccio (tricipiti surali).
Schema B – Spasticità di una gamba: C7; medio gluteo (parte alta del gluteo dal lato colpito); quadricipite (parte bassa della coscia colpita, sopra il ginocchio); tibiale anteriore o polpaccio della gamba colpita (lo sceglie il fisioterapista in base alla caviglia).
Tempi: settimana 1 → 1,5 ore al giorno per 5 giorni + 2 di pausa; settimane 2, 3 e 4 → 2 ore al giorno per 5 giorni + 2 di pausa. Se gira la testa: iniziare con 15 minuti e aumentare gradualmente.
Valutare i progressi con test semplici come Timed Up and Go e Romberg, meglio se ripresi in video: prima di iniziare, dopo la prima ora di applicazione e ai controlli.
Se non si percepisce beneficio: parlarne col medico (alcuni farmaci possono influire), fare una pausa di una o più settimane e ripetere, oppure provare punti diversi con il fisioterapista.`,
  },
  {
    id: 'prot-dolore',
    cat: 'protocollo',
    title: 'Protocollo Dolore cronico',
    source: 'Guida per il paziente Equistasi – Dolore cronico, Rev. 1 ottobre 2026',
    tags: ['dolore', 'dolore cronico', 'protocollo', 'metamero', 'vertebra', 'ginocchio', 'muscoli'],
    text: `Quattro dispositivi:
1) sul punto dove il dolore è più intenso;
2·3) sui muscoli che sostengono il movimento dell’area dolorante;
4) sulla vertebra del metamero collegato al distretto (premere le vertebre della zona e scegliere la più dolente). Esempio ginocchio: 1 sul punto doloroso, 2 e 3 sui muscoli della coscia, 4 sulla vertebra L3-L4.
Verifica: dopo circa 10 minuti valuta se percepisci un beneficio; se dopo 10–20 minuti non cambia nulla sposta i dispositivi su punti vicini lungo i muscoli o sulla colonna.
Tempi: alla prima applicazione i dispositivi sui muscoli restano fino al giorno dopo (togli circa un’ora dopo il risveglio); quello sulla vertebra 1 ora, se serve fino a 2 ore, mai fino al giorno dopo. Se il dolore è scomparso non serve continuare: riapplica quando ritorna. Almeno 2 giorni di pausa a settimana.
Durante l’applicazione la percezione del dolore può cambiare; se compare un leggero fastidio è il momento di togliere i dispositivi. Nausea, mal di testa o capogiri: togliere subito e riprovare il giorno dopo.`,
  },
  {
    id: 'prot-dermatomeri',
    cat: 'protocollo',
    title: 'Dolore e dermatomeri: applicazione personalizzata',
    source: 'Guida per il paziente Equistasi – Dolore e dermatomeri; mappa da F.H. Netter, Atlante di anatomia umana',
    tags: ['dermatomero', 'metamero', 'radice nervosa', 'sciatica', 'cervicobrachialgia', 'l4', 'l5', 's1', 'c5', 'c6', 'c7'],
    text: `Ogni zona di pelle è innervata da una radice nervosa spinale: è il dermatomero. Conoscerlo aiuta a personalizzare l’applicazione.
Schema: 1 dispositivo sulla zona di massima sensibilità o dolore nel dermatomero interessato; 2 sui muscoli di sostegno (es. quadricipite per L3-L4, polpacci per S1-S2); in alternativa o in aggiunta, uno sulla vertebra corrispondente.
Esempi: L4-L5 (dolore o instabilità alle gambe) → vicino alla colonna lombare + due sui polpacci. C5-C7 (dolore al collo che scende al braccio) → C7 + due sulle braccia nelle zone di dolore o rigidità. S1-S2 (disturbi del cammino nel Parkinson) → C7 + entrambi i polpacci.
Tempi: attendere circa 60 secondi e rivalutare; sulla vertebra le prime volte 1 ora, poi fino a 2; 5 giorni sì e 2 di pausa.
Livelli principali: C5 clavicole; C5-C7 lato esterno delle braccia; C8-T1 lato interno delle braccia; C6 pollice; C6-C8 mano; C8 anulare e mignolo; T4 altezza dei capezzoli; T10 ombelico; T12 inguine; L1-L4 davanti e interno delle gambe; L4 lato interno dell’alluce; L4-S1 piedi; L5-S2 lato esterno e retro delle gambe; S1 bordo esterno del piede e mignolo; S2-S5 perineo. I dermatomeri si sovrappongono in parte tra loro.
Attenzione: dolore irradiato con perdita di forza, intorpidimento a sella o disturbi di vescica/intestino richiede valutazione medica urgente.`,
  },
  {
    id: 'prot-sport',
    cat: 'protocollo',
    title: 'Protocollo Sport e performance (Elvy)',
    source: 'Guida Equistasi – Sport e performance; presentazione Elvy',
    tags: ['sport', 'atleti', 'elvy', 'performance', 'calcio', 'ciclismo', 'corsa', 'protocollo'],
    text: `Tre dispositivi: C7 alla base del collo e uno su ciascun polpaccio, preferibilmente sul soleo (parte bassa del polpaccio, sopra il tendine d’Achille).
Tempi: primo giorno 1–2 ore prima della pratica sportiva; nei giorni successivi durante allenamenti o gare; più applicazioni al giorno sono possibili senza superare 4 ore totali; massimo 5 giorni a settimana con 2 di pausa.
Obiettivi: stabilità posturale e controllo neuromuscolare; controllo del movimento negli sport dinamici (calcio, ciclismo).
Meglio essere seguiti da un fisioterapista o preparatore atletico. Il sistema Elvy (dispositivo con NFC, app per smartphone/smartwatch e cintura lombare) misura equilibrio, salto, corsa, postura e recupero (HRV) e permette di confrontare lo stesso test con e senza dispositivo.
Studi in ambito sportivo: Guiotto 2022 (ciclisti, pressione sulla sella) e Spolaor 2023 (calciatrici, fattori di rischio di lesione del crociato anteriore).`,
  },
  {
    id: 'prot-trigger',
    cat: 'protocollo',
    title: 'Trigger point miofasciali e dolore riferito',
    source: 'Travell, Simons & Simons, Myofascial Pain and Dysfunction: The Trigger Point Manual; app Equistasi Point',
    tags: ['trigger point', 'miofasciale', 'dolore riferito', 'cefalea', 'cervicale', 'lombalgia', 'trapezio', 'piriforme'],
    text: `Un trigger point miofasciale è un punto iperirritabile all’interno di una banda tesa di muscolo, dolente alla pressione, che può riprodurre il dolore abituale anche a distanza (dolore riferito). Esempi tipici: trapezio superiore → dolore alla tempia e al collo (cefalea tensiva); sternocleidomastoideo → dolore a fronte, orecchio, vertigine posturale; quadrato dei lombi e medio gluteo → lombalgia e dolore al gluteo; piriforme → dolore al gluteo e lungo la coscia (pseudo-sciatica); soleo → dolore al tallone; infraspinato → dolore profondo alla spalla.
Fattori che li favoriscono: sovraccarico o posture prolungate, traumi, stress, sonno scarso, sedentarietà, carenze o squilibri metabolici.
Nell’app Equistasi Point la X indica il trigger point dove applicare il dispositivo; le zone blu indicano dove si irradia il dolore. Il dispositivo va sulla X, non sulla zona blu.
Strategie associate: allungamento dolce, calore, automassaggio/compressione ischemica, correzione posturale, esercizio graduale. Un dolore con febbre, calo di peso, dolore notturno costante o deficit neurologici non è un semplice trigger point e va valutato dal medico.`,
  },

  /* ───────────────────────── Letteratura ───────────────────────── */
  {
    id: 'lit-volpe-2014',
    cat: 'studio',
    title: 'Volpe, Giantin, Fasano 2014 – Parkinson, studio randomizzato di fase II (PLoS ONE)',
    source: 'Volpe D, Giantin MG, Fasano A. A wearable proprioceptive stabilizer (Equistasi®) for rehabilitation of postural instability in Parkinson’s disease: a phase II randomized double-blind, double-dummy, controlled study. PLoS One. 2014;9(11):e112065. doi:10.1371/journal.pone.0112065',
    url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0112065',
    tags: ['parkinson', 'studio', 'rct', 'equilibrio', 'instabilità posturale', 'berg', 'cadute', 'pdq-39', 'posturografia'],
    text: `Disegno: studio pilota di fase II randomizzato, doppio cieco, double-dummy, controllato. 40 pazienti con malattia di Parkinson divisi in due gruppi: dispositivo attivo oppure inattivo; tutti hanno svolto 2 mesi di programma intensivo di riabilitazione dell’equilibrio.
Risultati: entrambi i gruppi sono migliorati. Sulle misure posturografiche principali (esito primario) non ci sono state differenze significative tra i gruppi. Negli esiti secondari il gruppo Equistasi ha mostrato miglioramenti significativi su Berg Balance Scale, Falls Efficacy Scale e PDQ-39 (qualità di vita); tra gli esiti secondari c’era anche il numero di cadute.
Conclusione degli autori: un programma di fisioterapia per l’equilibrio associato alla vibrazione meccanica focale del dispositivo potrebbe essere superiore alla sola riabilitazione. Livello di evidenza: studio pilota piccolo con esito primario non significativo; risultati da confermare.`,
  },
  {
    id: 'lit-spina-2016',
    cat: 'studio',
    title: 'Spina et al. 2016 – Sclerosi multipla, RCT doppio cieco vs placebo',
    source: 'Spina E, Carotenuto A, Aceto MG, Cerillo I, Silvestre F, Arace F, Paone P, Orefice G, Iodice R. The effects of mechanical focal vibration on walking impairment in multiple sclerosis patients: a randomized, double-blinded vs placebo study. Restor Neurol Neurosci. 2016;34(6):869-876. doi:10.3233/RNN-160665',
    url: 'https://journals.sagepub.com/doi/abs/10.3233/RNN-160665',
    tags: ['sclerosi multipla', 'studio', 'rct', 'cammino', 'equilibrio', 'napoli', 'federico ii'],
    text: `Disegno: studio pilota randomizzato, doppio cieco, controllato con dispositivo placebo (sham), condotto a Napoli (gruppo Università Federico II). 20 pazienti con sclerosi multipla recidivante-remittente e disturbi del cammino: 10 con dispositivo attivo, 10 con placebo.
Risultati: il gruppo trattato ha mostrato miglioramenti di parametri del cammino e dell’equilibrio rispetto al placebo, con parte del beneficio mantenuto al follow-up.
Livello di evidenza: studio pilota su piccolo campione. Dallo stesso gruppo deriva il protocollo Equistasi per la SM (schemi A e B). Esiste anche uno studio registrato (ClinicalTrials.gov NCT02848898, Federico II) randomizzato crossover sugli effetti della vibrazione focale Equistasi sulla spasticità nella SM.`,
  },
  {
    id: 'lit-leonardi-2017',
    cat: 'studio',
    title: 'Leonardi et al. 2017 – Atassie cerebellari ereditarie (Neurological Sciences)',
    source: 'Leonardi L, Aceto MG, Marcotulli C, Arcuria G, Serrao M, Pierelli F, Paone P, Filla A, Roca A, Casali C. A wearable proprioceptive stabilizer for rehabilitation of limb and gait ataxia in hereditary cerebellar ataxias: a pilot open-labeled study. Neurol Sci. 2017;38(3):459-463. doi:10.1007/s10072-016-2800-x',
    url: 'https://link.springer.com/article/10.1007/s10072-016-2800-x',
    tags: ['atassia', 'friedreich', 'atassia spinocerebellare', 'sca', 'studio', 'sara', '6 minuti', 'nine hole peg'],
    text: `Disegno: studio pilota in aperto (senza gruppo di controllo). 11 adulti con diagnosi genetica di atassia spinocerebellare autosomica dominante (SCA) o atassia di Friedreich hanno indossato il dispositivo attivo per 3 settimane.
Risultati: miglioramenti significativi della scala SARA (gravità dell’atassia), del Nine-Hole Peg Test (destrezza degli arti superiori) e del test del cammino in 6 minuti.
Conclusione: evidenza preliminare che la vibrazione focale del dispositivo possa migliorare l’atassia degli arti e del cammino; servono studi più ampi e controllati.`,
  },
  {
    id: 'lit-atassia-infantile-2018',
    cat: 'studio',
    title: 'Studio pilota 2018 – Atassia in età pediatrica (Frontiers in Neurology)',
    source: 'Non-invasive focal mechanical vibrations delivered by wearable devices: an open-label pilot study in childhood ataxia. Front Neurol. 2018;9:849. doi:10.3389/fneur.2018.00849 (elenco autori non verificato in questa base di conoscenza)',
    url: 'https://www.frontiersin.org/articles/10.3389/fneur.2018.00849/full',
    tags: ['atassia', 'bambini', 'pediatria', 'friedreich', 'cammino', 'studio'],
    text: `Disegno: studio pilota in aperto su 10 bambini/ragazzi con atassia (forme cerebellari lente o non progressive e atassia di Friedreich).
Trattamento: 4 settimane con Equistasi.
Risultati: il trattamento è risultato sicuro e ha prodotto effetti significativi su parametri del passo (analisi del cammino), con risposte diverse tra atassie cerebellari e atassia di Friedreich.
Limiti: assenza di gruppo di controllo, campione piccolo.`,
  },
  {
    id: 'lit-peppe-2017-abs',
    cat: 'studio',
    title: 'Peppe et al. 2017 – Parkinson grave, analisi del cammino (abstract MDS)',
    source: 'Proprioceptive Focal Stimulation (Equistasi®) may improve gait in severe Parkinson’s disease patients. Gait analysis double-blind, double-dummy randomized study. Abstract, Movement Disorders 2017 (MDS Congress)',
    url: 'https://www.mdsabstracts.org/abstract/proprioceptive-focal-stimulation-equistasi-may-improve-gait-in-severe-parkinsons-disease-patients-gait-analysis-double-blind-double-dummy-randomized-study/',
    tags: ['parkinson', 'parkinson grave', 'cammino', 'gait analysis', 'abstract'],
    text: `Abstract congressuale: studio randomizzato doppio cieco double-dummy con analisi strumentale del cammino in 12 pazienti con Parkinson in fase avanzata. Riporta possibili miglioramenti del cammino con stimolazione attiva. È un abstract (non un articolo completo sottoposto a revisione) su pochi pazienti: evidenza limitata.`,
  },
  {
    id: 'lit-peppe-2019',
    cat: 'studio',
    title: 'Peppe et al. 2019 – Parkinson, studio multicentrico crossover sul cammino (Frontiers in Neurology)',
    source: 'Peppe A, Paravati S, Baldassarre MG, et al. Proprioceptive Focal Stimulation (Equistasi®) may improve the quality of gait in middle-moderate Parkinson’s disease patients. Double-blind, double-dummy, randomized, crossover, Italian multicentric study. Front Neurol. 2019;10:998. doi:10.3389/fneur.2019.00998',
    url: 'https://www.frontiersin.org/articles/10.3389/fneur.2019.00998/full',
    tags: ['parkinson', 'cammino', 'gait analysis', 'velocità', 'lunghezza del passo', 'crossover', 'multicentrico', 'rct'],
    text: `Disegno: studio italiano multicentrico, randomizzato, doppio cieco, double-dummy, crossover, in pazienti con Parkinson di grado medio-moderato. Valutazione con analisi strumentale del cammino.
Risultati: la stimolazione attiva ha migliorato in modo significativo la velocità media del cammino, la lunghezza del passo (stride length), la fase di appoggio e la percentuale di doppio appoggio, sia a destra sia a sinistra.
Conclusione degli autori: i risultati supportano l’efficacia della vibrazione focale come stimolazione del sistema propriocettivo nel Parkinson. (Il numero esatto di pazienti e i valori numerici completi non sono riportati in questa scheda.)`,
  },
  {
    id: 'lit-serio-2019',
    cat: 'studio',
    title: 'Serio et al. 2019 – Parkinson, studio retrospettivo su stabilità e cadute (Sensors)',
    source: 'Serio F, Minosa C, De Luca M, Conte P, Albani G, Peppe A. Focal Vibration Training (Equistasi®) to improve posture stability. A retrospective study in Parkinson’s disease. Sensors (Basel). 2019;19(9):2101. doi:10.3390/s19092101',
    url: 'https://www.mdpi.com/1424-8220/19/9/2101',
    tags: ['parkinson', 'cadute', 'stabilità posturale', 'retrospettivo', 'riabilitazione'],
    text: `Disegno: studio retrospettivo su 55 pazienti con Parkinson in riabilitazione posturale, con o senza allenamento con vibrazione focale (Equistasi).
Risultati: entrambi i gruppi sono migliorati; il gruppo Equistasi ha mostrato un miglioramento significativo sulle scale cliniche e una riduzione significativa e mantenuta del tasso di cadute (da 2,1 a 1,25; p = 0,036).
Conclusione: l’allenamento con vibrazione focale è uno strumento valido per potenziare l’effetto della riabilitazione posturale. Limite: disegno retrospettivo, non randomizzato.`,
  },
  {
    id: 'lit-spolaor-2021',
    cat: 'studio',
    title: 'Spolaor et al. 2021 – Parkinson, attività muscolare e controllo posturale (Sensors)',
    source: 'Spolaor F, Romanato M, Guiotto A, Peppe A, Bakdounes L, To DK, Volpe D, Sawacha Z. Relationship between muscular activity and postural control changes after Proprioceptive Focal Stimulation (Equistasi®) in middle-moderate Parkinson’s disease patients: an explorative study. Sensors (Basel). 2021;21(2):560. doi:10.3390/s21020560',
    url: 'https://www.mdpi.com/1424-8220/21/2/560',
    tags: ['parkinson', 'emg', 'elettromiografia', 'postura', 'controllo posturale', 'biomeccanica'],
    text: `Studio esplorativo (Università di Padova, laboratorio di biomeccanica) sulla relazione tra attività muscolare (elettromiografia di superficie) e cambiamenti del controllo posturale dopo stimolazione propriocettiva focale con Equistasi in pazienti con Parkinson medio-moderato. Contribuisce a descrivere come il sistema neuromuscolare risponde alla stimolazione. I risultati numerici dettagliati non sono riportati in questa scheda.`,
  },
  {
    id: 'lit-romanato-2021',
    cat: 'studio',
    title: 'Romanato et al. 2021 – Parkinson, biomeccanica di equilibrio e arti inferiori (Med Biol Eng Comput)',
    source: 'Romanato M, Guiotto A, Spolaor F, Bakdounes L, Baldassarre G, Cucca A, Peppe A, Volpe D, Sawacha Z, et al. Changes of biomechanics induced by Equistasi® in Parkinson’s disease: coupling between balance and lower limb joints kinematics. Med Biol Eng Comput. 2021;59:1403-1415. doi:10.1007/s11517-021-02373-3',
    url: 'https://link.springer.com/article/10.1007/s11517-021-02373-3',
    tags: ['parkinson', 'biomeccanica', 'cinematica', 'equilibrio', 'crossover', 'gait analysis'],
    text: `Studio randomizzato crossover su 24 partecipanti con Parkinson che ha analizzato con strumenti biomeccanici (posturografia e cinematica articolare) il legame tra equilibrio e movimento delle articolazioni degli arti inferiori con e senza Equistasi. Fornisce un’analisi meccanicistica di come la stimolazione propriocettiva modifica la strategia posturale. Risultati numerici dettagliati non riportati in questa scheda.`,
  },
  {
    id: 'lit-guiotto-2022',
    cat: 'studio',
    title: 'Guiotto et al. 2022 – Ciclisti, pressione sulla sella (Sports)',
    source: 'Guiotto A, et al. Could proprioceptive stimuli change saddle pressure on male cyclists during different hand positions? An exploratory study of the effect of the Equistasi® device. Sports (Basel). 2022;10(6):88. doi:10.3390/sports10060088',
    url: 'https://www.mdpi.com/2075-4663/10/6/88',
    tags: ['ciclismo', 'sport', 'sella', 'postura', 'lombare'],
    text: `Studio esplorativo su 70 ciclisti maschi testati su rullo con e senza Equistasi, con mappatura delle pressioni sulla sella in tre posizioni delle mani.
Risultati: con il dispositivo la superficie di contatto sulla sella è risultata significativamente più ampia in tutte le posizioni (p < 0,05), con valori più alti di integrale pressione-tempo e percentuale di superficie; nessuna differenza per rapporto di pressione, posizione del picco e centro di pressione.
Interpretazione: la stimolazione focale del sistema propriocettivo lombare può modificare la postura del ciclista. Studio esplorativo, effetto acuto.`,
  },
  {
    id: 'lit-cruciani-2022',
    cat: 'studio',
    title: 'Cruciani et al. 2022 – Volontari sani, oscillazioni ad alta frequenza dei potenziali evocati (Frontiers in Neurology)',
    source: 'Cruciani A, et al. Focal vibrations enhance somatosensory facilitation in healthy subjects: a pilot study on Equistasi® and high-frequency oscillations. Front Neurol. 2022. doi:10.3389/fneur.2022.1052989',
    url: 'https://www.frontiersin.org/articles/10.3389/fneur.2022.1052989/full',
    tags: ['neurofisiologia', 'potenziali evocati', 'hfo', 'volontari sani', 'meccanismo', 'corteccia'],
    text: `Studio pilota neurofisiologico, non controllato, su volontari sani. Dopo l’applicazione di Equistasi è stata osservata una riduzione statisticamente significativa dell’area totale delle oscillazioni ad alta frequenza (HFO) dei potenziali evocati somatosensoriali, interpretata come aumento della facilitazione somatosensoriale. È uno dei pochi studi sul meccanismo d’azione. Lo studio è stato finanziato dal produttore; disegno non controllato.`,
  },
  {
    id: 'lit-alashram-2023',
    cat: 'studio',
    title: 'Alashram et al. 2023 – Revisione sistematica nel Parkinson',
    source: 'Alashram AR, Annino G, Romagnoli C, Raju M, Padua E. Proprioceptive Focal Stimulation (Equistasi®) for gait and postural balance rehabilitation in patients with Parkinson’s disease: a systematic review. Proc Inst Mech Eng H. 2023;237(2):179-189. doi:10.1177/09544119221141945',
    url: 'https://journals.sagepub.com/doi/abs/10.1177/09544119221141945',
    tags: ['parkinson', 'revisione sistematica', 'evidenza', 'pedro', 'sicurezza', 'cammino', 'equilibrio'],
    text: `Prima revisione sistematica su Equistasi. Ricerca in PubMed, Scopus, PEDro, REHABDATA, Web of Science, CINAHL, EMBASE e MEDLINE fino a luglio 2021. Cinque studi inclusi; qualità metodologica valutata con la scala PEDro (punteggi da 3 a 8, mediana 8).
Conclusioni: evidenza a favore dei benefici della stimolazione focale propriocettiva (Equistasi) su cammino e stabilità posturale nelle persone con Parkinson; il dispositivo appare sicuro e ben tollerato. Gli autori indicano la necessità di ulteriori studi di alta qualità.`,
  },
  {
    id: 'lit-spolaor-2023',
    cat: 'studio',
    title: 'Spolaor et al. 2023 – Calciatrici, fattori di rischio di lesione del legamento crociato anteriore',
    source: 'Spolaor F, Guiotto A, Ciniglio A, Cibin F, Sawacha Z. Effects of a proprioceptive focal stimulation (Equistasi®) on reducing the biomechanical risk factors associated with ACL injury in female footballers. Front Sports Act Living. 2023;5:1134702. doi:10.3389/fspor.2023.1134702',
    url: 'https://www.frontiersin.org/articles/10.3389/fspor.2023.1134702/full',
    tags: ['sport', 'calcio', 'crociato', 'lca', 'acl', 'prevenzione infortuni', 'donne', 'cambio di direzione'],
    text: `10 calciatrici d’élite hanno usato Equistasi per 4 settimane (5 giorni a settimana, 1 ora al giorno). Valutazioni sul campo in 4 momenti: test di Romberg e manovre di cambio di direzione (sidestep cutting) bilaterali.
Risultati: riduzione dei momenti di abduzione di anca e ginocchio, delle forze di reazione al suolo e del momento di dorsiflessione della caviglia da T1 fino a T4, cioè dei fattori biomeccanici associati al rischio di lesione del crociato anteriore.
Conclusione: risultati preliminari su piccolo campione, promettenti per l’inserimento dell’allenamento propriocettivo nei programmi di prevenzione.`,
  },
  {
    id: 'lit-buonanno-2024',
    cat: 'studio',
    title: 'Buonanno et al. 2024 – Dolore cronico, studio pilota randomizzato (Pain and Therapy)',
    source: 'Buonanno P, Iacovazzo C, Marra A, de Siena AU, Josu T, Zampi M, Sedda D, Servillo G, Vargas M. Potential role of focal microvibration (Equistasi®) in the management of chronic pain: a pilot study. Pain Ther. 2024;13(1):185-198. doi:10.1007/s40122-023-00562-6',
    url: 'https://link.springer.com/article/10.1007/s40122-023-00562-6',
    tags: ['dolore cronico', 'dolore', 'studio', 'rct', 'bpi', 'oswestry', 'lavoro', 'napoli', 'federico ii'],
    text: `Disegno: studio pilota (Università Federico II di Napoli, terapia del dolore) su 60 pazienti con dolore cronico di varia origine, randomizzati a Equistasi oppure alla sola terapia farmacologica standard (controllo).
Misure: Brief Pain Inventory (BPI), Oswestry Disability Index (ODI), Work Ability Index (WAI) al basale e dopo 7, 15, 30, 60 e 90 giorni.
Risultati: nel gruppo Equistasi il dolore medio e il dolore peggiore delle ultime 24 ore si sono ridotti in modo significativo dal giorno 15, con effetto mantenuto fino al giorno 90; è migliorata anche l’interferenza del dolore con le attività quotidiane, e sono migliorati sollevamento (ODI) e capacità lavorativa (WAI). Il gruppo di controllo non ha mostrato cambiamenti significativi.
Conclusione: la microvibrazione focale può essere uno strumento efficace nella gestione del dolore cronico in combinazione con altre terapie. Studio pilota, non in cieco rispetto a un dispositivo placebo.`,
  },
  {
    id: 'lit-fmv-review-2025',
    cat: 'studio',
    title: 'Revisione sistematica 2025 – Vibrazione muscolare focale nel Parkinson (J Clin Med)',
    source: 'The potential of focal muscle vibration therapy in the management of Parkinson’s disease: a systematic review. J Clin Med. 2025;14(21):7472. doi:10.3390/jcm14217472',
    url: 'https://doi.org/10.3390/jcm14217472',
    tags: ['vibrazione focale', 'parkinson', 'revisione', 'cadenza', 'cammino'],
    text: `Revisione sulla vibrazione muscolare focale (FMV) in generale nel Parkinson, che include anche studi con Equistasi. Riporta, tra gli effetti descritti negli studi, un miglioramento dei parametri spazio-temporali del cammino (riduzione della cadenza con aumento della lunghezza del passo) ed effetti su equilibrio e postura, con eterogeneità tra dispositivi, frequenze e protocolli.`,
  },
  {
    id: 'lit-sintesi',
    cat: 'studio',
    title: 'Sintesi delle evidenze su Equistasi (stato della letteratura)',
    source: 'Sintesi della base di conoscenza, aggiornata a ottobre 2026',
    tags: ['evidenze', 'letteratura', 'studi', 'pubblicazioni', 'efficacia', 'funziona', 'scientifico', 'bibliografia'],
    text: `Studi peer-reviewed noti su Equistasi:
- Parkinson: Volpe 2014 (RCT fase II, 40 pz), Peppe 2019 (RCT crossover multicentrico sul cammino), Serio 2019 (retrospettivo, 55 pz, cadute), Spolaor 2021 (EMG e postura), Romanato 2021 (crossover biomeccanico, 24 pz), revisione sistematica Alashram 2023 (5 studi), più l’abstract Peppe 2017 (12 pz gravi).
- Sclerosi multipla: Spina 2016 (RCT vs placebo, 20 pz); studio registrato NCT02848898 sulla spasticità.
- Atassie: Leonardi 2017 (11 adulti, SCA e Friedreich), studio pediatrico Front Neurol 2018 (10 bambini).
- Dolore cronico: Buonanno 2024 (60 pz randomizzati).
- Sport: Guiotto 2022 (70 ciclisti), Spolaor 2023 (10 calciatrici).
- Neurofisiologia: Cruciani 2022 (volontari sani).
Giudizio onesto: i risultati sono incoraggianti e coerenti nel suggerire benefici su equilibrio, cammino, cadute e dolore, con buona tollerabilità; tuttavia gli studi sono per lo più piccoli, pilota o non controllati, e alcuni esiti primari non sono risultati significativi (Volpe 2014). Servono studi randomizzati più ampi. Equistasi va considerato un complemento alla riabilitazione e alle terapie, non un sostituto.
Questa sintesi copre la letteratura indicizzata reperita; possono esistere tesi, poster e abstract congressuali non inclusi. Nuovi studi si aggiungono con tools/pdf2kb.py.`,
  },

  /* ───────────────────────── Riabilitazione ───────────────────────── */
  {
    id: 'riab-parkinson',
    cat: 'riabilitazione',
    title: 'Riabilitazione nella malattia di Parkinson',
    source: 'Linee guida europee di fisioterapia nel Parkinson (KNGF/ParkinsonNet 2014); letteratura riabilitativa consolidata',
    tags: ['parkinson', 'fisioterapia', 'esercizio', 'cueing', 'lsvt big', 'tai chi', 'cammino', 'equilibrio', 'freezing'],
    text: `Il Parkinson è una malattia neurodegenerativa con bradicinesia, rigidità, tremore a riposo e, nelle fasi più avanzate, instabilità posturale, freezing della marcia e cadute; ci sono anche sintomi non motori (stipsi, disturbi del sonno, umore, olfatto, pressione bassa in piedi).
L’esercizio fisico regolare è parte della terapia in ogni fase: migliora mobilità, equilibrio, forza, capacità aerobica e qualità di vita.
Componenti principali della fisioterapia:
- Allenamento aerobico (cammino veloce, cyclette, tapis roulant) almeno 150 minuti a settimana secondo tolleranza.
- Esercizi di ampiezza ("pensa in grande"), come nel metodo LSVT BIG.
- Equilibrio: spostamenti di carico, passi in varie direzioni, Tai Chi, esercizi su superfici diverse, doppio compito.
- Cammino con cue esterni: ritmo di un metronomo o musica, linee sul pavimento, contare i passi; strategie di attenzione al passo lungo.
- Strategie per il freezing: fermarsi, spostare il peso, fare un passo indietro o di lato, usare un ritmo o un bersaglio visivo; evitare girate strette, preferire curve ampie.
- Forza e flessibilità (muscoli estensori del tronco, anche, polpacci) e postura.
- Trasferimenti (alzarsi dalla sedia, girarsi nel letto) con strategie di movimento a fasi.
Equistasi (C7 + soleo) può essere usato durante la riabilitazione: negli studi è stato associato a un programma di esercizi per l’equilibrio. Importante coordinare gli orari di esercizio con la terapia farmacologica (fase "on").`,
  },
  {
    id: 'riab-sm',
    cat: 'riabilitazione',
    title: 'Riabilitazione nella sclerosi multipla',
    source: 'Letteratura riabilitativa consolidata sulla sclerosi multipla',
    tags: ['sclerosi multipla', 'fatica', 'spasticità', 'equilibrio', 'calore', 'esercizio', 'fisioterapia'],
    text: `La sclerosi multipla è una malattia infiammatoria e demielinizzante del sistema nervoso centrale. Sintomi frequenti: fatica, disturbi dell’equilibrio e del cammino, spasticità, debolezza, disturbi sensitivi, problemi vescicali, disturbi visivi e cognitivi.
Riabilitazione:
- Esercizio aerobico e di forza progressivo, adattato: riduce la fatica e migliora la funzione.
- Equilibrio e coordinazione: esercizi statici e dinamici, su superfici diverse, a occhi aperti e chiusi, con doppio compito.
- Spasticità: allungamenti quotidiani mantenuti, posture, mobilizzazione, eventuali ortesi; i farmaci e la tossina botulinica sono decisi dal neurologo/fisiatra.
- Gestione della fatica: suddividere le attività, pause programmate, priorità, risparmio energetico.
- Sensibilità al calore (fenomeno di Uhthoff): il caldo peggiora temporaneamente i sintomi; raffreddarsi, allenarsi negli orari freschi.
- Ausili per il cammino quando servono, per sicurezza e per risparmiare energia.
Equistasi: protocollo A (C7, L5, polpacci) per equilibrio e passo; protocollo B per la spasticità di una gamba. Valutazioni utili: Timed Up and Go, Romberg, test dei 25 piedi, 6 minuti.
Un peggioramento nuovo che dura più di 24 ore (perdita di vista, debolezza, formicolii estesi) può essere una ricaduta e va comunicato subito al centro SM.`,
  },
  {
    id: 'riab-atassia',
    cat: 'riabilitazione',
    title: 'Riabilitazione delle atassie',
    source: 'Letteratura riabilitativa sulle atassie cerebellari',
    tags: ['atassia', 'cervelletto', 'coordinazione', 'frenkel', 'equilibrio', 'friedreich'],
    text: `Le atassie (cerebellari, sensitive, ereditarie come SCA e Friedreich) causano scarsa coordinazione, cammino a base allargata, instabilità, tremore intenzionale, disartria.
La riabilitazione intensiva della coordinazione è la terapia con più evidenza: esercizi di equilibrio statico e dinamico, controllo del tronco, esercizi di coordinazione degli arti (tipo Frenkel), cammino con variazioni di velocità e direzione, esercizi a quattro zampe e in ginocchio, attività motorie complesse e videogiochi di movimento (exergame). Benefici maggiori con programmi intensivi e continuativi a domicilio.
Pesi ai polsi/caviglie e ausili possono aiutare alcune persone; la logopedia aiuta parola e deglutizione.
Equistasi è stato studiato nelle atassie ereditarie dell’adulto (Leonardi 2017: miglioramento SARA, Nine-Hole Peg Test e 6 minuti in 3 settimane) e in età pediatrica (studio 2018, 4 settimane, sicuro, effetti sul passo), come complemento alla riabilitazione.`,
  },
  {
    id: 'riab-ictus',
    cat: 'riabilitazione',
    title: 'Riabilitazione dopo ictus',
    source: 'Linee guida di riabilitazione post-ictus; letteratura sulla vibrazione focale nella spasticità',
    tags: ['ictus', 'stroke', 'emiparesi', 'spasticità', 'riabilitazione', 'vibrazione focale', 'neuroplasticità'],
    text: `Dopo un ictus la riabilitazione sfrutta la neuroplasticità ed è più efficace se precoce, intensiva e orientata a compiti reali (task-oriented training): ripetere molte volte gesti utili (raggiungere, afferrare, alzarsi, camminare).
Tecniche con evidenza: allenamento del cammino ad alta intensità, terapia di uso forzato/indotto del braccio colpito (CIMT) in casi selezionati, training dell’equilibrio, rinforzo muscolare, mirror therapy, stimolazione elettrica funzionale, gestione della spasticità (allungamenti, ortesi, tossina botulinica decisa dal medico).
La vibrazione muscolare focale è studiata nella spasticità post-ictus con risultati promettenti su tono e funzione. Per Equistasi non sono stati identificati studi specifici pubblicati sull’ictus in questa base di conoscenza: l’eventuale uso va concordato con fisiatra e fisioterapista.
URGENZA: i segni di un ictus in corso (bocca storta, braccio che cade, difficoltà a parlare, perdita improvvisa di vista o equilibrio) richiedono di chiamare subito il 112/118: il tempo è cervello.`,
  },
  {
    id: 'riab-dolore-cronico',
    cat: 'riabilitazione',
    title: 'Gestione riabilitativa del dolore cronico',
    source: 'Modello biopsicosociale del dolore; linee guida su lombalgia e dolore muscoloscheletrico (es. NICE)',
    tags: ['dolore cronico', 'lombalgia', 'cervicalgia', 'fibromialgia', 'esercizio', 'sensibilizzazione centrale', 'sonno'],
    text: `Il dolore si definisce cronico quando dura oltre 3 mesi. Non dipende solo dal danno ai tessuti: il sistema nervoso può diventare più sensibile (sensibilizzazione centrale) e contano anche sonno, stress, paura del movimento e umore (modello biopsicosociale).
Interventi con buona evidenza:
- Esercizio terapeutico graduale e regolare (qualsiasi tipo che la persona tolleri e apprezzi): è la base.
- Educazione sul dolore (capire che "dolore non significa sempre danno") per ridurre la paura del movimento.
- Esposizione graduale alle attività evitate, ritmo delle attività (pacing).
- Igiene del sonno, gestione dello stress, approcci cognitivo-comportamentali.
- Terapie manuali e fisiche come complemento, non da sole.
- Farmaci solo su indicazione del medico; attenzione all’uso prolungato di antinfiammatori e oppioidi.
Lombalgia comune: restare attivi, evitare il riposo a letto prolungato. Equistasi può essere usato secondo il protocollo dolore (punto doloroso + muscoli + vertebra del metamero) come complemento; studio Buonanno 2024 sul dolore cronico.
Segnali d’allarme che richiedono il medico: febbre, calo di peso inspiegato, storia di tumore, dolore notturno costante non meccanico, trauma importante, perdita di forza, anestesia a sella, disturbi di vescica o intestino.`,
  },
  {
    id: 'riab-equilibrio-cadute',
    cat: 'riabilitazione',
    title: 'Equilibrio e prevenzione delle cadute',
    source: 'Linee guida mondiali sulla prevenzione delle cadute negli anziani (2022); programmi Otago',
    tags: ['cadute', 'equilibrio', 'anziani', 'otago', 'prevenzione', 'casa', 'vertigini'],
    text: `L’equilibrio nasce dall’integrazione di propriocezione, vista e sistema vestibolare, elaborate da cervello e cervelletto, e dalla forza muscolare.
Prevenzione delle cadute:
- Esercizi di equilibrio e forza almeno 3 volte a settimana, progressivi (es. programma Otago, Tai Chi): sono l’intervento più efficace.
- Revisione dei farmaci con il medico (sedativi, antipertensivi, farmaci che danno ipotensione).
- Controllo della vista, calzature stabili, attenzione all’ipotensione ortostatica (alzarsi lentamente).
- Casa sicura: luci notturne, niente tappeti scivolosi, maniglioni in bagno, oggetti d’uso a portata di mano.
- Vitamina D solo se carente, su indicazione medica.
Esercizi base (con supporto vicino e in sicurezza): stare in piedi a piedi uniti, in tandem (un piede davanti all’altro), su un piede; alzarsi dalla sedia senza mani; camminare tallone-punta; spostamenti di carico.
Dopo una caduta con trauma cranico, dolore all’anca o incapacità di alzarsi: soccorso medico.`,
  },
  {
    id: 'riab-propriocezione',
    cat: 'riabilitazione',
    title: 'Esercizi propriocettivi',
    source: 'Letteratura riabilitativa e di medicina dello sport',
    tags: ['propriocezione', 'esercizi', 'tavoletta', 'caviglia', 'distorsione', 'ginocchio', 'prevenzione'],
    text: `L’allenamento propriocettivo migliora il controllo neuromuscolare ed è usato in riabilitazione (distorsioni di caviglia, ricostruzione del crociato, neurologia) e prevenzione degli infortuni.
Progressione tipica: da stabile a instabile (pavimento → cuscino → tavoletta oscillante), da due a un piede, da occhi aperti a chiusi, da statico a dinamico (lanci di palla, perturbazioni, salti e atterraggi controllati), aggiungendo compiti cognitivi.
Programmi di prevenzione negli sport (es. FIFA 11+) riducono gli infortuni a ginocchio e caviglia; nell’atterraggio e nei cambi di direzione è importante evitare il ginocchio che cede verso l’interno (valgo dinamico).
Equistasi fornisce uno stimolo propriocettivo continuo e può essere indossato durante questi esercizi (vedi Spolaor 2023 sulle calciatrici).`,
  },
  {
    id: 'riab-postura',
    cat: 'riabilitazione',
    title: 'Postura, colonna vertebrale e vita quotidiana',
    source: 'Letteratura riabilitativa consolidata',
    tags: ['postura', 'schiena', 'collo', 'ergonomia', 'lavoro al computer', 'cervicale'],
    text: `Non esiste una postura "perfetta": è più importante cambiare spesso posizione. Al computer: schermo all’altezza degli occhi, piedi appoggiati, pause attive ogni 30–45 minuti con movimenti di collo, spalle e schiena.
Esercizi utili: retrazione del mento, mobilità toracica, rinforzo dei muscoli profondi del tronco e dei glutei, allungamento di pettorali e flessori dell’anca.
Nel Parkinson la postura flessa in avanti si contrasta con esercizi di estensione, allungamenti e richiami posturali.`,
  },
  {
    id: 'riab-sport-recupero',
    cat: 'riabilitazione',
    title: 'Allenamento, recupero e prevenzione degli infortuni nello sport',
    source: 'Medicina dello sport, letteratura consolidata',
    tags: ['sport', 'recupero', 'hrv', 'riscaldamento', 'sovrallenamento', 'infortuni', 'sonno'],
    text: `Principi: progressione graduale dei carichi (evitare aumenti bruschi), riscaldamento attivo, forza e propriocezione per prevenire infortuni, sonno adeguato, idratazione e alimentazione.
Il recupero si può monitorare con la variabilità della frequenza cardiaca (HRV) misurata al mattino: un calo persistente rispetto alla media personale, insieme a stanchezza e calo di prestazione, può indicare recupero insufficiente.
Dolore acuto durante lo sport con gonfiore, instabilità o impossibilità a caricare il peso richiede valutazione medica. Dolore toracico, svenimento o palpitazioni durante lo sforzo: interrompere e chiamare il 112.`,
  },

  /* ───────────────────────── Medicina ───────────────────────── */
  {
    id: 'med-parkinson',
    cat: 'medicina',
    title: 'Malattia di Parkinson: informazioni mediche di base',
    source: 'Conoscenze mediche consolidate (criteri MDS)',
    tags: ['parkinson', 'levodopa', 'dopamina', 'sintomi', 'diagnosi', 'terapia', 'fluttuazioni', 'discinesie'],
    text: `Malattia neurodegenerativa legata alla perdita dei neuroni dopaminergici della substantia nigra. Diagnosi clinica (neurologo) basata su bradicinesia più tremore a riposo e/o rigidità.
Terapia: farmaci dopaminergici (levodopa associata a carbidopa o benserazide, dopamino-agonisti, inibitori MAO-B e COMT); nelle fasi avanzate terapie avanzate (stimolazione cerebrale profonda, infusioni). Con gli anni possono comparire fluttuazioni (fasi on/off) e discinesie.
Consigli pratici: assumere la levodopa a orari regolari; le proteine del pasto possono ridurne l’assorbimento (spesso si consiglia di assumerla lontano dai pasti proteici: seguire il neurologo). Non sospendere mai bruscamente i farmaci dopaminergici.
Instabilità posturale e freezing rispondono meno ai farmaci: qui riabilitazione e strategie di movimento sono fondamentali (ambito in cui è stato studiato Equistasi).`,
  },
  {
    id: 'med-sm',
    cat: 'medicina',
    title: 'Sclerosi multipla: informazioni mediche di base',
    source: 'Conoscenze mediche consolidate',
    tags: ['sclerosi multipla', 'ricaduta', 'farmaci', 'risonanza', 'forme'],
    text: `Malattia autoimmune del sistema nervoso centrale con infiammazione e demielinizzazione. Forme: recidivante-remittente (la più frequente all’esordio), secondariamente progressiva, primariamente progressiva. Diagnosi del neurologo con risonanza magnetica e criteri di McDonald.
Terapie modificanti la malattia riducono ricadute e progressione; le ricadute si trattano spesso con cortisonici. Stile di vita: attività fisica, non fumare, vitamina D se carente, sonno.
Sintomi gestibili anche con la riabilitazione: fatica, spasticità, equilibrio, vescica (con il medico).`,
  },
  {
    id: 'med-neuropatia',
    cat: 'medicina',
    title: 'Neuropatia periferica e perdita di sensibilità ai piedi',
    source: 'Conoscenze mediche consolidate',
    tags: ['neuropatia', 'diabete', 'formicolii', 'piedi', 'sensibilità', 'equilibrio'],
    text: `La neuropatia periferica (frequente nel diabete, ma anche per carenza di vitamina B12, alcol, chemioterapia) riduce la sensibilità e la propriocezione dei piedi, peggiorando l’equilibrio di notte o a occhi chiusi.
Utile: controllo glicemico, controllo quotidiano dei piedi, calzature adeguate, esercizi di equilibrio e forza, buona illuminazione. Non applicare dispositivi o cerotti su pelle con ferite o ulcere; nel piede diabetico ogni lesione va vista dal medico. Non sono stati identificati studi pubblicati su Equistasi nella neuropatia: chiedere al medico.`,
  },
  {
    id: 'med-anatomia-punti',
    cat: 'medicina',
    title: 'Anatomia dei punti di applicazione principali',
    source: 'Anatomia umana (Netter); protocolli Equistasi',
    tags: ['anatomia', 'c7', 'l5', 'soleo', 'gastrocnemio', 'tricipite surale', 'medio gluteo', 'quadricipite', 'tibiale anteriore'],
    text: `C7 (vertebra prominente): la più sporgente alla base del collo, si palpa piegando la testa in avanti; quella sopra (C6) scompare quando si estende il collo, C7 resta.
L5: ultima vertebra lombare, circa all’altezza della linea che unisce le creste iliache (che passa tra L4 e L5).
Tricipite surale: gastrocnemio (i due ventri superficiali del polpaccio) e soleo (più profondo, sporge ai lati nella parte bassa del polpaccio, sopra il tendine d’Achille). Il soleo è un muscolo antigravitario chiave per l’equilibrio in piedi.
Medio gluteo: parte alta e laterale del gluteo, sotto la cresta iliaca; stabilizza il bacino quando si sta su una gamba.
Quadricipite: davanti alla coscia; vicino al ginocchio si trova il vasto mediale.
Tibiale anteriore: davanti alla tibia, lato esterno; solleva la punta del piede (debolezza → piede cadente).`,
  },

  /* ───────────────────────── Valutazione ───────────────────────── */
  {
    id: 'val-test',
    cat: 'valutazione',
    title: 'Test e scale per misurare i progressi',
    source: 'Strumenti di valutazione clinica validati',
    tags: ['tug', 'timed up and go', 'berg', 'romberg', 'sara', '6 minuti', 'pdq-39', 'bpi', 'oswestry', 'fes-i', 'test'],
    text: `- Timed Up and Go (TUG): alzarsi da una sedia, camminare 3 metri, girarsi, tornare e sedersi; si cronometra. Negli anziani oltre 12–14 secondi indica rischio di caduta aumentato.
- Test di Romberg: in piedi a piedi uniti, prima a occhi aperti poi chiusi (30 secondi); un peggioramento marcato a occhi chiusi indica deficit propriocettivo. Fare sempre con qualcuno accanto.
- Berg Balance Scale: 14 prove di equilibrio, punteggio 0–56 (sotto 45 rischio di caduta).
- Test del cammino in 6 minuti (6MWT): distanza percorsa in 6 minuti, misura la resistenza.
- SARA: scala di gravità dell’atassia (0–40).
- Nine-Hole Peg Test: destrezza della mano.
- PDQ-39: qualità di vita nel Parkinson. FES-I: paura di cadere.
- Brief Pain Inventory (BPI), scala numerica del dolore 0–10, Oswestry Disability Index (disabilità da lombalgia), Work Ability Index.
Consiglio: per valutare Equistasi ripetere lo stesso test, nelle stesse condizioni (orario, farmaci, scarpe), prima e dopo l’applicazione, meglio con video, e annotare i risultati.`,
  },

  /* ───────────────────────── Sicurezza ───────────────────────── */
  {
    id: 'sic-urgenze',
    cat: 'sicurezza',
    title: 'Segnali d’allarme: quando chiamare subito il 112/118',
    source: 'Indicazioni di primo soccorso consolidate',
    tags: ['urgenza', 'emergenza', '112', '118', 'ictus', 'infarto', 'dolore al petto', 'svenimento', 'allarme'],
    text: `Chiamare subito il 112 (o 118) se compaiono:
- segni di ictus: bocca storta, debolezza o intorpidimento improvviso di un braccio o una gamba, difficoltà a parlare o capire, perdita improvvisa della vista, vertigine violenta con perdita di equilibrio, mal di testa improvviso e fortissimo;
- dolore o oppressione al petto, specie se irradiato a braccio, mandibola o schiena, con sudore o affanno;
- difficoltà a respirare, svenimento, convulsioni, confusione improvvisa;
- dopo una caduta: trauma cranico con sonnolenza, vomito o confusione; impossibilità ad alzarsi; dolore forte all’anca;
- perdita di forza alle gambe con anestesia a sella o perdita di controllo di vescica/intestino (sindrome della cauda equina);
- reazione allergica con gonfiore di viso/gola.
Contattare a breve il medico se: febbre con mal di schiena, dolore che peggiora nonostante il riposo, gonfiore e calore di un polpaccio (possibile trombosi), sintomi neurologici nuovi.`,
  },
  {
    id: 'sic-limiti-assistente',
    cat: 'sicurezza',
    title: 'Cosa può e non può fare l’assistente',
    source: 'Regole dell’assistente Equistasi',
    tags: ['limiti', 'diagnosi', 'medico', 'privacy', 'assistente'],
    text: `L’assistente fornisce informazioni generali su Equistasi, sui protocolli, sulla letteratura scientifica e sulla riabilitazione. Non fa diagnosi, non prescrive farmaci e non sostituisce medico, fisioterapista o farmacista. Le decisioni su terapie e protocolli vanno prese con il professionista sanitario che segue la persona.
Privacy: non è necessario fornire nome, codice fiscale o altri dati personali per usare l’assistente.`,
  },
];

export const DOCS = [...CORE_DOCS, ...EXTRA_DOCS];

export const CATEGORIES = {
  dispositivo: 'Dispositivo',
  protocollo: 'Protocollo',
  studio: 'Studio scientifico',
  riabilitazione: 'Riabilitazione',
  medicina: 'Medicina',
  valutazione: 'Valutazione',
  sicurezza: 'Sicurezza',
};

/** Testo completo della base di conoscenza, nel formato usato dal prompt del modello. */
export function kbAsText(docs = DOCS) {
  return docs
    .map((d) => `<documento id="${d.id}" categoria="${d.cat}">\n# ${d.title}\nFonte: ${d.source}${d.url ? `\nLink: ${d.url}` : ''}\n${d.text}\n</documento>`)
    .join('\n\n');
}
