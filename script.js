/*******************************************************
 * script.js
 * - Remplace sheetURL par ton lien CSV (publié depuis Google Sheets)
 * - Ce script cherche les en-têtes : 
 *   "Pôle", "spécialité", "année", "groupe", "drive link", "last update"
 * - Il extrait la liste unique des Pôles et affiche des cartes.
 *******************************************************/

const sheetURL = "https://docs.google.com/spreadsheets/d/1AfYExJcJEJVw6hOmPUUkBXBnbC16MM9vu453MpVLIpw/gviz/tq?tqx=out:csv&gid=0"; // <-- remplace ici par ton lien CSV

const container = document.getElementById("poles-container");

/* Parseur CSV simple mais robuste (gère guillemets et virgules internes) */
function parseCSV(text) {
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
    } else if (ch === ',' && !inQuotes) {
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
  return rows;
}

/* Normalisation (enlève accents, minuscules, trim) */
function normalizeHeader(s) {
  return s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
}

/* Recherche d'index pour les noms de colonnes français exacts demandés */
function findHeaderIndex(headers, expectedNames) {
  const normalized = headers.map(h => normalizeHeader(h || ''));
  for (const name of expectedNames) {
    const n = normalizeHeader(name);
    const idx = normalized.indexOf(n);
    if (idx !== -1) return idx;
  }
  return -1;
}

/* Charge puis affiche les pôles */
async function loadPoles() {
  try {
    const resp = await fetch(sheetURL);
    if (!resp.ok) throw new Error('Impossible de charger la feuille (vérifie le lien CSV publié).');
    const txt = await resp.text();
    const rows = parseCSV(txt);
    if (!rows || rows.length === 0) throw new Error('Feuille vide ou format CSV invalide.');

    const headers = rows[0].map(h => (h || '').trim());
    // Ici on utilise strictement les noms fournis en version française
    const poleIdx = findHeaderIndex(headers, ['Pôle', 'Pole', 'pôle', 'pole']);
    const specialiteIdx = findHeaderIndex(headers, ['spécialité', 'specialite', 'Spécialité', 'Specialite']);
    const anneeIdx = findHeaderIndex(headers, ['année', 'annee', 'Année', 'Annee']);
    const groupeIdx = findHeaderIndex(headers, ['groupe', 'Groupe']);
    const driveLinkIdx = findHeaderIndex(headers, ['drive link', 'drive_link', 'lien drive', 'lien_drive']);
    const lastUpdateIdx = findHeaderIndex(headers, ['last update', 'last_update', 'derniere mise a jour', 'derniere_mise_a_jour']);

    if (poleIdx === -1) throw new Error('La colonne "Pôle" est introuvable. Vérifie l\'en-tête (doit s\'appeler exactement "Pôle").');

    // Extraire pôles uniques (conserver order d'apparition)
    const polesMap = new Map(); // pole -> {count, sampleRow}
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const poleRaw = (r[poleIdx] || '').trim();
      if (!poleRaw) continue;
      if (!polesMap.has(poleRaw)) {
        polesMap.set(poleRaw, { index: i, row: r });
      }
    }

    if (polesMap.size === 0) {
      container.innerHTML = '<p>Aucun pôle trouvé dans la feuille.</p>';
      return;
    }

    // Construire cartes
    container.innerHTML = '';
    let i = 0;
    for (const [poleName, meta] of polesMap.entries()) {
      const card = document.createElement('button');
      card.className = 'card';
      card.type = 'button';
      card.setAttribute('aria-label', `Ouvrir ${poleName}`);
      card.innerHTML = `<span>${poleName}</span>`;
      card.onclick = () => {
        // On redirige vers une page dédiée au pôle (à créer ensuite) avec le nom encodé
        const encoded = encodeURIComponent(poleName);
        window.location.href = `pole.html?pole=${encoded}`;
      };
      container.appendChild(card);
      setTimeout(() => card.classList.add('visible'), 80 * i);
      i++;
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color:#b00">Erreur : ${err.message}</p>`;
  }
}

/* Barre de progression du scroll */
window.addEventListener('scroll', () => {
  const top = document.documentElement.scrollTop || document.body.scrollTop;
  const height = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
  const pct = height > 0 ? (top / height) * 100 : 0;
  document.getElementById('scroll-indicator').style.width = Math.max(0, Math.min(100, pct)) + '%';
});

loadPoles();
