const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Créer une réservation (client)
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { trajet_id, sieges, client_nom, client_email } = req.body;

    if (!trajet_id || !sieges || !client_nom || !client_email) {
      return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
    }

    await connection.beginTransaction();

    // Vérifier la disponibilité des sièges
    const [dejaPris] = await connection.execute(
      `SELECT rs.siege_numero 
       FROM reservations_sieges rs
       JOIN reservations r ON rs.reservation_id = r.id
       WHERE r.trajet_id = ? AND r.statut = 'confirmée' AND rs.siege_numero IN (?)`,
      [trajet_id, sieges]
    );
    if (dejaPris.length > 0) {
      await connection.rollback();
      return res.status(409).json({ 
        erreur: 'Certains sièges ne sont plus disponibles', 
        sieges_indisponibles: dejaPris.map(s => s.siege_numero) 
      });
    }

    // Créer la réservation
    const [result] = await connection.execute(
      'INSERT INTO reservations (trajet_id, client_nom, client_email, statut) VALUES (?, ?, ?, ?)',
      [trajet_id, client_nom, client_email, 'confirmée']
    );
    const reservationId = result.insertId;

    // Assigner les sièges
    for (const siege of sieges) {
      await connection.execute(
        'INSERT INTO reservations_sieges (reservation_id, siege_numero) VALUES (?, ?)',
        [reservationId, siege]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Réservation confirmée', id: reservationId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ erreur: 'Erreur serveur' });
  } finally {
    connection.release();
  }
});

// Historique client par email
router.get('/historique/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const [reservations] = await pool.execute(
      `SELECT r.id, r.trajet_id, r.date_reservation, r.statut,
              t.depart, t.destination, t.date, t.heure
       FROM reservations r
       JOIN trajets t ON r.trajet_id = t.id
       WHERE r.client_email = ?
       ORDER BY r.date_reservation DESC`,
      [email]
    );

    for (let reservation of reservations) {
      const [sieges] = await pool.execute(
        'SELECT siege_numero FROM reservations_sieges WHERE reservation_id = ?',
        [reservation.id]
      );
      reservation.sieges = sieges.map(s => s.siege_numero);
    }
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Admin : toutes les réservations
router.get('/admin', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.id, r.client_nom, r.client_email, r.date_reservation, r.statut,
              t.depart, t.destination, t.date, t.heure
       FROM reservations r
       JOIN trajets t ON r.trajet_id = t.id
       ORDER BY r.date_reservation DESC`
    );

    for (let reservation of rows) {
      const [sieges] = await pool.execute(
        'SELECT siege_numero FROM reservations_sieges WHERE reservation_id = ?',
        [reservation.id]
      );
      reservation.sieges = sieges.map(s => s.siege_numero);
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Annuler une réservation (changer le statut)
router.put('/:id/annuler', async (req, res) => {
  try {
    await pool.execute(
      "UPDATE reservations SET statut = 'annulée' WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: 'Réservation annulée' });
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Supprimer définitivement une réservation (admin)
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM reservations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Réservation supprimée' });
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;