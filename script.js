/* --------------------------------------
   GLOBAL CONFIG
----------------------------------------- */
const sheetURL =
  "https://docs.google.com/spreadsheets/d/1AfYExJcJEJVw6hOmPUUkBXBnbC16MM9vu453MpVLIpw/gviz/tq?tqx=out:csv&gid=0";

/* --------------------------------------
   UTILITIES (used by all pages)
----------------------------------------- */
function stripBOM(s) {
  if (s && s.charCodeAt(0) === 0xFEFF) return s.slice(1);
  return s;
}

function detectDelimiter(line) {
  const comma = (line.match(/,/g) || []).length;
  const semi = (line.match(/;/g) || []).length;
  return semi > comma ? ";" : ",";
}

function parseCSV(text, delimiter) {
  text = stripBOM(text);
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (current || row.length) {
        row.push(current);
        rows.push(row);
      }
      row = [];
      current = "";
      while (text[i + 1] === "\n" || text[i + 1] === "\r") i++;
    } else {
      current += c;
    }
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  return rows.map(r => r.map(x => x.trim()));
}

function normalize(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getHeaderIndex(headers, names) {
  const norm = headers.map(h => normalize(h));
  for (const n of names) {
    const idx = norm.indexOf(normalize(n));
    if (idx !== -1) return idx;
  }
  return -1;
}

function param(name) {
  const p = new URLSearchParams(location.search);
  return p.get(name);
}

/* scroll indicator */
window.addEventListener("scroll", () => {
  const top = document.documentElement.scrollTop;
  const height =
    document.documentElement.scrollHeight - window.innerHeight;
  const percent = height > 0 ? (top / height) * 100 : 0;
  document.getElementById("scroll-indicator").style.width =
    percent + "%";
});

/* reveal animation */
const reveal = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        reveal.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);

/* --------------------------------------
   LOAD CSV
----------------------------------------- */
async function loadCSV() {
  const res = await fetch(sheetURL, { cache: "no-store" });
  const text = await res.text();
  const first = text.split(/\r?\n/).find(x => x.trim()) || "";
  const delim = detectDelimiter(first);
  return parseCSV(text, delim);
}

/* --------------------------------------
   PAGE ROUTING
----------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  const page = location.pathname.split("/").pop();

  if (page === "" || page === "index.html") loadPoles();
  if (page === "specialites.html") loadSpecialites();
});

/* --------------------------------------
   INDEX: show poles
----------------------------------------- */
async function loadPoles() {
  const container = document.getElementById("poles-container");
  if (!container) return;

  container.innerHTML = '<div class="placeholder">Chargement…</div>';

  try {
    const rows = await loadCSV();
    const headers = rows[0];

    const poleIdx = getHeaderIndex(headers, ["pôle", "pole"]);
    if (poleIdx === -1) throw new Error('Colonne "Pôle" introuvable');

    const seen = new Set();
    const poles = [];

    for (let i = 1; i < rows.length; i++) {
      const pole = rows[i][poleIdx];
      if (!pole) continue;

      if (!seen.has(pole)) {
        seen.add(pole);
        poles.push(pole);
      }
    }

    container.innerHTML = "";

    poles.forEach(p => {
      const c = document.createElement("button");
      c.className = "card";
      c.textContent = p;

      c.onclick = () =>
        (location.href = `specialites.html?pole=${encodeURIComponent(
          p
        )}`);

      container.appendChild(c);
      reveal.observe(c);
    });
  } catch (err) {
    container.innerHTML =
      '<div class="placeholder" style="color:red;">Erreur lors du chargement</div>';
  }
}

/* --------------------------------------
   SPECIALITES PAGE
----------------------------------------- */
async function loadSpecialites() {
  const container = document.getElementById("specialties-container");
  const title = document.getElementById("page-title");
  const niveau = document.getElementById("niveau");

  if (!container || !title) return;

  const selectedPole = param("pole");
  if (!selectedPole) {
    title.textContent = "Spécialités";
    container.innerHTML =
      '<div class="placeholder">Aucun pôle sélectionné.</div>';
    return;
  }

  title.textContent = "Pôle " + selectedPole;

  container.innerHTML = '<div class="placeholder">Chargement…</div>';

  try {
    const rows = await loadCSV();
    const headers = rows[0];

    const poleIdx = getHeaderIndex(headers, ["pôle", "pole"]);
    const specIdx = getHeaderIndex(headers, [
      "spécialité",
      "specialite",
      "specialty"
    ]);

    const norm = normalize(selectedPole);

    const seen = new Set();
    const list = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (normalize(r[poleIdx]) !== norm) continue;

      const spec = r[specIdx];
      if (!spec) continue;

      if (!seen.has(spec)) {
        seen.add(spec);
        list.push(spec);
      }
    }

    container.innerHTML = "";

    list.forEach(s => {
      const card = document.createElement("button");
      card.className = "card";
      card.textContent = s;

      card.onclick = () =>
        (location.href = `groupes.html?pole=${encodeURIComponent(
          selectedPole
        )}&specialite=${encodeURIComponent(
          s
        )}&niveau=${encodeURIComponent(niveau.value)}`);

      container.appendChild(card);
      reveal.observe(card);
    });
  } catch (e) {
    container.innerHTML =
      '<div class="placeholder" style="color:red;">Erreur CSV</div>';
  }
}
