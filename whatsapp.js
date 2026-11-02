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
const AUTH_DIR = path.join(__dirname, 'auth_info');
const digits = value => String(value || '').replace(/\\D/g, '');

async function startWhatsApp() {
  const ownNumber = digits(process.env.PAIRING_NUMBER);

  if (!ownNumber || ownNumber.includes('X')) {
    throw new Error('Configure PAIRING_NUMBER avec ton propre numéro WhatsApp.');
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

    let pairingRequested = false;

    sock.ev.on('connection.update', async update => {
      const { connection, lastDisconnect } = update;

      if (connection === 'connecting' && !state.creds.registered && !pairingRequested) {
        pairingRequested = true;
        try {
          const code = await sock.requestPairingCode(ownNumber);
          console.log('Code de liaison VORAX BOT :', code);
          console.log('Saisis-le dans WhatsApp > Appareils connectés > Connecter avec un numéro.');
        } catch (error) {
          pairingRequested = false;
          console.error('Erreur de liaison :', error.message);
        }
      }

      if (connection === 'open') {
        console.log('✅ VORAX BOT connecté à WhatsApp.');
      }

      if (connection === 'close') {
        const status = lastDisconnect?.error?.output?.statusCode;

        if (status === DisconnectReason.loggedOut) {
          console.error('Session déconnectée. Supprime auth_info sur le serveur puis relance une liaison.');
          return;
        }

        console.log('Connexion fermée. Nouvelle tentative dans 5 secondes.');
        setTimeout(() => {
          connect().catch(error => console.error('Reconnexion impossible :', error.message));
        }, 5000);
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
          const isOwner = senderNumber === ownNumber;
          const isGroup = chat.endsWith('@g.us');

          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            '';

          if (!text.trim()) continue;

          let isAdmin = false;
          let isBotAdmin = false;

          if (isGroup) {
            const metadata = await sock.groupMetadata(chat);
            const admins = metadata.participants
              .filter(participant => participant.admin)
              .map(participant => participant.id);

            isAdmin = admins.some(id => digits(id.split('@')[0]) === senderNumber);
            const botNumber = digits(sock.user.id.split(':')[0]);
            isBotAdmin = admins.some(id => digits(id.split('@')[0]) === botNumber);
          }

          await handleCommand({
            sock, msg, text: text.trim(), chat, isGroup,
            isOwner, isAdmin, isBotAdmin
          });
        } catch (error) {
          console.error('Erreur de traitement message :', error.message);
        }
      }
    });
  }

  await connect();
}

module.exports = { startWhatsApp };
