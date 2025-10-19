// plugins/menu.js
// Azbry-MD • Menu Utama (dengan peringatan jika ketik .menu all salah)

const moment = require('moment-timezone')
process.env.TZ = 'Asia/Makassar'

const BOT_NAME = '𝑨𝒛𝒃𝒓𝒚-𝑴𝑫 𝑺𝒚𝒔𝒕𝒆𝒎'
const DEVELOPER = '𝑭𝒆𝒃𝒓𝒚𝑾𝒆𝒔𝒌𝒆𝒓 🧠'

const arrayMenu = [
  'ai','main','downloader','database','sticker','advanced','xp','fun',
  'game','github','group','info','internet','islam','kerang','maker',
  'news','owner','voice','quotes','store','stalk','shortlink','tools','anonymous'
]
const allTags = {
  ai:'MENU AI', main:'MENU UTAMA', downloader:'MENU DOWNLOADER',
  database:'MENU DATABASE', sticker:'MENU STICKER', advanced:'MENU ADVANCED',
  xp:'MENU XP', fun:'MENU FUN', game:'MENU GAME', github:'MENU GITHUB',
  group:'MENU GROUP', info:'MENU INFO', internet:'MENU INTERNET', islam:'MENU ISLAM',
  kerang:'MENU KERANG', maker:'MENU MAKER', news:'MENU NEWS', owner:'MENU OWNER',
  voice:'MENU VOICE', quotes:'MENU QUOTES', store:'MENU STORE', stalk:'MENU STALK',
  shortlink:'MENU SHORTLINK', tools:'MENU TOOLS', anonymous:'MENU ANONYMOUS'
}

const readMore = String.fromCharCode(8206).repeat(4001)

function clockString(ms){
  if(isNaN(ms))return'--:--:--'
  let h=Math.floor(ms/3600000)
  let m=Math.floor(ms/60000)%60
  let s=Math.floor(ms/1000)%60
  return [h,m,s].map(v=>v.toString().padStart(2,0)).join(':')
}

function headerCard(p,m){
  const uptime = clockString(process.uptime()*1000)
  const date = moment.tz('Asia/Makassar').format('dddd, DD MMMM YYYY')
  const time = moment.tz('Asia/Makassar').format('HH:mm:ss')
  const name = `@${m.sender.split('@')[0]}`
  return (
`╭──〔 ${BOT_NAME} 〕
│ Hi ${name}
│ Created by ${DEVELOPER}
│ Powered with AI & smart automation.
│
│ 🕒 Uptime : ${uptime}
│ 📅 Tanggal : ${date}
│ ⏰ Waktu : ${time}
│ ⌨️ Prefix : [ ${p} ]
╰─────────────────────`
  )
}

let handler = async (m,{conn,usedPrefix:_p,args=[],command})=>{
  try{
    const help=Object.values(global.plugins).filter(pl=>!pl.disabled).map(pl=>({
      help:Array.isArray(pl.help)?pl.help:[pl.help],
      tags:Array.isArray(pl.tags)?pl.tags:[pl.tags],
      prefix:'customPrefix'in pl,limit:pl.limit,premium:pl.premium
    }))
    const req=(args[0]||'').toLowerCase()

    // menu utama
    if(!req){
      const list = arrayMenu.map(cat=>`• .menu ${cat}`).join('\n')
      const msg=
`${headerCard(_p,m)}

⬇️ Baca selengkapnya untuk melihat daftar menu ⬇️
${readMore}
╭─❖ DAFTAR MENU
${list}
╰─────────────────────

Tips: Ketik ${_p}menu <kategori> untuk melihat perintahnya.
Contoh: ${_p}menu sticker`
      return conn.sendMessage(m.chat,{text:msg,mentions:[m.sender]},{quoted:m})
    }

    // jika user nulis ".menu all"
    if (req === 'all') {
      return m.reply(`⚠️ Gunakan perintah *.menuall* untuk melihat semua kategori menu.`)
    }

    // menu kategori
    if(!allTags[req]) 
      return m.reply(`Kategori "${req}" tidak tersedia.\n\n💡 Coba ketik *.menuall* untuk menampilkan semua menu.`)
    
    const cmds=help.filter(x=>x.tags&&x.tags.includes(req)&&x.help)
    if(!cmds.length)return m.reply(`Belum ada perintah di kategori ${allTags[req]}`)
    let out=`╭─❖ ${allTags[req]}\n`
    for(const c of cmds){
      for(const h of c.help){
        out+=`│ ${c.prefix?h:_p+h} ${c.limit?'·(Ⓛ)':''}${c.premium?'·(Ⓟ)':''}\n`
      }
    }
    out+=`╰─────────────────────\nGunakan perintah dengan awalan ${_p}`
    return conn.sendMessage(m.chat,{text:out},{quoted:m})
  }catch(e){
    console.error(e)
    conn.reply(m.chat,'Maaf, menu sedang error.',m)
  }
}

handler.help=['menu','help']
handler.tags=['main']
handler.command=/^(menu|help)$/i
handler.exp=3
module.exports=handler