// plugins/_azstat.js
// Azbry-MD — AZINFO Custom (Ringkas & Rapi)
// by FebryWesker

process.env.TZ = 'Asia/Makassar'

function clock(ms) {
  if (isNaN(ms)) return '--:--:--'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor(ms / 60000) % 60
  const s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

let handler = async (m, { conn }) => {
  const uptime = clock(process.uptime() * 1000)
  const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1)
  const groups = Object.keys(conn.chats || {}).filter(v => v.endsWith('@g.us')).length
  const plugins = Object.keys(global.plugins || {}).length
  const readMore = String.fromCharCode(8206).repeat(4001)

  const text = `
╭─〔 𝑨𝒛𝒃𝒓𝒚-𝑴𝑫 𝑺𝒚𝒔𝒕𝒆𝒎 〕
│ Developer : 𝑭𝒆𝒃𝒓𝒚𝑾𝒆𝒔𝒌𝒆𝒓 🧠
│ Timezone  : WITA
│ Uptime    : ${uptime}
│ Memory    : ${mem} MB
│ Groups    : ${groups}
│ Plugins   : ${plugins}
╰───────────────────────

✨ *Fitur Custom Azbry Active:* ${readMore}
╭───────────────────────
│ 🎯 Level & XP System
│     • .lvl — profil level kamu
│     • .leaderboard — top 10 grup
│     • .givexp — owner kasih XP
│
│ 🕌 Pengingat Sholat
│     • Auto Subuh–Isya (WITA)
│     • Audio adzan otomatis
│     • .sholat — cek status & whitelist
│
│ 🍽️ Pengingat Makan
│     • Sarapan, Siang, Malam
│     • Bisa pakai audio makan.mp3
│     • .makan — cek status & whitelist
│
│ 💾 Auto Backup & Report
│     • Backup DB + plugins (00.00 WITA)
│     • Laporan status dikirim owner
│     • .reminder-report — manual report
│
│ 🗣️ Mention Rescue
│     • Kirim DM kalau user di-mention
│     • .mentionrescue — konfigurasi
│
│ ⚙️ Filter Kata Kasar
│     • .bw on/off/status/list
│     • Bypass admin opsional
│
│ 🔧 Plugin Manager
│     • .sf — tambah plugin
│     • .upplugin — update plugin
│
│ 📊 Azbry Info
│     • .azinfo — info & menu ini
╰───────────────────────
`.trim()

  await conn.reply(m.chat, text, m)
}

handler.help = ['azinfo']
handler.tags = ['info']
handler.command = /^azinfo$/i

module.exports = handler