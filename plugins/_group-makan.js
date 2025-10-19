// plugins/auto-makan.js
// 🍽️ Pengingat Makan otomatis + AUDIO (WITA, dengan whitelist)
// by FebryWesker (Azbry-MD)

process.env.TZ = 'Asia/Makassar'
const fs = require('fs')
const path = require('path')

const DB = path.join(__dirname, '..', 'database', 'automakan.json')

// === utils ===
function load() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')) } catch {}
  return {
    on: true,
    zone: 'WITA',
    times: { sarapan: '06:30', siang: '12:05', malam: '20:05' },
    whitelist: [], // hanya grup di sini yang akan menerima pengingat
    sent: {}
  }
}
function save(x) {
  fs.mkdirSync(path.dirname(DB), { recursive: true })
  fs.writeFileSync(DB, JSON.stringify(x, null, 2))
}
function now() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' })) }
function HM(d = now()) { return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
function YMD(d = now()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

function audio(slot) {
  const base = path.join(__dirname, '..', 'media', 'makan')
  const f = path.join(base, `${slot}.mp3`)
  return fs.existsSync(f) ? f : null
}

async function sendText(conn, jids, text) {
  for (const j of jids) try { await conn.sendMessage(j, { text }) } catch {}
}
async function sendAudio(conn, jids, file) {
  if (!file) return
  for (const j of jids) try {
    await conn.sendMessage(j, { audio: { url: file }, mimetype: 'audio/mpeg', ptt: false })
  } catch {}
}

// === scheduler ===
if (!global.__MAKAN_TIMER__) {
  global.__MAKAN_TIMER__ = setInterval(async () => {
    try {
      const st = Object.assign({ times:{}, whitelist:[], sent:{} }, load())
      if (!st.on) return
      const hm = HM(), ymd = YMD()
      st.sent[ymd] = st.sent[ymd] || {}

      const targets = Array.isArray(st.whitelist) ? st.whitelist.filter(j => j.endsWith('@g.us')) : []
      if (!targets.length) return // skip kalau belum ada whitelist

      for (const [slot, time] of Object.entries(st.times)) {
        if (hm === time && !st.sent[ymd][slot]) {
          const text =
            slot === 'sarapan' ? `🍞 Saatnya *sarapan* (${st.zone}).`
          : slot === 'siang'   ? `🍛 Saatnya *makan siang* (${st.zone}).`
          :                      `🍲 Saatnya *makan malam* (${st.zone}).`

          await sendText(global.conn, targets, text)
          await sendAudio(global.conn, targets, audio(slot))

          st.sent[ymd][slot] = true
          save(st)
        }
      }
    } catch {}
  }, 60_000)
}

// === command ===
let handler = async (m, { conn, usedPrefix, command, args }) => {
  if (!/^makan$/i.test(command)) return

  const st = Object.assign({ times:{}, whitelist:[] }, load())
  const sub = (args[0] || '').toLowerCase()

  if (!sub || sub === 'status') {
    const t = st.times
    const exist = s => audio(s) ? '🎵' : '—'
    const body = [
      'Pengingat makan otomatis (WITA)',
      '',
      `Sarapan: ${t.sarapan} ${exist('sarapan')}`,
      `Siang  : ${t.siang} ${exist('siang')}`,
      `Malam  : ${t.malam} ${exist('malam')}`,
      '',
      st.whitelist?.length
        ? `Whitelist aktif (${st.whitelist.length} grup)`
        : 'Whitelist kosong (tidak kirim ke mana pun)',
      '',
      `Gunakan:\n${usedPrefix}${command} add here\n${usedPrefix}${command} del here\n${usedPrefix}${command} list\n${usedPrefix}${command} test <sarapan|siang|malam>`
    ].join('\n')

    return conn.reply(m.chat, body, m)
  }

  if (sub === 'test') {
    const slot = (args[1] || '').toLowerCase()
    if (!/^(sarapan|siang|malam)$/.test(slot))
      return m.reply(`Pakai: ${usedPrefix}${command} test <sarapan|siang|malam>`)
    const text =
      slot === 'sarapan' ? '🍞 Tes pengingat sarapan'
      : slot === 'siang' ? '🍛 Tes pengingat makan siang'
      : '🍲 Tes pengingat makan malam'
    await conn.reply(m.chat, text, m)
    const f = audio(slot)
    if (f) await conn.sendMessage(m.chat, { audio: { url: f }, mimetype: 'audio/mpeg', ptt: false }, { quoted: m })
    return
  }

  if (sub === 'add') {
    if (!m.chat.endsWith('@g.us')) return m.reply('Ketik di grup yang mau ditambahkan.')
    if (!st.whitelist.includes(m.chat)) st.whitelist.push(m.chat)
    save(st); return m.reply('✅ Grup ini ditambahkan ke whitelist.')
  }

  if (sub === 'del' || sub === 'rm' || sub === 'hapus') {
    const i = st.whitelist.indexOf(m.chat)
    if (i >= 0) st.whitelist.splice(i, 1)
    save(st); return m.reply('✅ Grup ini dihapus dari whitelist.')
  }

  if (sub === 'list') {
    const list = st.whitelist || []
    if (!list.length) return m.reply('Whitelist kosong (tidak kirim ke mana pun).')
    return m.reply('📜 Grup whitelist:\n' + list.map((j, i) => `${i+1}. ${j}`).join('\n'))
  }

  return m.reply(`Pakai:\n${usedPrefix}${command} status\n${usedPrefix}${command} test <slot>\n${usedPrefix}${command} add here | del here | list`)
}

handler.help = ['makan', 'makan test <slot>', 'makan add/del here', 'makan list']
handler.tags = ['auto','health','group']
handler.command = /^makan$/i
handler.group = true

module.exports = handler