// Downloader Auto • Optimized
// TikTok, Douyin, Instagram, Facebook
// Notes:
// - butuh variabel `btc` (API key botcahx) tersedia secara global/lingkungan.
// - hanya jalan untuk user premium (isPrems === true)

import fetch from 'node-fetch'

/* ================== Helpers ================== */
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// presence helper (silent fail)
async function setTyping(conn, jid, on = true) {
  try { await conn.sendPresenceUpdate(on ? 'composing' : 'paused', jid) } catch {}
}

// fetch with timeout & small retry
async function requestJSON(url, { timeoutMs = 15000, retries = 1 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 AzbryMD/1.0' },
        signal: controller.signal
      })
      clearTimeout(t)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      clearTimeout(t)
      if (attempt === retries) throw e
      await sleep(700) // backoff
    }
  }
}

// safe senders
async function safeSendVideo(conn, jid, url, caption, quoted) {
  await conn.sendMessage(jid, {
    video: { url },
    caption,
    mentions: quoted?.mentionedJid ? quoted.mentionedJid : [quoted?.sender].filter(Boolean)
  }, { quoted })
}
async function safeSendImage(conn, jid, url, caption, quoted) {
  await conn.sendMessage(jid, {
    image: { url },
    caption,
    mentions: quoted?.mentionedJid ? quoted.mentionedJid : [quoted?.sender].filter(Boolean)
  }, { quoted })
}
async function react(conn, m, emoji = '⏬') {
  try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
}

// cooldown per chat
const COOLDOWN_MS = 12_000
global.__dl_cooldown = global.__dl_cooldown || new Map()
function inCooldown(chatId) {
  const last = global.__dl_cooldown.get(chatId) || 0
  const now = Date.now()
  if (now - last < COOLDOWN_MS) return true
  global.__dl_cooldown.set(chatId, now)
  return false
}

/* =============== URL Detection =============== */
// ekstrak 1 url dari teks
function extractFirstUrl(text) {
  const m = text.match(/https?:\/\/[^\s<>"]+/i)
  return m ? m[0] : null
}
// service regex (lebih ketat)
const RX = {
  tiktok: /^(?:https?:\/\/)?(?:www\.)?(?:vt|vm|t)?\.?tiktok\.com\/\S+/i,
  douyin: /^(?:https?:\/\/)?(?:www\.)?(?:v\.)?douyin\.com\/\S+/i,
  instagram: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:tv|p|reel)\/\S+/i,
  facebook: /^(?:https?:\/\/)?(?:web\.|www\.|m\.)?(?:facebook|fb)\.(?:com|watch)\/\S*/i
}

/* ================ Downloaders ================ */
// TikTok
async function downloadTikTok(conn, link, m) {
  const url = `https://api.botcahx.eu.org/api/dowloader/tiktok?url=${encodeURIComponent(link)}&apikey=${btc}`
  const data = await requestJSON(url, { timeoutMs: 20000, retries: 1 })

  const vids = data?.result?.video
  if (!Array.isArray(vids) || vids.length === 0) throw new Error('No video found')

  await react(conn, m, '🎵')
  if (vids.length > 1) {
    for (const v of vids) {
      await safeSendVideo(conn, m.chat, v, '*Tiktok Downloader*', m)
      await sleep(1200)
    }
  } else {
    await safeSendVideo(conn, m.chat, vids[0], '*Tiktok Downloader*', m)
  }
}

// Douyin (video or slide)
async function downloadDouyin(conn, link, m) {
  // coba video dulu
  try {
    const vurl = `https://api.botcahx.eu.org/api/dowloader/douyin?url=${encodeURIComponent(link)}&apikey=${btc}`
    const vdata = await requestJSON(vurl, { timeoutMs: 20000, retries: 1 })
    const vlist = vdata?.result?.video
    if (Array.isArray(vlist) && vlist.length) {
      await react(conn, m, '🎵')
      await safeSendVideo(conn, m.chat, vlist[0], '*Douyin Downloader*', m)
      return
    }
  } catch {}

  // kalau gagal, coba slide
  const surl = `https://api.botcahx.eu.org/api/download/douyinslide?url=${encodeURIComponent(link)}&apikey=${btc}`
  const sdata = await requestJSON(surl, { timeoutMs: 20000, retries: 1 })
  const imgs = sdata?.result?.images
  if (!Array.isArray(imgs) || !imgs.length) throw new Error('No douyin slide found')

  await react(conn, m, '🖼️')
  for (const img of imgs) {
    await safeSendImage(conn, m.chat, img, '*Douyin Slide Downloader*', m)
    await sleep(900)
  }
}

// Instagram (max 3 media)
async function downloadInstagram(conn, link, m) {
  const url = `https://api.botcahx.eu.org/api/dowloader/igdowloader?url=${encodeURIComponent(link)}&apikey=${btc}`
  const data = await requestJSON(url, { timeoutMs: 20000, retries: 1 })

  const arr = Array.isArray(data?.result) ? data.result : []
  const LIMIT = 3
  if (!arr.length) throw new Error('No Instagram media found')

  await react(conn, m, '📸')
  for (let i = 0; i < Math.min(LIMIT, arr.length); i++) {
    const item = arr[i]
    const mediaUrl = item?.url
    if (!mediaUrl) continue

    // tentukan tipe by extension hint (simple)
    if (/\.(mp4|m4v)(\?|$)/i.test(mediaUrl)) {
      await safeSendVideo(conn, m.chat, mediaUrl, '*Instagram Downloader*', m)
    } else {
      await safeSendImage(conn, m.chat, mediaUrl, '*Instagram Downloader*', m)
    }
    await sleep(900)
  }
}

// Facebook (prioritas HD lalu SD)
async function downloadFacebook(conn, link, m) {
  const url = `https://api.botcahx.eu.org/api/dowloader/fbdown3?url=${encodeURIComponent(link)}&apikey=${btc}`
  const data = await requestJSON(url, { timeoutMs: 20000, retries: 1 })
  const urls = data?.result?.url?.urls

  if (!Array.isArray(urls) || !urls.length) throw new Error('No facebook URLs')
  let videoUrl = urls.find(x => x?.hd)?.hd || urls.find(x => x?.sd)?.sd
  if (!videoUrl) throw new Error('No suitable FB video url')

  await react(conn, m, '📘')
  await safeSendVideo(conn, m.chat, videoUrl, '*Facebook Downloader*', m)
}

/* =================== Hook =================== */
export async function before(m, { conn, isPrems }) {
  try {
    // basic guards
    if (!m?.text) return
    if (!isPrems) return                    // hanya premium
    if (m.fromMe) return                    // abaikan pesan dari bot sendiri
    if (/^(?:[=>.##!/\\])/i.test(m.text)) return // abaikan command
    const chat = global.db?.data?.chats?.[m.chat]
    if (chat?.isBanned) return

    // cooldown per chat
    if (inCooldown(m.chat)) return

    // ambil 1 url
    const rawUrl = extractFirstUrl(m.text.replace(/\n+/g, ' '))
    if (!rawUrl) return

    // normalisasi url (hapus trailing tanda baca)
    const url = rawUrl.replace(/[),.]+$/g, '')

    // set typing on selama proses
    await setTyping(conn, m.chat, true)

    // deteksi layanan
    if (RX.tiktok.test(url)) {
      await downloadTikTok(conn, url.match(RX.tiktok)[0], m)
    } else if (RX.douyin.test(url)) {
      await downloadDouyin(conn, url.match(RX.douyin)[0], m)
    } else if (RX.instagram.test(url)) {
      await downloadInstagram(conn, url.match(RX.instagram)[0], m)
    } else if (RX.facebook.test(url)) {
      await downloadFacebook(conn, url.match(RX.facebook)[0], m)
    } else {
      // bukan link yang didukung, lewati
      return
    }

    return !0
  } catch (err) {
    console.error('[AUTO DL ERR]', err?.message || err)
    try {
      await conn.sendMessage(m.chat, { text: '⚠️ Gagal memproses tautan. Coba ulang beberapa saat lagi.' }, { quoted: m })
    } catch {}
  } finally {
    await setTyping(conn, m.chat, false)
  }
}