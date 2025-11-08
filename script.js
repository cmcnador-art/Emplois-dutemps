/* script.js - improved for CMC
   - fetches CSV from Google Sheets (gviz/tq? out:csv)
   - robust CSV parsing (commas or semicolons)
   - accessible, animated card injection
   - IntersectionObserver reveal + scroll progress
*/

/* --------- CONFIG: update this URL if needed --------- */
const sheetURL = "https://docs.google.com/spreadsheets/d/1AfYExJcJEJVw6hOmPUUkBXBnbC16MM9vu453MpVLIpw/gviz/tq?tqx=out:csv&gid=0";

const container = document.getElementById("poles-container");

/* utility: strip BOM */
function stripBOM(s) {
  if (s && s.charCodeAt(0) === 0xFEFF) return s.slice(1);
  return s;
}

/* detect delimiter from header line */
function detectDelimiter(firstLine) {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semCount = (firstLine.match(/;/g) || []).length;
  return semCount > commaCount ? ';' : ',';
}

/* simple CSV parser supporting a delimiter and quoted values */
function parseCSV(text, delim = ',') {
  text = stripBOM(text);
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      row.push(cur);
      cur = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (cur !== '' || row.length > 0) {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      }
      // skip successive line breaks
      while (text[i + 1] === '\n' || text[i + 1] === '\r') i++;
    } else {
      cur += ch;
    }
  }

  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }

  // trim cells
  return rows.map(r => r.map(cell => (cell || '').trim()));
}

/* normalize header text */
function normalizeHeader(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function indexOfHeader(headers, names) {
  const norm = headers.map(h => normalizeHeader(h || ''));
  for (const n of names) {
    const idx = norm.indexOf(normalizeHeader(n));
    if (idx !== -1) return idx;
  }
  return -1;
}

/* show error inside container */
function showError(message, extra) {
  container.innerHTML = `<div class="placeholder" style="color:#b00">Erreur : ${message}</div>`;
  if (extra) {
    const p = document.createElement('div');
    p.className = 'placeholder';
    p.style.color = '#666';
    p.style.fontSize = '0.95rem';
    p.style.textAlign = 'center';
    p.innerHTML = extra;
    container.appendChild(p);
  }
}

/* intersection observer to reveal cards */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

/* main loader */
async function loadPoles() {
  container.innerHTML = '<div class="placeholder">Chargement…</div>';

  try {
    const resp = await fetch(sheetURL, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`Réponse HTTP ${resp.status}`);
    const text = await resp.text();

    // detect HTML (login/error) responses
    const preview = (text || '').slice(0, 1200).toLowerCase();
    if (preview.includes('<html') || preview.includes('<!doctype html') || preview.includes('login')) {
      throw new Error('La feuille renvoie une page HTML. Vérifie le partage (Anyone with the link → Viewer) et que le lien est celui du CSV (gviz/tq?...out:csv).');
    }

    // pick first non-empty line to detect delimiter
    const firstLine = text.split(/\r?\n/).find(l => l && l.trim().length > 0) || '';
    const delim = detectDelimiter(firstLine);
    const rows = parseCSV(text, delim);

    if (!rows || rows.length === 0) throw new Error('Feuille vide ou CSV mal formé.');

    const headers = rows[0].map(h => (h || '').trim());
    // try several header names for pole column
    const poleIdx = indexOfHeader(headers, ['Pôle', 'Pole', 'pôle', 'pole', 'pole_name', 'pole name']);
    if (poleIdx === -1) throw new Error('Colonne "Pôle" introuvable (vérifie l\'en-tête).');

    // build unique poles preserving order
    const seen = new Set();
    const poles = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const cell = (r[poleIdx] || '').trim();
      if (!cell) continue;
      if (!seen.has(cell)) {
        seen.add(cell);
        poles.push({ name: cell, row: r });
      }
    }

    if (poles.length === 0) {
      showError('Aucun pôle trouvé.');
      return;
    }

    // inject buttons
    container.innerHTML = '';
    poles.forEach((p, idx) => {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.type = 'button';
      btn.setAttribute('aria-label', `Ouvrir ${p.name}`);
      btn.innerHTML = `<span>${p.name}</span>`;
      // go to pole page (keeps workflow). Make sure you have pole.html implemented.
      btn.addEventListener('click', () => {
        const q = encodeURIComponent(p.name);
        window.location.href = `pole.html?pole=${q}`;
      });
      container.appendChild(btn);

      // use observer to reveal
      revealObserver.observe(btn);
    });

  } catch (err) {
    console.error(err);
    showError(err.message, 'Vérifie : 1) le partage est "Anyone with the link" en Viewer, 2) le lien CSV (gviz/tq?...out:csv), 3) ouvre le lien CSV dans le navigateur pour tester.');
  }
}

/* scroll progress bar handler */
window.addEventListener('scroll', () => {
  const top = document.documentElement.scrollTop || document.body.scrollTop;
  const height = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
  const pct = height > 0 ? (top / height) * 100 : 0;
  const bar = document.getElementById('scroll-indicator');
  if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
});

/* initialize */
loadPoles();
