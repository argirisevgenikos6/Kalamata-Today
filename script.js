// Οι ειδήσεις φορτώνονται από το news.json (το επεξεργάζεται η σελίδα admin.html).
let news = [];
let breaking = [];

// Προστασία από HTML μέσα στο κείμενο των ειδήσεων
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// «πριν 2 ώρες», «χθες», «12 Οκτ» από την ημερομηνία δημοσίευσης
function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "μόλις τώρα";
  if (mins < 60) return `πριν ${mins} λεπτ${mins === 1 ? "ό" : "ά"}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `πριν ${hours} ώρ${hours === 1 ? "α" : "ες"}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "χθες";
  if (days < 7) return `πριν ${days} μέρες`;
  return new Date(iso).toLocaleDateString("el-GR", { day: "numeric", month: "short", year: "numeric" });
}

// Η φωτογραφία μπαίνει πάνω από το χρώμα· αν λείπει, φαίνεται το χρώμα.
const bg = (n) => {
  const colors = n.colors || ["#ff7a00", "#1a1a1a"];
  const gradient = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
  return `background-image:${n.image ? `url('${encodeURI(n.image)}'), ` : ""}${gradient}`;
};

// Πρωτοσέλιδο: θέσεις 1–3 που διάλεξε ο διαχειριστής (featured),
// οι υπόλοιπες γεμίζουν με τις πιο πρόσφατες ειδήσεις.
function frontPage() {
  const auto = news.filter((n) => ![1, 2, 3].includes(n.featured));
  return [1, 2, 3].map((slot) => news.find((n) => n.featured === slot) || auto.shift()).filter(Boolean);
}

function renderHero() {
  const hero = document.getElementById("hero");
  if (!news.length) { hero.innerHTML = ""; return; }
  const [main, ...side] = frontPage();
  hero.innerHTML = `
    <article class="hero-main">
      <div class="img" style="${bg(main)}"></div>
      <div class="overlay">
        <span class="tag">${esc(main.category)}</span>
        <h1>${esc(main.title)}</h1>
        <p>${esc(main.excerpt)}</p>
      </div>
    </article>
    <div class="hero-side">
      ${side.map((n) => `
        <article>
          <div class="img" style="${bg(n)}"></div>
          <div class="overlay">
            <span class="tag">${esc(n.category)}</span>
            <h3>${esc(n.title)}</h3>
          </div>
        </article>`).join("")}
    </div>`;
}

function renderGrid(items) {
  document.getElementById("news-grid").innerHTML = items.map((n) => `
    <article class="card">
      <div class="card-img"><div class="img" style="${bg(n)}"></div></div>
      <div class="card-body">
        <span class="tag">${esc(n.category)}</span>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.excerpt)}</p>
        <div class="meta">${timeAgo(n.date)}${n.views ? ` · ${n.views.toLocaleString("el-GR")} προβολές` : ""}</div>
      </div>
    </article>`).join("");
  document.getElementById("empty").hidden = items.length > 0;
}

function renderPopular() {
  const top = [...news].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  document.getElementById("popular").innerHTML = top.map((n) => `<li>${esc(n.title)}</li>`).join("");
}

function renderTicker() {
  const items = breaking.map((t) => `<span>${esc(t)}</span>`).join("");
  document.getElementById("ticker").innerHTML = items + items; // διπλό για συνεχή κύλιση
}

let currentCat = "all";

function applyFilters() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const filtered = news.filter((n) =>
    (currentCat === "all" || n.category === currentCat) &&
    (!q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q))
  );
  document.getElementById("feed-title").textContent =
    currentCat === "all" ? "Τελευταίες Ειδήσεις" : currentCat;
  renderGrid(filtered);
}

document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector(".nav a.active").classList.remove("active");
    link.classList.add("active");
    currentCat = link.dataset.cat;
    document.getElementById("hero").hidden = currentCat !== "all";
    document.getElementById("weather-panel").hidden = currentCat !== "Καιρός";
    document.getElementById("nav").classList.remove("open");
    applyFilters();
  });
});

document.getElementById("search").addEventListener("input", applyFilters);

const toggle = document.querySelector(".menu-toggle");
toggle.addEventListener("click", () => {
  const open = document.getElementById("nav").classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});

const themeBtn = document.getElementById("theme-toggle");
const syncThemeBtn = () =>
  themeBtn.setAttribute("aria-pressed", document.documentElement.dataset.theme === "dark");
syncThemeBtn();
themeBtn.addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme !== "dark";
  if (dark) document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) {}
  syncThemeBtn();
});

document.getElementById("newsletter-form").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.reset();
  document.getElementById("form-msg").hidden = false;
});

document.getElementById("today-date").textContent = new Date().toLocaleDateString("el-GR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Καιρός (Open-Meteo, δωρεάν χωρίς κλειδί) ----------
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=37.0389&longitude=22.1142" +
  "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  "&timezone=Europe%2FAthens&forecast_days=7";

// Κωδικοί καιρού WMO → περιγραφή και εικονίδιο
function describeWeather(code) {
  if (code === 0) return ["Αίθριος", "☀️"];
  if (code <= 2) return ["Λίγα σύννεφα", "🌤️"];
  if (code === 3) return ["Συννεφιά", "☁️"];
  if (code <= 48) return ["Ομίχλη", "🌫️"];
  if (code <= 57) return ["Ψιχάλες", "🌦️"];
  if (code <= 67) return ["Βροχή", "🌧️"];
  if (code <= 77) return ["Χιόνι", "❄️"];
  if (code <= 82) return ["Μπόρες", "🌦️"];
  if (code <= 86) return ["Χιονόπτωση", "🌨️"];
  return ["Καταιγίδα", "⛈️"];
}

const round = (x) => Math.round(x);

function renderWeather(data) {
  const c = data.current;
  const d = data.daily;
  const [desc, icon] = describeWeather(c.weather_code);

  document.getElementById("topbar-weather").innerHTML =
    `${icon} Καλαμάτα <strong>${round(c.temperature_2m)}°C</strong>`;

  const days = d.time.map((t, i) => {
    const date = new Date(t + "T12:00:00");
    const name = i === 0 ? "Σήμερα" : i === 1 ? "Αύριο" :
      date.toLocaleDateString("el-GR", { weekday: "long" });
    const [dDesc, dIcon] = describeWeather(d.weather_code[i]);
    return `
      <div class="day">
        <span class="day-name">${name}</span>
        <span class="day-date">${date.toLocaleDateString("el-GR", { day: "numeric", month: "short" })}</span>
        <span class="day-icon" title="${dDesc}">${dIcon}</span>
        <span class="day-temp"><strong>${round(d.temperature_2m_max[i])}°</strong> / ${round(d.temperature_2m_min[i])}°</span>
        <span class="day-rain">💧 ${d.precipitation_probability_max[i] ?? 0}%</span>
      </div>`;
  }).join("");

  document.getElementById("weather-body").innerHTML = `
    <div class="weather-today">
      <div class="today-main">
        <span class="today-icon">${icon}</span>
        <div>
          <div class="today-temp">${round(c.temperature_2m)}°C</div>
          <div class="today-desc">${desc}</div>
        </div>
      </div>
      <dl class="today-details">
        <div><dt>Αίσθηση</dt><dd>${round(c.apparent_temperature)}°C</dd></div>
        <div><dt>Μέγιστη / Ελάχιστη</dt><dd>${round(d.temperature_2m_max[0])}° / ${round(d.temperature_2m_min[0])}°</dd></div>
        <div><dt>Υγρασία</dt><dd>${c.relative_humidity_2m}%</dd></div>
        <div><dt>Άνεμος</dt><dd>${round(c.wind_speed_10m)} km/h</dd></div>
      </dl>
    </div>
    <div class="forecast">${days}</div>`;
}

fetch(WEATHER_URL)
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then(renderWeather)
  .catch(() => {
    document.getElementById("weather-body").innerHTML =
      `<p class="weather-status">Ο καιρός δεν είναι διαθέσιμος αυτή τη στιγμή. Δοκιμάστε ξανά σε λίγο.</p>`;
  });

// Φόρτωση ειδήσεων (το ?v= παρακάμπτει την cache ώστε να φαίνονται αμέσως οι νέες)
fetch(`news.json?v=${Date.now()}`)
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((data) => {
    news = (data.news || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    breaking = data.breaking || [];
  })
  .catch(() => {
    document.getElementById("empty").textContent = "Οι ειδήσεις δεν φόρτωσαν. Ανανεώστε τη σελίδα.";
  })
  .finally(() => {
    renderHero();
    applyFilters();
    renderPopular();
    renderTicker();
  });
