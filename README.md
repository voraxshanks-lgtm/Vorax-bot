# VORAX BOT

WhatsApp bot public, style royal noir et or. MongoDB stocke les paramètres; Baileys conserve la session WhatsApp dans `auth_info/` sur le disque persistant de l'hébergeur.

## Important
- Connecte uniquement un compte WhatsApp que tu possèdes et contrôles.
- Le mode `public` signifie que les utilisateurs peuvent utiliser les commandes; cela ne signifie pas que des visiteurs peuvent connecter leurs numéros au bot.
- Ne partage jamais `auth_info/`, `.env` ou ton code de liaison.
- Baileys est une bibliothèque non officielle; l'utilisation peut être soumise aux conditions WhatsApp.
- Héberge sur un service Node.js avec disque persistant. Une fonction serverless comme Vercel ne convient pas à une connexion WhatsApp persistante.

## Installation
1. Installe Node.js 20 ou plus récent.
2. Copie `.env.example` vers `.env`.
3. Remplis `MONGODB_URI` et `PAIRING_NUMBER` (numéro dont tu es propriétaire, format international sans `+`).
4. Dans un terminal :
   ```bash
   npm install
   npm start
   ```
5. Lis le code de liaison dans les logs du serveur, puis dans WhatsApp : Appareils connectés > Connecter un appareil > Connecter avec un numéro.
6. Garde le dossier `auth_info/` sur un disque persistant.

## Déploiement Render
- Crée un service Web Node.
- Build command : `npm install`
- Start command : `npm start`
- Ajoute les variables de `.env` dans Environment.
- Active un disque persistant et monte-le au chemin du projet pour préserver `auth_info/`.
- N'ajoute jamais `.env` ou `auth_info/` à GitHub.

## Commandes
`.menu`, `.ping`, `.alive`, `.system`
`.mode public|private`, `.prefix .`
`.welcome on|off`, `.goodbye on|off`, `.antilink on|off`
`.autolike on|off`, `.autoview on|off`, `.likeemoji ❤️`
`.groupinfo`, `.linkgroup`, `.revoke`, `.lockgroup`, `.unlockgroup`, `.leave`

Les fonctions média sont volontairement en attente d'un fournisseur fiable. N'ajoute pas des API inconnues ou des clés privées dans le code.
