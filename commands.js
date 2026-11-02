const os = require('os');
const { getSettings, updateSettings } = require('./settings');

const digits = value => String(value || '').replace(/\\D/g, '');

async function handleCommand(ctx) {
  const {
    sock, msg, text, chat, isGroup,
    isOwner, isAdmin, isBotAdmin
  } = ctx;

  const botKey = digits(sock.user.id.split(':')[0]);
  const settings = await getSettings(botKey);
  const prefix = settings.prefix || '.';

  if (!text.startsWith(prefix)) return false;

  const [rawCommand, ...args] = text.slice(prefix.length).trim().split(/\\s+/);
  const command = (rawCommand || '').toLowerCase();
  const reply = body => sock.sendMessage(chat, { text: body }, { quoted: msg });

  if (settings.mode === 'private' && !isOwner) return true;

  async function requireOwner() {
    if (!isOwner) await reply('Commande réservée au propriétaire du bot.');
    return isOwner;
  }

  switch (command) {
    case 'menu':
    case 'help':
      await reply([
        '👑 *VORAX BOT*',
        '> THE SUPREMARCY VORAX EMPIRE',
        '',
        '*GÉNÉRAL*',
        `${prefix}ping`,
        `${prefix}alive`,
        `${prefix}system`,
        '',
        '*RÉGLAGES — PROPRIÉTAIRE*',
        `${prefix}mode public|private`,
        `${prefix}prefix .`,
        `${prefix}welcome on|off`,
        `${prefix}goodbye on|off`,
        `${prefix}antilink on|off`,
        `${prefix}autolike on|off`,
        `${prefix}autoview on|off`,
        '',
        '*GROUPES*',
        `${prefix}groupinfo`,
        `${prefix}linkgroup`,
        `${prefix}revoke`,
        `${prefix}lockgroup`,
        `${prefix}unlockgroup`,
        `${prefix}leave`
      ].join('\\n'));
      return true;

    case 'ping':
      await reply('🏓 Pong ! VORAX BOT répond.');
      return true;

    case 'alive':
      await reply('👑 VORAX BOT est actif.\\nTHE SUPREMARCY VORAX EMPIRE');
      return true;

    case 'system':
      await reply(
        `*VORAX BOT — SYSTEM*\\nNode.js : ${process.version}` +
        `\\nUptime : ${Math.floor(process.uptime())} secondes` +
        `\\nRAM libre : ${Math.round(os.freemem() / 1048576)} MB`
      );
      return true;

    case 'mode':
      if (!await requireOwner()) return true;
      if (!['public', 'private'].includes(args[0])) {
        await reply(`Utilisation : ${prefix}mode public|private`);
        return true;
      }
      await updateSettings(botKey, { mode: args[0] });
      await reply(`Mode modifié : ${args[0]}`);
      return true;

    case 'prefix':
      if (!await requireOwner()) return true;
      if (!args[0] || args[0].length > 3) {
        await reply(`Utilisation : ${prefix}prefix .`);
        return true;
      }
      await updateSettings(botKey, { prefix: args[0] });
      await reply(`Préfixe modifié : ${args[0]}`);
      return true;

    case 'welcome':
    case 'goodbye':
    case 'antilink':
    case 'autolike':
    case 'autoview': {
      if (!await requireOwner()) return true;
      if (!['on', 'off'].includes(args[0])) {
        await reply(`Utilisation : ${prefix}${command} on|off`);
        return true;
      }
      const field = {
        welcome: 'welcome',
        goodbye: 'goodbye',
        antilink: 'antiLink',
        autolike: 'autoLike',
        autoview: 'autoView'
      }[command];

      await updateSettings(botKey, { [field]: args[0] === 'on' });
      await reply(`${command} : ${args[0]}`);
      return true;
    }

    case 'groupinfo':
      if (!isGroup) {
        await reply('Cette commande fonctionne dans un groupe.');
        return true;
      }
      {
        const metadata = await sock.groupMetadata(chat);
        await reply(`*${metadata.subject}*\\nMembres : ${metadata.participants.length}`);
        return true;
      }

    case 'linkgroup':
      if (!isGroup) {
        await reply('Groupe uniquement.');
        return true;
      }
      if (!isOwner && !isAdmin) {
        await reply('Réservé aux administrateurs du groupe.');
        return true;
      }
      if (!isBotAdmin) {
        await reply('Le bot doit être administrateur.');
        return true;
      }
      {
        const code = await sock.groupInviteCode(chat);
        await reply(`https://chat.whatsapp.com/${code}`);
        return true;
      }

    case 'revoke':
      if (!isGroup) {
        await reply('Groupe uniquement.');
        return true;
      }
      if (!isOwner && !isAdmin) {
        await reply('Réservé aux administrateurs.');
        return true;
      }
      if (!isBotAdmin) {
        await reply('Le bot doit être administrateur.');
        return true;
      }
      await sock.groupRevokeInvite(chat);
      await reply('Lien du groupe réinitialisé.');
      return true;

    case 'lockgroup':
    case 'unlockgroup':
      if (!isGroup) {
        await reply('Groupe uniquement.');
        return true;
      }
      if (!isOwner && !isAdmin) {
        await reply('Réservé aux administrateurs.');
        return true;
      }
      if (!isBotAdmin) {
        await reply('Le bot doit être administrateur.');
        return true;
      }
      await sock.groupSettingUpdate(
        chat,
        command === 'lockgroup' ? 'announcement' : 'not_announcement'
      );
      await reply(command === 'lockgroup'
        ? 'Mode annonce activé.'
        : 'Les membres peuvent envoyer des messages.');
      return true;

    case 'leave':
      if (!isGroup) {
        await reply('Groupe uniquement.');
        return true;
      }
      if (!await requireOwner()) return true;
      await reply('VORAX BOT quitte le groupe.');
      await sock.groupLeave(chat);
      return true;

    case 'song':
    case 'music':
    case 'video':
    case 'ytmp3':
    case 'ytmp4':
    case 'tiktok':
    case 'tt':
    case 'dl':
      await reply('Cette fonction média sera ajoutée après vérification du service utilisé.');
      return true;

    default:
      return false;
  }
}

module.exports = { handleCommand };
