# TontineBénin PM — Application de bureau

Wrapper Electron : une vraie application installable (Windows / Linux) qui ouvre
le Project Manager déployé sur le VPS. Les données restent centralisées côté serveur.

## Tester en local
```bash
cd desktop
npm install
npm start            # ouvre l'app (charge le VPS)
```

## Construire les installeurs

### Linux (natif, sur ta machine Linux)
```bash
cd desktop
npm install
npm run dist:linux   # → dist/TontineBenin-PM-*.AppImage  et  *.deb
```

### Windows (.exe)
Le `.exe` se construit **automatiquement via GitHub Actions** (pas besoin de Windows) :
1. Pousse le code sur GitHub.
2. Onglet **Actions** → « Build application de bureau » → **Run workflow**.
3. Télécharge les installeurs dans les **artefacts** du run (Windows + Linux).

Pour publier une **Release** (liens de téléchargement pour l'équipe) : crée un tag.
```bash
git tag v1.0.0 && git push origin v1.0.0
```
Les installeurs seront attachés à la Release GitHub.

## Changer l'URL du serveur
Par défaut : `https://vps-tontinebenin.taila91a50.ts.net:10000`.
Pour pointer ailleurs, définis `TB_PM_URL` au lancement, ou modifie la valeur par
défaut dans `main.js` avant de builder.
