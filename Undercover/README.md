# Undercover

Site statique (HTML/CSS/JS) — FR / EN / LA.

## Test local
    cd undercover
    python -m http.server 8000
Puis ouvrir http://localhost:8000 (ouvrir index.html directement ne marche pas : le CSV est chargé via fetch).

## Ajouter des mots
Éditer `data/words.csv` (colonnes : theme, fr_1, fr_2, en_1, en_2, la_1, la_2).
Pour un nouveau thème, ajouter son nom dans `js/i18n.js` (`themeNames`).
