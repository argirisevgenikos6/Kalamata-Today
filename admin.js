// Διαχείριση ειδήσεων: διαβάζει και γράφει το news.json στο GitHub μέσω του GitHub API.
const OWNER = "argirisevgenikos6";
const REPO = "Kalamata-Today";
const BRANCH = "main";
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const TOKEN_KEY = "kt-admin-token";

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

function renderList() {
  const q = $("list-search").value.trim().toLowerCase();
  const items = [...data.news]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((n) => !q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q));
  $("count").textContent = `(${data.news.length})`;
  $("news-list").innerHTML = items.map((n) => `
    <li class="${n.id === editingId ? "editing" : ""}">
      <div class="thumb" style="${thumbStyle(n)}"></div>
      <div class="info">
        <strong>${esc(n.title)}</strong>
        <span>${esc(n.category)} · ${formatDate(n.date)}</span>
      </div>
      <div class="btns">
        <button class="btn-ghost" data-edit="${esc(n.id)}">Επεξεργασία</button>
        <button class="btn-ghost danger" data-delete="${esc(n.id)}">Διαγραφή</button>
      </div>
    </li>`).join("") || `<li>Δεν υπάρχουν ειδήσεις.</li>`;
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
      } else {
        const item = json.news.find((x) => x.id === id);
        if (!item) throw new Error("Η είδηση δεν βρέθηκε (ίσως διαγράφηκε)");
        Object.assign(item, fields);
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

// ---------- Σύνδεση ----------
async function enter() {
  const { json } = await loadNews();
  data = json;
  $("login-view").hidden = true;
  $("app-view").hidden = false;
  $("logout").hidden = false;
  renderBreaking();
  resetForm();
}

function showLogin(message) {
  $("login-view").hidden = false;
  $("app-view").hidden = true;
  $("logout").hidden = true;
  $("login-msg").hidden = !message;
  $("login-msg").textContent = message || "";
  $("login-msg").className = "msg error";
}

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  token = $("token").value.trim();
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  try {
    const repo = await gh("");
    if (!repo.permissions || !repo.permissions.push) throw Object.assign(new Error("no push"), { status: 403 });
    try { localStorage.setItem(TOKEN_KEY, token); } catch (err) {}
    $("token").value = "";
    await enter();
  } catch (err) {
    token = "";
    showLogin(errorText(err));
  } finally {
    btn.disabled = false;
  }
});

$("logout").addEventListener("click", () => {
  try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  token = "";
  showLogin();
});

try { token = localStorage.getItem(TOKEN_KEY) || ""; } catch (e) {}
if (token) enter().catch((e) => showLogin(errorText(e)));
else showLogin();
