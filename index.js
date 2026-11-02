require('dotenv').config();

const express = require('express');
const { connectDatabase } = require('./database');
const { startWhatsApp } = require('./whatsapp');

const app = express();
app.disable('x-powered-by');

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VORAX BOT</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#080808;color:#f1dfb5;font-family:Arial,sans-serif}
main{width:min(90%,500px);padding:32px;border:1px solid #a9823c;border-radius:20px;text-align:center;background:#15110a}
h1{color:#d6ad55;letter-spacing:5px}
p{line-height:1.7}
</style>
</head>
<body><main><h1>VORAX BOT</h1><p>THE SUPREMARCY VORAX EMPIRE</p><p>Le service est en ligne.<br>Envoie <b>.menu</b> au bot sur WhatsApp.</p></main></body>
</html>`);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'VORAX BOT' });
});

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('La variable MONGODB_URI est absente.');
  }

  await connectDatabase();

  const port = Number(process.env.PORT || 8000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`VORAX BOT web server démarré sur le port ${port}`);
  });

  await startWhatsApp();
}

main().catch(error => {
  console.error('Erreur au démarrage :', error.message);
  process.exit(1);
});
