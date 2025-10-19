// plugins/menuall.js
// Azbry-MD • Full Elegant Theme Menu (Azbry Style)

const moment = require('moment-timezone')
process.env.TZ = 'Asia/Makassar'

const BOT_NAME  = '𝑨𝒛𝒃𝒓𝒚-𝑴𝑫 𝑺𝒚𝒔𝒕𝒆𝒎'
const DEV_NAME  = '𝑭𝒆𝒃𝒓𝒚𝑾𝒆𝒔𝒌𝒆𝒓 🧠'

// kategori tetap rapi seperti menu utama
const arrayMenu = [
  'ai','main','downloader','database','sticker','advanced','xp','fun',
  'game','github','group','info','internet','islam','kerang','maker',
  'news','owner','voice','quotes','store','stalk','shortlink','tools','anonymous'
]
const allTags = {
  ai:'🤖 MENU AI', main:'🧭 MENU UTAMA', downloader:'📥 MENU DOWNLOADER',
  database:'💾 MENU DATABASE', sticker:'🎨 MENU STICKER', advanced:'⚙️ MENU ADVANCED',
  xp:'🏅 MENU XP', fun:'🎭 MENU FUN', game:'🎮 MENU GAME', github:'🐙 MENU GITHUB',
  group:'👥 MENU GROUP', info:'📚 MENU INFO', internet:'🌐 MENU INTERNET', islam:'🕌 MENU ISLAM',
  kerang:'🐚 MENU KERANG', maker:'🧩 MENU MAKER', news:'📰 MENU NEWS', owner:'👑 MENU OWNER',
  voice:'🎤 MENU VOICE', quotes:'💬 MENU QUOTES', store:'🏪 MENU STORE', stalk:'🔍 MENU STALK',
  shortlink:'🔗 MENU SHORTLINK', tools:'🛠️ MENU TOOLS', anonymous:'🎭 MENU ANONYMOUS'
}

const readMore = String.fromCharCode(8206).repeat(4001)

function clockString(ms){
  if (isNaN(ms)) return '--:--:--'
  let h = Math.floor(ms/3600000)
  let m = Math.floor(ms/60000)%60
  let s = Math.floor(ms/1000)%60
  return [h,m,s].map(v=>v.toString().padStart(2,0)).join(':')
}

function headerCard(p, m){
  const uptime = clockString(process.uptime()*1000)
  const date = moment.tz('Asia/Makassar').format('dddd, DD MMMM YYYY')
  const time = moment.tz('Asia/Makassar').format('HH:mm:ss')
  const name = `@${m.sender.split('@')[0]}`
  return (
`╭──〔 ${BOT_NAME} 〕
│ Hi ${name}
│ Created by ${DEV_NAME}
│ Powered with AI & smart automation.
│
│ 🕒 Uptime : ${uptime}
│ 📅 Tanggal : ${date}
│ ⏰ Waktu : ${time}
│ ⌨️ Prefix : [ ${p} ]
╰─────────────────────`
  )
}

let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    const help = Object.values(global.plugins)
      .filter(pl => !pl.disabled)
      .map(pl => ({
        help: Array.isArray(pl.help) ? pl.help : [pl.help],
        tags: Array.isArray(pl.tags) ? pl.tags : [pl.tags],
        prefix: 'customPrefix' in pl,
        limit: pl.limit,
        premium: pl.premium
      }))

    let text = `${headerCard(_p, m)}\n\n`
    text += `💠 *DAFTAR MENU KATEGORI FULL*\n`
    text += `────────────────────────────\n`
    text += `⬇️ Baca selengkapnya untuk melihat semua menu ⬇️\n${readMore}\n`

    for (const cat of arrayMenu) {
      const title = allTags[cat]
      const cmds = help.filter(x => x.tags && x.tags.includes(cat) && x.help && x.help[0])
      if (!cmds.length) continue

      text += `\n────────────────────────────\n`
      text += `✨ ${title}\n`
      text += `────────────────────────────\n`
      for (const cm of cmds) {
        for (const h of cm.help) {
          if (!h) continue
          text += `${cm.prefix ? h : _p + h} ${cm.limit ? '·(Ⓛ)' : ''}${cm.premium ? '·(Ⓟ)' : ''}\n`
        }
      }
    }

    text += `\n────────────────────────────\n`
    text += `Gunakan awalan ${_p} untuk menjalankan perintah.\n`
    text += `🌐 Azbry-MD • Developed by ${DEV_NAME}`

    return conn.sendMessage(m.chat, { text, mentions: [m.sender] }, { quoted: m })
  } catch (e) {
    console.error(e)
    return conn.reply(m.chat, '⚠️ Maaf, menuall sedang error.', m)
  }
}

handler.help = ['menuall','allmenu','helpall']
handler.tags = ['main']
handler.command = /^(menuall|allmenu|helpall)$/i
handler.exp = 3

module.exports = handler