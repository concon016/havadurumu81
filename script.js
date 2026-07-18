// havadurumu81 — ortak JS (arama + tema + hava durumu verisi)
(function () {
  "use strict";

  /* ---------------- tema ---------------- */
  function initTheme() {
    var saved = localStorage.getItem("hd81-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("hd81-theme", next);
    });
  }

  /* ---------------- arama ---------------- */
  var TRMAP = { ı: "i", İ: "i", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ş: "s", Ş: "s", ö: "o", Ö: "o", ç: "c", Ç: "c" };
  function norm(s) {
    return String(s || "")
      .replace(/[ığüşöçİĞÜŞÖÇ]/g, function (c) { return TRMAP[c] || c; })
      .toLowerCase()
      .trim();
  }

  function initSearch() {
    var input = document.getElementById("ilSearchInput");
    if (!input) return;
    var box = document.getElementById("ilSearchSuggest");
    var activeIndex = -1;

    function render(list) {
      if (!list.length) { box.classList.remove("open"); box.innerHTML = ""; return; }
      box.innerHTML = list
        .map(function (il, i) {
          return (
            '<li><a href="' + il.slug + "-hava-durumu.html" + '" data-i="' + i + '">' +
            "<span>" + il.ad + "</span>" +
            '<span class="il-bolge">' + (BOLGE_ADLARI ? BOLGE_ADLARI[il.bolge] : "") + "</span>" +
            "</a></li>"
          );
        })
        .join("");
      box.classList.add("open");
      activeIndex = -1;
    }

    input.addEventListener("input", function () {
      var q = norm(input.value);
      if (!q) { render([]); return; }
      var hits = ILLER.filter(function (il) { return norm(il.ad).indexOf(q) !== -1; }).slice(0, 8);
      render(hits);
    });

    input.addEventListener("keydown", function (e) {
      var items = box.querySelectorAll("a");
      if (!items.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); }
      else if (e.key === "Enter") { e.preventDefault(); if (activeIndex >= 0) items[activeIndex].click(); else if (items[0]) items[0].click(); return; }
      else return;
      items.forEach(function (it, i) { it.classList.toggle("active", i === activeIndex); });
    });

    document.addEventListener("click", function (e) {
      if (!box.contains(e.target) && e.target !== input) box.classList.remove("open");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initSearch();
    if (document.body.dataset.ilSlug) initSehirSayfasi(document.body.dataset.ilSlug);
  });

  /* ---------------- hava kodu -> açıklama / ikon / renk grubu ---------------- */
  var CODE_INFO = {
    0: { desc: "Açık", group: "clear" },
    1: { desc: "Az Bulutlu", group: "clear" },
    2: { desc: "Parçalı Bulutlu", group: "cloudy" },
    3: { desc: "Kapalı", group: "cloudy" },
    45: { desc: "Sisli", group: "fog" },
    48: { desc: "Kırağı Sisi", group: "fog" },
    51: { desc: "Hafif Çisenti", group: "rain" },
    53: { desc: "Çisenti", group: "rain" },
    55: { desc: "Yoğun Çisenti", group: "rain" },
    56: { desc: "Donan Çisenti", group: "rain" },
    57: { desc: "Yoğun Donan Çisenti", group: "rain" },
    61: { desc: "Hafif Yağmurlu", group: "rain" },
    63: { desc: "Yağmurlu", group: "rain" },
    65: { desc: "Kuvvetli Yağmur", group: "rain" },
    66: { desc: "Donan Yağmur", group: "rain" },
    67: { desc: "Kuvvetli Donan Yağmur", group: "rain" },
    71: { desc: "Hafif Kar", group: "snow" },
    73: { desc: "Karlı", group: "snow" },
    75: { desc: "Yoğun Kar", group: "snow" },
    77: { desc: "Kar Taneli", group: "snow" },
    80: { desc: "Hafif Sağanak", group: "rain" },
    81: { desc: "Sağanak Yağmur", group: "rain" },
    82: { desc: "Şiddetli Sağanak", group: "rain" },
    85: { desc: "Kar Sağanağı", group: "snow" },
    86: { desc: "Yoğun Kar Sağanağı", group: "snow" },
    95: { desc: "Gök Gürültülü Fırtına", group: "storm" },
    96: { desc: "Dolulu Fırtına", group: "storm" },
    99: { desc: "Şiddetli Dolulu Fırtına", group: "storm" },
  };
  function codeInfo(code) { return CODE_INFO[code] || { desc: "—", group: "cloudy" }; }

  var ICONS = {
    "clear-day":
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.6" fill="#FFC93C" stroke="#FF9F1C" stroke-width="0.6"/>' +
      '<g stroke="#FF9F1C" stroke-width="1.9" stroke-linecap="round"><path d="M12 2.2v2.9M12 18.9v2.9M4.4 4.4l2.1 2.1M17.5 17.5l2.1 2.1M2.2 12h2.9M18.9 12h2.9M4.4 19.6l2.1-2.1M17.5 6.5l2.1-2.1"/></g></svg>',
    "clear-night":
      '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.4 6.4 0 0 0 10.5 10.5Z" fill="#FDE68A" stroke="#F5C84C" stroke-width="0.6"/>' +
      '<circle cx="5.2" cy="5.6" r="0.9" fill="#FDE68A"/><circle cx="3.6" cy="9.8" r="0.55" fill="#FDE68A"/></svg>',
    cloudy:
      '<svg viewBox="0 0 24 24"><path d="M7 17.5a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.2 8.1 4.5 4.5 0 0 1 16.5 17.5H7Z" fill="#B8C6D9" stroke="#8CA0B8" stroke-width="0.7"/></svg>',
    fog:
      '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M6 9.5a4 4 0 0 1 7.3-2.6 4.5 4.5 0 0 1 4.2 3" stroke="#AEBBC8" stroke-width="1.7"/><path d="M3.5 13h17M3.5 16.5h17M6 20h12" stroke="#93A4B5" stroke-width="1.7"/></svg>',
    rain:
      '<svg viewBox="0 0 24 24"><path d="M7 14.5a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.2 5.1 4.5 4.5 0 0 1 16.5 14.5H7Z" fill="#8FA3C4" stroke="#6B84AC" stroke-width="0.7"/>' +
      '<g stroke="#2E9BF0" stroke-width="1.9" stroke-linecap="round"><path d="M8 17.5l-1.2 2.4M12.5 17.5l-1.2 2.4M17 17.5l-1.2 2.4"/></g></svg>',
    snow:
      '<svg viewBox="0 0 24 24"><path d="M7 13.5a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.2 4.1 4.5 4.5 0 0 1 16.5 13.5H7Z" fill="#D3E8FB" stroke="#8FC1E8" stroke-width="0.7"/>' +
      '<g stroke="#4FA6E0" stroke-width="1.7" stroke-linecap="round"><path d="M9 17v4M12 17v4M15 17v4M7.5 19l3-1.5M10.5 19l1.5-1M13.5 18l1.5 1M16.5 19l-3-1.5"/></g></svg>',
    storm:
      '<svg viewBox="0 0 24 24"><path d="M7 13.5a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.2 4.1 4.5 4.5 0 0 1 16.5 13.5H7Z" fill="#6E7192" stroke="#4B4E6D" stroke-width="0.7"/>' +
      '<path d="M13 13.5 10 18h3l-2 4" fill="#FFD23F" stroke="#FFB800" stroke-width="0.8" stroke-linejoin="round"/></svg>',
  };
  function iconKey(group, isDay) {
    if (group === "clear") return isDay ? "clear-day" : "clear-night";
    return group;
  }
  function iconSVG(group, isDay) { return ICONS[iconKey(group, isDay)] || ICONS.cloudy; }
  function condClass(group, isDay) {
    if (group === "clear") return isDay ? "cond-clear-day" : "cond-clear-night";
    return "cond-" + group;
  }

  /* ---------------- şehir sayfası ---------------- */
  function findIl(slug) {
    for (var i = 0; i < ILLER.length; i++) if (ILLER[i].slug === slug) return ILLER[i];
    return null;
  }

  function fmtDate(iso, opts) {
    return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", opts);
  }

  function renderHero(il, current, todayMax, todayMin) {
    var info = codeInfo(current.weather_code);
    var isDay = current.is_day === 1;
    var hero = document.getElementById("weatherHero");
    hero.className = "weather-hero " + condClass(info.group, isDay);
    hero.innerHTML =
      '<div class="weather-hero-top">' +
      '<div><div class="weather-hero-city">' + il.ad + '</div>' +
      '<div class="weather-hero-sub">' + new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }) + '</div></div>' +
      '<div class="weather-hero-icon">' + iconSVG(info.group, isDay) + '</div>' +
      '</div>' +
      '<div class="weather-hero-temp">' + Math.round(current.temperature_2m) + '°</div>' +
      '<div class="weather-hero-desc">' + info.desc + '</div>' +
      '<div class="weather-hero-feels">Hissedilen ' + Math.round(current.apparent_temperature) + '° · En yüksek ' + Math.round(todayMax) + '° / En düşük ' + Math.round(todayMin) + '°</div>' +
      '<div class="weather-hero-stats">' +
      '<div class="wh-stat"><div class="wh-label">Nem</div><div class="wh-value">%' + Math.round(current.relative_humidity_2m) + '</div></div>' +
      '<div class="wh-stat"><div class="wh-label">Rüzgar</div><div class="wh-value">' + Math.round(current.wind_speed_10m) + ' km/s</div></div>' +
      '<div class="wh-stat"><div class="wh-label">Yağış</div><div class="wh-value">' + current.precipitation.toFixed(1) + ' mm</div></div>' +
      '</div>';
  }

  function renderHourly(hourly) {
    var wrap = document.getElementById("hourlyRow");
    if (!wrap) return;
    var nowIdx = hourly.time.findIndex(function (t) { return new Date(t) >= new Date(); });
    if (nowIdx < 0) nowIdx = 0;
    var slice = [];
    for (var i = nowIdx; i < Math.min(nowIdx + 24, hourly.time.length); i += 1) slice.push(i);
    wrap.innerHTML = slice
      .map(function (i) {
        var info = codeInfo(hourly.weather_code[i]);
        var d = new Date(hourly.time[i]);
        var isDay = d.getHours() >= 7 && d.getHours() <= 19;
        return (
          '<div class="hour-card"><div class="h-time">' + d.toLocaleTimeString("tr-TR", { hour: "2-digit" }) + '</div>' +
          '<div class="h-icon">' + iconSVG(info.group, isDay) + '</div>' +
          '<div class="h-temp">' + Math.round(hourly.temperature_2m[i]) + '°</div></div>'
        );
      })
      .join("");
  }

  function renderDaily(daily) {
    var wrap = document.getElementById("dayList");
    if (!wrap) return;
    wrap.innerHTML = daily.time
      .map(function (date, i) {
        var info = codeInfo(daily.weather_code[i]);
        var name = i === 0 ? "Bugün" : i === 1 ? "Yarın" : fmtDate(date, { weekday: "long" });
        return (
          '<div class="day-row"><div><div class="d-name">' + name + '</div><div class="d-date">' + fmtDate(date, { day: "numeric", month: "short" }) + '</div></div>' +
          '<div class="d-icon">' + iconSVG(info.group, true) + '</div>' +
          '<div class="d-pop">%' + Math.round(daily.precipitation_probability_max[i]) + '</div>' +
          '<div class="d-temps"><span>' + Math.round(daily.temperature_2m_max[i]) + '°</span><span class="lo">' + Math.round(daily.temperature_2m_min[i]) + '°</span></div></div>'
        );
      })
      .join("");
  }

  function initTabs() {
    var btns = document.querySelectorAll(".tab-btn");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) { b.classList.remove("active"); });
        document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
      });
    });
  }

  window.initSehirSayfasi = function (slug) {
    var il = findIl(slug);
    if (!il) return;
    initTabs();

    var fUrl =
      "https://api.open-meteo.com/v1/forecast?latitude=" + il.lat + "&longitude=" + il.lon +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day" +
      "&hourly=temperature_2m,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=Europe%2FIstanbul&forecast_days=16";

    fetch(fUrl)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderHero(il, data.current, data.daily.temperature_2m_max[0], data.daily.temperature_2m_min[0]);
        renderHourly(data.hourly);
        renderDaily(data.daily);
      })
      .catch(function () {
        var hero = document.getElementById("weatherHero");
        if (hero) hero.innerHTML = '<p style="padding:20px;">Hava durumu verisi şu anda alınamadı, lütfen sayfayı yenileyin.</p>';
      });
  };
})();
