// plugins/giveaway-dana.js
// Giveaway random tag 1 orang — "Dana Kaget"
// Usage:
//   .giveaway [text hadiah...]
//   .acakdana [text hadiah...]
// Only owner or group admin can run. Cooldown per-group.

const COOLDOWN_MS = 5 * 60 * 1000 // 5 menit

function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

module.exports = async (m, { conn, args, isOwner, isAdmin }) => {
  try {
    // hanya untuk grup
    if (!m.chat.endsWith('@g.us')) {
      return m.reply('Fitur ini hanya untuk grup.')
    }

    const chatId = m.chat
    // simple per-group cooldown map
    global.__giveaway_cooldown = global.__giveaway_cooldown || new Map()
    const last = global.__giveaway_cooldown.get(chatId) || 0
    const now = Date.now()
    if (now - last < COOLDOWN_MS) {
      const left = Math.ceil((COOLDOWN_MS - (now - last)) / 1000)
      return m.reply(`Tunggu dulu bro — cooldown giveaway aktif. Coba lagi dalam ${left} detik.`)
    }

    // perizinan: owner bot atau admin grup
    let amAdmin = false
    // if library provides isAdmin parameter, use it
    if (typeof isOwner !== 'undefined' && isOwner) {
      amAdmin = true
    } else {
      // check group metadata to see if sender is admin
      try {
        const metadata = await (conn.groupMetadata ? conn.groupMetadata(chatId) : conn.groupFetchAllParticipating().then(all => all[chatId]))
        const participants = metadata?.participants || []
        const me = participants.find(p => p.jid === (conn.user?.id || conn.user?.jid || conn.user))
        const sender = participants.find(p => p.jid === m.sender)
        // many Baileys forks use 'isAdmin' or 'admin' flags
        const senderIsAdmin = sender && (sender.admin === 'admin' || sender.admin === 'superadmin' || sender.isAdmin || sender.admin === true)
        if (senderIsAdmin) amAdmin = true
      } catch (e) {
        // ignore, fallthrough to require isOwner passed flag
      }
    }

    if (!amAdmin && !isOwner) {
      return m.reply('Hanya owner bot atau admin grup yang dapat menjalankan giveaway.')
    }

    // ambil participants grup (robust)
    let participants = []
    try {
      const meta = await (conn.groupMetadata ? conn.groupMetadata(chatId) : conn.groupFetchAllParticipating().then(all => all[chatId]))
      if (meta && Array.isArray(meta.participants)) {
        participants = meta.participants.map(p => (p.jid || p.id || p))
      } else {
        // fallback ke groupFetchAllParticipating
        const all = await (conn.groupFetchAllParticipating ? conn.groupFetchAllParticipating() : {})
        participants = Object.keys(all[chatId]?.participants || {})
      }
    } catch (e) {
      // fallback naive: try to use conn.chats
      try {
        participants = (Object.keys(conn.chats).filter(k => k.endsWith('@g.us') ? false : true))
      } catch {}
    }

    // normalize and filter
    participants = Array.from(new Set(participants))
      .filter(Boolean)
      // ensure endsWith @g.us
      .map(j => (j.includes('@') ? j : (j + '@s.whatsapp.net')))
      // exclude bot itself
      .filter(j => {
        const meId = (conn.user && (conn.user.id || conn.user.jid || conn.user)) || ''
        return j !== meId && j !== (meId && meId.replace(':', '@')) // tolerant
      })

    if (!participants.length) return m.reply('Gak ada peserta yang bisa dipilih.')

    // pilih random
    const winner = randItem(participants)
    const prize = args && args.length ? args.join(' ') : 'Dana Kaget'

    // prepare message
    const text = [
      '🎉 *GIVEAWAY — Pemenang Terpilih!* 🎉',
      '',
      `Selamat @${winner.split('@')[0]} — kamu terpilih menerima *${prize}*!`,
      '',
      '_Cara klaim: hubungi owner / admin grup untuk verifikasi._',
      '',
      'Terima kasih semua yang ikut! ❤️'
    ].join('\n')

    // send message with mention
    await conn.sendMessage(chatId, { text, mentions: [winner] }, { quoted: m })

    // set cooldown
    global.__giveaway_cooldown.set(chatId, Date.now())
  } catch (err) {
    console.error('[giveaway-dana ERR]', err)
    try { m.reply('Terjadi kesalahan saat memilih pemenang — coba lagi nanti.') } catch {}
  }
}

// handler metadata for frameworks that expect it:
// (if your bot auto-registers exports, comment/remove this block and wrap as module.exports = handler)
module.exports.help = ['giveaway <prize>', 'acakdana <prize>']
module.exports.tags = ['group', 'fun']
module.exports.command = /^(giveaway|acakdana)$/i
module.exports.admin = true
module.exports.group = true
module.exports.owner = false