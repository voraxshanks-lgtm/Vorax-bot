const fs = require('fs');
const path = require('path');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { handleCommand } = require('./commands');
const { getSettings } = require('./settings');

const AUTH_DIR = path.join(__dirname, '..', 'auth_info');

function digits(value) { return String(value || '').replace(/\D/g, ''); }

async function startWhatsApp() {
  const pairingNumber = digits(process.env.PAIRING_NUMBER);
  if (!pairingNumber || pairingNumber.includes('X')) {
    throw new Error('Configure PAIRING_NUMBER dans .env avec TON propre numéro WhatsApp.');
  }

  async function connect() {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'connecting' && !state.creds.registered) {
        try {
          const code = await sock.requestPairingCode(pairingNumber);
          console.log(`\nVORAX BOT pairing code: ${code}\n`);
          console.log('Sur TON WhatsApp : Appareils connectés > Connecter un appareil > Connecter avec un numéro.');
        } catch (err) {
          console.error('Pairing code error:', err.message);
        }
      }
      if (connection === 'open') console.log('VORAX BOT connected to WhatsApp.');
      if (connection === 'close') {
        const status = lastDisconnect?.error?.output?.statusCode;
        if (status !== DisconnectReason.loggedOut) {
          console.log('WhatsApp connection closed; reconnecting in 5 seconds.');
          setTimeout(connect, 5000);
        } else {
          console.error('Session logged out. Remove auth_info only if you intend to pair again.');
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages || []) {
        try {
          if (!msg.message || msg.key.fromMe) continue;
          const chat = msg.key.remoteJid;
          if (!chat || chat === 'status@broadcast' || chat.endsWith('@newsletter')) continue;
          const senderJid = msg.key.participant || chat;
          const senderNumber = digits(senderJid.split('@')[0]);
          const ownerNumber = digits(process.env.PAIRING_NUMBER);
          const isOwner = senderNumber === ownerNumber;
          const isGroup = chat.endsWith('@g.us');
          const body = msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption || '';
          if (!body) continue;

          const settings = await getSettings(sock.user.id);
          if (settings.mode === 'private' && !isOwner) continue;

          let isAdmin = false;
          let isBotAdmin = false;
          if (isGroup) {
            const metadata = await sock.groupMetadata(chat);
            const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
            isAdmin = admins.some(id => id.split('@')[0] === senderNumber);
            const botNumber = digits(sock.user.id.split(':')[0]);
            isBotAdmin = admins.some(id => digits(id.split('@')[0]) === botNumber);
          }

          await handleCommand({
            sock, msg, text: body.trim(), sender: senderJid, chat,
            isGroup, isOwner, isAdmin, isBotAdmin
          });
        } catch (err) {
          console.error('Message handler error:', err.message);
        }
      }
    });

    return sock;
  }

  await connect();
}

module.exports = { startWhatsApp };
