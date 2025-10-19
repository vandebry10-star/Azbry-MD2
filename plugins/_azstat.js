// plugins/_azstat.js
// Azbry-MD — AZINFO Ringkas (WITA)
// by FebryWesker

process.env.TZ = 'Asia/Makassar'
const fs = require('fs')
const path = require('path')

const F = (p) => path.join(__dirname, '..', 'database', p)
const S = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return {} } }

function clock (ms) {
  if (isNaN(ms)) return '--:--:--'
  let h = Math.floor(ms/3600000), m = Math.floor(ms/60000)%60, s = Math.floor(ms/1000)%60
  return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':')
}
function now () { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' })) }
function HM (d = now()) { return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }

function exists (p) { try { return fs.existsSync(p) } catch { return false } }

// cari jadwal berikutnya dari map times {name: 'HH:MM'}
function nextSlot (times) {
  if (!times) return { name: '-', time: '-' }
  const cur = HM()
  const entries = Object.entries(times).map(([n,t]) => ({ n, t }))
  entries.sort((a,b)=>a.t.localeCompare(b.t))
  const hit = entries.find(x => x.t >= cur)
  return hit || entries[0] || { n: '-', t: '-' }
}

let handler = async (m, { conn, usedPrefix, command }) => {
  if (!/^azinfo$/i.test(command)) return

  const uptime = clock(process.uptime()*1000)
  const mem = (process.memoryUsage().rss/(1024*1024)).toFixed(1)
  const groups = Object.keys(conn.chats||{}).filter(j=>j.endsWith('@g.us')).length
  const pluginCount = Object.keys(global.plugins||{}).length

  const sh = S(F('autosholat.json'))
  const shOn = sh.on !== false
  const shWhite = Array.isArray(sh.whitelist) ? sh.whitelist.length : 0
  const shTimes = sh.times || { subuh:'04:30', dzuhur:'12:00', ashar:'15:30', maghrib:'18:00', isya:'19:30' }
  const ns = nextSlot(shTimes)
  const adzanBase = path.join(__dirname, '..', 'media', 'adzan')
  const adzSubuh = exists(path.join(adzanBase, 'subuh.mp3'))
  const adzDef   = exists(path.join(adzanBase, 'adzan.mp3'))
  const shAudio  = adzSubuh || adzDef ? '🎵' : '—'

  const mk = S(F('automakan.json'))
  const mkOn = mk.on !== false
  const mkWhite = Array.isArray(mk.whitelist) ? mk.whitelist.length : 0
  const mkTimes = mk.times || { sarapan:'06:30', siang:'12:05', malam:'20:05' }
  const nm = nextSlot(mkTimes)
  const makanBase = path.join(__dirname, '..', 'media', 'makan')
  const sndSar = exists(path.join(makanBase, 'sarapan.mp3'))
  const sndSig = exists(path.join(makanBase, 'siang.mp3'))
  const sndMal = exists(path.join(makanBase, 'malam.mp3'))
  const mkAudio = (sndSar || sndSig || sndMal) ? '🎵' : '—'

  const body = [
    `Uptime  : ${uptime}`,
    `Memory  : ${mem} MB`,
    `Groups  : ${groups}`,
    `Plugins : ${pluginCount}`,
    '',
    `🕌 Sholat (${sh.zone || 'WITA'}) ${shOn ? '🟢' : '🔴'}  • WL: ${shWhite}`,
    `Next    : ${ns.n?.toUpperCase?.() || ns.n} ${ns.t} ${shAudio}`,
    '',
    `🍽️ Makan (${mk.zone || 'WITA'}) ${mkOn ? '🟢' : '🔴'}  • WL: ${mkWhite}`,
    `Next    : ${nm.n?.toUpperCase?.() || nm.n} ${nm.t} ${mkAudio}`,
    '',
    `Cmd cepat: .lvl • .leaderboard • .sholat • .makan • .bw`
  ].join('\n')

  const title = 'Azbry-MD — Ringkas'
  const txt = (typeof global.formatAzbry === 'function')
    ? global.formatAzbry(title, body)
    : `== ${title} ==\n${body}`

  return conn.reply(m.chat, txt, m)
}

handler.help = ['azinfo']
handler.tags = ['info']
handler.command = /^azinfo$/i

module.exports = handler