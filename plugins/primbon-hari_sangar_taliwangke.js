const fetch = require('node-fetch');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `Masukkan Tanggal Lahir!\n\ncontoh: ${usedPrefix + command} 14,05,2006`;

    try {
        let [part1] = text.split('|');
        let [tanggal1, bulan1, tahun1] = part1.split(',');

        
        await m.reply(wait);

        let res = await fetch(`https://api.botcahx.eu.org/api/primbon/harisangar?tanggal=${tanggal1}&bulan=${bulan1}&tahun=${tahun1}&apikey=${btc}`);
        let json = await res.json();
        let anu = [
          `―-HARI SANGAR TALIWANGKE-―\n\nTanggal lahir: ${json.result.message.tgl_lahir}\n\nHasil: ${json.result.message.result}\n\nInfo: ${json.result.message.info}\n\nCatatan: ${json.result.message.catatan}`, 
       ]
        if (json.status) {
         conn.reply(m.chat,`${(anu)}`);;
        } else {
            conn.reply(m.chat, `Maaf, terjadi kesalahan!`, m);
        }
    } catch (e) {
    throw eror
    }
}

handler.help = ['harisangar']
handler.tags = ['fun']
handler.command = /^(harisangar)$/i
handler.group = false;
handler.limit = true; 

module.exports = handler;

//danaputra133
//di bantu erlan aka