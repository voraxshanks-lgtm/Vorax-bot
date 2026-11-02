# VORAX BOT — Multi-utilisateurs

Site Node.js/Express + Baileys : chaque visiteur saisit son propre numéro WhatsApp et demande un code de liaison individuel. Les sessions sont séparées dans `auth_info/<numero>/`.

## Installation
- Node.js 20+
- `npm install`
- Définir `MONGODB_URI` dans l'environnement.
- `npm start`

## Render
- Type : Web Service
- Runtime : Node
- Build Command : `npm install`
- Start Command : `npm start`
- Environment Variable : `MONGODB_URI` = URI MongoDB privée.
- Avec un disque persistant monté sur `/var/data`, ajouter `AUTH_DIR=/var/data/auth_info`.

Aucun `PAIRING_NUMBER` global n'est nécessaire. Chaque utilisateur entre son numéro sur la page d'accueil. Ne jamais publier les dossiers de session ni les secrets.

## Important
Le code de liaison est personnel et doit rester privé. Les utilisateurs ne doivent connecter que leurs propres comptes ou des comptes pour lesquels ils ont une autorisation. Une limite de 5 demandes par adresse IP et par fenêtre de 10 minutes est appliquée en mémoire.

Le stockage local des sessions exige un disque persistant pour survivre aux redémarrages. Sans disque persistant, les sessions peuvent être perdues. Les limites et conditions de l'hébergeur s'appliquent.
