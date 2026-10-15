// Διαχείριση ειδήσεων: διαβάζει και γράφει το news.json στο GitHub μέσω του GitHub API.
const OWNER = "argirisevgenikos6";
const REPO = "Kalamata-Today";
const BRANCH = "main";
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const TOKEN_KEY = "kt-admin-token";
const KEY_FILE = "admin-key.json"; // το token κρυπτογραφημένο με τον κωδικό
const SLOT_NAMES = { 1: "Κεντρικό θέμα", 2: "Δεξιά πάνω", 3: "Δεξιά κάτω" };

const PALETTE = [
  ["#ff7a00", "#3a1a00"], ["#ffa94d", "#1a1a1a"], ["#111", "#ff7a00"], ["#e06500", "#2b0f00"],
  ["#333", "#ff8c1a"], ["#ffb366", "#ff7a00"], ["#4a3200", "#ff9a33"], ["#1f1f1f", "#ffa94d"],
];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let token = "";
let data = { breaking: [], news: [] };
let editingId = null;      // id της είδησης που επεξεργαζόμαστε (null = νέα)
let pendingImage = null;   // base64 της νέας φωτογραφίας
let removeImage = false;   // αφαίρεση της υπάρχουσας φωτογραφίας

// ---------- GitHub API ----------
async function gh(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = new Error(`GitHub ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

const toBase64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const fromBase64 = (b64) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

async function loadNews() {
  const file = await gh(`/contents/news.json?ref=${BRANCH}`);
  return { json: JSON.parse(fromBase64(file.content)), sha: file.sha };
}

// Φέρνει την πιο πρόσφατη έκδοση, εφαρμόζει την αλλαγή και την αποθηκεύει.
// Αν κάποιος άλλος άλλαξε το αρχείο στο μεταξύ (409), ξαναδοκιμάζει.
async function updateNews(change, message) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { json, sha } = await loadNews();
    change(json);
    try {
      await gh("/contents/news.json", {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: toBase64(JSON.stringify(json, null, 2) + "\n"),
          sha,
          branch: BRANCH,
        }),
      });
      data = json;
      return;
    } catch (e) {
      if (e.status !== 409 || attempt === 2) throw e;
    }
  }
}

async function uploadImage(path, base64, message) {
  await gh(`/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: base64, branch: BRANCH }),
  });
}

async function deleteImage(path) {
  if (!path || !path.startsWith("images/")) return;
  try {
    const file = await gh(`/contents/${encodeURI(path)}?ref=${BRANCH}`);
    await gh(`/contents/${encodeURI(path)}`, {
      method: "DELETE",
      body: JSON.stringify({ message: `Διαγραφή φωτογραφίας ${path}`, sha: file.sha, branch: BRANCH }),
    });
  } catch (e) { /* η φωτογραφία δεν υπάρχει ή δεν σβήστηκε — δεν πειράζει */ }
}

// ---------- Κωδικός: το token κρυπτογραφείται (AES-GCM) με κλειδί από τον κωδικό (PBKDF2) ----------
const ITERATIONS = 600000;
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password, salt, iterations) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function encryptToken(tok, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(tok));
  return { v: 1, iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(data) };
}

async function decryptToken(box, password) {
  const key = await deriveKey(password, unb64(box.salt), box.iterations);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, key, unb64(box.data));
  return new TextDecoder().decode(plain);
}

// Διαβάζει το admin-key.json χωρίς σύνδεση (το repo είναι δημόσιο). null = δεν έχει ρυθμιστεί κωδικός.
async function fetchKeyFile() {
  const res = await fetch(`${API}/contents/${KEY_FILE}?ref=${BRANCH}`, {
    headers: { Accept: "application/vnd.github.raw+json" }, cache: "no-store",
  }).catch(() => null);
  if (res && res.ok) return res.json();
  if (res && res.status === 404) return null;
  // Αν το API δεν απαντά (π.χ. όριο αιτημάτων), δοκιμάζουμε το αρχείο από το ίδιο το site
  const local = await fetch(`${KEY_FILE}?v=${Date.now()}`, { cache: "no-store" }).catch(() => null);
  return local && local.ok ? local.json() : null;
}

async function saveKeyFile(box) {
  let sha;
  try { sha = (await gh(`/contents/${KEY_FILE}?ref=${BRANCH}`)).sha; } catch (e) { if (e.status !== 404) throw e; }
  await gh(`/contents/${KEY_FILE}`, {
    method: "PUT",
    body: JSON.stringify({
      message: "Ενημέρωση κωδικού διαχείρισης",
      content: toBase64(JSON.stringify(box, null, 2) + "\n"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
}

// ---------- Πρωτοσέλιδο: ίδια λογική με το script.js ----------
const byDate = (a, b) => new Date(b.date) - new Date(a.date);
function frontPage(items) {
  const sorted = [...items].sort(byDate);
  const auto = sorted.filter((n) => ![1, 2, 3].includes(n.featured));
  return [1, 2, 3].map((slot) => {
    const chosen = sorted.find((n) => n.featured === slot);
    return chosen ? { item: chosen, chosen: true } : { item: auto.shift(), chosen: false };
  });
}

// Βάζει την είδηση id στη θέση slot (ή τη βγάζει με slot = null), αδειάζοντας τη θέση από άλλες
function setSlot(json, id, slot) {
  json.news.forEach((n) => {
    if (n.id === id) {
      if (slot) n.featured = slot; else delete n.featured;
    } else if (slot && n.featured === slot) {
      delete n.featured;
    }
  });
}

// ---------- Φωτογραφίες: σμίκρυνση σε 1200px JPEG πριν το ανέβασμα ----------
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1200 / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Η φωτογραφία δεν διαβάζεται."));
    img.src = URL.createObjectURL(file);
  });
}

// ---------- Μηνύματα ----------
function showStatus(text, type = "") {
  const el = $("status");
  el.textContent = text;
  el.className = `msg ${type}`;
  el.hidden = false;
  if (type === "ok") el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function errorText(e) {
  if (e.status === 401) return "Το token δεν είναι σωστό ή έληξε. Κάντε αποσύνδεση και βάλτε νέο.";
  if (e.status === 403 || e.status === 404) return "Το token δεν έχει δικαίωμα εγγραφής στο Kalamata-Today (Contents: Read and write).";
  if (e.status === 409) return "Κάποιος άλλος άλλαξε τις ειδήσεις ταυτόχρονα. Δοκιμάστε ξανά.";
  return `Κάτι πήγε στραβά (${e.message}). Ελέγξτε τη σύνδεση και δοκιμάστε ξανά.`;
}

const LIVE_NOTE = "Θα εμφανιστεί στο site σε περίπου 1 λεπτό.";

// ---------- Εμφάνιση ----------
const thumbStyle = (n) => {
  const [a, b] = n.colors || PALETTE[0];
  const img = n.image ? `url('${rawUrl(n.image)}'), ` : "";
  return `background-image:${img}linear-gradient(135deg, ${a}, ${b})`;
};

const formatDate = (iso) => new Date(iso).toLocaleString("el-GR", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});

// Η φωτογραφία φορτώνεται από το raw.githubusercontent ώστε να φαίνεται αμέσως, πριν ενημερωθεί το site
const rawUrl = (path) => `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${encodeURI(path)}`;

function renderFront() {
  $("front").innerHTML = frontPage(data.news).map(({ item, chosen }, i) => `
    <div class="slot slot-${i + 1}">
      <div class="slot-img" style="${item ? thumbStyle(item) : ""}">
        <span class="slot-num">${i + 1}</span>
      </div>
      <div class="slot-body">
        <span class="slot-name">${SLOT_NAMES[i + 1]}</span>
        <strong>${item ? esc(item.title) : "— κενό —"}</strong>
        <span class="slot-mode ${chosen ? "chosen" : ""}">${chosen ? "📌 Επιλεγμένο" : "Αυτόματα (πιο πρόσφατο)"}</span>
      </div>
    </div>`).join("");
}

function renderList() {
  renderFront();
  const q = $("list-search").value.trim().toLowerCase();
  const sorted = [...data.news].sort(byDate);
  const front = frontPage(data.news);
  const items = sorted
    .filter((n) => !q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q));
  $("count").textContent = `(${data.news.length})`;
  $("news-list").innerHTML = items.map((n) => {
    const pos = sorted.indexOf(n) + 1;
    const slot = front.findIndex((f) => f.item === n) + 1;
    const opts = ["", 1, 2, 3].map((v) =>
      `<option value="${v}" ${(n.featured || "") === v ? "selected" : ""}>${v ? `${v} · ${SLOT_NAMES[v]}` : "Αυτόματα"}</option>`).join("");
    return `
    <li class="${n.id === editingId ? "editing" : ""}">
      <span class="pos" title="Σειρά στο site">${pos}</span>
      <div class="thumb" style="${thumbStyle(n)}"></div>
      <div class="info">
        <strong>${esc(n.title)}</strong>
        <span>${esc(n.category)} · ${formatDate(n.date)}</span>
        ${slot ? `<span class="badge">Πρωτοσέλιδο ${slot} · ${SLOT_NAMES[slot]}</span>` : ""}
      </div>
      <label class="slot-select">Θέση
        <select data-slot="${esc(n.id)}">${opts}</select>
      </label>
      <div class="btns">
        <button class="btn-ghost" data-edit="${esc(n.id)}">Επεξεργασία</button>
        <button class="btn-ghost danger" data-delete="${esc(n.id)}">Διαγραφή</button>
      </div>
    </li>`;
  }).join("") || `<li>Δεν υπάρχουν ειδήσεις.</li>`;
}

function renderBreaking() {
  $("f-breaking").value = (data.breaking || []).join("\n");
}

// datetime-local θέλει τοπική ώρα χωρίς ζώνη: "2026-10-15T09:30"
const toLocalInput = (d) => {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 16);
};

function setPreview(src) {
  $("preview").style.backgroundImage = src
    ? `url('${src}')`
    : "";
  $("remove-image").hidden = !src;
}

function resetForm() {
  editingId = null;
  pendingImage = null;
  removeImage = false;
  $("news-form").reset();
  $("f-date").value = toLocalInput(new Date());
  $("f-featured").value = "";
  $("form-title").textContent = "Νέα είδηση";
  $("save-btn").textContent = "Δημοσίευση";
  $("cancel-edit").hidden = true;
  setPreview(null);
  renderList();
}

function startEdit(id) {
  const n = data.news.find((x) => x.id === id);
  if (!n) return;
  editingId = id;
  pendingImage = null;
  removeImage = false;
  $("f-title").value = n.title;
  $("f-excerpt").value = n.excerpt;
  $("f-category").value = n.category;
  $("f-date").value = toLocalInput(new Date(n.date));
  $("f-featured").value = n.featured || "";
  $("f-image").value = "";
  $("form-title").textContent = "Επεξεργασία είδησης";
  $("save-btn").textContent = "Αποθήκευση αλλαγών";
  $("cancel-edit").hidden = false;
  setPreview(n.image ? rawUrl(n.image) : null);
  renderList();
  $("news-form").scrollIntoView({ behavior: "smooth" });
}

// ---------- Ενέργειες ----------
async function withBusy(button, fn) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "Αποθήκευση…";
  try { await fn(); }
  catch (e) { showStatus(errorText(e), "error"); }
  finally {
    button.disabled = false;
    // Αν η φόρμα άλλαξε το κείμενο στο μεταξύ (π.χ. resetForm), το κρατάμε
    if (button.textContent === "Αποθήκευση…") button.textContent = label;
  }
}

$("news-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const fields = {
    title: $("f-title").value.trim(),
    excerpt: $("f-excerpt").value.trim(),
    category: $("f-category").value,
    date: new Date($("f-date").value).toISOString(),
  };
  const slot = Number($("f-featured").value) || null;
  const isNew = !editingId;
  const id = editingId || String(Date.now());

  withBusy($("save-btn"), async () => {
    let imagePath;
    if (pendingImage) {
      imagePath = `images/${id}-${Date.now()}.jpg`;
      showStatus("Ανέβασμα φωτογραφίας…");
      await uploadImage(imagePath, pendingImage, `Φωτογραφία για: ${fields.title}`);
    }
    let oldImage = null;
    showStatus("Αποθήκευση είδησης…");
    await updateNews((json) => {
      json.news = json.news || [];
      if (isNew) {
        const item = { id, ...fields, views: 0, colors: PALETTE[Math.floor(Math.random() * PALETTE.length)] };
        if (imagePath) item.image = imagePath;
        json.news.unshift(item);
        setSlot(json, id, slot);
      } else {
        const item = json.news.find((x) => x.id === id);
        if (!item) throw new Error("Η είδηση δεν βρέθηκε (ίσως διαγράφηκε)");
        Object.assign(item, fields);
        setSlot(json, id, slot);
        if (imagePath || removeImage) {
          oldImage = item.image || null;
          if (imagePath) item.image = imagePath;
          else delete item.image;
        }
      }
    }, isNew ? `Νέα είδηση: ${fields.title}` : `Επεξεργασία: ${fields.title}`);
    if (oldImage) await deleteImage(oldImage);
    showStatus(`${isNew ? "Η είδηση δημοσιεύτηκε." : "Οι αλλαγές αποθηκεύτηκαν."} ${LIVE_NOTE}`, "ok");
    resetForm();
  });
});

$("f-image").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await resizeImage(file);
    pendingImage = dataUrl.split(",")[1];
    removeImage = false;
    setPreview(dataUrl);
  } catch (err) {
    showStatus(err.message, "error");
    e.target.value = "";
  }
});

$("remove-image").addEventListener("click", () => {
  pendingImage = null;
  removeImage = true;
  $("f-image").value = "";
  setPreview(null);
});

$("cancel-edit").addEventListener("click", resetForm);

$("news-list").addEventListener("click", (e) => {
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-delete]");
  if (edit) startEdit(edit.dataset.edit);
  if (del) {
    const id = del.dataset.delete;
    const n = data.news.find((x) => x.id === id);
    if (!n || !confirm(`Διαγραφή της είδησης;\n\n«${n.title}»`)) return;
    withBusy(del, async () => {
      let image = null;
      await updateNews((json) => {
        const item = json.news.find((x) => x.id === id);
        image = item && item.image;
        json.news = json.news.filter((x) => x.id !== id);
      }, `Διαγραφή: ${n.title}`);
      if (image) await deleteImage(image);
      if (editingId === id) resetForm(); else renderList();
      showStatus(`Η είδηση διαγράφηκε. ${LIVE_NOTE}`, "ok");
    });
  }
});

$("breaking-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const lines = $("f-breaking").value.split("\n").map((s) => s.trim()).filter(Boolean);
  withBusy(e.submitter || e.target.querySelector("button"), async () => {
    await updateNews((json) => { json.breaking = lines; }, "Ενημέρωση έκτακτων");
    renderBreaking();
    showStatus(`Τα έκτακτα αποθηκεύτηκαν. ${LIVE_NOTE}`, "ok");
  });
});

$("list-search").addEventListener("input", renderList);

// Αλλαγή θέσης στο πρωτοσέλιδο απευθείας από τη λίστα
$("news-list").addEventListener("change", (e) => {
  const sel = e.target.closest("[data-slot]");
  if (!sel) return;
  const id = sel.dataset.slot;
  const slot = Number(sel.value) || null;
  const n = data.news.find((x) => x.id === id);
  sel.disabled = true;
  showStatus("Αποθήκευση θέσης…");
  updateNews((json) => setSlot(json, id, slot),
    slot ? `Πρωτοσέλιδο ${slot}: ${n.title}` : `Εκτός πρωτοσέλιδου: ${n.title}`)
    .then(() => showStatus(`${slot ? `Μπήκε στη θέση ${slot} (${SLOT_NAMES[slot]}).` : "Η θέση έγινε αυτόματη."} ${LIVE_NOTE}`, "ok"))
    .catch((err) => showStatus(errorText(err), "error"))
    .finally(renderList);
});

// ---------- Σύνδεση ----------
let keyBox = null; // περιεχόμενο του admin-key.json

async function enter() {
  const { json } = await loadNews();
  data = json;
  $("login-view").hidden = true;
  $("app-view").hidden = false;
  $("logout").hidden = false;
  renderBreaking();
  resetForm();
}

function loginMessage(text, type = "error") {
  $("login-msg").hidden = !text;
  $("login-msg").textContent = text || "";
  $("login-msg").className = `msg ${type}`;
}

function showLogin(mode, message) {
  $("login-view").hidden = false;
  $("app-view").hidden = true;
  $("logout").hidden = true;
  $("password-mode").hidden = mode !== "password";
  $("setup-mode").hidden = mode !== "setup";
  $("token-help").hidden = mode !== "setup";
  $("to-password-wrap").hidden = !keyBox;
  loginMessage(message);
  (mode === "password" ? $("password") : $("token")).focus();
}

function remember(tok) {
  token = tok;
  try { localStorage.setItem(TOKEN_KEY, tok); } catch (e) {}
}

// Σύνδεση με κωδικό
$("password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  loginMessage("Έλεγχος κωδικού…", "");
  try {
    let tok;
    try { tok = await decryptToken(keyBox, $("password").value); }
    catch (err) { throw Object.assign(new Error("wrong"), { wrongPassword: true }); }
    token = tok;
    await enter();
    remember(tok);
    $("password").value = "";
  } catch (err) {
    token = "";
    loginMessage(err.wrongPassword ? "Λάθος κωδικός." :
      err.status === 401 ? "Το token που είναι αποθηκευμένο έληξε. Πατήστε «Αλλαγή κωδικού» και βάλτε νέο token." :
      errorText(err));
  } finally {
    btn.disabled = false;
  }
});

// Πρώτη ρύθμιση ή αλλαγή κωδικού
$("setup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const tok = $("token").value.trim();
  const pw = $("new-password").value;
  if (pw !== $("new-password-2").value) return loginMessage("Οι δύο κωδικοί δεν είναι ίδιοι.");
  if (pw.length < 10) return loginMessage("Ο κωδικός θέλει τουλάχιστον 10 χαρακτήρες.");
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  loginMessage("Έλεγχος token και αποθήκευση κωδικού…", "");
  try {
    token = tok;
    const repo = await gh("");
    if (!repo.permissions || !repo.permissions.push) throw Object.assign(new Error("no push"), { status: 403 });
    keyBox = await encryptToken(tok, pw);
    await saveKeyFile(keyBox);
    remember(tok);
    e.target.reset();
    await enter();
    showStatus("Ο κωδικός αποθηκεύτηκε. Από τώρα μπαίνετε μόνο με τον κωδικό, από οποιαδήποτε συσκευή.", "ok");
  } catch (err) {
    token = "";
    loginMessage(errorText(err));
  } finally {
    btn.disabled = false;
  }
});

$("to-setup").addEventListener("click", (e) => { e.preventDefault(); showLogin("setup"); });
$("to-password").addEventListener("click", (e) => { e.preventDefault(); showLogin("password"); });

$("logout").addEventListener("click", () => {
  try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  token = "";
  showLogin(keyBox ? "password" : "setup");
});

(async () => {
  try { token = localStorage.getItem(TOKEN_KEY) || ""; } catch (e) {}
  keyBox = await fetchKeyFile().catch(() => null);
  if (token) {
    try { return await enter(); }
    catch (e) { token = ""; try { localStorage.removeItem(TOKEN_KEY); } catch (_) {} }
  }
  showLogin(keyBox ? "password" : "setup");
})();
