#!/bin/sh
# Copia nel sito i clip dell'avatar fotorealistico generati con Higgsfield,
# così l'app non dipende dal CDN esterno (vedi avatarMedia in assistente/js/config.js).
set -e
HF=https://d8j0ntlcm91z4.cloudfront.net/user_3DOukuRyFd7f2J84gGwrmduEdRX
DIR="$(dirname "$0")/../assistente/media"
mkdir -p "$DIR"
curl -fL -o "$DIR/fisioterapista.png"         "$HF/hf_20261018_184307_3e71e495-fcab-4959-938b-e1264f42eafa.png"
curl -fL -o "$DIR/fisioterapista-attesa.mp4"  "$HF/hf_20261018_184415_e121879a-bed5-476e-9deb-bf518e61aa21.mp4"
curl -fL -o "$DIR/fisioterapista-ascolto.mp4" "$HF/hf_20261018_184409_65e39e5b-3c02-4ca6-b619-47bf8b444277.mp4"
curl -fL -o "$DIR/fisioterapista-parla.mp4"   "$HF/hf_20261018_184409_102d55d9-01e1-44ea-b33a-e44b126a6e48.mp4"
echo "Fatto: file in assistente/media/. Aggiungili al repository (git add assistente/media)."
