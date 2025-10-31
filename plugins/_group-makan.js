// plugins/groupmakan.js
// 🍽️ Makan Reminders — cron + auto schedule per grup

const path = require('path')
const fs = require('fs')

// === safe require for node-cron ===
function safeRequire(name) {
  try { return require(name) } catch (e) {
    console.error(`[makan] Module "${name}" belum terpasang? Jalankan: npm i ${name}`)
    return null
  }
}
let cron = safeRequire('node-cron')

// === DB helpers (auto mkdir) ===
const DB_DIR = path.join(__dirname, '..', 'database')
const DB_PATH = path.join(DB_DIR, 'automakan.json')
function ensureDir(p) { try { fs.mkdirSync(p, { recursive: true }) } catch {} }
function load() { try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) } catch { return {} } }
function save(x) { try { ensureDir(DB_DIR); fs.writeFileSync(DB_PATH, JSON.stringify(x, null, 2)) } catch (e) { console.error('[makan save ERR]', e?.message) } }

// ==== STATE ====
global.__makan_boot = global.__makan_boot || false
global._makanJobs = global._makanJobs || []

global._registerMakanSchedules = global._registerMakanSchedules || (async function (conn) {
  try { global._makanJobs.forEach(j => j.stop && j.stop()) } catch {}
  global._makanJobs = []

  const st = load()
  st.on ??= true
  st.zone ??= 'WITA'
  st.whitelist = Array.isArray(st.whitelist) ? st.whitelist : []
  st.times ??= { sarapan:'06:30', siang:'12:15', malam:'20:00' }
  save(st)

  if (!st.on) { console.log('[makan] disabled'); return }
  if (!cron) { console.warn('[makan] cron tidak aktif.'); return }

  const tz = zoneToTZ(st.zone) || 'Asia/Makassar'
  const plans = [
    { slot:'sarapan', time: st.times.sarapan, text:'🍞 *Waktunya sarapan!* Isi energi untuk memulai hari 💪' },
    { slot:'siang',   time: st.times.siang,   text:'🍛 *Waktunya makan siang!* Jangan lupa istirahat dan makan yang bergizi 🍽️' },
    { slot:'malam',   time: st.times.malam,   text:'🍲 *Waktunya makan malam!* Makan secukupnya biar tidur nyenyak 😴' }
  ].filter(p => p.time && /^\d{2}:\d{2}$/.test(p.time))

  for (const p of plans) {
    const exp = toDailyCron(p.time)
    try {
      const job = cron.schedule(exp, async () => {
        try {
          console.log(`[makan RUN] ${p.slot} @ ${new Date().toISOString()} (${tz})`)
          const targets = await getTargetGroupJids(conn)
          for (const jid of targets) { await safeSend(conn, jid, p.text) }
        } catch (e) { console.error('[makan SEND ERR]', e?.message) }
      }, { timezone: tz })
      global._makanJobs.push(job)
    } catch (e) { console.error('[makan CRON ERR]', p.slot, p.time, e?.message) }
  }

  const targetsCount = (await getTargetGroupJids(conn)).length
  console.log('[makan] scheduled:', plans.map(p => `${p.slot} ${p.time}`).join(', '), `(${tz}) ; groups=${targetsCount}`)
})

// ==== UTIL ====
function zoneToTZ(z){ z=String(z||'').toUpperCase(); if(z==='WIB')return'Asia/Jakarta'; if(z==='WITA')return'Asia/Makassar'; if(z==='WIT')return'Asia/Jayapura'; return null }
function toDailyCron(hhmm){ const [H,M]=(String(hhmm).split(':').map(x=>parseInt(x,10))); const h=Number.isFinite(H)?Math.max(0,Math.min(23,H)):0; const m=Number.isFinite(M)?Math.max(0,Math.min(59,M)):0; return `${m} ${h} * * *` }
async function getTargetGroupJids(conn){
  const st = load()
  if (Array.isArray(st.whitelist) && st.whitelist.length) return st.whitelist.map(j => j.endsWith('@g.us') ? j : `${j}`)
  try {
    const all = await (conn.groupFetchAllParticipating ? conn.groupFetchAllParticipating() : {})
    return Object.keys(all||{}).filter(j => j.endsWith('@g.us'))
  } catch { return [] }
}
async function safeSend(conn, jid, text){
  try {
    const target = jid.endsWith('@g.us') ? jid : (jid.includes('@') ? jid : `${jid}@g.us`)
    await conn.sendMessage(target, { text }); console.log('[makan OK]', target)
  } catch (e) { console.error('[makan SEND ERR]', jid, e?.message) }
}

// === API test ===
global.sendMakanReminder = global.sendMakanReminder || (async function (conn, target, slot, { test } = {}) {
  const msg = test ? `✅ *TEST* Pengingat makan *${slot}*` : `🍽️ Pengingat makan *${slot}*`
  await safeSend(conn, target, msg)
})

// ==== COMMAND ====
let handler = async (m, { conn, usedPrefix, args }) => {
  const st = load()
  st.on ??= true
  st.zone ??= 'WITA'
  st.whitelist = Array.isArray(st.whitelist) ? st.whitelist : []
  st.times ??= { sarapan:'06:30', siang:'12:15', malam:'20:00' }

  const sub = (args[0]||'').toLowerCase()
  const sub2 = (args[1]||'').toLowerCase()

  if (!sub || sub==='status'){
    const onoff = st.on ? '🟢 ON' : '🔴 OFF'
    const wl = st.whitelist.length ? `${st.whitelist.length} grup` : 'semua grup'
    const t = st.times
    return m.reply(
`🍽️ *Pengingat Makan* ${onoff}
Whitelist: ${wl}
Jadwal:
• Sarapan: ${t.sarapan}
• Siang: ${t.siang}
• Malam: ${t.malam}

Perintah:
${usedPrefix}makan on|off [here|all]
${usedPrefix}makan add here | del here | list
${usedPrefix}makan set <sarapan|siang|malam> <HH:MM>
${usedPrefix}makan test <slot>`)
  }

  if ((sub==='on'||sub==='off') && sub2==='all'){
    st.on = (sub==='on'); save(st)
    await m.reply(`✅ Pengingat makan ${sub.toUpperCase()} untuk *semua grup*.`)
    await global._registerMakanSchedules(conn); return
  }

  if ((sub==='on'||sub==='off') && (sub2==='here'||!sub2)){
    const id = m.chat
    const idx = st.whitelist.indexOf(id)
    if (sub==='on'){ if(!st.whitelist.includes(id)) st.whitelist.push(id); st.on=true; save(st); await m.reply('✅ Pengingat makan diaktifkan untuk grup ini.') }
    else { if(idx>=0) st.whitelist.splice(idx,1); save(st); await m.reply('✅ Pengingat makan dimatikan untuk grup ini.') }
    await global._registerMakanSchedules(conn); return
  }

  if (sub==='add' && (args[1]==='here')){ if(!st.whitelist.includes(m.chat)) st.whitelist.push(m.chat); save(st); await m.reply('✅ Grup ini ditambahkan ke whitelist.'); await global._registerMakanSchedules(conn); return }
  if (sub==='del' && (args[1]==='here')){ st.whitelist = st.whitelist.filter(x=>x!==m.chat); save(st); await m.reply('✅ Grup ini dihapus dari whitelist.'); await global._registerMakanSchedules(conn); return }
  if (sub==='list'){ const list = st.whitelist.length ? st.whitelist.map((j,i)=>`${i+1}. ${j}`).join('\n') : '(kosong → semua grup aktif saat ON)'; return m.reply('Whitelist Makan:\n'+list) }

  // SET TIME
  if (sub === 'set') {
    const slot = (args[1]||'').toLowerCase()
    const hhmm = (args[2]||'')
    if (!/^(sarapan|siang|malam)$/.test(slot))
      return m.reply(`Format: ${usedPrefix}makan set <sarapan|siang|malam> <HH:MM>`)
    if (!/^\d{2}:\d{2}$/.test(hhmm))
      return m.reply('Format jam salah. Contoh: 12:15')

    st.times[slot] = hhmm
    save(st)
    await m.reply(`✅ Jam makan *${slot}* diubah ke *${hhmm}*.`)
    await global._registerMakanSchedules(conn)
    return
  }

  if (sub==='test'){
    const slot = (args[1]||'').toLowerCase()
    if (!/^(sarapan|siang|malam)$/.test(slot)) return m.reply(`Format: ${usedPrefix}makan test <sarapan|siang|malam>`)
    if (typeof global.sendMakanReminder === 'function'){ await global.sendMakanReminder(conn, m.chat, slot, { test:true }); return m.reply(`✅ Test pengingat makan *${slot}* dikirim.`) }
    return m.reply('✅ Test terpicu (fungsi pengingat belum aktif?)')
  }

  return m.reply(`Perintah tidak dikenal. Ketik ${usedPrefix}makan status`)
}

handler.help = ['makan [status|on|off] (here|all) | add here | del here | list | set <slot> <HH:MM> | test <slot>']
handler.tags = ['auto','group']
handler.command = /^makan$/i
handler.owner = true

handler.after = async function (m, { conn }) {
  if (!global.__makan_boot) {
    global.__makan_boot = true
    try { await global._registerMakanSchedules(conn) } catch (e) { console.error('[makan BOOT ERR]', e?.message) }
  }
}

module.exports = handler