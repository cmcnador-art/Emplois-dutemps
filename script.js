// ---------- CONFIG ----------
const SHEET_URL = 'https://opensheet.elk.sh/1AfYExJcJEJVw6hOmPUUkBXBnbC16MM9vu453MpVLIpw/Emplois_du_temps';

// ---------- HELPERS ----------
function goTo(url) { window.location.href = url; }
function goBack() { window.history.back(); }
function saveSelection(k, v) { sessionStorage.setItem(k, v); }
function getSelection(k) { return sessionStorage.getItem(k); }

async function fetchData() {
  const res = await fetch(SHEET_URL);
  return await res.json();
}

// ---------- POLES PAGE ----------
async function loadPolesPage() {
  const container = document.getElementById('polesContainer');
  if (!container) return;
  container.innerHTML = '<p>Chargement...</p>';

  try {
    const data = await fetchData();
    const poles = [...new Set(data.map(r => (r['pôle'] || '').toString().trim()).filter(Boolean))];

    container.innerHTML = '';
    poles.forEach(pole => {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.textContent = pole;
      btn.onclick = () => {
        saveSelection('pole', pole);
        goTo(`specialites.html?p=${encodeURIComponent(pole)}`);
      };
      container.appendChild(btn);
    });

    if (poles.length === 0) container.innerHTML = '<p>Aucun pôle trouvé.</p>';
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Erreur de chargement des pôles.</p>';
  }
}

// ---------- SPECIALTIES PAGE ----------
async function loadSpecialtiesPage() {
  const params = new URLSearchParams(window.location.search);
  const pole = (params.get('p') || '').toString().trim();
  const titleEl = document.getElementById('poleName');
  const container = document.getElementById('specialtiesContainer');
  if (!container || !titleEl) return;

  titleEl.textContent = pole || 'Pôle';
  container.innerHTML = '<p>Chargement...</p>';

  try {
    const data = await fetchData();
    const specialties = [...new Set(
      data
        .filter(r => (r['pôle'] || '').toString().trim() === pole)
        .map(r => (r['spécialité'] || '').toString().trim())
        .filter(Boolean)
    )];

    container.innerHTML = '';
    specialties.forEach(spec => {
      const safeId = spec.replace(/[^\w\-]/g, '_');
      const div = document.createElement('div');
      div.className = 'specialty';
      div.innerHTML = `
        <button class="card" onclick="toggleYears('${safeId}'); saveSelection('specialty', '${spec.replace(/'/g,"\\'")}')">${spec}</button>
        <div id="${safeId}" class="years" style="display:none;">
          <button class="year-btn" onclick="saveSelection('year',1); goTo('Groupes.html?s=${encodeURIComponent(spec)}&y=1')">1ère Année</button>
          <button class="year-btn" onclick="saveSelection('year',2); goTo('Groupes.html?s=${encodeURIComponent(spec)}&y=2')">2ème Année</button>
        </div>
      `;
      container.appendChild(div);
    });

    if (specialties.length === 0) container.innerHTML = '<p>Aucune spécialité trouvée pour ce pôle.</p>';
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Erreur de chargement des spécialités.</p>';
  }
}

// ---------- GROUPS PAGE (Groupes.html with capital G) ----------
async function loadGroupsPage() {
  const params = new URLSearchParams(window.location.search);
  const specialty = (params.get('s') || '').toString().trim();
  const year = (params.get('y') || '').toString();
  const specEl = document.getElementById('specialtyName');
  const yearEl = document.getElementById('yearName');
  const container = document.getElementById('groupsContainer');
  if (!container || !specEl || !yearEl) return;

  specEl.textContent = specialty;
  yearEl.textContent = year === '1' ? '1ère Année' : (year === '2' ? '2ème Année' : 'Année');
  container.innerHTML = '<p>Chargement...</p>';

  try {
    const data = await fetchData();
    const groups = [...new Set(
      data
        .filter(r => (r['spécialité'] || '').toString().trim() === specialty && (r['année'] || '').toString() === year)
        .map(r => (r['groupe'] || '').toString().trim())
        .filter(Boolean)
    )];

    container.innerHTML = '';
    groups.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.textContent = `Groupe ${g}`;
      btn.onclick = () => { saveSelection('group', g); goTo(`emploi.html?g=${encodeURIComponent(g)}`); };
      container.appendChild(btn);
    });

    if (groups.length === 0) container.innerHTML = '<p>Aucun groupe trouvé.</p>';
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Erreur de chargement des groupes.</p>';
  }
}

// ---------- EMPLOI PAGE ----------
async function loadEmploiPage() {
  const params = new URLSearchParams(window.location.search);
  const group = (params.get('g') || '').toString().trim();
  const specialty = getSelection('specialty') || '';
  const year = getSelection('year') || '';
  const titleEl = document.getElementById('emploiTitle');
  const container = document.getElementById('emploiContainer');
  if (!container || !titleEl) return;

  titleEl.textContent = `Emploi du Temps – Groupe ${group}`;
  container.innerHTML = '<p>Chargement...</p>';

  try {
    const data = await fetchData();
    const row = data.find(r =>
      (r['groupe'] || '').toString().trim().toLowerCase() === group.toLowerCase() &&
      (r['spécialité'] || '').toString().trim().toLowerCase() === (specialty || '').toLowerCase() &&
      (r['année'] || '').toString() === (year || '')
    );

    if (!row) {
      container.innerHTML = '<p>Aucun emploi du temps trouvé.</p>';
      return;
    }

    container.innerHTML = `
      <p><strong>Pôle:</strong> ${row["pôle"] || ''}</p>
      <p><strong>Spécialité:</strong> ${row["spécialité"] || ''}</p>
      <p><strong>Année:</strong> ${row["année"] || ''}</p>
      <p><strong>Dernière mise à jour:</strong> ${row["last update"] || 'Non disponible'}</p>
      <br>
      <a href="${row["drive link"] || '#'}" target="_blank" class="year-btn">📄 Voir le PDF</a>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Erreur de chargement du fichier.</p>';
  }
}

// ---------- UI helpers ----------
function toggleYears(id) {
  document.querySelectorAll('.years').forEach(y => y.style.display = 'none');
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = (el.style.display === 'flex') ? 'none' : 'flex';
}

function goNext() {
  const current = window.location.pathname.split('/').pop();
  if (!current || current === '') {
    loadPolesPage();
    return;
  }
  if (current.includes('index.html')) {
    const pole = getSelection('pole');
    if (pole) goTo(`specialites.html?p=${encodeURIComponent(pole)}`);
  } else if (current.includes('specialites.html')) {
    const spec = getSelection('specialty');
    const year = getSelection('year');
    if (spec && year) goTo(`Groupes.html?s=${encodeURIComponent(spec)}&y=${year}`);
  } else if (current.includes('Groupes.html')) {
    const group = getSelection('group');
    if (group) goTo(`emploi.html?g=${encodeURIComponent(group)}`);
  }
}

function adjustNavButtons() {
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  const container = document.querySelector('.nav-buttons');
  if (!container) return;
  const current = window.location.pathname.split('/').pop();
  let one = false;

  if (current.includes('index.html') || current === '') {
    if (prev) prev.style.display = 'none';
    one = true;
  } else if (current.includes('Groupes.html')) {
    const g = getSelection('group');
    if (next) {
      if (!g) next.style.display = 'none';
      else next.style.display = '';
    }
    one = !getSelection('group');
  } else {
    if (prev) prev.style.display = '';
    if (next) next.style.display = '';
  }

  if (one) container.classList.add('one-button');
  else container.classList.remove('one-button');
}

// ---------- ROUTING ----------
document.addEventListener('DOMContentLoaded', () => {
  adjustNavButtons();
  const path = window.location.pathname.split('/').pop();
  if (path === '' || path === 'index.html') loadPolesPage();
  else if (path === 'specialites.html') loadSpecialtiesPage();
  else if (path === 'Groupes.html') loadGroupsPage();
  else if (path === 'emploi.html') loadEmploiPage();
});
