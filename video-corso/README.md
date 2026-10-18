# Video corso EQUISTASI — voce italiana "Julian"

Video corso narrato tratto dal deck "Corso EQUISTASI per terapisti" (29 slide).

- `slide/` — le 29 slide renderizzate a 1920×1080 (PNG), in ordine.
- `narrazione.json` — testo della narrazione in italiano, una voce per slide (`[id_slide, testo]`).
- `render-slide.mjs` — script Playwright usato per renderizzare le slide dal deck.

La narrazione è generata con Higgsfield (voce preset **Julian**);
il montaggio (slide + audio, 1080p H.264/AAC) è eseguito con ffmpeg.

Versione 2: narrazione con motore ElevenLabs (voce Julian), nome pronunciato "Equistàsi",
e 4 clip illustrative di valutazione (anamnesi, Timed Up and Go, palpazione lombare,
mobilità cervicale) inserite nelle slide 10, 14, 20 e 24.
