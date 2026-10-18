#!/bin/sh
# Copia nel sito i clip dell'avatar fotorealistico generati con Higgsfield,
# così l'app non dipende dal CDN esterno (vedi avatarMedia in assistente/js/config.js).
set -e
HF=https://d8j0ntlcm91z4.cloudfront.net/user_3DOukuRyFd7f2J84gGwrmduEdRX
DIR="$(dirname "$0")/../assistente/media"
mkdir -p "$DIR"
curl -fL -o "$DIR/primo.png"          "$HF/hf_20261018_190841_95f763ba-0b73-443c-92fb-30f6de2642d4.png"
curl -fL -o "$DIR/primo-attesa.mp4"   "$HF/hf_20261018_191020_f2f1ca95-140c-41c9-8da9-bddf6d55f03c.mp4"
curl -fL -o "$DIR/primo-ascolto.mp4"  "$HF/hf_20261018_190954_ea7467ba-e3aa-4e6f-82bc-00f4836bbf6b.mp4"
curl -fL -o "$DIR/primo-parla.mp4"    "$HF/hf_20261018_190954_b99a2d05-178a-4fe6-96b8-70ef136a8810.mp4"
echo "Fatto: file in assistente/media/. Aggiungili al repository (git add assistente/media)."
