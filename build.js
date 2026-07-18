// Yerel üretim script'i — 81 il sayfasını + sitemap.xml'i data.js'den üretir.
// Deploy edilen siteye dahil değildir, sadece bu klasörde çalıştırılır: node build.js

const fs = require("fs");
const path = require("path");
const { ILLER, BOLGE_ADLARI } = require("./data.js");

const SITE = "https://havadurumu81.com";

const REGION_BLURB = {
  marmara: (ad) => `Marmara Bölgesi'nde yer alan ${ad}, Karadeniz ile Ege arasındaki geçiş ikliminin özelliklerini taşır: kışlar serin ve yağışlı, yazlar ise nispeten sıcak ve orta derecede nemli geçer. En yağışlı aylar kış ve ilkbahar başlarıdır.`,
  ege: (ad) => `Ege Bölgesi'nde bulunan ${ad}, tipik Akdeniz iklimini yaşar: yazlar sıcak ve kurak, kışlar ise ılık ve yağışlı geçer. Yağışın büyük bölümü kasım-mart arasında düşer.`,
  akdeniz: (ad) => `Akdeniz Bölgesi'nde yer alan ${ad}'de yazlar uzun, sıcak ve kurak; kışlar ise ılık ve yağışlıdır. Yıllık sıcaklık farkı Türkiye'nin çoğu bölgesine göre daha düşüktür.`,
  icanadolu: (ad) => `İç Anadolu Bölgesi'nde bulunan ${ad}, karasal iklimin tipik özelliklerini gösterir: yazlar sıcak ve kurak, kışlar ise soğuk ve karlı geçer. Gece-gündüz ve yaz-kış sıcaklık farkları oldukça belirgindir.`,
  karadeniz: (ad) => `Karadeniz Bölgesi'nde yer alan ${ad}, yıl boyunca dengeli ve bol yağış alan nemli bir iklime sahiptir. Yazlar ılık, kışlar ise soğuk fakat kıyı kesimlerinde don olayı nispeten seyrektir.`,
  doguanadolu: (ad) => `Doğu Anadolu Bölgesi'nde bulunan ${ad}, Türkiye'nin en sert karasal iklimine sahip bölgelerindendir: kışlar uzun, soğuk ve karlı; yazlar ise kısa ve serindir.`,
  guneydogu: (ad) => `Güneydoğu Anadolu Bölgesi'nde yer alan ${ad}, yazları çok sıcak ve kurak, kışları ise ılık ve az yağışlı geçen karasal-Akdeniz karışımı bir iklime sahiptir.`,
};

function pageHTML(il) {
  const related = ILLER.filter((x) => x.bolge === il.bolge && x.slug !== il.slug)
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"))
    .slice(0, 8);

  const title = `${il.ad} Hava Durumu – Bugün ve 16 Günlük Tahmin | havadurumu81`;
  const desc = `${il.ad} hava durumu: anlık sıcaklık, saatlik ve 16 günlük tahmin. ${il.ad} için güncel hava durumunu hemen öğrenin.`;
  const url = `${SITE}/${il.slug}-hava-durumu.html`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${il.ad} Hava Durumu">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta name="robots" content="index, follow">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2219%22 font-size=%2220%22>☀️</text></svg>">
<link rel="stylesheet" href="style.css">
<script>
  (function(){var t=localStorage.getItem("hd81-theme");if(t)document.documentElement.setAttribute("data-theme",t);})();
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"Anasayfa","item":"${SITE}/"},
    {"@type":"ListItem","position":2,"name":"${il.ad} Hava Durumu","item":"${url}"}
  ]
}
</script>
</head>
<body data-il-slug="${il.slug}">

<header class="site-header">
  <div class="wrap">
    <a href="/" class="logo"><span>havadurumu</span><span class="dot">81</span></a>
    <nav class="header-nav">
      <a href="/#iller">81 İl</a>
      <button class="theme-toggle" id="themeToggle" aria-label="Tema değiştir">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.4 6.4 0 0 0 10.5 10.5Z"/></svg>
      </button>
    </nav>
  </div>
</header>

<main>
  <div class="wrap" style="padding-top:20px;">
    <div class="search-box" style="max-width:420px;margin:0 0 8px;">
      <input type="text" id="ilSearchInput" placeholder="Başka bir il ara…" autocomplete="off">
      <span class="search-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/></svg>
      </span>
      <ul class="search-suggest" id="ilSearchSuggest"></ul>
    </div>
    <p class="breadcrumb"><a href="/">Anasayfa</a> / ${il.ad} Hava Durumu</p>
  </div>

  <div class="wrap" style="padding-top:18px;padding-bottom:50px;">
    <h1 style="font-size:1.5rem;margin:0 0 16px;">${il.ad} Hava Durumu</h1>

    <div class="weather-hero" id="weatherHero">
      <div style="padding:30px;text-align:center;opacity:.7;">Hava durumu yükleniyor…</div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="tabBugun">Bugün</button>
      <button class="tab-btn" data-tab="tabHafta">16 Günlük</button>
    </div>

    <div class="tab-panel active" id="tabBugun">
      <div class="hourly-row" id="hourlyRow">
        <div class="hour-card skeleton" style="height:88px;"></div>
        <div class="hour-card skeleton" style="height:88px;"></div>
        <div class="hour-card skeleton" style="height:88px;"></div>
      </div>
    </div>

    <div class="tab-panel" id="tabHafta">
      <div class="day-list" id="dayList">
        <div class="day-row skeleton" style="height:52px;"></div>
        <div class="day-row skeleton" style="height:52px;"></div>
      </div>
    </div>

    <div class="city-info">
      <h2>${il.ad} İklimi Hakkında</h2>
      <p>${REGION_BLURB[il.bolge](il.ad)}</p>
      <p>${il.ad}, ${BOLGE_ADLARI[il.bolge]} Bölgesi'nde yer alır. Şehir merkezinin yaklaşık koordinatları: enlem ${il.lat}, boylam ${il.lon}.</p>
      <div class="related-cities">
        ${related.map((r) => `<a href="${r.slug}-hava-durumu.html">${r.ad} Hava Durumu</a>`).join("\n        ")}
      </div>
    </div>
  </div>
</main>

<footer class="site-footer">
  <div class="wrap">
    <p>© <span id="yearNow"></span> havadurumu81 — hava durumu verileri Open-Meteo tarafından sağlanmaktadır.</p>
    <div class="foot-links">
      <a href="/sitemap.xml">Site Haritası</a>
    </div>
  </div>
</footer>

<script src="data.js"></script>
<script src="script.js"></script>
<script>document.getElementById("yearNow").textContent = new Date().getFullYear();</script>
</body>
</html>
`;
}

function build() {
  const dir = __dirname;
  ILLER.forEach((il) => {
    fs.writeFileSync(path.join(dir, `${il.slug}-hava-durumu.html`), pageHTML(il), "utf8");
  });

  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...ILLER.map(
      (il) =>
        `  <url><loc>${SITE}/${il.slug}-hava-durumu.html</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`
    ),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(dir, "sitemap.xml"), sitemap, "utf8");

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`;
  fs.writeFileSync(path.join(dir, "robots.txt"), robots, "utf8");

  console.log(`${ILLER.length} il sayfası + sitemap.xml + robots.txt üretildi.`);
}

build();
