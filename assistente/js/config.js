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
  // Nome dell'avatar (uguale ad ASSISTANT_NAME nel Worker)
  name: 'Primo',
  // Avatar in tempo reale LiveAvatar (HeyGen): true se nel Worker ci sono LIVEAVATAR_API_KEY e LIVEAVATAR_AVATAR_ID.
  // Finché non è pronto, o se manca, si usa l'avatar qui sotto.
  liveAvatar: false,
  // Lingua iniziale se l'utente non ne ha scelta una (altrimenti quella del telefono); si cambia dal menu 🌐
  lang: '',
  // Avatar: 'foto' = fisioterapista fotorealistica (video), 'illustrato' = personaggio disegnato (SVG).
  avatar: 'foto',
  // Clip dell'avatar fotorealistico (Primo, fisioterapista), generati con Higgsfield dallo stesso ritratto.
  // Prima la copia nel sito (assistente/media/, vedi tools/scarica-avatar.sh), poi quella su Higgsfield.
  avatarMedia: {
    poster: ['media/primo.png', `${HF}/hf_20261018_190841_95f763ba-0b73-443c-92fb-30f6de2642d4.png`],
    idle: ['media/primo-attesa.mp4', `${HF}/hf_20261018_191020_f2f1ca95-140c-41c9-8da9-bddf6d55f03c.mp4`],
    listening: ['media/primo-ascolto.mp4', `${HF}/hf_20261018_190954_ea7467ba-e3aa-4e6f-82bc-00f4836bbf6b.mp4`],
    speaking: ['media/primo-parla.mp4', `${HF}/hf_20261018_190954_b99a2d05-178a-4fe6-96b8-70ef136a8810.mp4`],
  },
};
