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

const AUTH_ROOT = process.env.AUTH_DIR || path.join(__dirname, 'auth_info');
const sessions = new Map();
const digits = value => String(value || '').replace(/\D/g, '');
const safeFolder = phone => path.join(AUTH_ROOT, phone);

function validPhone(phone) {
  return /^\d{8,15}$/.test(phone);
}

async function createSocket(phone, session) {
  fs.mkdirSync(safeFolder(phone), { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(safeFolder(phone));
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    browser: ['VORAX BOT', 'Chrome', '1.0.0']
  });

  session.sock = sock;
  session.status = state.creds.registered ? 'connecting' : 'waiting_code';
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async update => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      session.status = 'connected';
      session.code = null;
      console.log(`VORAX BOT connecté pour ${phone.slice(0, 3)}***`);
    }
    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode;
      if (status === DisconnectReason.loggedOut) {
        session.status = 'logged_out';
        session.sock = null;
        if (session.resolveCode) {
          session.rejectCode(new Error('Connexion annulée depuis WhatsApp. Recommence la liaison.'));
        }
        return;
      }
      session.status = 'reconnecting';
      setTimeout(() => {
        if (sessions.get(phone) === session) {
          createSocket(phone, session).catch(err => {
            session.status = 'error';
            console.error('Reconnexion impossible :', err.message);
          });
        }
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
        const isOwner = senderNumber === phone;
        const isGroup = chat.endsWith('@g.us');
        const text = msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption || '';
        if (!text.trim()) continue;
        let isAdmin = false;
        let isBotAdmin = false;
        if (isGroup) {
          const metadata = await sock.groupMetadata(chat);
          const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
          isAdmin = admins.some(id => digits(id.split('@')[0]) === senderNumber);
          const botNumber = digits(sock.user.id.split(':')[0]);
          isBotAdmin = admins.some(id => digits(id.split('@')[0]) === botNumber);
        }
        await handleCommand({ sock, msg, text: text.trim(), chat, isGroup, isOwner, isAdmin, isBotAdmin });
      } catch (err) {
        console.error('Erreur commande :', err.message);
      }
    }
  });

  return { sock, state };
}

async function connectUser(rawPhone) {
  const phone = digits(rawPhone);
  if (!validPhone(phone)) throw new Error('Numéro invalide. Utilise le format international, chiffres uniquement.');

  const existing = sessions.get(phone);
  if (existing) {
    if (existing.status === 'connected') return { status: 'connected', message: 'Ce compte est déjà connecté.' };
    if (existing.code) return { status: 'waiting_code', code: existing.code };
    if (existing.pending) return existing.pending;
  }

  const session = { status: 'starting', sock: null, code: null, pending: null };
  sessions.set(phone, session);
  session.pending = new Promise(async (resolve, reject) => {
    session.resolveCode = resolve;
    session.rejectCode = reject;
    let settled = false;
    const finish = value => { if (!settled) { settled = true; resolve(value); } };
    const fail = err => { if (!settled) { settled = true; sessions.delete(phone); reject(err); } };
    session.rejectCode = fail;
    const timeout = setTimeout(() => fail(new Error('Le code n’est pas arrivé à temps. Réessaie dans quelques instants.')), 30000);
    try {
      const { state, sock } = await createSocket(phone, session);
      if (state.creds.registered) {
        clearTimeout(timeout);
        session.status = 'connecting';
        finish({ status: 'connecting', message: 'Une session existe déjà. Connexion en cours.' });
        return;
      }
      // Baileys pairing codes are requested only for the number entered by this visitor.
      const code = await sock.requestPairingCode(phone);
      clearTimeout(timeout);
      session.code = String(code).match(/.{1,4}/g)?.join('-') || String(code);
      session.status = 'waiting_code';
      finish({ status: 'waiting_code', code: session.code });
    } catch (err) {
      clearTimeout(timeout);
      fail(err);
    }
  });
  try { return await session.pending; }
  finally { session.pending = null; }
}

async function restoreSavedSessions() {
  fs.mkdirSync(AUTH_ROOT, { recursive: true });
  const folders = fs.readdirSync(AUTH_ROOT, { withFileTypes: true })
    .filter(item => item.isDirectory() && validPhone(item.name));
  for (const folder of folders) {
    const phone = folder.name;
    if (sessions.has(phone)) continue;
    const session = { status: 'starting', sock: null, code: null, pending: null };
    sessions.set(phone, session);
    createSocket(phone, session).catch(err => {
      session.status = 'error';
      console.error('Restauration session impossible :', err.message);
    });
  }
  console.log(`${folders.length} session(s) WhatsApp trouvée(s) sur le disque.`);
}

module.exports = { connectUser, restoreSavedSessions };
