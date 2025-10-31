const fetch = require('node-fetch');

const handler = async (m, { conn, command, text }) => {
  if (!text) return conn.reply(m.chat, 'Masukkan teks untuk dicari!', m);

  try {
    await m.reply(wait)
    const response = await fetch(`https://api.botcahx.eu.org/api/search/google?text1=${encodeURIComponent(text)}&apikey=${btc}`);
    const data = await response.json();

    if (!data.status || !data.result?.length) throw new Error('Pencarian gagal atau tidak ada hasil');

    const msg = data.result
      .map(({ title, url, snippet }, index) => 
        `${index + 1}. *${title}*\n🌐 ${url}\n📝 ${snippet || 'Tidak ada deskripsi tersedia'}`
      )
      .join('\n\n');

    await conn.relayMessage(m.chat, {
      extendedTextMessage: {
        text: `🔍 *Hasil Pencarian: ${text}*\n\n${msg}`,
        contextInfo: {
          externalAdReply: {
            title: 'Google Search',
            mediaType: 1,
            previewType: 0,
            renderLargerThumbnail: true,
            thumbnailUrl: 'https://telegra.ph/file/d7b761ea856b5ba7b0713.jpg',
            sourceUrl: ''
          }
        },
        mentions: [m.sender]
      }
    }, {});
  } catch (e) {
    await conn.reply(m.chat, eror, m);
  }
};

handler.help = ['google <pencarian>'];
handler.tags = ['internet'];
handler.command = /^google$/i;
handler.limit = true;

module.exports = handler;
