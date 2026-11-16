#!/bin/zsh
# Récupère la couverture d'un ou plusieurs reels Instagram pour la section #reseaux.
# Usage : ./assets/reels/maj-couvertures.sh CODE1 CODE2 …   (le code = le bout d'URL après /reel/)
# Puis ajouter les codes en tête de liste dans reseaux.js, et monter ?v= de reseaux.js dans index.html.
# Regarder la couverture avant de publier : certaines sont une image floue, à écarter.
cd "${0:A:h}" || exit 1
for code in "$@"; do
  tmp=$(mktemp -t reel).jpg
  if curl -sfL -A "Mozilla/5.0" -o "$tmp" "https://www.instagram.com/p/$code/media/?size=l"; then
    ffmpeg -loglevel error -y -i "$tmp" -vf "scale=540:960:force_original_aspect_ratio=increase,crop=540:960" -q:v 5 "$code.jpg" && echo "ok  $code"
  else
    echo "ÉCHEC $code (code faux ou reel supprimé)"
  fi
  rm -f "$tmp"
done
