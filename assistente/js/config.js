/*
 * Configurazione dell'assistente.
 *
 * chatUrl: indirizzo del Worker Cloudflare (cartella worker/), ad esempio
 *   'https://equistasi-assistente.<account>.workers.dev/chat'
 * Se è vuoto, o se il servizio non risponde, l'assistente funziona in modalità
 * "offline": risponde cercando nella base di conoscenza locale.
 */
const HF = 'https://d8j0ntlcm91z4.cloudfront.net/user_3DOukuRyFd7f2J84gGwrmduEdRX';

window.ASSISTANT_CONFIG = {
  chatUrl: '',
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
