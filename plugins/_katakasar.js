// plugins/_katakasars.js
// Badword Filter (soft warning, tanpa kick) — WITA — FULL LIST ver. FebryWesker
process.env.TZ = 'Asia/Makassar'

const fs = require('fs')
const path = require('path')
const DBFILE = path.join(__dirname, '..', 'database', 'katakasars.json')

// ===== Storage =====
function defaultList() {
  return [
    "anjing","anjir","anjay","anjai","anjayy","anjayyy","anjrot","anjrr","anjy","anjim",
    "babi","bangsat","bajingan","brengsek","bego","bloon","blo'on","bodoh","tolol","goblok",
    "asw","asu","anj","kampret","setan","iblis","kontol","memek","jembut","pepek",
    "pler","peler","pentil","titit","toket","ngewe","ngentot","ngntot","colmek","coli",
    "itil","jancok","cok","cuk","anjg","sarap","tai","taek","kentot","telek","pantek","puki",
    "pukimak","burit","pelacur","lonte","jalang","sundal","hencet","keparat","idiot",
    "kntl","knntl","kntol","pelerlu","panteq","anying","ngetot","ngehe","ngentd","ngentut",
    "kacuk","pepekmu","pukimu","itilmu","jembutmu","kntlmu","ngocok","colok","masturb",
    "fak","fuck","bitch","bastard","shit","dick","asshole","motherfucker","retard","stupid",
    "idiot","whore","slut","nigger","fuckyou","fuck u","fck","suck","bastard","ngeyel","sange",
    "nafsu","anjayyy","anjayyy","anjirr","anjjr","anjr","anjg","kontl","bajeng","keparad"
  ]
}

function loadCfg () {
  try { return JSON.parse(fs.readFileSync(DBFILE, 'utf8')) } catch {}
  return { on:true, cooldown:30, bypassAdmins:true, list: defaultList() }
}
function saveCfg (cfg) {
  fs.mkdirSync(path.dirname(DBFILE), { recursive:true })
  fs.writeFileSync(DBFILE, JSON.stringify(cfg, null, 2))
}

// ===== Helpers =====
function escapeRegex (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function norm (s='') { return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase() }
function getText(m){
  if (m.text) return m.text
  if (m.caption) return m.caption
  const msg = m.msg || m.message || {}
  if (msg.conversation) return msg.conversation
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text
  const k = Object.keys(msg)[0]; const inner = k && msg[k]
  if (inner?.caption) return inner.caption
  if (inner?.text) return inner.text
  return ''
}

// cooldown memory
global.__KKS_COOL = global.__KKS_COOL || {}
function hitCooldown (gid, uid, sec) {
  const key = gid + '|' + uid
  const now = Date.now()
  const last = global.__KKS_COOL[key] || 0
  if (now - last < sec * 1000) return true
  global.__KKS_COOL[key] = now
  return false
}

// =============== COMMAND HANDLER ===============
let handler = async function (m, { conn, args, usedPrefix, command }) {
  if (!/^(bw|badword)$/i.test(command)) return
  const sub = (args[0] || '').toLowerCase()
  const cfg = loadCfg()

  if (!sub || sub === 'status') {
    const body = [
      `Status: ${cfg.on ? '🟢 ON' : '🔴 OFF'}`,
      `Cooldown: ${cfg.cooldown || 30}s`,
      `Bypass Admin: ${cfg.bypassAdmins ? 'Ya' : 'Tidak'}`,
      `Kata (${cfg.list.length}): ${cfg.list.slice(0,10).join(', ')} ... (${cfg.list.length} total)`
    ].join('\n')
    return conn.reply(m.chat, body, m)
  }
  if (sub === 'on' || sub === 'off') {
    cfg.on = sub === 'on'; saveCfg(cfg)
    return m.reply(`Filter kata kasar ${cfg.on ? 'AKTIF' : 'NONAKTIF'}.`)
  }
  if (sub === 'add') {
    const w = (args.slice(1).join(' ') || '').trim()
    if (!w) return m.reply(`Contoh: ${usedPrefix}${command} add goblok`)
    if (!cfg.list.includes(w)) cfg.list.push(w)
    saveCfg(cfg); return m.reply(`Ditambah: ${w}`)
  }
  if (sub === 'del' || sub === 'rm' || sub === 'hapus') {
    const w = (args.slice(1).join(' ') || '').trim()
    if (!w) return m.reply(`Contoh: ${usedPrefix}${command} del goblok`)
    const i = cfg.list.indexOf(w); if (i >= 0) cfg.list.splice(i, 1)
    saveCfg(cfg); return m.reply(`Dihapus: ${w}`)
  }
  if (sub === 'list') {
    return m.reply(`Daftar kata (${cfg.list.length}):\n- ${cfg.list.join('\n- ')}`)
  }
  if (sub === 'cooldown') {
    const n = parseInt(args[1]); if (isNaN(n) || n < 5) return m.reply('Isi angka detik (min 5).')
    cfg.cooldown = n; saveCfg(cfg); return m.reply(`Cooldown di-set: ${n}s`)
  }
  if (sub === 'bypassadmin') {
    cfg.bypassAdmins = !cfg.bypassAdmins; saveCfg(cfg)
    return m.reply(`Bypass admin: ${cfg.bypassAdmins ? 'Ya' : 'Tidak'}`)
  }

  return m.reply(
    `Pakai:\n` +
    `${usedPrefix}${command} status\n` +
    `${usedPrefix}${command} on|off\n` +
    `${usedPrefix}${command} add <kata>\n` +
    `${usedPrefix}${command} del <kata>\n` +
    `${usedPrefix}${command} list\n` +
    `${usedPrefix}${command} cooldown <detik>\n` +
    `${usedPrefix}${command} bypassadmin`
  )
}

// =============== LISTENER GLOBAL ===============
handler.all = async function (m) {
  const cfg = loadCfg()
  if (!cfg.on) return
  if (!m.chat || !m.chat.endsWith('@g.us')) return
  if (!m.sender) return

  const isOwner = m.isOwner || false
  const isAdmin = m.isAdmin || false
  if (isOwner) return
  if (cfg.bypassAdmins && isAdmin) return

  const raw = getText(m)
  if (!raw) return

  const text = norm(raw)
  const words = (cfg.list || []).map(w => escapeRegex(norm(w))).filter(Boolean)
  if (!words.length) return

  const re = new RegExp(
    `(?:^|\\b|\\s|[.,!?/\\\\()\\-_"'*])(${words.join('|')})(?=$|\\b|\\s|[.,!?/\\\\()\\-_"'*])`,
    'i'
  )
  if (!re.test(text)) return

  if (hitCooldown(m.chat, m.sender, cfg.cooldown || 30)) return

  try { await this.reply(m.chat, '⚠️ Santai bro… jaga kata-kata ya. (filter aktif)', m) } catch {}
}

handler.help = ['bw','badword']
handler.tags = ['auto','moderation','group']
handler.command = /^(bw|badword)$/i
handler.group = true

module.exports = handler