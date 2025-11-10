/* script.js - single JS for index, specialites, groupes (future)
   - Fetches CSV from Google Sheets (gviz/tq? out:csv)
   - Robust CSV parsing (commas/semicolons + quotes)
   - Renders poles on index
   - Renders specialties on specialites.html (filtered by ?pole=)
   - Shows niveau dropdown when specialty clicked (toggle)
   - Redirects to groupes.html when niveau selected
*/

/* -------- CONFIG: update your sheet URL here if changed -------- */
const sheetURL = "https://docs.google.com/spreadsheets/d/1AfYExJcJEJVw6hOmPUUkBXBnbC16MM9vu453MpVLIpw/gviz/tq?tqx=out:csv&gid=0";

/* ------------------ Utilities ------------------ */
function stripBOM(s){ if (s && s.charCodeAt(0) === 0xFEFF) return s.slice(1); return s; }
function detectDelimiter(firstLine){
  const comma = (firstLine.match(/,/g) || []).length;
  const semi = (firstLine.match(/;/g) || []).length;
  return semi > comma ? ';' : ',';
}
function parseCSV(text, delim=','){
  text = stripBOM(text);
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  for (let i=0;i<text.length;i++){
    const ch = text[i];
    const next = text[i+1];
    if (ch === '"') {
      if (inQuotes && next === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      row.push(cur);
      cur = '';
    } else if ((ch === '
' || ch === '
') && !inQuotes) {
      if (cur !== '' || row.length > 0) {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      }
      while (text[i+1] === '
' || text[i+1] === '
') i++;
    } else {
      cur += ch;
    }
  }
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.map(r => r.map(c => (c||'').trim()));
}
function normalize(s){
  return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
}
function indexOfHeader(headers, names){
  const norm = headers.map(h => normalize(h||''));
  for (const n of names){
    const idx = norm.indexOf(normalize(n));
    if (idx !== -1) return idx;
  }
  return -1;
}
function getQueryParam(name){
  return new URLSearchParams(window.location.search).get(name);
}

/* scroll progress bar */
window.addEventListener('scroll', () => {
  const top = document.documentElement.scrollTop || document.body.scrollTop;
  const height = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
  const pct = height > 0 ? (top / height) * 100 : 0;
  const bar = document.getElementById('scroll-indicator');
  if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
});

/* reveal observer for cards */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

/* load CSV text and return parsed rows */
async function loadCSV(){
  const resp = await fetch(sheetURL, { cache: 'no-store' });
  if (!resp.ok) throw new Error('Réponse HTTP ' + resp.status);
  const text = await resp.text();
  const preview = (text||'').slice(0,1200).toLowerCase();
  if (preview.includes('<html') || preview.includes('<!doctype html') || preview.includes('login')) {
    throw new Error('La feuille renvoie une page HTML (vérifie le partage et le lien CSV).');
  }
  const firstLine = text.split(/
?
/).find(l => l && l.trim().length>0) || '';
  const delim = detectDelimiter(firstLine);
  return parseCSV(text, delim);
}

/* ------------------ Page router ------------------ */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  if (page === '' || page === 'index.html') loadPoles();
  if (page === 'specialites.html') loadSpecialites();
});

/* ------------------ INDEX: load poles ------------------ */
async function loadPoles(){
  const container = document.getElementById('poles-container');
  if (!container) return;
  container.innerHTML = '<div class="placeholder">Chargement…</div>';
  try {
    const rows = await loadCSV();
    if (!rows || rows.length === 0) throw new Error('Feuille vide');
    const headers = rows[0];
    const poleIdx = indexOfHeader(headers, ['Pôle','Pole','pole','pôle']);
    if (poleIdx === -1) throw new Error('Colonne "Pôle" introuvable (vérifie l en-tête).');

    const seen = new Set();
    const poles = [];
    for (let i=1;i<rows.length;i++){
      const r = rows[i];
      if (!r) continue;
      const pole = (r[poleIdx]||'').trim();
      if (!pole) continue;
      if (!seen.has(pole)) { seen.add(pole); poles.push(pole); }
    }

    if (poles.length === 0) {
      container.innerHTML = '<div class="placeholder">Aucun pôle trouvé.</div>';
      return;
    }

    container.innerHTML = '';
    poles.forEach((poleName, idx) => {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.type = 'button';
      btn.setAttribute('aria-label', `Ouvrir ${poleName}`);
      btn.textContent = poleName;
      btn.addEventListener('click', () => {
        // navigate with query param
        const q = encodeURIComponent(poleName);
        window.location.href = `specialites.html?pole=${q}`;
      });
      container.appendChild(btn);
      // reveal effect
      setTimeout(() => revealObserver.observe(btn), 60 * idx);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="placeholder" style="color:#b00">Erreur : ${err.message}</div>
      <div class="placeholder" style="color:#666">Vérifie : 1) le partage "Anyone with the link" est Viewer, 2) le lien CSV (gviz/tq?...out:csv), 3) ouvre le lien CSV dans le navigateur.</div>`;
  }
}

/* ------------------ SPECIALITES: load specialties for chosen pole ------------------ */
async function loadSpecialites(){
  const container = document.getElementById('specialties-container');
  const titleEl = document.getElementById('page-title');
  const niveauWrapper = document.getElementById('niveau-wrapper');
  const niveauSelect = document.getElementById('niveau-select');

  if (!container || !titleEl) return;

  const rawPole = getQueryParam('pole');
  if (!rawPole){
    titleEl.textContent = 'Spécialités';
    container.innerHTML = '<div class="placeholder">Aucun pôle sélectionné.</div>';
    return;
  }
  const poleName = decodeURIComponent(rawPole);
  titleEl.textContent = `Pôle ${poleName}`;

  // hide dropdown initially
  if (niveauWrapper) {
    niveauWrapper.classList.add('hidden');
    niveauWrapper.setAttribute('aria-hidden', 'true');
  }

  container.innerHTML = '<div class="placeholder">Chargement…</div>';

  try {
    const rows = await loadCSV();
    if (!rows || rows.length === 0) throw new Error('Feuille vide');
    const headers = rows[0];
    const poleIdx = indexOfHeader(headers, ['Pôle','Pole','pôle','pole']);
    const specIdx = indexOfHeader(headers, ['Spécialité','Specialite','specialite','specialty','specialité']);

    if (poleIdx === -1 || specIdx === -1) {
      throw new Error('Colonnes "Pôle" ou "Spécialité" introuvables.');
    }

    const normPole = normalize(poleName);
    const seen = new Set();
    const list = [];
    for (let i=1;i<rows.length;i++){
      const r = rows[i];
      if (!r) continue;
      const poleCell = (r[poleIdx]||'').trim();
      if (!poleCell) continue;
      if (normalize(poleCell) !== normPole) continue;
      const specCell = (r[specIdx]||'').trim();
      if (!specCell) continue;
      if (!seen.has(specCell)) { seen.add(specCell); list.push(specCell); }
    }

    if (list.length === 0) {
      container.innerHTML = '<div class="placeholder">Aucune spécialité trouvée pour ce pôle.</div>';
      return;
    }

    // render specialties as cards
    container.innerHTML = '';
    list.forEach((s, idx) => {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.type = 'button';
      btn.textContent = s;
      btn.setAttribute('aria-label', `Sécurité ${s}`);

      btn.addEventListener('click', () => {
        if (window.currentSpecialty === s) {
          if (niveauWrapper) {
            const isHidden = niveauWrapper.classList.toggle('hidden');
            niveauWrapper.setAttribute('aria-hidden', isHidden ? 'true' : 'false');
            if (!isHidden) {
              btn.after(niveauWrapper);
            }
          }
          if (niveauWrapper && niveauWrapper.classList.contains('hidden')) {
            window.currentSpecialty = null;
          }
          return;
        }
        window.currentSpecialty = s;
        if (niveauWrapper) {
          niveauWrapper.classList.remove('hidden');
          niveauWrapper.setAttribute('aria-hidden', 'false');
          btn.after(niveauWrapper);
        }
        document.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));
        btn.classList.add('selected');
      });

      container.appendChild(btn);
      setTimeout(() => revealObserver.observe(btn), 70 * idx);
    });

    if (niveauSelect) {
      niveauSelect.onchange = () => {
        if (!window.currentSpecialty) return;
        const qPole = encodeURIComponent(poleName);
        const qSpec = encodeURIComponent(window.currentSpecialty);
        const qNiv = encodeURIComponent(niveauSelect.value);
        window.location.href = `groupes.html?pole=${qPole}&specialite=${qSpec}&niveau=${qNiv}`;
      };
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="placeholder" style="color:#b00">Erreur : ${err.message}</div>`;
  }
          }
