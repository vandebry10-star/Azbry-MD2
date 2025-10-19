// plugins/group-level.js
// Level & XP BALANCED PROGRESSION (Febry Edition 😎)

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'database')
const DB_FILE  = path.join(DATA_DIR, 'level.json')

const MAX_LEVEL = 20

// ======= XP Settings (Balanced) =======
// XP lebih kecil, leveling butuh waktu lebih lama tapi tetap cepat
const BASE_CHAT_XP = [5, 15]        // Chat biasa
const MEDIA_XP = {                  
  imageMessage: 15,
  videoMessage: 20,
  stickerMessage: 10,
  documentMessage: 10,
  audioMessage: 8
}
const REPLY_XP = 12
const COMMAND_XP = 8
const MENTIONED_XP = 5
const DAILY_BONUS_XP = 150          // Bonus harian tetap lumayan besar

// Cooldown lebih ketat (anti spam XP)
const COOLDOWN = {
  base: 60,        // chat biasa: 1 menit
  media: 90,       // kirim media: 1,5 menit
  reply: 45,
  command: 20,
  mentioned: 180
}

// ======= Utility =======
function ensureDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}), 'utf-8')
}
function loadDB() { ensureDB(); try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')||'{}') } catch { return {} } }
function saveDB(db){ ensureDB(); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8') }
function isGroupJid(jid=''){ return jid.endsWith('@g.us') }
function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min }

// 💡 XP requirement makin besar tiap level
function totalXpForLevel(n){ 
  if (n<=0) return 0
  return Math.floor(150 * n * (n + 1) / 2) // double dari versi sebelumnya biar gak cepat
}

function getLevelName(level){
  if (level <= 5)  return '🍼 Bocah Chat'
  if (level <= 10) return '💬 Tukang Nimbrung'
  if (level <= 15) return '🔥 Kang Aktif'
  if (level <= 20) return '👑 Dewa Grup'
  return '😎 Beyond Limit'
}

function getUser(db, gid, uid, name=''){
  if (!db[gid]) db[gid] = {}
  if (!db[gid][uid]) db[gid][uid] = { xp: 0, level: 1, name: name||'', lastDaily: 0, cd: {} }
  const u = db[gid][uid]
  if (name) u.name = name
  if (!u.cd) u.cd = {}
  return u
}
function inCooldown(user, reason, seconds){
  const now = Math.floor(Date.now()/1000)
  const last = user.cd?.[reason] || 0
  if (now - last < seconds) return true
  user.cd[reason] = now
  return false
}
function addXP(db, gid, uid, amount){
  const u = getUser(db, gid, uid)
  const before = u.level
  u.xp += amount
  while (u.level < MAX_LEVEL && u.xp >= totalXpForLevel(u.level+1)) {
    u.level++
  }
  return { leveled: u.level > before, newLevel: u.level }
}

function makeLevelUpText(uid, newLevel) {
  const rank = getLevelName(newLevel)
  return `🎉 *Naik Level!* @${uid.split('@')[0]} sekarang level *${newLevel}* — _${rank}_` +
         `\n\nℹ️ Cek level kamu: *.lvl*\n🏆 Lihat leaderboard: *.leaderboard*`
}

async function autoXP(m, conn){
  const gid = m.chat
  const uid = m.sender
  if (!isGroupJid(gid) || !uid || m.fromMe) return
  if (global.isXPAllowed && !global.isXPAllowed(gid)) return

  const db = loadDB()
  const user = getUser(db, gid, uid, m.pushName || uid.split('@')[0])
  let leveledNotice = null

  // 🎁 Bonus harian
  if (Date.now() - (user.lastDaily || 0) > 86400000) {
    user.lastDaily = Date.now()
    const { leveled, newLevel } = addXP(db, gid, uid, DAILY_BONUS_XP)
    if (leveled) leveledNotice = `🎁 *Bonus Harian* +${DAILY_BONUS_XP} XP\n${makeLevelUpText(uid, newLevel)}`
    saveDB(db)
  }

  const text = (m.text || '').trim()
  const looksLikeCmd = !!text && /^[.!/#$%^&*?]/.test(text)

  // 💬 Chat biasa
  if (!looksLikeCmd && !inCooldown(user, 'base', COOLDOWN.base)) {
    const gain = rand(...BASE_CHAT_XP)
    const { leveled, newLevel } = addXP(db, gid, uid, gain)
    if (leveled) leveledNotice = makeLevelUpText(uid, newLevel)
    saveDB(db)
  }

  // 📎 Media
  const mtype = m.mtype
  if (MEDIA_XP[mtype] && !inCooldown(user, `media:${mtype}`, COOLDOWN.media)) {
    const { leveled, newLevel } = addXP(db, gid, uid, MEDIA_XP[mtype])
    if (leveled) leveledNotice = makeLevelUpText(uid, newLevel)
    saveDB(db)
  }

  // 💬 Reply
  if (m.quoted && m.quoted.sender && m.quoted.sender !== uid && !inCooldown(user, 'reply', COOLDOWN.reply)) {
    const { leveled, newLevel } = addXP(db, gid, uid, REPLY_XP)
    if (leveled) leveledNotice = makeLevelUpText(uid, newLevel)
    saveDB(db)
  }

  // ⚙️ Command
  if (looksLikeCmd && !inCooldown(user, 'command', COOLDOWN.command)) {
    const { leveled, newLevel } = addXP(db, gid, uid, COMMAND_XP)
    if (leveled) leveledNotice = makeLevelUpText(uid, newLevel)
    saveDB(db)
  }

  // 🏷️ Mention target
  const mentioned = (m.mentionedJid || []).filter(Boolean)
  for (const target of mentioned) {
    const u2 = getUser(db, gid, target)
    if (!inCooldown(u2, `mentioned:${uid}`, COOLDOWN.mentioned)) {
      addXP(db, gid, target, MENTIONED_XP)
    }
  }
  saveDB(db)

  if (leveledNotice) await conn.reply(gid, leveledNotice, m, { mentions: [uid] })
}

// ========== COMMAND ==========
let handler = async (m, { conn, command, usedPrefix, args, text, isOwner }) => {
  const gid = m.chat
  const uid = m.sender
  if (!isGroupJid(gid)) return conn.reply(gid, 'Fitur level hanya untuk grup.', m)

  const db = loadDB()
  const user = getUser(db, gid, uid, m.pushName || uid.split('@')[0])

  // 📊 .lvl
  if (/^lvl$/i.test(command)) {
    const curLevel = user.level
    const curXP = user.xp
    const rank = getLevelName(curLevel)

    const nextLevel = Math.min(curLevel + 1, MAX_LEVEL)
    const needForThis = totalXpForLevel(curLevel)
    const needForNext = totalXpForLevel(nextLevel)
    const inLevelXP = curXP - needForThis
    const toNext = Math.max(needForNext - curXP, 0)
    const progress = `${inLevelXP} / ${needForNext - needForThis}`

    let txt = `╭─❖ 𝐋𝐄𝐕𝐄𝐋 𝐏𝐑𝐎𝐅𝐈𝐋𝐄\n`
    txt += `│ 👤 @${uid.split('@')[0]}\n`
    txt += `│ 💠 Level : ${curLevel}\n`
    txt += `│ 📈 XP : ${progress}\n`
    txt += `│ 🏷️ Rank : ${rank}\n`
    if (curLevel >= MAX_LEVEL) {
      txt += `│ 🔒 MAX LEVEL 🎉\n`
    } else {
      txt += `│ 🎯 Next : ${getLevelName(curLevel + 1)} (${toNext} XP lagi)\n`
    }
    txt += `╰───────────────────❖`
    return conn.reply(gid, txt, m, { mentions: [uid] })
  }

  // 🏆 .leaderboard
  if (/^leaderboard$/i.test(command)) {
    const group = db[gid] || {}
    const arr = Object.entries(group).map(([jid, v]) => ({
      jid,
      name: v.name || jid.split('@')[0],
      level: v.level || 1,
      xp: v.xp || 0
    }))
    if (!arr.length) return conn.reply(gid, 'Leaderboard masih kosong.', m)
    arr.sort((a, b) => (b.level - a.level) || (b.xp - a.xp))
    const top = arr.slice(0, 10)
    const lines = top.map((u, i) =>
      `${i + 1}. @${u.jid.split('@')[0]} — Lvl ${u.level} (${getLevelName(u.level)}) • ${u.xp} XP`
    )
    const txt = `🏆 *Leaderboard Grup (Top 10)*\n${lines.join('\n')}`
    return conn.reply(gid, txt, m, { mentions: top.map(u => u.jid) })
  }

  // 🎁 .givexp
  if (/^givexp$/i.test(command)) {
    if (!isOwner) return conn.reply(gid, 'Khusus Owner.', m)
    if (!m.mentionedJid?.length || !args[args.length-1]) {
      return conn.reply(gid, `Contoh: ${usedPrefix}givexp @user 200`, m)
    }
    const amount = parseInt(args[args.length-1])
    if (isNaN(amount)) return conn.reply(gid, 'Jumlah XP tidak valid.', m)
    const targets = m.mentionedJid
    for (const t of targets) {
      getUser(db, gid, t)
      addXP(db, gid, t, amount)
    }
    saveDB(db)
    return conn.reply(gid, `✅ +${amount} XP untuk ${targets.map(j=>`@${j.split('@')[0]}`).join(', ')}`, m, { mentions: targets })
  }
}

handler.help = ['lvl', 'leaderboard', 'givexp @user <jumlah>']
handler.tags = ['group', 'xp', 'fun']
handler.command = /^(lvl|leaderboard|givexp)$/i
handler.group = true

module.exports = handler
module.exports.before = async function (m) {
  try { await autoXP(m, this) } catch (e) {}
}