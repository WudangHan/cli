#!/bin/bash
# SEXTANT — lanceur double-clic (macOS)  |  SYNTHEX-APP-SEXTANT-v1.0
# IMPORTANT : place ce fichier dans le MEME dossier que sextant.py.
# Premiere fois : clic droit -> Ouvrir  (ou : chmod +x SEXTANT.command)

cd "$(dirname "$0")" || exit 1
clear
echo "================================================"
echo "    SEXTANT — Intelligence Report (SYNTHEX)"
echo "================================================"
echo

# 1) Python 3 present ?
if ! command -v python3 >/dev/null 2>&1; then
  echo "[X] Python 3 introuvable."
  echo "    Installe-le :  xcode-select --install   (ou  brew install python)"
  echo
  read -n 1 -s -r -p "Appuie sur une touche pour fermer..."
  exit 1
fi

# 2) sextant.py a cote ?
if [ ! -f sextant.py ]; then
  echo "[X] sextant.py introuvable dans :"
  echo "    $(pwd)"
  echo "    Mets SEXTANT.command dans le meme dossier que sextant.py."
  echo
  read -n 1 -s -r -p "Appuie sur une touche pour fermer..."
  exit 1
fi

# 3) Parametres (Entree = valeur par defaut)
read -r -p "Domaine [code|math|agents] (defaut: code) : " DOMAIN
DOMAIN=${DOMAIN:-code}
read -r -p "Horizon AAAA-MM (defaut: 2026-12)        : " HORIZON
HORIZON=${HORIZON:-2026-12}

OUT="rapport_SEXTANT_${DOMAIN}_$(date +%Y%m%d-%H%M%S).json"
echo
echo ">> Generation du rapport ($DOMAIN, $HORIZON)..."
echo
python3 sextant.py report --domain "$DOMAIN" --horizon "$HORIZON" --auto-approve --out "$OUT"
STATUS=$?
echo
if [ "$STATUS" -eq 0 ]; then
  echo "[OK] Rapport ecrit : $OUT"
  open "$OUT" 2>/dev/null
else
  echo "[!] Publication bloquee par le veto/HITL (code $STATUS)."
fi
echo
read -n 1 -s -r -p "Appuie sur une touche pour fermer..."
echo
