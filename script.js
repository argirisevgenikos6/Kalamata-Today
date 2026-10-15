// Δείγματα ειδήσεων — αντικαταστήστε με πραγματικό περιεχόμενο.
const news = [
  { title: "Ανακαινίζεται η παραλιακή οδός Ναυαρίνου", excerpt: "Ξεκινούν οι εργασίες αναβάθμισης του πεζοδρομίου και του ποδηλατόδρομου κατά μήκος της παραλίας.", category: "Τοπικά", time: "πριν 1 ώρα", views: 1520, colors: ["#ff7a00", "#3a1a00"] , image: "images/1.jpg" },
  { title: "Ρεκόρ αφίξεων στο αεροδρόμιο της Καλαμάτας", excerpt: "Αύξηση της επιβατικής κίνησης καταγράφεται για τη φετινή τουριστική σεζόν.", category: "Οικονομία", time: "πριν 2 ώρες", views: 2310, colors: ["#ffa94d", "#1a1a1a"] , image: "images/2.jpg" },
  { title: "Νίκη για την Καλαμάτα στο τελευταίο λεπτό", excerpt: "Η Μαύρη Θύελλα πήρε σπουδαίο τρίπωντο μπροστά σε γεμάτες εξέδρες.", category: "Αθλητικά", time: "πριν 3 ώρες", views: 3890, colors: ["#111", "#ff7a00"] , image: "images/3.jpg" },
  { title: "Διεθνές Φεστιβάλ Χορού: Το πρόγραμμα της χρονιάς", excerpt: "Παραστάσεις από καλλιτέχνες απ' όλο τον κόσμο στο Μέγαρο Χορού Καλαμάτας.", category: "Πολιτισμός", time: "πριν 4 ώρες", views: 980, colors: ["#e06500", "#2b0f00"] , image: "images/4.jpg" },
  { title: "Συνεδρίαση δημοτικού συμβουλίου για τον προϋπολογισμό", excerpt: "Στο τραπέζι τα έργα υποδομής και οι κοινωνικές δράσεις του δήμου.", category: "Πολιτική", time: "πριν 5 ώρες", views: 740, colors: ["#333", "#ff8c1a"] , image: "images/5.jpg" },
  { title: "Ηλιοφάνεια και ζέστη το Σαββατοκύριακο στη Μεσσηνία", excerpt: "Θερμοκρασίες έως 28 βαθμούς και ήπιοι άνεμοι σύμφωνα με την πρόγνωση.", category: "Καιρός", time: "πριν 6 ώρες", views: 1260, colors: ["#ffb366", "#ff7a00"] , image: "images/6.jpg" },
  { title: "Πρώτες βροχές του φθινοπώρου στη Μεσσηνία", excerpt: "Τοπικές μπόρες αναμένονται στα ορεινά του Ταϋγέτου, ενώ στην πόλη ο καιρός θα παραμείνει ήπιος.", category: "Καιρός", time: "πριν 6 ώρες", views: 690, colors: ["#3b3b3b", "#ff9a33"] },
  { title: "Ήρεμη θάλασσα στον Μεσσηνιακό Κόλπο", excerpt: "Ασθενείς άνεμοι και θερμοκρασία νερού γύρω στους 23 βαθμούς ευνοούν το κολύμπι.", category: "Καιρός", time: "πριν 7 ώρες", views: 510, colors: ["#ff8c1a", "#2b1400"] },
  { title: "Καλαμάτα ελιά: Αισιοδοξία για τη νέα σοδειά", excerpt: "Οι παραγωγοί αναμένουν καλή χρονιά τόσο σε ποσότητα όσο και σε ποιότητα.", category: "Οικονομία", time: "πριν 7 ώρες", views: 1640, colors: ["#4a3200", "#ff9a33"] , image: "images/7.jpg" },
  { title: "Νέοι χώροι πρασίνου στο κέντρο της πόλης", excerpt: "Δενδροφυτεύσεις και νέα παιδικά πάρκα στις γειτονιές της Καλαμάτας.", category: "Τοπικά", time: "πριν 8 ώρες", views: 560, colors: ["#1f1f1f", "#ffa94d"] , image: "images/8.jpg" },
  { title: "Μπάσκετ: Ξεκινά η προετοιμασία της ομάδας", excerpt: "Με νέες μεταγραφές και φιλόδοξους στόχους η νέα αγωνιστική περίοδος.", category: "Αθλητικά", time: "πριν 9 ώρες", views: 870, colors: ["#ff7a00", "#000"] , image: "images/9.jpg" },
  { title: "Έκθεση φωτογραφίας στο Ιστορικό Κέντρο", excerpt: "Η Καλαμάτα του περασμένου αιώνα μέσα από σπάνιο αρχειακό υλικό.", category: "Πολιτισμός", time: "πριν 10 ώρες", views: 430, colors: ["#2a2a2a", "#e06500"] , image: "images/10.jpg" },
];

const breaking = [
  "Κυκλοφοριακές ρυθμίσεις στο κέντρο λόγω έργων",
  "Ανοιχτή η εγγραφή για τον Μαραθώνιο Καλαμάτας",
  "Νέα δρομολόγια ΚΤΕΛ προς Αθήνα από τη Δευτέρα",
  "Διακοπή υδροδότησης αύριο σε περιοχές της πόλης",
];

// Η φωτογραφία μπαίνει πάνω από το χρώμα· αν λείπει, φαίνεται το χρώμα.
const bg = (n) => {
  const gradient = `linear-gradient(135deg, ${n.colors[0]}, ${n.colors[1]})`;
  return `background-image:${n.image ? `url('${n.image}'), ` : ""}${gradient}`;
};

function renderHero() {
  const [main, ...rest] = news;
  const side = rest.slice(0, 2);
  document.getElementById("hero").innerHTML = `
    <article class="hero-main">
      <div class="img" style="${bg(main)}"></div>
      <div class="overlay">
        <span class="tag">${main.category}</span>
        <h1>${main.title}</h1>
        <p>${main.excerpt}</p>
      </div>
    </article>
    <div class="hero-side">
      ${side.map((n) => `
        <article>
          <div class="img" style="${bg(n)}"></div>
          <div class="overlay">
            <span class="tag">${n.category}</span>
            <h3>${n.title}</h3>
          </div>
        </article>`).join("")}
    </div>`;
}

function renderGrid(items) {
  document.getElementById("news-grid").innerHTML = items.map((n) => `
    <article class="card">
      <div class="card-img"><div class="img" style="${bg(n)}"></div></div>
      <div class="card-body">
        <span class="tag">${n.category}</span>
        <h3>${n.title}</h3>
        <p>${n.excerpt}</p>
        <div class="meta">${n.time} · ${n.views.toLocaleString("el-GR")} προβολές</div>
      </div>
    </article>`).join("");
  document.getElementById("empty").hidden = items.length > 0;
}

function renderPopular() {
  const top = [...news].sort((a, b) => b.views - a.views).slice(0, 5);
  document.getElementById("popular").innerHTML = top.map((n) => `<li>${n.title}</li>`).join("");
}

function renderTicker() {
  const items = breaking.map((t) => `<span>${t}</span>`).join("");
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

renderHero();
renderGrid(news);
renderPopular();
renderTicker();
