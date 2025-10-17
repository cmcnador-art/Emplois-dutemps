// ---------- CONFIG ----------
const SHEET_URL = 'https://opensheet.elk.sh/1AfYExJcJEJVw6hOmPUUkBXBnbC16MM9vu453MpVLIpw/Emplois_du_temps';

// ---------- NAVIGATION ----------
function goTo(url) { window.location.href = url; }
function goBack() { window.history.back(); }
function saveSelection(k, v) { sessionStorage.setItem(k, v); }
function getSelection(k) { return sessionStorage.getItem(k); }

// ---------- LOAD SHEET ----------
async function fetchData() {
  const res = await fetch(SHEET_URL);
  return await res.json();
}

// ---------- POLES PAGE ----------
async function loadPolesPage() {
  const container = document.getElementById('polesContainer');
  container.innerHTML = '<p>Chargement...</p>';

  const data = await fetchData();

  // Get unique poles
  const poles = [...new Set(data.map(r => r['pôle']).filter(Boolean))];

  container.innerHTML = '';
  poles.forEach(pole => {
    const div = document.createElement('div');
    div.className = 'card';
    div.textContent = pole;
    div.onclick = () => { saveSelection('pole', pole); goTo(`specialites.html?p=${encodeURIComponent(pole)}`); };
    container.appendChild(div);
  });
}

// ---------- SPECIALTIES PAGE ----------
async function loadSpecialtiesPage() {
  const params = new URLSearchParams(window.location.search);
  const pole = params.get('p');
  const container = document.getElementById('specialtiesContainer');
  const title = document.getElementById('poleName');

  title.textContent = pole;
  container.innerHTML = '<p>Chargement...</p>';

  const data = await fetchData();

  // Filter specialties of this pole
  const specialties = [...new Set(
    data.filter(r => r['pôle'] === pole).map(r => r['spécialité']).filter(Boolean)
  )];

  container.innerHTML = '';
  specialties.forEach(spec => {
    const div = document.createElement('div');
    div.className = 'specialty';
    div.innerHTML = `
      <button class="card" onclick="toggleYears('${spec}'); saveSelection('specialty','${spec}')">${spec}</button>
      <div id="${spec}" class="years">
        <button class="year-btn" onclick="saveSelection('year',1); goNext()">1ère Année</button>
        <button class="year-btn" onclick="saveSelection('year',2); goNext()">2ème Année</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// ---------- GROUPS PAGE ----------
async function loadGroupsPage() {
  const params = new URLSearchParams(window.location.search);
  const specialty = params.get('s');
  const year = params.get('y');
  const container = document.getElementById('groupsContainer');
  const specEl = document.getElementById('specialtyName');
  const yearEl = document.getElementById('yearName');

  specEl.textContent = specialty;
  yearEl.textContent = year == 1 ? '1ère Année' : '2ème Année';
  container.innerHTML = '<p>Chargement...</p>';

  const data = await fetchData();

  // Filter groups for this specialty and year
  const groups = [...new Set(
    data.filter(r =>
      r['spécialité'] === specialty && r['année']?.toString() === year
    ).map(r => r['groupe']).filter(Boolean)
  )];

  container.innerHTML = '';
  groups.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.textContent = `Groupe ${g}`;
    btn.onclick = () => { saveSelection('group', g); goNext(); };
    container.appendChild(btn);
  });
}

// ---------- EMPLOI PAGE ----------
async function loadEmploiPage() {
  const params = new URLSearchParams(window.location.search);
  const group = params.get('g');
  const specialty = getSelection('specialty');
  const year = getSelection('year');
  const container = document.getElementById('emploiContainer');
  const titleEl = document.getElementById('emploiTitle');

  titleEl.textContent = `Emploi du Temps – Groupe ${group}`;
  container.innerHTML = '<p>Chargement...</p>';

  const data = await fetchData();
  const row = data.find(r =>
    r['groupe']?.toString().toLowerCase() === group.toLowerCase() &&
    r['spécialité']?.toLowerCase() === specialty.toLowerCase() &&
    r['année']?.toString() === year
  );

  if (!row) {
    container.innerHTML = '<p>Aucun emploi du temps trouvé.</p>';
    return;
  }

  container.innerHTML = `
    <p><strong>Pôle:</strong> ${row["pôle"]}</p>
    <p><strong>Spécialité:</strong> ${row["spécialité"]}</p>
    <p><strong>Année:</strong> ${row["année"]}</p>
    <p><strong>Dernière mise à jour:</strong> ${row["last update"] || 'Non disponible'}</p>
    <br>
    <a href="${row["drive link"]}" target="_blank" class="year-btn">📄 Voir le PDF</a>
  `;
}

// ---------- LOGIC ----------
function toggleYears(id) {
  document.querySelectorAll('.years').forEach(y => y.style.display = 'none');
  const el = document.getElementById(id);
  el.style.display = (el.style.display === 'flex') ? 'none' : 'flex';
}

function goNext() {
  const current = window.location.pathname.split('/').pop();
  if (current.includes('index.html')) {
    const pole = getSelection('pole');
    if (pole) goTo(`specialites.html?p=${pole}`);
  } else if (current.includes('specialites.html')) {
    const spec = getSelection('specialty');
    const year = getSelection('year');
    if (spec && year) goTo(`Groupes.html?s=${encodeURIComponent(spec)}&y=${year}`);
  } else if (current.includes('Groupes.html')) {
    const group = getSelection('group');
    if (group) goTo(`emploi.html?g=${group}`);
  }
}

function adjustNavButtons() {
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  const container = document.querySelector('.nav-buttons');
  const current = window.location.pathname.split('/').pop();
  let one = false;

  if (current.includes('index.html')) {
    prev.style.display = 'none'; one = true;
  } else if (current.includes('Groupes.html')) {
    const g = getSelection('group');
    if (!g) next.style.display = 'none'; one = true;
  }
  if (one) container.classList.add('one-button');
  else container.classList.remove('one-button');
}

// ---------- PAGE DETECTION ----------
document.addEventListener('DOMContentLoaded', () => {
  adjustNavButtons();

  if (window.location.pathname.includes('index.html')) loadPolesPage();
  else if (window.location.pathname.includes('specialites.html')) loadSpecialtiesPage();
  else if (window.location.pathname.includes('Groupes.html')) loadGroupsPage();
  else if (window.location.pathname.includes('emploi.html')) loadEmploiPage();
});
