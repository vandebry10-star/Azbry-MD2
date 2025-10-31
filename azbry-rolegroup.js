// plugins/group-level.js
// Level & XP — 5 Level, XP cuma dari chat & stiker (cooldown 5s), progres lama

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'database')
const DB_FILE  = path.join(DATA_DIR, 'level.json')

// ======= KONFIG =======
const MAX_LEVEL = 5

// XP sangat lambat
// Target XP level n: SCALE * n * (n + 1) / 2
// Contoh: n=2 -> 3*SCALE, n=5 -> 15*SCALE
const SCALE = 5000  // naikin kalau mau LEBIH lama lagi

// Sumber XP (hanya dua)
const CHAT_XP_RANGE = [2, 3]      // chat biasa
const STICKER_XP     = 6          // stiker

// Cooldown 5 detik
const CD_SECONDS = 5

// ======= Utils =======
function ensureDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}), 'utf-8')
}
function loadDB() { ensureDB(); try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')||'{}') } catch { return {} } }
function saveDB(db){ ensureDB(); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8') }
function isGroupJid(jid=''){ return jid.endsWith('@g.us') }
function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min }

// Target XP kumulatif untuk level n
function totalXpForLevel(n){
  if (n <= 0) return 0
  return Math.floor(SCALE * n * (n + 1) / 2)
}

function getLevelName(level) {
  if (level <= 1)  return '𝐘𝐚𝐩𝐩𝐢𝐧𝐠'
  if (level === 2) return '𝐊𝐢𝐧𝐠 𝐘𝐚𝐩𝐩𝐢𝐧𝐠'
  if (level === 3) return '𝐘𝐚𝐩𝐩𝐢𝐧𝐠 𝐅𝐢𝐧𝐚𝐥 𝐁𝐨𝐬𝐬'
  if (level === 4) return '𝐊𝐢𝐧𝐠 𝐘𝐚𝐩𝐩𝐢𝐧𝐠 𝐅𝐢𝐧𝐚𝐥 𝐁𝐨𝐬𝐬 𝐏𝐫𝐨𝐦𝐚𝐱'
  return '𝐊𝐢𝐧𝐠 𝐘𝐚𝐩𝐩𝐢𝐧𝐠 𝐅𝐢𝐧𝐚𝐥 𝐁𝐨𝐬𝐬 𝐏𝐫𝐨𝐦𝐚𝐱'
}

function getUser(db, gid, uid, name=''){
  if (!db[gid]) db[gid] = {}
  if (!db[gid][uid]) db[gid][uid] = { xp: 0, level: 1, name: name||'', cd: {} }
  const u = db[gid][uid]
  if (name) u.name = name
  if (!u.cd) u.cd = {}
  return u
}
function inCooldown(user, key, seconds){
  const now = Math.floor(Date.now()/1000)
  const last = user.cd[key] || 0
  if (now - last < seconds) return true
  user.cd[key] = now
  return false
}

function addXP(db, gid, uid, amount){
  const u = getUser(db, gid, uid)
  const before = u.level
  u.xp += amount
  while (u.level < MAX_LEVEL && u.xp >= totalXpForLevel(u.level + 1)) {
    u.level++
  }
  return { leveled: u.level > before, newLevel: u.level }
}

function makeLevelUpText(uid, newLevel) {
  const rank = getLevelName(newLevel)
  return `🎉 *Naik Level!* @${uid.split('@')[0]} sekarang level *${newLevel}* — _${rank}_` +
         `\n\nℹ️ Cek level: *.lvl*\n🏆 Leaderboard: *.leaderboard*`
}

// ======= AUTO XP (CHAT & STIKER SAJA) =======
async function autoXP(m, conn){
  const gid = m.chat
  const uid = m.sender
  if (!isGroupJid(gid) || !uid || m.fromMe) return
  if (global.isXPAllowed && !global.isXPAllowed(gid)) return

  const db = loadDB()
  const user = getUser(db, gid, uid, m.pushName || uid.split('@')[0])
  let leveledNotice = null

  const text = (m.text || '').trim()
  const isCmd = !!text && /^[.!/#$%^&*?]/.test(text)
  const isSticker = m.mtype === 'stickerMessage'

  // Chat biasa → XP kecil, cooldown 5s
  if (!isCmd && !isSticker && !inCooldown(user, 'chat', CD_SECONDS)) {
    const gain = rand(...CHAT_XP_RANGE)
    const { leveled, newLevel } = addXP(db, gid, uid, gain)
    if (leveled) leveledNotice = makeLevelUpText(uid, newLevel)
    saveDB(db)
  }

  // Stiker → XP sedang, cooldown 5s
  if (isSticker && !inCooldown(user, 'sticker', CD_SECONDS)) {
    const { leveled, newLevel } = addXP(db, gid, uid, STICKER_XP)
    if (leveled) leveledNotice = makeLevelUpText(uid, newLevel)
    saveDB(db)
  }

  // Tidak ada sumber XP lain (NO reply/command/media/daily/mentioned)

  if (leveledNotice) await conn.reply(gid, leveledNotice, m, { mentions: [uid] })
}

// ========== COMMAND ==========
let handler = async (m, { conn, command, usedPrefix, args, text, isOwner }) => {
  const gid = m.chat
  const uid = m.sender
  if (!isGroupJid(gid)) return conn.reply(gid, 'Fitur level hanya untuk grup.', m)

  const db = loadDB()
  const user = getUser(db, gid, uid, m.pushName || uid.split('@')[0])

  // .lvl
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

    let txt = `╭──「 𝐋𝐄𝐕𝐄𝐋 𝐒𝐓𝐀𝐓 」\n`
    txt += `│ 👤 @${uid.split('@')[0]}\n`
    txt += `│ 🔰 Level : ${curLevel}\n`
    txt += `│ 📈 XP : ${progress}\n`
    txt += `│ 🏅 Rank : ${rank}\n`
    if (curLevel >= MAX_LEVEL) {
      txt += `│ 🔒 MAX LEVEL 🎉\n`
    } else {
      txt += `│ 🎯 Next : ${getLevelName(curLevel + 1)} (${toNext} XP lagi)\n`
    }
    txt += `╰──────────────────────`
    return conn.reply(gid, txt, m, { mentions: [uid] })
  }

  // .leaderboard
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

    let txt = `╭──「 𝐋𝐄𝐀𝐃𝐄𝐑𝐁𝐎𝐀𝐑𝐃 𝐓𝐎𝐏 𝟏𝟎 」\n`
    for (const [i, u] of top.entries()) {
      txt += `│ ${i+1}. @${u.jid.split('@')[0]} — Lvl ${u.level} (${u.xp} XP)\n`
    }
    txt += `╰──────────────────────`
    return conn.reply(gid, txt, m, { mentions: top.map(u => u.jid) })
  }

  // .givexp (tetap ada, untuk owner)
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
handler.tags = ['group', 'xp', 'fun', 'azbry']
handler.command = /^(lvl|leaderboard|givexp)$/i
handler.group = true

module.exports = handler
module.exports.before = async function (m) {
  try { await autoXP(m, this) } catch (e) {}
}