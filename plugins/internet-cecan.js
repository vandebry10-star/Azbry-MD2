let fetch = require('node-fetch')

let handler = async (m, { conn, command }) => {
    try {
        let buffer = await fetch(`https://api.botcahx.eu.org/api/cecan/${command}?apikey=${btc}`).then(res => res.buffer())
        conn.sendFile(m.chat, buffer, 'hasil.jpg', `Random ${command}`, m)
    } catch (err) {
        throw eror
    }
}

handler.help = handler.command = ['china', 'vietnam', 'thailand', 'indonesia', 'korea', 'japan', 'malaysia', 'justinaxie', 'jeni', 'jiso', 'ryujin', 'rose', 'hijaber']
handler.tags = ['internet']
handler.limit = true
module.exports = handler
