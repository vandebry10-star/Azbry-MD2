// plugins/_send-diagnose.js
// Quick diagnose & panic-fix when bot receives messages but replies don't appear in chat.

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
  const sub = (args[0] || '').trim()

  if (/^senddiag$/i.test(command)) {
    const st = getStates()
    const txt =
`🩺 *Send Diagnose*
• self mode   : ${st.self ? 'ON (owner only)' : 'OFF (public)'}
• quiet mode  : ${st.quiet ? 'ON (no replies)' : 'OFF'}
• only gc     : ${st.gconly ? 'ON' : 'OFF'}
• only pc     : ${st.pconly ? 'ON' : 'OFF'}
• restrict    : ${st.restrict ? 'ON' : 'OFF'}
• autoread    : ${st.autoread ? 'ON' : 'OFF'}
• chat jid    : ${m.chat}
• from owner  : ${isOwner ? 'YES' : 'NO'}

Tips:
- Jika *self mode ON*, hanya owner yang mendapat balasan.
- Jika *quiet ON*, bot tidak membalas apa pun.
- Jika *gc-only/pc-only ON*, bot hanya membalas di tipe itu.`
    return m.reply(txt)
  }

  if (/^sendtest$/i.test(command)) {
    const text = args.length ? args.join(' ') : 'Test kirim dari diagnose plugin ✅'
    try {
      await conn.sendPresenceUpdate('composing', m.chat)
      const res = await conn.sendMessage(m.chat, { text }, { quoted: m })
      return m.reply('✅ *sendMessage OK* (balasan seharusnya muncul).\nJika tetap tidak muncul, cek *WhatsApp Web* di HP/WA Desktop apakah ada limit.')
    } catch (e) {
      const err = String(e && e.stack || e)
      return m.reply('❌ *sendMessage ERROR*\n```' + err.slice(0, 1500) + '```')
    }
  }

  if (/^fixsend$/i.test(command)) {
    // Panic fix: force public, quiet off, disable gc-only/pc-only
    try {
      if (global.opts) {
        global.opts.self = false
        global.opts.quiet = false
        global.opts['gconly'] = false
        global.opts['pconly'] = false
      }
      // beberapa base pakai global.db.data.settings / setting global
      if (global.db?.data?.settings) {
        const set = global.db.data.settings
        for (const k of Object.keys(set)) {
          if (typeof set[k] === 'object' && set[k]) {
            set[k].self = false
            set[k].quiet = false
            set[k].gconly = false
            set[k].pconly = false
          }
        }
      }
    } catch {}
    try {
      await conn.sendPresenceUpdate('available', m.chat)
      await conn.sendMessage(m.chat, { text: '🔥 Panic-fix diterapkan: public mode, quiet OFF, gc-only/pc-only OFF.\nCoba kirim `.menu` atau `.ping`.' }, { quoted: m })
    } catch (e) {
      return m.reply('❌ Gagal kirim setelah panic-fix.\nError:\n```' + String(e).slice(0, 1500) + '```')
    }
    return
  }

  // help
  return m.reply(
`Pakai:
• ${usedPrefix}senddiag
• ${usedPrefix}sendtest <teks>
• ${usedPrefix}fixsend`
  )
}

handler.help = ['senddiag','sendtest <teks>','fixsend']
handler.tags = ['owner','tools']
handler.command = /^(senddiag|sendtest|fixsend)$/i
handler.owner = true
module.exports = handler

function getStates() {
  const o = global.opts || {}
  const any = (k) => (o[k] != null ? o[k] : (global[k] != null ? global[k] : false))
  return {
    self: any('self'),
    quiet: any('quiet'),
    gconly: any('gconly') || any('gcOnly'),
    pconly: any('pconly') || any('pcOnly'),
    restrict: any('restrict'),
    autoread: any('autoread')
  }
}