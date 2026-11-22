#!/bin/zsh
# Rend les écrans du téléphone de nsd-360.html : 780 x 1688 (390 x 844 à 2x), en WebP.
# Usage : ./rendre-ecrans.sh   (depuis n'importe où)
set -e
ICI=${0:A:h}; OUT=$ICI/../ecrans; CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p $OUT
TMP=$(mktemp -d)
cap(){ "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=390,844 --virtual-time-budget=4000 --screenshot="$2" "$1" >/dev/null 2>&1; }
# 1. La capture du site montré dans l'écran « site » (6 s : après les apparitions, avant le bandeau NSD de la démo, ouvert à 9 s)
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=390,790 --virtual-time-budget=6000 --screenshot="$ICI/capture-site.png" "file://$ICI/../../../demos/vitrines/salon/index.html" >/dev/null 2>&1
# 2. Les écrans
for s in intro reunion tournage publie reseaux pub rapport site tarif; do
  cap "file://$ICI/ecrans.html?s=$s" "$TMP/$s.png"
  cwebp -quiet -q 86 "$TMP/$s.png" -o "$OUT/$s.webp"
done
rm -rf $TMP
ls -la $OUT
