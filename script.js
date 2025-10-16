// Smooth navigation
function goTo(url) {
  window.location.href = url;
}

function goBack() {
  window.history.back();
}

// ------------------ SELECTION STORAGE ------------------
function saveSelection(key, value) { sessionStorage.setItem(key, value); }
function getSelection(key) { return sessionStorage.getItem(key); }

function selectPole(poleId) { saveSelection('pole', poleId); }
function selectSpecialty(specId) { saveSelection('specialty', specId); }
function selectYear(year) { saveSelection('year', year); }
function selectGroup(groupId) { saveSelection('group', groupId); }

// ------------------ SMART NAV BUTTONS ------------------
function goNext() {
  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage.includes('index.html')) {
    const pole = getSelection('pole');
    if (pole) goTo(`specialites.html?p=${pole}`);
  } else if (currentPage.includes('specialites.html')) {
    const spec = getSelection('specialty');
    const year = getSelection('year');
    if (spec && year) goTo(`groupes.html?s=${spec}&y=${year}`);
  } else if (currentPage.includes('groupes.html')) {
    const group = getSelection('group');
    if (group) goTo(`emploi.html?g=${group}`);
  }
}

// ------------------ ADJUST NAV BUTTONS ------------------
function adjustNavButtons() {
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  const container = document.querySelector('.nav-buttons');
  const currentPage = window.location.pathname.split('/').pop();
  
  let visibleButtons = 2;

  if (currentPage.includes('index.html')) {
    prev.style.display = 'none';
    visibleButtons = 1;
  } else if (currentPage.includes('groupes.html')) {
    const group = getSelection('group');
    if (!group) next.style.display = 'none';
    visibleButtons = group ? 2 : 1;
  }

  if (visibleButtons === 1) container.classList.add('one-button');
  else container.classList.remove('one-button');
}

// ------------------ SPECIALTIES DYNAMIC LOADING ------------------
document.addEventListener('DOMContentLoaded', () => {
  adjustNavButtons();

  if (window.location.pathname.includes('specialites.html')) {
    loadSpecialtiesPage();
  } else if (window.location.pathname.includes('groupes.html')) {
    loadGroupsPage();
  }
});

// ------------------ SPECIALTIES + YEARS ------------------
function toggleYears(id) {
  const allYears = document.querySelectorAll('.years');
  allYears.forEach(section => {
    if (section.id !== id) section.style.display = 'none';
  });
  const selected = document.getElementById(id);
  selected.style.display = (selected.style.display === 'flex') ? 'none' : 'flex';
}

// ------------------ GROUPS STATIC PROTOTYPE ------------------
function loadGroupsPage() {
  const params = new URLSearchParams(window.location.search);
  const specialty = params.get('s');
  const year = params.get('y');

  const specialtyNameEl = document.getElementById('specialtyName');
  const yearNameEl = document.getElementById('yearName');
  const container = document.getElementById('groupsContainer');

  specialtyNameEl.textContent = specialty ? specialty.toUpperCase() : 'Spécialité';
  yearNameEl.textContent = year ? (year === '1' ? '1ère Année' : '2ème Année') : 'Année';

  const groupesData = {
    dev: {1: ['101','102','103'], 2: ['201','203','DEVOFS201']},
    reseaux: {1:['101','102'], 2:['201']}
    // add more specialties here
  };

  const groups = groupesData[specialty] ? groupesData[specialty][year] || [] : [];

  container.innerHTML = '';
  groups.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.textContent = `Groupe ${g}`;
    btn.onclick = () => { selectGroup(g); goNext(); };
    container.appendChild(btn);
  });
}
