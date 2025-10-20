const sheetURL = "https://opensheet.elk.sh/1AfYExJcJEJVw6hOmPUUkBXBnbC16MM9vu453MpVLIpw/Feuille1";

fetch(sheetURL)
  .then(res => res.json())
  .then(data => {
    const page = window.location.pathname.split("/").pop();

    if (page === "" || page === "index.html") {
      // --- Page des pôles ---
      const poles = [...new Set(data.map(row => row["pôle"]))];
      const container = document.getElementById("polesContainer");

      container.innerHTML = poles
        .map(pole => `<button class="btn" onclick="goToSpecialites('${pole}')">${pole}</button>`)
        .join("");
    }

    if (page === "specialites.html") {
      // --- Page des spécialités ---
      const params = new URLSearchParams(window.location.search);
      const selectedPole = params.get("pole");

      const specialites = [...new Set(
        data.filter(r => r["pôle"] === selectedPole)
            .map(r => r["spécialité"])
      )];

      const container = document.getElementById("specialitesContainer");
      container.innerHTML = specialites.length
        ? specialites.map(spec => `<button class="btn" onclick="goToGroupes('${selectedPole}', '${spec}')">${spec}</button>`).join("")
        : `<p>Aucune spécialité trouvée pour ${selectedPole}</p>`;
    }

    if (page === "Groupes.html") {
      // --- Page des groupes ---
      const params = new URLSearchParams(window.location.search);
      const pole = params.get("pole");
      const spec = params.get("spec");

      const groupes = data.filter(r => r["pôle"] === pole && r["spécialité"] === spec);

      const container = document.getElementById("groupesContainer");
      container.innerHTML = groupes.length
        ? groupes.map(g => `
          <div class="card">
            <p><strong>Groupe:</strong> ${g["groupe"]}</p>
            <a href="${g["Drive link"]}" target="_blank">📄 Ouvrir le PDF</a>
            <p class="small">Dernière mise à jour: ${g["last update"]}</p>
          </div>
        `).join("")
        : `<p>Aucun groupe trouvé pour ${spec}</p>`;
    }
  })
  .catch(err => {
    console.error("Erreur de chargement :", err);
  });

function goToSpecialites(pole) {
  window.location.href = `specialites.html?pole=${encodeURIComponent(pole)}`;
}

function goToGroupes(pole, spec) {
  window.location.href = `Groupes.html?pole=${encodeURIComponent(pole)}&spec=${encodeURIComponent(spec)}`;
}
