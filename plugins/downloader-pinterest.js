let fetch = require('node-fetch');
let handler = async (m, { usedPrefix, command, conn, text }) => {
  if (!text) throw `*🚩 Example:* ${usedPrefix}${command} Zhao Lusi`;
  m.reply(wait)
  try {
    let response = await fetch(`https://api.botcahx.eu.org/api/search/pinterest?text1=${text}&apikey=${btc}`);
    let data = await response.json();   
    let old = new Date()
    let limit = Math.min(5, data.result.length);
    for(let i = 1; i < limit; i++) { 
      await sleep(3000);
      conn.sendFile(m.chat, data.result[i], 'pin.jpg', `🍟 *Fetching* : ${((new Date - old) * 1)} ms`, m);
    }
  } catch (e) {
    throw eror
  }
}

handler.help = ['pinterest <keyword>'];
handler.tags = ['internet'];
handler.command = /^(pinterest)$/i;

module.exports = handler;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
