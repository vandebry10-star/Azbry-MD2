// plugins/_autoresponse.js
// Auto Respon Ramah • Azbry-MD by FebryWesker 🧠

let handler = m => m

handler.before = async function (m, { conn }) {
  if (m.isBaileys || m.fromMe || !m.text) return
  const text = m.text.toLowerCase()

  // daftar kata sapaan umum
  const greetings = ['hai','halo','bot']
  if (greetings.some(v => text.includes(v))) {
    let msg = `👋 Hai *${m.pushName || 'Kamu'}*!  
Saya **Azbry-MD**, asisten WhatsApp berbasis AI 🤖  

✨ Ketik *.menu* untuk melihat daftar fitur.  
🧠 Dikelola oleh: *FebryWesker*  
💬 Powered by: *Azbry System™*`

    await conn.sendMessage(m.chat, { text: msg }, { quoted: m })
  }
}

module.exports = handler
