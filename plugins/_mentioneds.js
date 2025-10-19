// plugins/_auto-mention-rescue.js
// 🔔 Auto Mention Rescue — kirim DM kalau user di-mention tapi AFK ≥1 jam
// Author: FebryWesker (Azbry Edition)

process.env.TZ = 'Asia/Makassar'
const fs = require('fs')
const path = require('path')

const DB = path.join(__dirname, '..', 'database', 'mention-rescue.json')
function ensure() {
  const dir = path.dirname(DB)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(
      DB,
      JSON.stringify({
        on: true,
        timeout: 60, // menit (1 jam)
        cooldown: 120, // menit (2 jam)
        users: {},
        logs: [],
        whitelist: [] // daftar grup aktif
      }, null, 2)
    )
  }
}
function load(){ ensure(); return JSON.parse(fs.readFileSync(DB,'utf8')) }
function save(x){ fs.writeFileSync(DB, JSON.stringify(x,null,2)) }

function now(){ return Math.floor(Date.now()/1000) }
function humanize(seconds){
  const h = Math.floor(seconds/3600), m = Math.floor(seconds%3600/60)
  return h>0?`${h} jam ${m} mnt`:`${m} mnt`
}

// update lastActive setiap user kirim pesan
module.exports.before = async function(m){
  try{
    if (!m.sender) return
    const st = load()
    st.users[m.sender] = st.users[m.sender] || {}
    st.users[m.sender].lastActive = now()
    save(st)

    // kalau fitur off
    if (!st.on) return

    // hanya grup
    if (!m.isGroup || !m.mentionedJid?.length) return
    if (st.whitelist.length && !st.whitelist.includes(m.chat)) return

    const timeout = (st.timeout||60)*60
    const cooldown = (st.cooldown||120)*60

    for(const target of m.mentionedJid){
      if (target === this.user.id) continue
      const u = st.users[target] || {}
      const last = u.lastActive || 0
      const since = now() - last
      const lastNotif = u.lastNotify || 0

      // kalau belum aktif 1 jam dan belum notif lagi
      if (since >= timeout && now() - lastNotif >= cooldown){
        const text = `🔔 *Mention Rescue*\nKamu baru disebut di grup:\n${m.chat}\n\n📣 Dari: @${m.sender.split('@')[0]}\n🗨️ Cuplikan:\n${(m.text||'').slice(0,100)}`
        try{
          await this.sendMessage(target, { text, mentions:[m.sender] })
          u.lastNotify = now()
          st.logs.unshift({
            time: new Date().toLocaleString('id-ID',{timeZone:'Asia/Makassar'}),
            group: m.chat,
            from: m.sender,
            to: target,
            snippet: (m.text||'').slice(0,100)
          })
          st.logs = st.logs.slice(0,100)
          st.users[target] = u
          save(st)
        }catch(e){}
      }
    }
  }catch(e){}
}

// 🛠️ Commands (owner)
let handler = async (m, { args, usedPrefix, isOwner }) => {
  if (!isOwner) return m.reply('Khusus owner.')
  const st = load()
  const sub = (args[0]||'').toLowerCase()
  if (!sub || sub==='status'){
    const onoff = st.on?'🟢 ON':'🔴 OFF'
    return m.reply(`Mention Rescue ${onoff}\nTimeout: ${st.timeout} menit\nCooldown: ${st.cooldown} menit\nWhitelist: ${st.whitelist.length||'semua grup'}\n\n${usedPrefix}mentionrescue on/off\n${usedPrefix}mentionrescue timeout <mnt>\n${usedPrefix}mentionrescue cooldown <mnt>\n${usedPrefix}mentionrescue add|del <jid/here>\n${usedPrefix}mentionrescue list\n${usedPrefix}mentionlog`)
  }
  if (sub==='on'||sub==='off'){ st.on=sub==='on'; save(st); return m.reply(`✅ Mention Rescue ${sub.toUpperCase()}`) }
  if (sub==='timeout'){ const v=parseInt(args[1]||''); if(!v)return m.reply('Masukkan menit.'); st.timeout=v; save(st); return m.reply(`✅ Timeout → ${v} menit`) }
  if (sub==='cooldown'){ const v=parseInt(args[1]||''); if(!v)return m.reply('Masukkan menit.'); st.cooldown=v; save(st); return m.reply(`✅ Cooldown → ${v} menit`) }
  if (sub==='add'||sub==='del'){
    const id=(args[1]==='here'||!args[1])? m.chat : args[1]
    if(!id.endsWith('@g.us')) return m.reply('Masukkan JID grup valid.')
    if(sub==='add' && !st.whitelist.includes(id)) st.whitelist.push(id)
    if(sub==='del') st.whitelist=st.whitelist.filter(x=>x!==id)
    save(st)
    return m.reply('✅ Ok.')
  }
  if (sub==='list'){ return m.reply('Whitelist:\n'+(st.whitelist.join('\n')||'(kosong)')) }
  if (sub==='log'||sub==='logs'||sub==='mentionlog'){
    const logs=st.logs||[]
    if(!logs.length) return m.reply('Belum ada log.')
    const out=logs.slice(0,10).map((x,i)=>`${i+1}. ${x.time}\n   Grup: ${x.group}\n   Dari: @${x.from.split('@')[0]} → @${x.to.split('@')[0]}\n   “${x.snippet}”`).join('\n\n')
    return m.reply('🗒️ *Mention Log (10 terakhir)*\n'+out)
  }
}
handler.help=['mentionrescue [on/off/timeout/cooldown/add/del/list/log]']
handler.tags=['auto','owner']
handler.command=/^mention(rescue|log|logs)$/i
handler.owner=true
module.exports=handler