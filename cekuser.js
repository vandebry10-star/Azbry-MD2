// plugins/cekuser.js
// Menampilkan semua user yang terdaftar di database dan sisa limit hariannya

let handler = async (m, { conn }) => {
  try {
    const users = global.db?.data?.users || {}
    const userIds = Object.keys(users)

    if (!userIds.length) return m.reply('❌ Tidak ada user terdaftar di database.')

    let text = `👥 *Daftar User Terdaftar*\nTotal: ${userIds.length}\n\n`
    for (const id of userIds) {
      const u = users[id]
      const name = u?.name || 'Tidak diketahui'
      const limit = u?.limit || 0
      text += `• ${name}\n  ${id}\n  🔹 Limit tersisa: ${limit}\n\n`
    }

    // kalau terlalu panjang kirim sebagai dokumen .txt
    if (text.length > 3500) {
      const fs = require('fs')
      const path = require('path')
      const tmp = path.join(__dirname, '..', 'tmp')
      try { fs.mkdirSync(tmp, { recursive: true }) } catch {}
      const file = path.join(tmp, `cekuser-${Date.now()}.txt`)
      fs.writeFileSync(file, text, 'utf8')
      await conn.sendMessage(m.chat, {
        document: fs.readFileSync(file),
        fileName: 'cekuser.txt',
        mimetype: 'text/plain'
      }, { quoted: m })
      fs.unlinkSync(file)
    } else {
      await m.reply(text)
    }
  } catch (e) {
    console.error('[CEKUSER ERR]', e)
    m.reply('⚠️ Terjadi kesalahan saat membaca database user.')
  }
}

handler.help = ['cekuser']
handler.tags = ['info']
handler.command = /^cekuser$/i

module.exports = handler