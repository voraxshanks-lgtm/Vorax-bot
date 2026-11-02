# VORAX BOT

Base initiale du bot WhatsApp, en mode public. MongoDB Atlas stocke les paramètres du bot.

## Fichiers à la racine
`index.js`, `database.js`, `Settings.js`, `settings.js`, `commands.js`, `whatsapp.js`, `package.json`.

## Déploiement Render
- Build command : `npm install`
- Start command : `npm start`
- Variables d'environnement : `MONGODB_URI` et `PAIRING_NUMBER`
- Utiliser un disque persistant pour conserver le dossier `auth_info`.

Ne publie jamais `.env` ni `auth_info`. Utilise uniquement ton propre compte WhatsApp.
Le mode public permet aux utilisateurs d'utiliser les commandes; il ne permet pas aux autres personnes de lier leur compte.
Les fonctions média, welcome/goodbye et anti-link sont encore à développer.
