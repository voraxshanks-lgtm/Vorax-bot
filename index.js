require('dotenv').config();

const express = require('express');
const pino = require('pino');
const { startWhatsApp } = require('./src/whatsapp');
const { connectDatabase } = require('./src/database');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VORAX BOT</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#080808;color:#f4e5bd;font-family:Arial,sans-serif}
main{width:min(92%,520px);padding:32px;border:1px solid #8f6b2b;border-radius:20px;background:linear-gradient(145deg,#17130c,#080808);text-align:center}
h1{letter-spacing:5px;color:#d7ad55}p{color:#c9c0ae;line-height:1.6}.status{display:inline-block;padding:8px 14px;border:1px solid #8f6b2b;border-radius:30px;color:#e6c77e}
small{color:#887b63}</style></head><body><main><h1>VORAX BOT</h1><div class="status">WhatsApp service</div>
<p>THE SUPREMARCY VORAX EMPIRE</p><p>Bot WhatsApp en cours de fonctionnement.<br>Utilise <b>.menu</b> dans WhatsApp pour afficher les commandes.</p>
<small>Royal black &amp; gold edition</small></main></body></html>`);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'VORAX BOT', time: new Date().toISOString() });
});

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function main() {
  const port = Number(process.env.PORT || 8000);
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI manquant dans .env');
  await connectDatabase();
  app.listen(port, '0.0.0.0', () => logger.info(`VORAX BOT web server on ${port}`));
  await startWhatsApp();
}

main().catch(err => {
  logger.error({ err }, 'Startup failed');
  process.exit(1);
});
