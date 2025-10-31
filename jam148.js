// plugins/jam148.js
// Kirim "jam" ke grup target pada 01:48, 10:48, 11:48, 14:08 (WITA)

const fs = require('fs')
const path = require('path')

function safeRequire(name) {
  try { return require(name) } catch (e) {
    console.error(`[jam148] Module "${name}" belum terpasang? Jalankan: npm i ${name}`)
    return null
  }
}
let cron = safeRequire('node-cron')

// DB helpers
const DB_DIR = path.join(__dirname, '..', 'database')
const DB_PATH = path.join(DB_DIR, 'jam148.json')
function ensureDir(p) { try { fs.mkdirSync(p, { recursive: true }) } catch {} }
function load() { try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) } catch { return {} } }
function save(x) { try { ensureDir(DB_DIR); fs.writeFileSync(DB_PATH, JSON.stringify(x, null, 2)) } catch (e) { console.error('[jam148 save ERR]', e?.message) } }

global.__jam148_boot = global.__jam148_boot || false
global._jam148Jobs = global._jam148Jobs || []

const FIXED_TIMES = ['01:48', '10:48', '14:08']
const TZ = 'Asia/Makassar' // WITA

global._registerJam148 = global._registerJam148 || (async function (conn) {
  try { global._jam148Jobs.forEach(j => j.stop && j.stop()) } catch {}
  global._jam148Jobs = []

  const st = load()
  st.on ??= true
  st.whitelist = Array.isArray(st.whitelist) ? st.whitelist : []
  save(st)

  if (!st.on) { console.log('[jam148] disabled'); return }
  if (!cron) { console.warn('[jam148] cron tidak aktif (node-cron tidak tersedia).'); return }

  const job = cron.schedule('* * * * *', async () => {
    try {
      const now = new Date()
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }).format(now)
      if (FIXED_TIMES.includes(fmt)) {
        console.log(`[jam148 RUN] ${fmt} (${TZ})`)
        const targets = await getTargetGroupJids(conn, st)
        for (const jid of targets) {
          await safeSend(conn, jid, 'jam')
        }
      }
    } catch (e) {
      console.error('[jam148 ERR]', e?.message)
    }
  }, { timezone: TZ })

  global._jam148Jobs.push(job)
  console.log('[jam148] scheduled (WITA only) for times:', FIXED_TIMES.join(', '))
})

async function getTargetGroupJids(conn, st) {
  if (Array.isArray(st.whitelist) && st.whitelist.length) return st.whitelist.map(j => j.endsWith('@g.us') ? j : `${j}`)
  try {
    const all = await (conn.groupFetchAllParticipating ? conn.groupFetchAllParticipating() : {})
    return Object.keys(all || {}).filter(j => j.endsWith('@g.us'))
  } catch { return [] }
}

async function safeSend(conn, jid, text) {
  try {
    const target = jid.endsWith('@g.us') ? jid : (jid.includes('@') ? jid : `${jid}@g.us`)
    await conn.sendMessage(target, { text })
    console.log('[jam148 OK]', target)
  } catch (e) { console.error('[jam148 SEND ERR]', jid, e?.message) }
}

// ===== COMMAND =====
let handler = async (m, { conn, usedPrefix, args }) => {
  const st = load()
  st.on ??= true
  st.whitelist = Array.isArray(st.whitelist) ? st.whitelist : []

  const sub = (args[0] || '').toLowerCase()
  const sub2 = (args[1] || '').toLowerCase()

  if (!sub || sub === 'status') {
    const onoff = st.on ? '🟢 ON' : '🔴 OFF'
    const wl = st.whitelist.length ? `${st.whitelist.length} grup` : 'semua grup'
    return m.reply(
`⏰ jam148 (zona WITA) ${onoff}
Trigger waktu: 01:48, 10:48, 11:48, 14:08
Whitelist: ${wl}

Pakai:
${usedPrefix}jam148 on|off [here|all]
${usedPrefix}jam148 add here | del here | list`)
  }

  if ((sub === 'on' || sub === 'off') && sub2 === 'all') {
    st.on = (sub === 'on'); save(st)
    await m.reply(`✅ jam148 ${sub.toUpperCase()} untuk *semua grup*.`)
    await global._registerJam148(conn); return
  }

  if ((sub === 'on' || sub === 'off') && (sub2 === 'here' || !sub2)) {
    const id = m.chat
    const idx = st.whitelist.indexOf(id)
    if (sub === 'on') { if (!st.whitelist.includes(id)) st.whitelist.push(id); st.on = true; save(st); await m.reply('✅ jam148 diaktifkan untuk grup ini.') }
    else { if (idx >= 0) st.whitelist.splice(idx, 1); save(st); await m.reply('✅ jam148 dimatikan untuk grup ini.') }
    await global._registerJam148(conn); return
  }

  if (sub === 'add' && sub2 === 'here') { if (!st.whitelist.includes(m.chat)) st.whitelist.push(m.chat); save(st); await m.reply('✅ Grup ini ditambahkan ke whitelist.'); await global._registerJam148(conn); return }
  if (sub === 'del' && sub2 === 'here') { st.whitelist = st.whitelist.filter(x => x !== m.chat); save(st); await m.reply('✅ Grup ini dihapus dari whitelist.'); await global._registerJam148(conn); return }
  if (sub === 'list') { const list = st.whitelist.length ? st.whitelist.map((j, i) => `${i + 1}. ${j}`).join('\n') : '(kosong → semua grup aktif saat ON)'; return m.reply('Whitelist jam148:\n' + list) }

  return m.reply(`Perintah tidak dikenal. Ketik ${usedPrefix}jam148 status`)
}

handler.help = ['jam148 [status|on|off] (here|all) | add here | del here | list']
handler.tags = ['auto','group']
handler.command = /^jam148$/i

handler.after = async function (m, { conn }) {
  if (!global.__jam148_boot) {
    global.__jam148_boot = true
    try { await global._registerJam148(conn) } catch (e) { console.error('[jam148 BOOT ERR]', e?.message) }
  }
}

module.exports = handler