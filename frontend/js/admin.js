const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  chargerTrajets();
  chargerReservations();
  chargerHistorique();
});

// ========== TRAJETS ==========
async function chargerTrajets() {
  const response = await fetch(`${API_BASE}/trajets/admin`);
  const trajets = await response.json();
  const tbody = document.getElementById('listeTrajets');
  tbody.innerHTML = trajets.map(t => `
    <tr>
      <td>${t.id}</td>
      <td>${t.depart}</td>
      <td>${t.destination}</td>
      <td>${new Date(t.date).toLocaleDateString('fr-FR')}</td>
      <td>${t.heure}</td>
      <td>${t.prix} Ar</td>
      <td>${t.places_total}</td>
      <td>
        <button class="btn btn-warning btn-sm me-1" onclick="modifierTrajet(${t.id}, '${t.depart}','${t.destination}','${t.date}','${t.heure}',${t.prix},${t.places_total})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="supprimerTrajet(${t.id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function ouvrirFormulaireTrajet() {
  document.getElementById('formTrajetContainer').style.display = 'block';
  document.getElementById('titreFormTrajet').textContent = 'Ajouter un trajet';
  document.getElementById('formTrajet').reset();
  document.getElementById('trajetId').value = '';
  document.getElementById('placesAdmin').value = 22;
}

function modifierTrajet(id, depart, dest, date, heure, prix, places) {
  document.getElementById('formTrajetContainer').style.display = 'block';
  document.getElementById('titreFormTrajet').textContent = 'Modifier le trajet';
  document.getElementById('trajetId').value = id;
  document.getElementById('departAdmin').value = depart;
  document.getElementById('destAdmin').value = dest;
  document.getElementById('dateAdmin').value = date;
  document.getElementById('heureAdmin').value = heure;
  document.getElementById('prixAdmin').value = prix;
  document.getElementById('placesAdmin').value = places;
}

function cacherFormulaire() {
  document.getElementById('formTrajetContainer').style.display = 'none';
}

document.getElementById('formTrajet').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('trajetId').value;
  const data = {
    depart: document.getElementById('departAdmin').value,
    destination: document.getElementById('destAdmin').value,
    date: document.getElementById('dateAdmin').value,
    heure: document.getElementById('heureAdmin').value,
    prix: document.getElementById('prixAdmin').value,
    places_total: document.getElementById('placesAdmin').value
  };

  const url = id ? `${API_BASE}/trajets/${id}` : `${API_BASE}/trajets`;
  const method = id ? 'PUT' : 'POST';

  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  cacherFormulaire();
  chargerTrajets();
});

async function supprimerTrajet(id) {
  if (confirm('Supprimer définitivement ce trajet ?')) {
    await fetch(`${API_BASE}/trajets/${id}`, { method: 'DELETE' });
    chargerTrajets();
  }
}

// ========== RÉSERVATIONS ==========
async function chargerReservations() {
  const response = await fetch(`${API_BASE}/reservations/admin`);
  const reservations = await response.json();
  const tbody = document.getElementById('listeReservations');
  tbody.innerHTML = reservations.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.client_nom}</td>
      <td>${r.client_email}</td>
      <td>${r.depart} → ${r.destination}<br><small>${new Date(r.date).toLocaleDateString('fr-FR')} ${r.heure}</small></td>
      <td>${r.sieges.join(', ')}</td>
      <td>${new Date(r.date_reservation).toLocaleString('fr-FR')}</td>
      <td><span class="badge ${r.statut === 'confirmée' ? 'bg-success' : 'bg-secondary'}">${r.statut}</span></td>
      <td class="no-print">
        <button class="btn btn-info btn-sm me-1" onclick="imprimerTicket(${r.id})"><i class="bi bi-ticket"></i> Ticket</button>
        <button class="btn btn-outline-danger btn-sm" onclick="supprimerReservation(${r.id})"><i class="bi bi-trash"></i> Supprimer</button>
      </td>
    </tr>
  `).join('');
}

async function supprimerReservation(id) {
  if (confirm('Supprimer définitivement cette réservation ?')) {
    const response = await fetch(`${API_BASE}/reservations/${id}`, { method: 'DELETE' });
    if (response.ok) {
      chargerReservations();
      chargerHistorique();
    } else {
      alert('Erreur lors de la suppression');
    }
  }
}

// ========== HISTORIQUE ==========
async function chargerHistorique() {
  const response = await fetch(`${API_BASE}/reservations/admin`);
  const reservations = await response.json();
  const tbody = document.getElementById('listeHistorique');
  tbody.innerHTML = reservations.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.client_nom}</td>
      <td>${r.client_email}</td>
      <td>${r.depart} → ${r.destination}<br><small>${new Date(r.date).toLocaleDateString('fr-FR')} ${r.heure}</small></td>
      <td>${r.sieges.join(', ')}</td>
      <td>${new Date(r.date_reservation).toLocaleString('fr-FR')}</td>
      <td><span class="badge ${r.statut === 'confirmée' ? 'bg-success' : 'bg-secondary'}">${r.statut}</span></td>
    </tr>
  `).join('');
}

function imprimerListe() {
  window.print();
}

// ========== IMPRESSION TICKET (corrigée) ==========
async function imprimerTicket(reservationId) {
  const response = await fetch(`${API_BASE}/reservations/admin`);
  const reservations = await response.json();
  const r = reservations.find(res => res.id === reservationId);
  if (!r) return alert('Réservation introuvable');

  const printWindow = window.open('', '_blank', 'width=450,height=600');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Ticket - Voyage Madagascar</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          padding: 20px;
          margin: 0;
          color: #000;
          background: #fff;
        }
        .ticket {
          max-width: 400px;
          margin: 0 auto;
          border: 2px dashed #000;
          border-radius: 10px;
          padding: 20px;
        }
        .ticket h2 {
          text-align: center;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }
        .ticket hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 15px 0;
        }
        .ticket p {
          margin: 8px 0;
          font-size: 0.95rem;
        }
        .ticket .footer {
          text-align: center;
          font-size: 0.8rem;
          margin-top: 15px;
          color: #555;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <h2>🎫 TICKET DE VOYAGE</h2>
        <hr>
        <p><strong>N° Réservation :</strong> ${r.id}</p>
        <p><strong>Passager :</strong> ${r.client_nom}</p>
        <p><strong>Email :</strong> ${r.client_email}</p>
        <p><strong>Trajet :</strong> ${r.depart} → ${r.destination}</p>
        <p><strong>Date :</strong> ${new Date(r.date).toLocaleDateString('fr-FR')} à ${r.heure}</p>
        <p><strong>Sièges :</strong> ${r.sieges.join(', ')}</p>
        <p><strong>Statut :</strong> ${r.statut}</p>
        <p><strong>Date de réservation :</strong> ${new Date(r.date_reservation).toLocaleString('fr-FR')}</p>
        <hr>
        <div class="footer">
          Merci de votre confiance !<br>
          Voyage Madagascar
        </div>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 500);
}