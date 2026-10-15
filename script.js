// Δείγματα ειδήσεων — αντικαταστήστε με πραγματικό περιεχόμενο.
const news = [
  { title: "Ανακαινίζεται η παραλιακή οδός Ναυαρίνου", excerpt: "Ξεκινούν οι εργασίες αναβάθμισης του πεζοδρομίου και του ποδηλατόδρομου κατά μήκος της παραλίας.", category: "Τοπικά", time: "πριν 1 ώρα", views: 1520, colors: ["#ff7a00", "#3a1a00"] },
  { title: "Ρεκόρ αφίξεων στο αεροδρόμιο της Καλαμάτας", excerpt: "Αύξηση της επιβατικής κίνησης καταγράφεται για τη φετινή τουριστική σεζόν.", category: "Οικονομία", time: "πριν 2 ώρες", views: 2310, colors: ["#ffa94d", "#1a1a1a"] },
  { title: "Νίκη για την Καλαμάτα στο τελευταίο λεπτό", excerpt: "Η Μαύρη Θύελλα πήρε σπουδαίο τρίπωντο μπροστά σε γεμάτες εξέδρες.", category: "Αθλητικά", time: "πριν 3 ώρες", views: 3890, colors: ["#111", "#ff7a00"] },
  { title: "Διεθνές Φεστιβάλ Χορού: Το πρόγραμμα της χρονιάς", excerpt: "Παραστάσεις από καλλιτέχνες απ' όλο τον κόσμο στο Μέγαρο Χορού Καλαμάτας.", category: "Πολιτισμός", time: "πριν 4 ώρες", views: 980, colors: ["#e06500", "#2b0f00"] },
  { title: "Συνεδρίαση δημοτικού συμβουλίου για τον προϋπολογισμό", excerpt: "Στο τραπέζι τα έργα υποδομής και οι κοινωνικές δράσεις του δήμου.", category: "Πολιτική", time: "πριν 5 ώρες", views: 740, colors: ["#333", "#ff8c1a"] },
  { title: "Ηλιοφάνεια και ζέστη το Σαββατοκύριακο στη Μεσσηνία", excerpt: "Θερμοκρασίες έως 28 βαθμούς και ήπιοι άνεμοι σύμφωνα με την πρόγνωση.", category: "Καιρός", time: "πριν 6 ώρες", views: 1260, colors: ["#ffb366", "#ff7a00"] },
  { title: "Καλαμάτα ελιά: Αισιοδοξία για τη νέα σοδειά", excerpt: "Οι παραγωγοί αναμένουν καλή χρονιά τόσο σε ποσότητα όσο και σε ποιότητα.", category: "Οικονομία", time: "πριν 7 ώρες", views: 1640, colors: ["#4a3200", "#ff9a33"] },
  { title: "Νέοι χώροι πρασίνου στο κέντρο της πόλης", excerpt: "Δενδροφυτεύσεις και νέα παιδικά πάρκα στις γειτονιές της Καλαμάτας.", category: "Τοπικά", time: "πριν 8 ώρες", views: 560, colors: ["#1f1f1f", "#ffa94d"] },
  { title: "Μπάσκετ: Ξεκινά η προετοιμασία της ομάδας", excerpt: "Με νέες μεταγραφές και φιλόδοξους στόχους η νέα αγωνιστική περίοδος.", category: "Αθλητικά", time: "πριν 9 ώρες", views: 870, colors: ["#ff7a00", "#000"] },
  { title: "Έκθεση φωτογραφίας στο Ιστορικό Κέντρο", excerpt: "Η Καλαμάτα του περασμένου αιώνα μέσα από σπάνιο αρχειακό υλικό.", category: "Πολιτισμός", time: "πριν 10 ώρες", views: 430, colors: ["#2a2a2a", "#e06500"] },
];

const breaking = [
  "Κυκλοφοριακές ρυθμίσεις στο κέντρο λόγω έργων",
  "Ανοιχτή η εγγραφή για τον Μαραθώνιο Καλαμάτας",
  "Νέα δρομολόγια ΚΤΕΛ προς Αθήνα από τη Δευτέρα",
  "Διακοπή υδροδότησης αύριο σε περιοχές της πόλης",
];

const bg = (c) => `background:linear-gradient(135deg, ${c[0]}, ${c[1]})`;

function renderHero() {
  const [main, ...rest] = news;
  const side = rest.slice(0, 2);
  document.getElementById("hero").innerHTML = `
    <article class="hero-main">
      <div class="img" style="${bg(main.colors)}"></div>
      <div class="overlay">
        <span class="tag">${main.category}</span>
        <h1>${main.title}</h1>
        <p>${main.excerpt}</p>
      </div>
    </article>
    <div class="hero-side">
      ${side.map((n) => `
        <article>
          <div class="img" style="${bg(n.colors)}"></div>
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
      <div class="card-img"><div class="img" style="${bg(n.colors)}"></div></div>
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

renderHero();
renderGrid(news);
renderPopular();
renderTicker();
