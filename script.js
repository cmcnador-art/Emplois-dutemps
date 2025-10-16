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
// -------------- specialties list --------
function loadSpecialtiesPage() {
  const params = new URLSearchParams(window.location.search);
  const pole = params.get('p');

  const poleNameEl = document.getElementById('poleName');
  const container = document.getElementById('specialtiesContainer');

  const specialtiesData = {
    digital: {
      title: 'Pôle Digital',
      specialties: [
        { id: 'dev', name: 'Développement Digital' },
        { id: 'infographie', name: 'Infographie' },
        { id: 'reseaux', name: 'Réseaux Informatiques' }
      ]
    },
    gestion: {
      title: 'Pôle Gestion & Commerce',
      specialties: [
        { id: 'compta', name: 'Comptabilité' },
        { id: 'commerce', name: 'Commerce' },
        { id: 'gestion', name: 'Gestion des Entreprises' }
      ]
    },
    industrie: {
      title: 'Pôle Industrie',
      specialties: [
        { id: 'elec', name: 'Électricité Industrielle' },
        { id: 'meca', name: 'Mécanique Industrielle' }
      ]
    },
    agri: {
      title: 'Pôle Agri-Agroalimentaire',
      specialties: [
        { id: 'agriculture', name: 'Agriculture' },
        { id: 'agro', name: 'Agroalimentaire' }
      ]
    },
    btp: {
      title: 'Pôle Bâtiment & T.P.',
      specialties: [
        { id: 'bat', name: 'Bâtiment' },
        { id: 'tp', name: 'Travaux Publics' }
      ]
    },
    tourisme: {
      title: 'Pôle Tourisme & Hôtellerie',
      specialties: [
        { id: 'hotel', name: 'Hôtellerie' },
        { id: 'tourisme', name: 'Tourisme' }
      ]
    },
    textile: {
      title: 'Pôle Textile & Mode',
      specialties: [
        { id: 'mode', name: 'Stylisme & Modélisme' },
        { id: 'textile', name: 'Production Textile' }
      ]
    },
    sante: {
      title: 'Pôle Santé & Services Sociaux',
      specialties: [
        { id: 'infirmier', name: 'Infirmier Polyvalent' },
        { id: 'social', name: 'Service Social' }
      ]
    }
  };

  const poleData = specialtiesData[pole];

  if (!poleData) {
    poleNameEl.textContent = 'Pôle inconnu';
    container.innerHTML = '<p>Aucune spécialité trouvée.</p>';
    return;
  }

  poleNameEl.textContent = poleData.title;
  container.innerHTML = '';

  poleData.specialties.forEach(spec => {
    const div = document.createElement('div');
    div.className = 'specialty';
    div.innerHTML = `
      <button class="card" onclick="toggleYears('${spec.id}'); selectSpecialty('${spec.id}')">${spec.name}</button>
      <div id="${spec.id}" class="years">
        <button class="year-btn" onclick="selectYear(1); goNext()">1ère Année</button>
        <button class="year-btn" onclick="selectYear(2); goNext()">2ème Année</button>
      </div>
    `;
    container.appendChild(div);
  });
}
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
  } else if (window.location.pathname.includes('Groupes.html')) {
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
