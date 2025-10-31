global.owner = ['628xxxxxxxxxx', '115414931636252'] // nomor owner wajib di isi tidak boleh kosong (ganti lid kamu)
global.mods  = ['628xxxxxxxxxx', '115414931636252'] // nomor owner wajib di isi tidak boleh kosong (ganti lid kamu)
global.prems = ['628xxxxxxxxxx', '115414931636252'] // nomor owner wajib di isi tidak boleh kosong (ganti lid kamu)
global.nameowner = 'FebryWesker' // nama owner wajib di isi tidak boleh kosong
global.numberowner = '628xxxxxxxxxx' // nomor owner wajib di isi tidak boleh kosong
global.mail = 'support@tioprm.eu.org' // wajib di isi tidak boleh kosong
global.gc = 'https://chat.whatsapp.com/I5RpePh2b5u37OyFjzCNTr' // wajib di isi tidak boleh kosong
global.instagram = 'https://instagram.com/iglu' // wajib di isi tidak boleh kosong
global.wm = '© AzbryMD' // isi nama bot atau nama kalian
global.wait = '_*Tunggu sedang di proses...*_' // ini pesan simulasi loading
global.eror = '_*Server Error*_' // ini pesan saat terjadi kesalahan
global.stiker_wait = '*⫹⫺ Stiker sedang dibuat...*' // ini pesan simulasi saat loading pembuatan sticker
global.packname = 'Made With' // watermark stikcker packname
global.author = 'AzbryMD' // watermark stikcker author
global.maxwarn = '5' // Peringatan maksimum Warn

global.autobio = false // Set true/false untuk mengaktifkan atau mematikan autobio (default: false)
global.antiporn = false // Set true/false untuk Auto delete pesan porno (bot harus admin) (default: false)
global.spam = false // Set true/false untuk anti spam (default: false)
global.gcspam = false // Set true/false untuk menutup grup ketika spam (default: false)
    

// APIKEY INI WAJIB DI ISI! //
global.btc = 'apikey_lu'
global.aksesKey = 'akseskey_lu'
// Daftar terlebih dahulu https://api.botcahx.eu.org


// Tidak boleh diganti atau di ubah
global.APIs = {   
  btc: 'https://api.botcahx.eu.org'
}

//Tidak boleh diganti atau di ubah
global.APIKeys = { 
  'https://api.botcahx.eu.org': global.btc
}


let fs = require('fs')
let chalk = require('chalk')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  delete require.cache[file]
  require(file)
})
