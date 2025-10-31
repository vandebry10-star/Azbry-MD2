const fs = require('fs')

/* === CONFIGURABLE === */
const LIMIT_HARIAN = 10
const ZONA_WAKTU = 'Asia/Makassar' // WITA

// --- FUNGSI UTAMA HANDLER --- //
let handler = async (m, { conn, args, command }) => {
  const users = global.db.data.users
  if (!users) return m.reply('⚠️ Database user kosong atau belum terbentuk.')

  if (/^resetlimit$/i.test(command)) {
    Object.keys(users).forEach(u => users[u].limit = LIMIT_HARIAN)
    return m.reply(`✅ Limit semua user berhasil direset ke *${LIMIT_HARIAN}* per hari.`)
  }

  if (/^cleardb$/i.test(command)) {
    const jumlah = Object.keys(users).length
    global.db.data.users = {}
    return m.reply(`🗑️ Database user berhasil dikosongkan (${jumlah} user dihapus).`)
  }

  if (/^listlimit$/i.test(command)) {
    if (!Object.keys(users).length) return m.reply('❌ Tidak ada data user.')

    let teks = '📋 *Daftar User & Sisa Limit:*\n\n'
    let i = 1
    for (const [jid, data] of Object.entries(users)) {
      teks += `${i++}. wa.me/${jid.split('@')[0]} → ${data.limit || 0}\n`
    }

    return conn.reply(m.chat, teks.trim(), m)
  }
}

handler.help = [
  'resetlimit',
  'cleardb',
  'listlimit'
]
handler.tags = ['owner']
handler.command = /^(resetlimit|cleardb|listlimit)$/i
handler.owner = true

module.exports = handler

/* === AUTO RESET LIMIT HARIAN (00:00 WITA) === */
setInterval(() => {
  try {
    const now = new Date()
    const options = { timeZone: ZONA_WAKTU, hour12: false }
    const jam = new Intl.DateTimeFormat('en-GB', { ...options, hour: '2-digit', minute: '2-digit' }).format(now)

    if (jam === '00:00') {
      const users = global.db.data.users
      if (!users) return
      for (let jid of Object.keys(users)) {
        users[jid].limit = LIMIT_HARIAN
      }
      console.log(`[AUTO RESET LIMIT] Semua user direset ke ${LIMIT_HARIAN} | Zona: ${ZONA_WAKTU}`)
    }
  } catch (e) {
    console.error('Error auto reset limit:', e)
  }
}, 60 * 1000) // cek tiap 1 menit