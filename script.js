/* ===== DATA (replace with your Google Sheets or DB later) ===== */

const poles = [
    { id: "digital", name: "Pôle Digital" },
    { id: "gestion", name: "Pôle Gestion & Commerce" },
    { id: "paramedical", name: "Pôle Paramédical" }
];

const specialties = {
    digital: [
        "Développement Digital",
        "Infrastructure Digitale"
    ],
    gestion: [
        "Commerce",
        "Gestion des Entreprises"
    ],
    paramedical: [
        "Infirmier",
        "Assistant Médical"
    ]
};

/* ==============================================================
   ========== LOAD PÔLES ON INDEX.HTML ==========================
   ============================================================== */
if (document.getElementById("polesContainer")) {
    const container = document.getElementById("polesContainer");

    poles.forEach(p => {
        const div = document.createElement("div");
        div.className = "box";
        div.textContent = p.name;

        div.onclick = () => {
            localStorage.setItem("selectedPole", p.id);
            localStorage.setItem("selectedPoleName", p.name);
            window.location.href = "specialties.html";
        };

        container.appendChild(div);
    });
}

/* ==============================================================
   ========== LOAD SPECIALTIES ON SPECIALTIES.HTML ===============
   ============================================================== */
if (document.getElementById("specialtiesContainer")) {
    const selectedPole = localStorage.getItem("selectedPole");
    const selectedPoleName = localStorage.getItem("selectedPoleName");

    document.getElementById("poleTitle").textContent = selectedPoleName;

    const container = document.getElementById("specialtiesContainer");
    const dropdown = document.getElementById("yearsDropdown");

    specialties[selectedPole].forEach(spec => {
        const div = document.createElement("div");
        div.className = "box";
        div.textContent = spec;

        div.onclick = () => {
            localStorage.setItem("selectedSpecialty", spec);
            dropdown.classList.remove("hidden");
        };

        container.appendChild(div);
    });

    document.querySelectorAll(".year-btn").forEach(btn => {
        btn.onclick = () => {
            const year = btn.dataset.year;
            localStorage.setItem("selectedYear", year);

            window.location.href = "groups.html"; // you will give me this page later
        };
    });
}
