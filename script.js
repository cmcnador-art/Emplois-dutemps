// Smooth navigation to another page
function goTo(url) {
  window.location.href = url;
}

// Go back one page
function goBack() {
  window.history.back();
}

// Fade-in animation for cards
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card');
  cards.forEach((c, i) => {
    c.style.opacity = 0;
    c.style.transform = 'translateY(16px)';
    setTimeout(() => {
      c.style.transition = 'all 450ms cubic-bezier(.2,.9,.2,1)';
      c.style.opacity = 1;
      c.style.transform = 'translateY(0)';
    }, i * 90);
  });

  // Load specialties only if we are on specialites.html
  if (window.location.pathname.includes('specialites.html')) {
    loadSpecialtiesPage();
  }
});

// Toggle years under specialties
function toggleYears(id) {
  const allYears = document.querySelectorAll('.years');
  allYears.forEach(section => {
    if (section.id !== id) section.style.display = 'none';
  });

  const selected = document.getElementById(id);
  if (selected.style.display === 'flex') {
    selected.style.display = 'none';
  } else {
    selected.style.display = 'flex';
  }
}

// ---------- DYNAMIC SPECIALTIES SYSTEM ----------
function loadSpecialtiesPage() {
  const params = new URLSearchParams(window.location.search);
  const pole = params.get('p');

  const poleNameEl = document.getElementById('poleName');
  const container = document.getElementById('specialtiesContainer');

  // Define specialties per pole
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

  // Set pole title
  poleNameEl.textContent = poleData.title;

  // Generate specialties dynamically
  poleData.specialties.forEach(spec => {
    const div = document.createElement('div');
    div.className = 'specialty';
    div.innerHTML = `
      <button class="card" onclick="toggleYears('${spec.id}')">${spec.name}</button>
      <div id="${spec.id}" class="years">
        <button class="year-btn" onclick="goTo('Groupes.html?s=${spec.id}&y=1')">1ère Année</button>
        <button class="year-btn" onclick="goTo('Groupes.html?s=${spec.id}&y=2')">2ème Année</button>
      </div>
    `;
    container.appendChild(div);
  });
}
