// 🧠 Reflection Log (Fixed Final Version by FebryWesker)
// Auto-send summary chat harian ke owner jam 23:59 WITA

const fs = require('fs')
const path = require('path')
process.env.TZ = 'Asia/Makassar'
const TZ = 'Asia/Makassar'
const DATA = path.join(__dirname, '..', 'database', 'reflection.json')

// === Utility ===
function ensure() {
  const dir = path.dirname(DATA)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DATA))
    fs.writeFileSync(DATA, JSON.stringify({ on: true, lastSent: '', days: {} }, null, 2))
}
function load() {
  ensure()
  try {
    return JSON.parse(fs.readFileSync(DATA, 'utf-8'))
  } catch {
    return { on: true, lastSent: '', days: {} }
  }
}
function save(db) {
  fs.writeFileSync(DATA, JSON.stringify(db, null, 2))
}

// ✅ Fix waktu agar gak error Invalid time value
function todayKey() {
  try {
    const now = new Date()
    const local = new Date(now.toLocaleString('en-US', { timeZone: TZ }))
    return local.toISOString().slice(0, 10)
  } catch {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
  }
}
function hourMinute() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }))
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function tokenize(s = '') {
  return (s.toLowerCase().match(/\b[a-z0-9\u00C0-\u024f]{3,}\b/gi) || []).filter(
    (w) => !STOP.has(w)
  )
}
const STOP = new Set(
  ['dan', 'yang', 'atau', 'untuk', 'dari', 'kamu', 'saya', 'aku', 'dia', 'kita', 'kami', 'lagi', 'mau', 'banget', 'udah', 'sih', 'aja', 'lah', 'nih', 'kan', 'ya', 'kok', 'kayak', 'gitu', 'itu', 'ini']
)

function record(m) {
  if (!m.isGroup || !m.text) return
  const db = load()
  const day = todayKey()
  if (!db.days[day]) db.days[day] = { total: 0, groups: {} }
  const g = (db.days[day].groups[m.chat] ||= { total: 0, users: {}, words: {} })
  g.total++
  const u = m.sender
  g.users[u] = (g.users[u] || 0) + 1
  for (const w of tokenize(m.text)) g.words[w] = (g.words[w] || 0) + 1
  db.days[day].total++
  save(db)
}

function topN(obj, n = 5, map = (k, v) => [k, v]) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => map(k, v))
}

function ownerJids(fallbackJid) {
  const out = new Set()
  const ow = global.owner || []
  for (const item of ow) {
    if (!item) continue
    if (Array.isArray(item)) {
      const num = String(item[0] || '').replace(/[^\d]/g, '')
      if (num) out.add(num + '@s.whatsapp.net')
    } else {
      const num = String(item).replace(/[^\d]/g, '')
      if (num) out.add(num + '@s.whatsapp.net')
    }
  }
  if (out.size === 0 && fallbackJid) out.add(fallbackJid)
  return [...out]
}

async function sendReflection(conn, force = false, alsoChat = null) {
  const db = load()
  if (!db.on && !force) return
  const day = todayKey()
  const has = db.days[day]
  if (!has) return

  const groups = has.groups
  let text = `🧠 *Azbry Reflection — ${day}*\n`
  text += `Total pesan hari ini: ${has.total}\n`
  text += `Grup terdata: ${Object.keys(groups).length}\n\n`

  for (const [gid, g] of Object.entries(groups)) {
    const topUsers =
      topN(g.users, 3, (jid, c) => `@${jid.split('@')[0]} (${c})`).join(', ') || '-'
    const topWords =
      topN(g.words, 5, (w, c) => `${w}(${c})`).join(', ') || '-'
    text += `• Grup: ${gid}\n   - Pesan: ${g.total}\n   - Aktif: ${topUsers}\n   - Topik: ${topWords}\n`
  }
  text += `\n💭 Catatan: Data ini otomatis (23:59 WITA)\nMatikan/nyalakan: .reflect off/on`

  const owners = ownerJids(alsoChat)
  for (const j of owners) {
    try {
      await conn.sendMessage(j, { text })
    } catch (e) {
      console.error('Reflection send fail:', e)
    }
  }

  db.lastSent = day
  save(db)
}

// Auto-send tiap 23:59 WITA
if (!global.__REFLECT_TIMER__) {
  global.__REFLECT_TIMER__ = setInterval(async () => {
    try {
      const hhmm = hourMinute()
      const db = load()
      if (hhmm === '23:59' && db.lastSent !== todayKey()) {
        if (global.conn) await sendReflection(global.conn)
      }
    } catch (e) {
      console.error('Reflection loop error:', e)
    }
  }, 60_000)
}

// === Command ===
let handler = async (m, { conn, args, usedPrefix }) => {
  const db = load()
  const sub = (args[0] || '').toLowerCase()

  if (!sub || sub === 'status') {
    return m.reply(
      `🧠 Reflection: ${db.on ? '🟢 ON' : '🔴 OFF'}\nTerakhir kirim: ${
        db.lastSent || '-'
      }\n\n• ${usedPrefix}reflect on/off\n• ${usedPrefix}reflect sendnow`
    )
  }

  if (sub === 'on' || sub === 'off') {
    db.on = sub === 'on'
    save(db)
    return m.reply(`✅ Reflection ${sub.toUpperCase()}`)
  }

  if (sub === 'sendnow') {
    await sendReflection(conn, true, m.chat)
    return m.reply('✅ Reflection log dikirim sekarang.')
  }

  return m.reply(
    `Pakai:\n• ${usedPrefix}reflect on/off\n• ${usedPrefix}reflect status\n• ${usedPrefix}reflect sendnow`
  )
}

handler.help = ['reflect [on/off/status/sendnow]']
handler.tags = ['experimental', 'owner']
handler.command = /^reflect$/i
handler.owner = true
module.exports = handler
module.exports.before = async function (m) {
  try {
    record(m)
  } catch {}
}