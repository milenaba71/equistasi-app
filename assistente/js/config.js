/*
 * Configurazione dell'assistente.
 *
 * apiUrl: indirizzo del Worker Cloudflare (cartella worker/), ad esempio
 *   'https://equistasi-assistente.<account>.workers.dev'
 * Il Worker risponde con Claude (/chat), verifica il seriale del dispositivo da studio (/activate)
 * e apre l'avatar HeyGen (/avatar/token).
 * Se è vuoto l'assistente funziona in modalità "offline" (ricerca nella base di conoscenza locale)
 * e non chiede l'attivazione.
 */
const HF = 'https://d8j0ntlcm91z4.cloudfront.net/user_3DOukuRyFd7f2J84gGwrmduEdRX';

window.ASSISTANT_CONFIG = {
  apiUrl: '',
  // Nome dell'avatar (es. 'Diandra' se recuperi il tuo avatar HeyGen)
  name: 'Stasi',
  // Avatar in tempo reale LiveAvatar (HeyGen): true se nel Worker ci sono LIVEAVATAR_API_KEY e LIVEAVATAR_AVATAR_ID.
  // Finché non è pronto, o se manca, si usa l'avatar qui sotto.
  liveAvatar: false,
  // Lingua di riconoscimento vocale e sintesi
  lang: 'it-IT',
  // Dopo che l'avatar ha parlato, riapre il microfono (conversazione a mani libere)
  handsFree: false,
  // Avatar: 'foto' = fisioterapista fotorealistica (video), 'illustrato' = personaggio disegnato (SVG).
  avatar: 'foto',
  // Clip dell'avatar fotorealistico, generati con Higgsfield dallo stesso ritratto.
  // Prima la copia nel sito (assistente/media/, vedi tools/scarica-avatar.sh), poi quella su Higgsfield.
  avatarMedia: {
    poster: ['media/fisioterapista.png', `${HF}/hf_20261018_184307_3e71e495-fcab-4959-938b-e1264f42eafa.png`],
    idle: ['media/fisioterapista-attesa.mp4', `${HF}/hf_20261018_184415_e121879a-bed5-476e-9deb-bf518e61aa21.mp4`],
    listening: ['media/fisioterapista-ascolto.mp4', `${HF}/hf_20261018_184409_65e39e5b-3c02-4ca6-b619-47bf8b444277.mp4`],
    speaking: ['media/fisioterapista-parla.mp4', `${HF}/hf_20261018_184409_102d55d9-01e1-44ea-b33a-e44b126a6e48.mp4`],
  },
};
