/* ---------------------------
   Robust script.js for CMC
   - Replace sheetURL with your CSV link
   - Handles BOM, HTML-login responses, comma/semicolon
   --------------------------- */
const sheetURL = "https://docs.google.com/spreadsheets/d/1AfYExJcJEJVw6hOmPUUkBXBnbC16MM9vu453MpVLIpw/gviz/tq?tqx=out:csv&gid=0"; // <-- update if needed

const container = document.getElementById("poles-container");

function stripBOM(s) {
  if (s && s.charCodeAt(0) === 0xFEFF) return s.slice(1);
  return s;
}

/* detect delimiter (, or ;) by checking first line */
function detectDelimiter(firstLine) {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semCount = (firstLine.match(/;/g) || []).length;
  return semCount > commaCount ? ';' : ',';
}

/* simple CSV parser supporting chosen delimiter and quotes */
function parseCSV(text, delim=',') {
  text = stripBOM(text);
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i+1];
    if (ch === '"') {
      if (inQuotes && next === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
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
      while (text[i+1] === '\n' || text[i+1] === '\r') i++;
    } else {
      cur += ch;
    }
  }
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.map(r => r.map(cell => (cell||'').trim()));
}

/* normalize header names (remove accents and lowercase) */
function normalizeHeader(s) {
  return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function indexOfHeader(headers, names) {
  const norm = headers.map(h => normalizeHeader(h || ''));
  for (const n of names) {
    const idx = norm.indexOf(normalizeHeader(n));
    if (idx !== -1) return idx;
  }
  return -1;
}

async function loadPoles() {
  container.innerHTML = '<p>Chargement…</p>';
  try {
    const resp = await fetch(sheetURL);
    if (!resp.ok) throw new Error(`Réponse HTTP ${resp.status}`);
    const text = await resp.text();

    // If the server returned an HTML page (login or error) the response will contain "<html"
    const preview = (text||'').slice(0, 800).toLowerCase();
    if (preview.includes('<html') || preview.includes('doctype html') || preview.includes('login')) {
      throw new Error('La feuille renvoie une page HTML (vérifie que "Anyone with the link" est en Viewer).');
    }

    // detect delimiter from first non-empty line
    const firstLine = text.split(/\r?\n/).find(l => l && l.trim().length>0) || '';
    const delim = detectDelimiter(firstLine);
    const rows = parseCSV(text, delim);
    if (!rows || rows.length === 0) throw new Error('Feuille vide ou CSV mal formé.');

    const headers = rows[0];
    const poleIdx = indexOfHeader(headers, ['Pôle','Pole','pôle','pole']);
    if (poleIdx === -1) throw new Error('Colonne "Pôle" introuvable (vérifie l\'en-tête).');

    // build unique poles preserving order
    const map = new Map();
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const pole = (r[poleIdx]||'').trim();
      if (!pole) continue;
      if (!map.has(pole)) map.set(pole, r);
    }

    if (map.size === 0) {
      container.innerHTML = '<p>Aucun pôle trouvé.</p>';
      return;
    }

    container.innerHTML = '';
    let i = 0;
    for (const [poleName, row] of map.entries()) {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.type = 'button';
      btn.innerHTML = `<span>${poleName}</span>`;
      btn.onclick = () => {
        const q = encodeURIComponent(poleName);
        window.location.href = `pole.html?pole=${q}`;
      };
      container.appendChild(btn);
      setTimeout(() => btn.classList.add('visible'), 80 * i);
      i++;
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color:#b00">Erreur : ${err.message}</p>
      <p style="color:#666">Vérifie : 1) le partage est "Anyone with the link → Viewer", 2) le lien CSV correct (gviz/tq?...out:csv), 3) ouvre le lien CSV dans Chrome pour tester.</p>`;
  }
}

/* progress bar */
window.addEventListener('scroll', () => {
  const top = document.documentElement.scrollTop || document.body.scrollTop;
  const height = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
  const pct = height > 0 ? (top / height) * 100 : 0;
  const bar = document.getElementById('scroll-indicator');
  if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
});

loadPoles();
