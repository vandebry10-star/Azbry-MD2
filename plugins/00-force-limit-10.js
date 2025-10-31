// plugins/00-force-limit-10.js
// Paksa default limit = 10 untuk semua user (free)

function isNum(n) {
  return typeof n === 'number' && !isNaN(n)
}

module.exports = {
  // jalan sebelum plugin lain
  before(m) {
    try {
      const users = global.db?.data?.users
      if (!users) return
      const u = users[m.sender]
      if (!u) return

      // kalau belum ada/invalid → set 10
      if (!isNum(u.limit)) u.limit = 10

      // kalau ada modul lain nyetel >10 (mis. 100) → paksa 10
      if (u.limit > 10) u.limit = 10
    } catch {}
  }
}