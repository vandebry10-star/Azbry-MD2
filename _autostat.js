// plugins/_autostat.js
// Azbry-MD — Auto Features Status (Ringkas & Rapi)
// by FebryWesker
//
// Menampilkan status fitur otomatis:
// 🕌 Sholat, 🍽️ Makan, 💾 AutoBackup, 🎯 Level XP
// (Daily Report & Mention Rescue dihapus agar aman dari banned)

process.env.TZ = 'Asia/Makassar'

const fs = require('fs')
const path = require('path')

const TZ = 'Asia/Makassar'
const DB = (p) => path.join(__dirname, '..', 'database', p)
const J = (p, d={}) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return d } }
const FEX = (p) => { try { return fs.existsSync(p) } catch { return false } }

function now() { return new Date(new Date().toLocaleString('en-US', { timeZone: TZ })) }
function fmt(ts) {
  if (!ts) return '—'
  const d = (ts instanceof Date) ? ts : new Date(ts)
  return d.toLocaleString('id-ID', { timeZone: TZ, hour12: false })
}
function clock(ms) {
  if (isNaN(ms)) return '--:--:--'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor(ms / 60000) % 60
  const s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
function HHMM(d = now()) {
  const h = String(d.getHours()).padStart(2,'0')
  const m = String(d.getMinutes()).padStart(2,'0')
  return `${h}:${m}`
}
function nextSlot(timesMap) {
  if (!timesMap) return { name: '-', time: '-' }
  const cur = HHMM()
  const arr = Object.entries(timesMap).map(([n,t]) => ({ n, t }))
  arr.sort((a,b)=>a.t.localeCompare(b.t))
  return arr.find(x => x.t >= cur) || arr[0] || { n:'-', t:'-' }
}

const AUTOSTAT_FILE = DB('autostat.json')
function loadAuto() { return J(AUTOSTAT_FILE, { last: {} }) }
function saveAuto(x) { fs.writeFileSync(AUTOSTAT_FILE, JSON.stringify(x,null,2)) }
global.autostatTouch = function(name, when=new Date()) {
  const st = loadAuto()
  st.last[name] = when instanceof Date ? when.toISOString() : when
  saveAuto(st)
}

const readMore = String.fromCharCode(8206).repeat(4001)

let handler = async (m, { conn, usedPrefix }) => {
  const uptime = clock(process.uptime() * 1000)
  const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1)
  const groups = Object.keys(conn.chats || {}).filter(v => v.endsWith('@g.us')).length

  const autoMemo = loadAuto()

  // 🕌 Sholat
  const sh = J(DB('autosholat.json'), {})
  const shOn = sh.on !== false
  const shWL = Array.isArray(sh.whitelist) ? sh.whitelist.length : 0
  const shTimes = sh.times || { subuh:'04:30', dzuhur:'12:00', ashar:'15:30', maghrib:'18:00', isya:'19:30' }
  const shNext = nextSlot(shTimes)
  const shLast = sh.lastRun || autoMemo.last['sholat'] || '-'

  // 🍽️ Makan
  const mk = J(DB('automakan.json'), {})
  const mkOn = mk.on !== false
  const mkWL = Array.isArray(mk.whitelist) ? mk.whitelist.length : 0
  const mkTimes = mk.times || { sarapan:'06:30', siang:'12:05', malam:'20:05' }
  const mkNext = nextSlot(mkTimes)
  const mkLast = mk.lastRun || autoMemo.last['makan'] || '-'

  // 💾 AutoBackup
  const bk = J(DB('autobackup.json'), {})
  const bkOn = bk.on !== false
  const bkLast = bk.last || autoMemo.last['backup'] || '-'
  const bkNext = '00:00'

  // 🎯 Level XP
  const lvPath = DB('level.json')
  let lvUsers = 0, lvGroups = 0
  if (FEX(lvPath)) {
    try {
      const L = JSON.parse(fs.readFileSync(lvPath, 'utf8'))
      lvGroups = Object.keys(L).length
      lvUsers = Object.values(L).reduce((a,g)=>a+Object.keys(g||{}).length,0)
    } catch {}
  }
  const lvOn = true
  const lvLast = autoMemo.last['level'] || '-'
  const lvNext = 'on-message'

  const pad = (s, n=10) => (s||'').toString().padEnd(n,' ')
  const line = (icon, name, on, extra=[]) => {
    const base = `${icon} ${pad(name,12)} : ${on ? '🟢 ON ' : '🔴 OFF'}`
    const more = extra.filter(Boolean).map(x=>`\n   ${x}`).join('')
    return base + more
  }

  const body = [
    `Uptime  : ${uptime}`,
    `Memory  : ${mem} MB`,
    `Groups  : ${groups}`,
    '',
    'Status Auto Features:',
    readMore,
    line('🕌','Sholat', shOn, [
      `Zone: ${sh.zone||'WITA'} • WL: ${shWL}`,
      `Next: ${(shNext.n||'-').toUpperCase?.()||shNext.n} ${shNext.t}`,
      `Last: ${fmt(shLast)}`
    ]),
    '',
    line('🍽️','Makan', mkOn, [
      `WL: ${mkWL}`,
      `Next: ${(mkNext.n||'-').toUpperCase?.()||mkNext.n} ${mkNext.t}`,
      `Last: ${fmt(mkLast)}`
    ]),
    '',
    line('💾','AutoBackup', bkOn, [
      `Next: ${bkNext}`,
      `Last: ${fmt(bkLast)}${bk.ok===false?' (fail)':''}`
    ]),
    '',
    line('🎯','LevelXP', lvOn, [
      `Data: ${lvUsers} users / ${lvGroups} grup`,
      `Next: ${lvNext}`,
      `Last: ${fmt(lvLast)}`
    ]),
    '',
    `Tips: Owner bisa set manual dengan:\n${usedPrefix}autostat touch <sholat|makan|backup|level>`
  ].join('\n')

  const head = [
    '╭─〔 𝑨𝒛𝒃𝒓𝒚-𝑴𝑫 𝑺𝒚𝒔𝒕𝒆𝒎 〕',
    `│ Auto Status • ${new Date().toLocaleString('id-ID',{timeZone:TZ,hour12:false})}`,
    `│ Uptime: ${uptime} • RAM: ${mem} MB`,
    '╰───────────────────────'
  ].join('\n')

  return conn.reply(m.chat, `${head}\n\n${body}`, m)
}

// ===== Command Helper =====
let cmd = async (m, { args, usedPrefix, isOwner }) => {
  const sub = (args[0]||'').toLowerCase()
  if (!sub || sub === 'help') {
    return m.reply(
`Autostat helper:
${usedPrefix}autostat            → tampilkan status auto features
${usedPrefix}autostat touch X    → set "last run" manual (owner)
  X = sholat | makan | backup | level`)
  }
  if (sub === 'touch') {
    if (!isOwner) return m.reply('Khusus owner.')
    const key = (args[1]||'').toLowerCase()
    const allow = ['sholat','makan','backup','level']
    if (!allow.includes(key)) return m.reply(`Pilih: ${allow.join(', ')}`)
    const st = loadAuto()
    st.last[key] = new Date().toISOString()
    saveAuto(st)
    return m.reply(`✅ last run "${key}" di-set: ${fmt(st.last[key])}`)
  }
  return m.reply(`Gunakan: ${usedPrefix}autostat atau ${usedPrefix}autostat help`)
}

handler.help = ['autostat']
handler.tags = ['info','owner']
handler.command = /^autostat$/i
handler.owner = false

cmd.help = ['autostat [help|touch]']
cmd.tags = ['owner']
cmd.command = /^autostat\s+(help|touch)/i
cmd.owner = true

module.exports = handler
module.exports.autostatctl = cmd