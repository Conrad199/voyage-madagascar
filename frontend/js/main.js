const API_BASE = 'http://localhost:3000/api'; // Ou '/api' si vous servez tout via le backend

let trajetActuel = null;
let siegesSelectionnes = [];

// Recherche des trajets
document.getElementById('formRecherche').addEventListener('submit', async (e) => {
  e.preventDefault();
  const depart = document.getElementById('depart').value;
  const destination = document.getElementById('destination').value;
  const date = document.getElementById('date').value;

  try {
    const response = await fetch(`${API_BASE}/trajets?depart=${depart}&destination=${destination}&date=${date}`);
    const trajets = await response.json();
    afficherTrajets(trajets);
  } catch (error) {
    alert('Erreur de connexion au serveur');
  }
});

function afficherTrajets(trajets) {
  const container = document.getElementById('resultatsTrajets');
  container.innerHTML = '';
  if (trajets.length === 0) {
    container.innerHTML = '<p class="text-center">Aucun trajet trouvé.</p>';
    return;
  }
  trajets.forEach(t => {
    container.innerHTML += `
      <div class="col-md-4 mb-3">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${t.depart} → ${t.destination}</h5>
            <p class="card-text">
              <i class="bi bi-calendar"></i> ${new Date(t.date).toLocaleDateString('fr-FR')}<br>
              <i class="bi bi-clock"></i> ${t.heure}
            </p>
            <p class="fw-bold text-primary">${t.prix} Ar</p>
            <p class="text-muted">${t.places_total} places disponibles</p>
            <button class="btn btn-primary w-100" onclick="ouvrirReservation(${t.id})">Réserver</button>
          </div>
        </div>
      </div>`;
  });
}

async function ouvrirReservation(trajetId) {
  trajetActuel = trajetId;
  siegesSelectionnes = [];

  // Récupérer les sièges occupés
  const response = await fetch(`${API_BASE}/trajets/${trajetId}/sieges`);
  const siegesOccupes = await response.json();

  // Générer le plan de 22 sièges (par ex. 5 rangées de 4 + 2)
  const planDiv = document.getElementById('planSieges');
  planDiv.innerHTML = '<h6 class="mb-3">Plan des sièges (22 places)</h6>';
  for (let i = 1; i <= 22; i++) {
    const btn = document.createElement('span');
    btn.className = 'siege';
    btn.textContent = i;
    if (siegesOccupes.includes(i)) {
      btn.classList.add('occupe');
      btn.onclick = null; // impossible de cliquer sur un siège déjà réservé
    } else {
      btn.classList.add('disponible');
      btn.addEventListener('click', () => toggleSiege(i, btn));
    }
    planDiv.appendChild(btn);
    // Passage à la ligne toutes les 5 sièges pour un joli rendu
    if (i % 5 === 0) planDiv.appendChild(document.createElement('br'));
  }

  // Réinitialiser le formulaire
  document.getElementById('trajetId').value = trajetId;
  document.getElementById('clientNom').value = '';
  document.getElementById('clientEmail').value = '';
  document.getElementById('siegesTexte').textContent = 'Aucun';

  // Afficher la modale
  new bootstrap.Modal(document.getElementById('reservationModal')).show();
}

function toggleSiege(num, element) {
  const index = siegesSelectionnes.indexOf(num);
  if (index > -1) {
    siegesSelectionnes.splice(index, 1);
    element.classList.remove('selectionne');
  } else {
    siegesSelectionnes.push(num);
    element.classList.add('selectionne');
  }
  document.getElementById('siegesTexte').textContent =
    siegesSelectionnes.length ? siegesSelectionnes.join(', ') : 'Aucun';
}

// Soumission de la réservation
document.getElementById('formReservation').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (siegesSelectionnes.length === 0) {
    alert('Veuillez sélectionner au moins un siège.');
    return;
  }

  const clientNom = document.getElementById('clientNom').value;
  const clientEmail = document.getElementById('clientEmail').value;
  const trajetId = document.getElementById('trajetId').value;

  try {
    const response = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trajet_id: parseInt(trajetId),
        sieges: siegesSelectionnes,
        client_nom: clientNom,
        client_email: clientEmail
      })
    });

    if (!response.ok) {
      const err = await response.json();
      alert(err.erreur || 'Erreur lors de la réservation');
      return;
    }

    alert('Réservation confirmée !');
    bootstrap.Modal.getInstance(document.getElementById('reservationModal')).hide();
  } catch (error) {
    alert('Erreur réseau');
  }
});

// Historique des réservations
document.getElementById('chargerHistorique').addEventListener('click', async () => {
  const email = document.getElementById('emailHistorique').value;
  if (!email) return alert('Veuillez entrer votre email');

  const response = await fetch(`${API_BASE}/reservations/historique/${email}`);
  const reservations = await response.json();

  const contenu = document.getElementById('contenuHistorique');
  if (reservations.length === 0) {
    contenu.innerHTML = '<p>Aucune réservation trouvée.</p>';
    return;
  }

  contenu.innerHTML = reservations.map(r => `
    <div class="card mb-2 shadow-sm">
      <div class="card-body">
        <h6>${r.depart} → ${r.destination}</h6>
        <p class="mb-1">Le ${new Date(r.date).toLocaleDateString('fr-FR')} à ${r.heure}</p>
        <p class="mb-1">Sièges : ${r.sieges.join(', ')}</p>
        <span class="badge ${r.statut === 'confirmée' ? 'bg-success' : 'bg-danger'}">${r.statut}</span>
      </div>
    </div>
  `).join('');
});