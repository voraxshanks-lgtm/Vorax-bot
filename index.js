require('dotenv').config();
const express = require('express');
const { connectDatabase } = require('./database');
const { connectUser, restoreSavedSessions } = require('./whatsapp');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

// Simple in-memory limits to discourage automated pairing-code requests.
const attempts = new Map();
function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(time => now - time < 10 * 60 * 1000);
  if (recent.length >= 5) return res.status(429).json({ error: 'Trop de demandes. Réessaie dans 10 minutes.' });
  recent.push(now);
  attempts.set(ip, recent);
  next();
}

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VORAX BOT — Connexion</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at top,#241b0d,#070707 60%);color:#f4ead4;font-family:Arial,sans-serif;display:grid;place-items:center;padding:20px}
main{width:min(100%,470px);padding:28px;border:1px solid #a9823c;border-radius:20px;background:#11100df2;box-shadow:0 20px 70px #0008}h1{margin:0;color:#d8b15d;letter-spacing:5px;text-align:center} .brand{text-align:center;color:#bca77d;font-size:12px;letter-spacing:2px;margin:9px 0 28px}
label{display:block;margin:15px 0 8px;color:#dfc78f}input{width:100%;padding:15px;border:1px solid #6d572d;border-radius:10px;background:#090909;color:white;font-size:17px;outline:none}button{width:100%;padding:15px;margin-top:15px;border:0;border-radius:10px;background:linear-gradient(100deg,#a77a2d,#e3c16d);color:#171108;font-weight:bold;font-size:16px;cursor:pointer}button:disabled{opacity:.55;cursor:wait}.hint{color:#a99b7d;font-size:13px;line-height:1.6}.result{display:none;margin-top:20px;padding:17px;border:1px solid #6d572d;border-radius:12px;text-align:center}.code{font-size:27px;font-weight:bold;letter-spacing:4px;color:#e7c56e;margin:10px}.error{color:#ff9b9b}.ok{color:#9fe0a7}ol{padding-left:22px;text-align:left;line-height:1.8;font-size:14px}
</style></head><body><main><h1>VORAX BOT</h1><div class="brand">THE SUPREMARCY VORAX EMPIRE</div>
<p>Connecte ton propre compte WhatsApp pour utiliser ton bot.</p>
<label for="phone">Ton numéro WhatsApp (format international)</label><input id="phone" type="tel" inputmode="numeric" placeholder="2250700000000" maxlength="15">
<p class="hint">Écris l'indicatif du pays et le numéro, sans +, espace ni tiret. Exemple fictif : 2250700000000.</p>
<button id="connect">OBTENIR MON CODE</button><div id="result" class="result" aria-live="polite"></div>
<p class="hint">Chaque numéro possède sa propre session. Ne partage jamais ton code de liaison. Utilise uniquement un compte que tu possèdes ou que tu es autorisé à connecter.</p>
</main><script>
const btn=document.getElementById('connect'),phone=document.getElementById('phone'),result=document.getElementById('result');
btn.addEventListener('click',async()=>{result.style.display='block';result.className='result';result.textContent='Demande du code en cours…';btn.disabled=true;
try{const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:phone.value})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Une erreur est survenue.');if(data.code){result.innerHTML='<div>TON CODE DE LIAISON</div><div class="code"></div><ol><li>Ouvre WhatsApp sur ton téléphone.</li><li>Va dans Appareils connectés.</li><li>Choisis Connecter un appareil, puis connecter avec un numéro.</li><li>Saisis le code affiché ici.</li></ol>';result.querySelector('.code').textContent=data.code;}else{result.innerHTML='<div class="ok"></div>';result.querySelector('div').textContent=data.message||'Connexion en cours.';}}catch(e){result.classList.add('error');result.textContent=e.message;}finally{btn.disabled=false;}});
</script></body></html>`);
});

app.post('/api/connect', rateLimit, async (req, res) => {
  try {
    const result = await connectUser(req.body?.phone);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Impossible de générer le code.' });
  }
});
app.get('/health', (_req, res) => res.json({ ok: true, service: 'VORAX BOT' }));

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('La variable MONGODB_URI est absente.');
  await connectDatabase();
  const port = Number(process.env.PORT || 8000);
  app.listen(port, '0.0.0.0', () => console.log(`VORAX BOT démarré sur le port ${port}`));
  await restoreSavedSessions();
}
main().catch(error => { console.error('Erreur au démarrage :', error.message); process.exit(1); });
