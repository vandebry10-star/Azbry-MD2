// plugins/instagram.js
// Instagram Downloader (command) — sinkron dengan autodl (pakai conn.sendFile)

const fetch = require('node-fetch')

const LIMIT_MEDIA = 3
const API_BASE = 'https://api.botcahx.eu.org/api/dowloader/igdowloader'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function isVideo(u) { return /\.(mp4|m4v)(\?|$)/i.test(u) }
function isWebp(u)  { return /\.webp(\?|$)/i.test(u) }

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) throw `Contoh:\n${usedPrefix}${command} https://www.instagram.com/reel/XXXXXXXX/`
  if (!/instagram\.com\/(p|reel|tv)\//i.test(args[0])) throw `URL Instagram tidak valid.`

  try {
    // feedback reaksi
    try { await conn.sendMessage(m.chat, { react: { text: '⏬', key: m.key } }) } catch {}

    const apiURL = `${API_BASE}?url=${encodeURIComponent(args[0])}&apikey=${btc}`
    const res = await fetch(apiURL, { headers: { 'user-agent': 'Mozilla/5.0 Azbry-MD' }})
    if (!res.ok) throw `HTTP ${res.status}`
    const json = await res.json()

    const items = Array.isArray(json?.result) ? json.result : []
    if (!items.length) throw `Media tidak ditemukan dari URL tersebut.`

    const max = Math.min(LIMIT_MEDIA, items.length)
    for (let i = 0; i < max; i++) {
      const url = items[i]?.url
      if (!url) continue

      // === Kirim menggunakan pipeline yang sama seperti autodl ===
      if (isVideo(url)) {
        // Video → gunakan conn.sendFile (lebih stabil daripada video:{url})
        await conn.sendFile(m.chat, url, 'instagram.mp4', '*Instagram Downloader*', m)
      } else if (isWebp(url)) {
        // WEBP → kirim sebagai dokumen supaya tidak otomatis jadi stiker
        await conn.sendMessage(m.chat, {
          document: { url },
          fileName: 'instagram.webp',
          mimetype: 'image/webp',
          caption: '*Instagram Downloader* (webp)'
        }, { quoted: m })
      } else {
        // Gambar biasa → juga aman pakai sendFile
        await conn.sendFile(m.chat, url, 'instagram.jpg', '*Instagram Downloader*', m)
      }

      await sleep(900)
    }
  } catch (e) {
    console.error('[IG CMD ERR]', e)
    throw `⚠️ Gagal mengunduh/mengirim dari Instagram. Coba link lain atau ulangi nanti.`
  }
}

handler.help = ['instagram <url>', 'ig <url>', 'igdl <url>']
handler.tags = ['downloader']
handler.command = /^(ig|instagram|igdl|instagramdl)$/i
handler.limit = true

module.exports = handler