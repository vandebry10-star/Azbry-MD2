// plugins/_group-sholat.js
// 🕌 Pengingat Sholat + AUDIO (WITA) — WHITELIST ONLY
// Hanya kirim ke grup yang didaftarkan via `.sholat add here`

process.env.TZ = 'Asia/Makassar'
const fs = require('fs')
const path = require('path')

const DB = path.join(__dirname, '..', 'database', 'autosholat.json')

// ===== utils storage =====
function load() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')) } catch {}
  return {
    on: true,
    zone: 'WITA',
    // set default; sesuaikan kalau pakai API jadwal nantinya
    times: { subuh:'04:30', dzuhur:'12:00', ashar:'15:30', maghrib:'18:00', isya:'19:30' },
    whitelist: [],            // HANYA grup di sini yang akan menerima reminder
    sent: {},                 // { 'YYYY-MM-DD': { subuh:true, ... } }
    sentPre: {}               // { 'YYYY-MM-DD': { subuh:true, ... } }
  }
}
function save(x) {
  fs.mkdirSync(path.dirname(DB), { recursive: true })
  fs.writeFileSync(DB, JSON.stringify(x, null, 2))
}
function now() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' })) }
function HM(d = now()) { return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
function YMD(d = now()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

// ===== audio =====
function audioFor(name){
  const base = path.join(__dirname, '..', 'media', 'adzan')
  const subuh = path.join(base, 'subuh.mp3')
  const def   = path.join(base, 'adzan.mp3')
  if (name === 'subuh' && fs.existsSync(subuh)) return subuh
  if (fs.existsSync(def)) return def
  return null
}

// ===== blast helpers =====
async function blastText(conn, jids, text) {
  for (const j of jids) { try { await conn.sendMessage(j, { text }) } catch {} }
}
async function blastAudio(conn, jids, file) {
  if (!file) return
  for (const j of jids) { try { await conn.sendMessage(j, { audio: { url:file }, mimetype:'audio/mpeg', ptt:false }) } catch {} }
}

// ===== scheduler (tiap menit) =====
if (!global.__SHOLAT_WHITELIST_TIMER__) {
  global.__SHOLAT_WHITELIST_TIMER__ = setInterval(async () => {
    try {
      const st = Object.assign({ on:true, times:{}, whitelist:[], sent:{}, sentPre:{} }, load())
      if (!st.on) return

      const hm = HM(), ymd = YMD()
      st.sent[ymd]    = st.sent[ymd]    || {}
      st.sentPre[ymd] = st.sentPre[ymd] || {}

      // WHITELIST ONLY: kalau kosong, tidak kirim ke mana pun
      const targets = Array.isArray(st.whitelist) ? st.whitelist.filter(j => j.endsWith('@g.us')) : []
      if (!targets.length) return

      const minus10 = (time) => {
        const [H, M] = time.split(':').map(Number)
        const d = now(); d.setHours(H, M, 0, 0); d.setMinutes(d.getMinutes() - 10)
        return HM(d)
      }

      // Pre (-10 menit)
      for (const [name, time] of Object.entries(st.times)) {
        if (hm === minus10(time) && st.sentPre[ymd][name] !== true) {
          await blastText(global.conn, targets, `⏰ 10 menit lagi masuk *${name}* (${st.zone}).`)
          st.sentPre[ymd][name] = true; save(st)
        }
      }

      // On-time + audio
      for (const [name, time] of Object.entries(st.times)) {
        if (hm === time && st.sent[ymd][name] !== true) {
          await blastText(global.conn, targets, `🕌 Waktunya *${name}* (${st.zone}).`)
          await blastAudio(global.conn, targets, audioFor(name))
          st.sent[ymd][name] = true; save(st)
        }
      }
    } catch {}
  }, 60_000)
}

// ===== command =====
let handler = async (m, { conn, usedPrefix, command, args }) => {
  if (!/^sholat$/i.test(command)) return

  const st = Object.assign({ on:true, zone:'WITA', times:{}, whitelist:[] }, load())
  const sub = (args[0] || '').toLowerCase()

  // STATUS (default)
  if (!sub || sub === 'status') {
    const t = st.times
    const hasSubuh = audioFor('subuh') ? '🎵' : '—'
    const hasDef   = audioFor('maghrib') || audioFor('dzuhur') || audioFor('ashar') || audioFor('isya') ? '🎵' : '—'
    const body = [
      'Pengingat sholat otomatis (WITA, whitelist-only)',
      '',
      `Subuh   : ${t.subuh} ${hasSubuh}`,
      `Dzuhur  : ${t.dzuhur} ${hasDef ? '🎵' : '—'}`,
      `Ashar   : ${t.ashar} ${hasDef ? '🎵' : '—'}`,
      `Maghrib : ${t.maghrib} ${hasDef ? '🎵' : '—'}`,
      `Isya    : ${t.isya} ${hasDef ? '🎵' : '—'}`,
      '',
      st.whitelist?.length
        ? `Whitelist aktif (${st.whitelist.length} grup) — gunakan "${usedPrefix}${command} list"`
        : 'Whitelist kosong (tidak kirim ke mana pun)',
      '',
      `Perintah:\n` +
      `${usedPrefix}${command} add here\n` +
      `${usedPrefix}${command} del here\n` +
      `${usedPrefix}${command} list\n` +
      `${usedPrefix}${command} test <subuh|dzuhur|ashar|maghrib|isya>`
    ].join('\n')

    const msg = typeof global.formatAzbry === 'function'
      ? global.formatAzbry('Azbry Sholat', body)
      : body

    return conn.reply(m.chat, msg, m)
  }

  // TEST kirim ke chat ini
  if (sub === 'test') {
    const w = (args[1] || '').toLowerCase()
    if (!/^(subuh|dzuhur|ashar|maghrib|isya)$/.test(w))
      return m.reply(`Pakai: ${usedPrefix}${command} test <subuh|dzuhur|ashar|maghrib|isya>`)

    await conn.reply(m.chat, `🕌 *Tes* pengingat ${w} (${st.zone}).`, m)
    const f = audioFor(w)
    if (f) await conn.sendMessage(m.chat, { audio: { url:f }, mimetype:'audio/mpeg', ptt:false }, { quoted: m })
    return
  }

  // WHITELIST mgmt
  if (sub === 'add') {
    if (!m.chat.endsWith('@g.us')) return m.reply('Ketik perintah ini di grup yang mau ditambahkan.')
    if (!st.whitelist.includes(m.chat)) st.whitelist.push(m.chat)
    save(st); return m.reply('✅ Grup ini ditambahkan ke whitelist pengingat sholat.')
  }
  if (sub === 'del' || sub === 'rm' || sub === 'hapus') {
    const i = st.whitelist.indexOf(m.chat)
    if (i >= 0) st.whitelist.splice(i, 1)
    save(st); return m.reply('✅ Grup ini dihapus dari whitelist pengingat sholat.')
  }
  if (sub === 'list') {
    const list = st.whitelist || []
    if (!list.length) return m.reply('Whitelist kosong (tidak kirim ke mana pun).')
    return m.reply('📜 Grup whitelist:\n' + list.map((j,i)=>`${i+1}. ${j}`).join('\n'))
  }

  return m.reply(
    `Pakai:\n` +
    `${usedPrefix}${command} status\n` +
    `${usedPrefix}${command} add here | del here | list\n` +
    `${usedPrefix}${command} test <subuh|dzuhur|ashar|maghrib|isya>`
  )
}

handler.help = ['sholat', 'sholat add/del here', 'sholat list', 'sholat test <waktu>']
handler.tags = ['auto','islam','group']
handler.command = /^sholat$/i
handler.group = true

module.exports = handler