/*
 * Configurazione dell'assistente.
 *
 * chatUrl: indirizzo del Worker Cloudflare (cartella worker/), ad esempio
 *   'https://equistasi-assistente.<account>.workers.dev/chat'
 * Se è vuoto, o se il servizio non risponde, l'assistente funziona in modalità
 * "offline": risponde cercando nella base di conoscenza locale.
 */
window.ASSISTANT_CONFIG = {
  chatUrl: '',
  // Lingua di riconoscimento vocale e sintesi
  lang: 'it-IT',
  // Dopo che l'avatar ha parlato, riapre il microfono (conversazione a mani libere)
  handsFree: false,
};
