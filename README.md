# Cyrias Buddy — Portail Modulaire

## Installation GitHub Pages

1. Créer un repo GitHub
2. Uploader tout le contenu de ce dossier
3. Settings > Pages > Source: main branch > / (root)
4. Le site est live sur `https://votre-user.github.io/votre-repo/`

## Installation locale

```bash
python3 -m http.server 8000
# Ouvrir http://localhost:8000
```

## Structure

```
index.html          — Shell SPA + sidebar + CSS inline
assets/css/main.css — Composants CSS custom
assets/js/          — storage, ui, router, app
modules/            — 20 modules JS
pages/              — 20 pages HTML
tests/              — TNR (89 tests)
```
