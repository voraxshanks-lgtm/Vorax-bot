const { getSettings, updateSettings } = require('./settings');

const owners = new Set(
  String(process.env.PAIRING_NUMBER || '').replace(/\D/g, '')
    ? [String(process.env.PAIRING_NUMBER).replace(/\D/g, '')] : []
);

const help = (prefix) => [
  '*👑 VORAX BOT — MENU*',
  '',
  '*GÉNÉRAL*',
  `${prefix}menu — afficher le menu`,
  `${prefix}ping — latence`,
  `${prefix}alive — état du bot`,
  `${prefix}system — informations système`,
  '',
  '*RÉGLAGES (propriétaire)*',
  `${prefix}mode public|private`,
  `${prefix}prefix .`,
  `${prefix}welcome on|off`,
  `${prefix}goodbye on|off`,
  `${prefix}antilink on|off`,
  `${prefix}autolike on|off`,
  `${prefix}autoview on|off`,
  `${prefix}likeemoji ❤️`,
  '',
  '*GROUPES (administrateurs)*',
  `${prefix}groupinfo`,
  `${prefix}linkgroup`,
  `${prefix}revoke`,
  `${prefix}lockgroup / ${prefix}unlockgroup`,
  `${prefix}leave`,
  '',
  '*MÉDIAS*',
  'Les téléchargements seront activés uniquement avec un fournisseur vérifié et configuré.',
  '',
  '> THE SUPREMARCY VORAX EMPIRE'
].join('\n');

async function handleCommand({ sock, msg, text, sender, chat, isGroup, isOwner, isAdmin, isBotAdmin }) {
  const settings = await getSettings(sock.user.id);
  const prefix = settings.prefix || '.';
  if (!text.startsWith(prefix)) return false;
  const [commandRaw, ...args] = text.slice(prefix.length).trim().split(/\s+/);
  const command = (commandRaw || '').toLowerCase();
  const arg = args.join(' ');
  const reply = (body) => sock.sendMessage(chat, { text: body }, { quoted: msg });

  if (settings.mode === 'private' && !isOwner) return true;

  switch (command) {
    case 'menu':
    case 'help':
      await reply(help(prefix)); return true;
    case 'ping': {
      const start = Date.now();
      await reply(`🏓 Pong : ${Date.now() - start} ms`); return true;
    }
    case 'alive':
      await reply('👑 *VORAX BOT est actif.*\nTHE SUPREMARCY VORAX EMPIRE'); return true;
    case 'system':
      await reply(`*VORAX BOT — SYSTEM*\nNode: ${process.version}\nUptime: ${Math.floor(process.uptime())} secondes\nMode: ${settings.mode}\nPréfixe: ${prefix}`); return true;
    case 'mode':
      if (!isOwner) return reply('Commande réservée au propriétaire.');
      if (!['public', 'private'].includes(args[0])) return reply(`Usage: ${prefix}mode public|private`);
      await updateSettings(sock.user.id, { mode: args[0] }); await reply(`Mode défini sur ${args[0]}.`); return true;
    case 'prefix':
      if (!isOwner) return reply('Commande réservée au propriétaire.');
      if (!args[0] || args[0].length > 3) return reply(`Usage: ${prefix}prefix .`);
      await updateSettings(sock.user.id, { prefix: args[0] }); await reply(`Préfixe changé : ${args[0]}`); return true;
    case 'welcome':
    case 'goodbye':
    case 'antilink':
    case 'autolike':
    case 'autoview': {
      if (!isOwner) return reply('Commande réservée au propriétaire.');
      if (!['on', 'off'].includes(args[0])) return reply(`Usage: ${prefix}${command} on|off`);
      const field = { welcome: 'welcome', goodbye: 'goodbye', antilink: 'antiLink', autolike: 'autoLike', autoview: 'autoView' }[command];
      await updateSettings(sock.user.id, { [field]: args[0] === 'on' });
      await reply(`${command} : ${args[0]}`); return true;
    }
    case 'likeemoji':
      if (!isOwner) return reply('Commande réservée au propriétaire.');
      if (!arg || arg.length > 8) return reply(`Usage: ${prefix}likeemoji ❤️`);
      await updateSettings(sock.user.id, { likeEmoji: arg }); await reply('Emoji de réaction mis à jour.'); return true;
    case 'groupinfo':
      if (!isGroup) return reply('Cette commande fonctionne uniquement dans un groupe.');
      {
        const meta = await sock.groupMetadata(chat);
        await reply(`*${meta.subject}*\nMembres : ${meta.participants.length}\nCréé par : ${meta.owner || 'Inconnu'}`);
        return true;
      }
    case 'linkgroup':
      if (!isGroup) return reply('Groupe uniquement.');
      if (!isAdmin && !isOwner) return reply('Réservé aux administrateurs du groupe.');
      if (!isBotAdmin) return reply('Le bot doit être administrateur.');
      {
        const code = await sock.groupInviteCode(chat);
        await reply(`Lien du groupe : https://chat.whatsapp.com/${code}`);
        return true;
      }
    case 'revoke':
      if (!isGroup) return reply('Groupe uniquement.');
      if (!isAdmin && !isOwner) return reply('Réservé aux administrateurs.');
      if (!isBotAdmin) return reply('Le bot doit être administrateur.');
      await sock.groupRevokeInvite(chat); await reply('Lien d’invitation réinitialisé.'); return true;
    case 'lockgroup':
    case 'unlockgroup':
      if (!isGroup) return reply('Groupe uniquement.');
      if (!isAdmin && !isOwner) return reply('Réservé aux administrateurs.');
      if (!isBotAdmin) return reply('Le bot doit être administrateur.');
      await sock.groupSettingUpdate(chat, command === 'lockgroup' ? 'announcement' : 'not_announcement');
      await reply(command === 'lockgroup' ? 'Seuls les administrateurs peuvent envoyer des messages.' : 'Tous les membres peuvent envoyer des messages.');
      return true;
    case 'leave':
      if (!isGroup) return reply('Groupe uniquement.');
      if (!isOwner) return reply('Seul le propriétaire du bot peut utiliser cette commande.');
      await reply('Le bot quitte le groupe.');
      await sock.groupLeave(chat); return true;
    case 'song':
    case 'music':
    case 'video':
    case 'ytmp3':
    case 'ytmp4':
    case 'tiktok':
    case 'tt':
    case 'dl':
      await reply('Cette fonction média sera activée après configuration d’un fournisseur fiable. Aucun lien ou fichier externe n’est téléchargé pour le moment.');
      return true;
    default:
      return false;
  }
}

module.exports = { handleCommand };
