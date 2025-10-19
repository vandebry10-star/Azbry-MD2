// plugins/_reminder-report.js
// 🧾 Ringkasan Laporan Pengingat (Sholat + Makan) → kirim ke Owner tiap hari
// • Baca database: autosholat.json & automakan.json
// • Tanda: [✓] terkirim, [x] gagal/tdk ada, [-] tidak diketahui
// • Default kirim harian 21:45 WITA (bisa diubah)
// by FebryWesker (Azbry Edition)

process.env.TZ = 'Asia/Makassar'
const fs = require('fs')
const path = require('path')

const DB = path.join(__dirname, '..', 'database', 'remind-report.json')
const F  = (p) => path.join(__dirname, '..', 'database', p)
const readJSON = (file, fallback = {}) => { try { return JSON.parse(fs.readFileSync(file,'utf8')) } catch { return fallback } }
const saveJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2))

function ensure() {
  const dir = path.dirname(DB)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB)) saveJSON(DB, { on: true, time: '21:45', last: '' })
}
function loadCfg(){ ensure(); return readJSON(DB, { on:true, time:'21:45', last:'' }) }
function saveCfg(x){ saveJSON(DB, x) }

function nowLocal(){ return new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Makassar'})) }
function HM(d=nowLocal()){ return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
function YMD(d=nowLocal()){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const cap = s => s.charAt(0).toUpperCase()+s.slice(1)

function owners(){
  const s=new Set()
  ;(global.owner||[]).forEach(o=>{ const n=Array.isArray(o)?o[0]:o; if(n) s.add(String(n).replace(/[^\d]/g,'')+'@s.whatsapp.net') })
  return [...s]
}
const mark = ok => ok===true ? '✓' : ok===false ? 'x' : '-'

// --- read sholat status (today) ---
function readSholat() {
  const sh = readJSON(F('autosholat.json'), {})
  const today = YMD()
  const sent    = (sh.sent    && sh.sent[today])    || {}
  const sentPre = (sh.sentPre && sh.sentPre[today]) || {}
  const names = ['subuh','dzuhur','ashar','maghrib','isya']
  const list = names.map(n => ({
    name: n,
    pre:  sentPre[n]===true ? true : (sentPre[n]===false ? false : (sentPre[n]==null ? null : !!sentPre[n])),
    main: sent[n]===true    ? true : (sent[n]===false    ? false : (sent[n]==null    ? null : !!sent[n]))
  }))
  const wl = Array.isArray(sh.whitelist) ? sh.whitelist.length : 0
  return { on: sh.on!==false, zone: sh.zone||'WITA', times: sh.times||{}, list, wl }
}

// --- read makan status (today) ---
function readMakan() {
  const mk = readJSON(F('automakan.json'), {})
  const today = YMD()
  let sent = {}
  if (mk.sent && typeof mk.sent==='object') {
    if (mk.sent[today]) sent = mk.sent[today]
    else if (['sarapan','siang','malam'].some(k => Object.prototype.hasOwnProperty.call(mk.sent, k))) {
      sent = mk.sent // assume today
    }
  }
  const times = (mk.times||{ sarapan:'06:30', siang:'12:05', malam:'20:05' })
  return {
    on: mk.on!==false, zone: mk.zone||'WITA', times,
    sarapan: sent.sarapan===true ? true : (sent.sarapan===false ? false : (sent.sarapan==null ? null : !!sent.sarapan)),
    siang:   sent.siang===true   ? true : (sent.siang===false   ? false : (sent.siang==null   ? null : !!sent.siang)),
    malam:   sent.malam===true   ? true : (sent.malam===false   ? false : (sent.malam==null   ? null : !!sent.malam)),
    wl: Array.isArray(mk.whitelist) ? mk.whitelist.length : 0
  }
}

function buildReportText() {
  const sh = readSholat()
  const mk = readMakan()
  const date = YMD()
  const lines = []

  lines.push(`Tanggal: ${date} (WITA)\n`)
  lines.push(`🕌 *Sholat* (${sh.zone}) ${sh.on?'🟢':'🔴'}`)
  sh.list.forEach(it=>{
    lines.push(`• ${cap(it.name)}  [pre: ${mark(it.pre)}]  [adzan: ${mark(it.main)}]  ${sh.times?.[it.name]?'('+sh.times[it.name]+')':''}`)
  })
  if (sh.wl) lines.push(`  WL grup: ${sh.wl}`)

  lines.push(`\n🍽️ *Makan* (${mk.zone}) ${mk.on?'🟢':'🔴'}`)
  lines.push(`• Sarapan  [${mark(mk.sarapan)}]  (${mk.times.sarapan||'-'})`)
  lines.push(`• Siang    [${mark(mk.siang)}]    (${mk.times.siang||'-'})`)
  lines.push(`• Malam    [${mark(mk.malam)}]    (${mk.times.malam||'-'})`)
  if (mk.wl) lines.push(`  WL grup: ${mk.wl}`)

  lines.push(`\nKeterangan: [✓] terkirim  [x] tidak terkirim  [-] tidak diketahui`)

  const body = lines.join('\n')
  const title = `Reminder Daily Report`
  if (typeof global.formatAzbry === 'function') return global.formatAzbry(title, body)
  return `== ${title} ==\n${body}`
}

// --- scheduler harian ---
if (!global.__REMIND_REPORT_TIMER__) {
  global.__REMIND_REPORT_TIMER__ = setInterval(async () => {
    try {
      const cfg = loadCfg()
      if (!cfg.on) return
      const nowHM = HM()
      const today = YMD()
      if (nowHM !== cfg.time) return
      if (cfg.last === today) return

      const txt = buildReportText()
      const os = owners()
      for (const j of os) {
        try { await global.conn.sendMessage(j, { text: txt }) } catch {}
      }
      cfg.last = today
      saveCfg(cfg)
    } catch {}
  }, 60_000)
}

// --- command ---
let handler = async (m, { args, usedPrefix, command, isOwner }) => {
  if (!/^remindreport$/i.test(command)) return
  if (!isOwner) return m.reply('Khusus owner.')

  const cfg = loadCfg()
  const sub = (args[0]||'').toLowerCase()

  if (!sub || sub==='status') {
    const msg = `
Status: ${cfg.on?'🟢 ON':'🔴 OFF'}
Jadwal: ${cfg.time} (WITA)

Perintah:
${usedPrefix}remindreport now
${usedPrefix}remindreport time <HH:MM>
${usedPrefix}remindreport on/off
`.trim()
    return m.reply(typeof global.formatAzbry==='function'
      ? global.formatAzbry('Reminder Report', msg)
      : msg)
  }
  if (sub==='on'||sub==='off'){
    cfg.on = sub==='on'; saveCfg(cfg)
    return m.reply(`✅ Reminder Report ${sub.toUpperCase()}`)
  }
  if (sub==='time'){
    const v=(args[1]||'').trim()
    if(!/^\d{2}:\d{2}$/.test(v)) return m.reply(`Format jam salah. Contoh: ${usedPrefix}remindreport time 21:45`)
    cfg.time=v; cfg.last='' ; saveCfg(cfg)
    return m.reply(`✅ Jadwal diubah → ${v} WITA`)
  }
  if (sub==='now'){
    const txt = buildReportText()
    try{ await m.reply(txt) }catch{}
    const os=owners()
    for(const j of os){ try{ await global.conn.sendMessage(j,{text:txt}) }catch{} }
    return
  }

  return m.reply(`Pakai:\n${usedPrefix}remindreport now\n${usedPrefix}remindreport time <HH:MM>\n${usedPrefix}remindreport on/off`)
}

handler.help = ['remindreport [now|time|on|off]']
handler.tags = ['auto','report','owner']
handler.command = /^remindreport$/i
handler.owner = true

module.exports = handler