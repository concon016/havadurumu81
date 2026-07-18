// Yerel üretim script'i — her il için 3 ayrı sayfa (günlük/haftalık/2 haftalık) + sitemap.xml'i data.js'den üretir.
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

const VARIANTS = [
  { key: "gunluk", suffix: "-hava-durumu.html", nav: "Günlük", h1: (ad) => `${ad} Hava Durumu`, titleMid: "Hava Durumu – Günlük Tahmin", days: null },
  { key: "haftalik", suffix: "-haftalik-hava-durumu.html", nav: "Haftalık", h1: (ad) => `${ad} Haftalık Hava Durumu`, titleMid: "Haftalık Hava Durumu – 7 Günlük Tahmin", days: 7 },
  { key: "iki-haftalik", suffix: "-2-haftalik-hava-durumu.html", nav: "2 Haftalık", h1: (ad) => `${ad} 2 Haftalık Hava Durumu`, titleMid: "2 Haftalık Hava Durumu – 16 Günlük Tahmin", days: 16 },
];

function faqFor(il, variant) {
  const base = [
    {
      q: `${il.ad} hava durumu ne kadar güncel?`,
      a: `Bu sayfadaki veriler her ziyarette anlık olarak yeniden çekilir; herhangi bir önbellekleme veya gecikme yoktur, her açılışta o anki en güncel veriyi görürsünüz.`,
    },
    {
      q: `${il.ad} hava durumu verileri nereden alınıyor?`,
      a: `Veriler, Avrupa ve ABD'nin resmi hava tahmin modellerini birleştiren ücretsiz ve açık kaynaklı Open-Meteo servisinden alınmaktadır.`,
    },
  ];
  if (variant.key === "gunluk") {
    base.splice(1, 0, {
      q: `${il.ad} için saatlik tahmin var mı?`,
      a: `Evet, bugünün önümüzdeki 24 saati için saatlik sıcaklık ve hava durumu tahmini gösterilir. Daha uzun vade için ${il.ad} haftalık ve 2 haftalık hava durumu sayfalarına bakabilirsiniz.`,
    });
  } else if (variant.key === "haftalik") {
    base.splice(1, 0, {
      q: `${il.ad} haftalık hava durumu tahmini ne kadar güvenilir?`,
      a: `7 günlük tahminler meteorolojik olarak oldukça güvenilirdir; ilk 3-4 gün için doğruluk çok yüksek, 5-7. günler için ise genel eğilim (sıcaklık aralığı, yağış olasılığı) doğru bir tahmindir.`,
    });
  } else {
    base.splice(1, 0, {
      q: `2 haftalık (16 günlük) tahmin ne kadar doğru?`,
      a: `16 gün, güvenilir hava tahmin modellerinin ulaşabildiği maksimum süredir. İlk hafta yüksek doğrulukta, ikinci hafta ise genel sıcaklık eğilimi ve yağış olasılığı şeklinde yorumlanmalıdır. Bunun ötesindeki "aylık tahmin" iddiaları meteorolojik olarak güvenilir değildir.`,
    });
  }
  return base;
}

function pageHTML(il, variant) {
  const related = ILLER.filter((x) => x.bolge === il.bolge && x.slug !== il.slug)
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"))
    .slice(0, 8);

  const title = `${il.ad} ${variant.titleMid} | havadurumu81`;
  const desc =
    variant.key === "gunluk"
      ? `${il.ad} hava durumu: anlık sıcaklık ve saatlik tahmin. ${il.ad} için güncel hava durumunu hemen öğrenin.`
      : variant.key === "haftalik"
      ? `${il.ad} haftalık hava durumu: önümüzdeki 7 gün için günlük sıcaklık, yağış olasılığı ve detaylı tahmin.`
      : `${il.ad} 2 haftalık hava durumu: önümüzdeki 16 gün için günlük sıcaklık, yağış olasılığı ve detaylı tahmin.`;
  const url = `${SITE}/${il.slug}${variant.suffix}`;
  const gunlukUrl = `${SITE}/${il.slug}-hava-durumu.html`;
  const h1 = variant.h1(il.ad);
  const faq = faqFor(il, variant);

  const breadcrumbItems =
    variant.key === "gunluk"
      ? [
          { name: "Anasayfa", item: `${SITE}/` },
          { name: h1, item: url },
        ]
      : [
          { name: "Anasayfa", item: `${SITE}/` },
          { name: `${il.ad} Hava Durumu`, item: gunlukUrl },
          { name: h1, item: url },
        ];

  const navRow = VARIANTS.map(
    (v) => `<a class="tab-btn${v.key === variant.key ? " active" : ""}" href="${il.slug}${v.suffix}">${v.nav}</a>`
  ).join("\n      ");

  const bodyMain =
    variant.key === "gunluk"
      ? `<div class="hourly-row" id="hourlyRow">
        <div class="hour-card skeleton" style="height:88px;"></div>
        <div class="hour-card skeleton" style="height:88px;"></div>
        <div class="hour-card skeleton" style="height:88px;"></div>
      </div>`
      : `<div class="day-list" id="dayList" data-days="${variant.days}">
        <div class="day-row skeleton" style="height:52px;"></div>
        <div class="day-row skeleton" style="height:52px;"></div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="google-site-verification" content="z1KWBFbgHZbBm0YmH_Ej9PLyjjPVtR17RNDfYOOPh_I" />
<script async src="https://www.googletagmanager.com/gtag/js?id=G-X38Q06SKYB"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-X38Q06SKYB');
</script>
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${h1}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/og-image.png">
<meta name="robots" content="index, follow">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2219%22 font-size=%2220%22>☀️</text></svg>">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#1976d2">
<link rel="apple-touch-icon" href="/assets/icon-192.png">
<link rel="stylesheet" href="style.css">
<script>
  (function(){var t=localStorage.getItem("hd81-theme");if(t)document.documentElement.setAttribute("data-theme",t);})();
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    ${breadcrumbItems.map((b, i) => `{"@type":"ListItem","position":${i + 1},"name":${JSON.stringify(b.name)},"item":${JSON.stringify(b.item)}}`).join(",\n    ")}
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    ${faq.map((f) => `{"@type":"Question","name":${JSON.stringify(f.q)},"acceptedAnswer":{"@type":"Answer","text":${JSON.stringify(f.a)}}}`).join(",\n    ")}
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
      <button class="theme-toggle" id="installBtn" aria-label="Uygulamayı yükle" title="Ana ekrana ekle" style="display:none;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>
      </button>
      <button class="theme-toggle" id="themeToggle" aria-label="Tema değiştir">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.4 6.4 0 0 0 10.5 10.5Z"/></svg>
      </button>
    </nav>
  </div>
</header>

<div class="install-modal-overlay" id="installModalOverlay">
  <div class="install-modal">
    <button class="install-modal-close" id="installModalClose" aria-label="Kapat">✕</button>
    <h3>Ana Ekrana Ekle</h3>
    <div id="installModalBody"></div>
  </div>
</div>

<main>
  <div class="wrap" style="padding-top:20px;">
    <div class="search-box" style="max-width:420px;margin:0 0 8px;">
      <input type="text" id="ilSearchInput" placeholder="Başka bir il ara…" autocomplete="off">
      <span class="search-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/></svg>
      </span>
      <ul class="search-suggest" id="ilSearchSuggest"></ul>
    </div>
    <p class="breadcrumb">${breadcrumbItems.map((b, i) => (i === breadcrumbItems.length - 1 ? b.name : `<a href="${b.item}">${b.name}</a>`)).join(" / ")}</p>
  </div>

  <div class="wrap" style="padding-top:18px;padding-bottom:50px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 16px;">
      <h1 style="font-size:1.5rem;margin:0;">${h1}</h1>
      <button class="fav-btn" id="favBtn" data-slug="${il.slug}" aria-label="Favorilere ekle" title="Favorilere ekle">☆</button>
    </div>

    <div class="weather-hero" id="weatherHero">
      <div style="padding:30px;text-align:center;opacity:.7;">Hava durumu yükleniyor…</div>
    </div>

    <div class="tabs">
      ${navRow}
    </div>

    <div class="tab-panel active">
      ${bodyMain}
    </div>

    <div class="city-info">
      <h2>${il.ad} İklimi Hakkında</h2>
      <p>${REGION_BLURB[il.bolge](il.ad)}</p>
      <p>${il.ad}, ${BOLGE_ADLARI[il.bolge]} Bölgesi'nde yer alır. Şehir merkezinin yaklaşık koordinatları: enlem ${il.lat}, boylam ${il.lon}.</p>
      <div class="related-cities">
        ${related.map((r) => `<a href="${r.slug}${variant.suffix}">${r.ad} ${variant.nav} Hava Durumu</a>`).join("\n        ")}
      </div>
    </div>

    <div class="city-info" style="margin-top:16px;">
      <h2>Sıkça Sorulan Sorular</h2>
      ${faq.map((f) => `<h3 style="font-size:.98rem;margin:14px 0 4px;">${f.q}</h3>\n      <p>${f.a}</p>`).join("\n      ")}
    </div>
  </div>
</main>

<footer class="site-footer">
  <div class="wrap">
    <div>
      <p>© <span id="yearNow"></span> havadurumu81 — hava durumu verileri Open-Meteo tarafından sağlanmaktadır.</p>
      <p class="credit">Bu site <a href="https://canwebco.com" target="_blank" rel="noopener">canwebco</a> tarafından tasarlanmıştır.</p>
    </div>
    <div class="foot-links">
      <a href="/gizlilik.html">Gizlilik Politikası</a>
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
  const urls = [];
  const today = new Date().toISOString().slice(0, 10);

  urls.push(`  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`);

  ILLER.forEach((il) => {
    VARIANTS.forEach((variant) => {
      const fileName = `${il.slug}${variant.suffix}`;
      fs.writeFileSync(path.join(dir, fileName), pageHTML(il, variant), "utf8");
      const priority = variant.key === "gunluk" ? "0.8" : "0.7";
      urls.push(`  <url><loc>${SITE}/${fileName}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>${priority}</priority></url>`);
    });
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(dir, "sitemap.xml"), sitemap, "utf8");

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`;
  fs.writeFileSync(path.join(dir, "robots.txt"), robots, "utf8");

  console.log(`${ILLER.length} il × ${VARIANTS.length} varyant = ${ILLER.length * VARIANTS.length} sayfa + sitemap.xml + robots.txt üretildi.`);
}

build();
