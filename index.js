<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>FebryWesker — Azbry-MD</title>
<meta name="description" content="Portofolio ringkas FebryWesker (Azbry-MD). Smart Automation & Elegant System." />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#0b0d10;         /* dasar gelap */
    --panel:#111418;      /* kartu/section */
    --muted:#98a2b3;      /* teks sekunder */
    --text:#e6e8ec;       /* teks utama */
    --accent:#b8ff9a;     /* hijau neon halus */
    --accent-2:#8ee887;   /* hijau sekunder */
    --ring:rgba(184,255,154,.18);
    --shadow:0 4px 16px rgba(0,0,0,.35);
    --radius:16px;
  }
  *{box-sizing:border-box}
  html,body{height:100%}
  body{
    margin:0; font-family:Inter,system-ui,Segoe UI,Roboto,Arial,Helvetica,sans-serif;
    background:radial-gradient(1200px 800px at 20% -10%, rgba(184,255,154,.06), transparent 40%),
               radial-gradient(1000px 700px at 120% 30%, rgba(184,255,154,.04), transparent 35%),
               var(--bg);
    color:var(--text);
  }

  /* container */
  .wrap{max-width:980px;margin:0 auto;padding:28px 18px 56px}

  /* brand header */
  header{display:flex;align-items:center;gap:16px;margin:8px 0 22px}
  /*  🔧 PP kini IMG, bukan background  */
  .logo{
    width:60px;height:60px;border-radius:14px;object-fit:cover;display:block;
    border:1px solid var(--ring); box-shadow:var(--shadow); background:#0f1114;
  }
  .brand h1{font-weight:800;line-height:1.05;font-size:clamp(28px,4.6vw,42px);margin:0}
  .brand small{display:block;margin-top:6px;color:var(--muted);font-weight:600;letter-spacing:.2px}

  /* hero */
  .hero{
    margin:26px 0 28px;padding:26px;border-radius:var(--radius);
    background:linear-gradient(180deg, rgba(255,255,255,.02), transparent 60%), var(--panel);
    border:1px solid rgba(255,255,255,.04); box-shadow:var(--shadow);
  }
  .tag{display:inline-flex;gap:8px;align-items:center;background:rgba(184,255,154,.09);
       color:#dfffe0;border:1px solid var(--ring);padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.35px;text-transform:uppercase}
  .hero h2{margin:16px 0 12px;font-size:clamp(22px,3.8vw,30px)}
  .hero p{margin:0;color:var(--muted)}

  /* grid tombol utama */
  .grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px;margin-top:18px}
  .span-7{grid-column:span 7}
  .span-5{grid-column:span 5}
  @media(max-width:800px){.span-7,.span-5{grid-column:span 12}}

  .card{
    background:var(--panel); border:1px solid rgba(255,255,255,.05);
    border-radius:var(--radius); padding:18px; box-shadow:var(--shadow);
  }
  .card h3{margin:2px 0 10px;font-size:18px}
  .card p{margin:0 0 14px;color:var(--muted)}
  .btn{
    display:inline-flex;align-items:center;gap:10px;
    padding:12px 16px;border-radius:12px;font-weight:700;text-decoration:none;color:#0b0d10;
    background:linear-gradient(180deg,var(--accent),var(--accent-2));
    box-shadow:0 6px 22px rgba(184,255,154,.25), inset 0 0 0 1px rgba(0,0,0,.12);
    border:0; cursor:pointer;
  }
  .btn.ghost{background:transparent;color:var(--text);border:1px solid rgba(255,255,255,.09)}
  .btn + .btn{margin-left:10px}
  .icon{font-size:18px}

  /* section pages */
  section{margin-top:28px}
  .section-title{font-size:20px;margin:0 0 12px}
  .muted{color:var(--muted)}
  .stack{display:flex;flex-wrap:wrap;gap:10px}

  /* footer */
  footer{margin-top:36px;color:var(--muted);font-size:13px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}
  .mono{opacity:.9}

  /* simple fade in */
  .fade{opacity:0;transform:translateY(6px);animation:fade .6s ease-out forwards}
  .fade.d2{animation-delay:.07s}.fade.d3{animation-delay:.14s}.fade.d4{animation-delay:.21s}
  @keyframes fade{to{opacity:1;transform:none}}
</style>
</head>
<body>
  <div class="wrap">
    <!-- HEADER -->
    <header class="fade">
      <img class="logo" src="https://files.catbox.moe/xv0imr.png?v=1" alt="Azbry-MD logo">
      <div class="brand">
        <h1>FebryWesker</h1>
        <small>Azbry-MD • WhatsApp Bot</small>
      </div>
    </header>

    <!-- HERO -->
    <div class="hero fade d2">
      <span class="tag">Monochrome • Simple</span>
      <h2>Smart Automation & Elegant System</h2>
      <p>Tujuan utama: orang yang masuk ke sini langsung menuju <b>Azbry Sistem</b>. Tautan WhatsApp tetap ada tapi bukan fokus utama.</p>

      <div class="grid">
        <div class="card span-7">
          <h3>Prioritas Utama</h3>
          <p class="muted">Dokumentasi & pusat layanan Azbry.</p>
          <a class="btn" href="#azbry"><span class="icon">🧠</span> Azbry Sistem</a>
          <a class="btn ghost" href="#github"><span class="icon">🌐</span> GitHub</a>
        </div>

        <div class="card span-5">
          <h3>Kontak Cepat</h3>
          <p class="muted">Perlu bantuan cepat via WhatsApp? Buka di sini.</p>
          <a class="btn ghost" href="#whatsapp"><span class="icon">💬</span> WhatsApp</a>
        </div>
      </div>
    </div>

    <!-- AZBRY SISTEM -->
    <section id="azbry" class="fade d2">
      <h3 class="section-title">Azbry Sistem</h3>
      <div class="card">
        <p class="muted">Dokumentasi fitur, changelog, dan integrasi ekosistem Azbry. Ini adalah halaman yang paling disarankan untuk dikunjungi terlebih dahulu.</p>
        <div class="stack">
          <a class="btn" href="https://github.com/vandebry10-star/Azbry-MD2" target="_blank" rel="noopener"><span class="icon">🚀</span> Buka Azbry Sistem</a>
          <a class="btn ghost" href="#github"><span class="icon">📦</span> Lihat Kode di GitHub</a>
        </div>
      </div>
    </section>

    <!-- GITHUB -->
    <section id="github" class="fade d3">
      <h3 class="section-title">GitHub</h3>
      <div class="card">
        <p class="muted">Repositori publik terkait Azbry-MD, eksperimen AI, dan utilitas automasi.</p>
        <a class="btn" href="https://github.com/vandebry10-star" target="_blank" rel="noopener"><span class="icon">🌐</span> Kunjungi GitHub</a>
      </div>
    </section>

    <!-- WHATSAPP -->
    <section id="whatsapp" class="fade d4">
      <h3 class="section-title">WhatsApp</h3>
      <div class="card">
        <p class="muted">Pilih salah satu tombol di bawah untuk membuka chat. Nomor tidak ditampilkan di halaman ini demi privasi.</p>
        <div class="stack">
          <a class="btn" href="https://wa.me/6281510040802" target="_blank" rel="noopener"><span class="icon">👤</span> Nomor Owner</a>
          <a class="btn ghost" href="https://wa.me/6285189988271" target="_blank" rel="noopener"><span class="icon">🤖</span> Nomor Bot</a>
        </div>
      </div>
    </section>

    <footer class="fade d4">
      <span>© <span id="y"></span> FebryWesker</span>
      <span class="mono">Made with ❤ • Monochrome + Simple</span>
    </footer>
  </div>

<script>
  // tahun otomatis
  document.getElementById('y').textContent = new Date().getFullYear();

  // scroll halus kalau klik #hash
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const id=a.getAttribute('href');
      if(id.length>1){
        e.preventDefault();
        document.querySelector(id)?.scrollIntoView({behavior:'smooth',block:'start'});
        history.pushState(null,'',id);
      }
    })
  });
</script>
</body>
</html>
