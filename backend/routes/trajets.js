const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// RECHERCHE PUBLIQUE (client) – retourne maintenant places_restantes
router.get('/', async (req, res) => {
  try {
    const { depart, destination, date } = req.query;
    let sql = `
      SELECT t.*,
             (t.places_total - COALESCE(rs.cnt, 0)) AS places_restantes
      FROM trajets t
      LEFT JOIN (
        SELECT r.trajet_id, COUNT(rs.id) AS cnt
        FROM reservations r
        JOIN reservations_sieges rs ON rs.reservation_id = r.id
        WHERE r.statut = 'confirmée'
        GROUP BY r.trajet_id
      ) rs ON rs.trajet_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (depart) {
      sql += ' AND t.depart LIKE ?';
      params.push(`%${depart}%`);
    }
    if (destination) {
      sql += ' AND t.destination LIKE ?';
      params.push(`%${destination}%`);
    }
    if (date) {
      sql += ' AND t.date = ?';
      params.push(date);
    }

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ADMIN : obtenir tous les trajets (sans places_restantes)
router.get('/admin', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM trajets ORDER BY date, heure');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ADMIN : ajouter un trajet
router.post('/', async (req, res) => {
  try {
    const { depart, destination, date, heure, prix, places_total } = req.body;
    if (!depart || !destination || !date || !heure || !prix) {
      return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
    }
    const [result] = await pool.execute(
      'INSERT INTO trajets (depart, destination, date, heure, prix, places_total) VALUES (?, ?, ?, ?, ?, ?)',
      [depart, destination, date, heure, prix, places_total || 22]
    );
    res.status(201).json({ message: 'Trajet créé', id: result.insertId });
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ADMIN : modifier un trajet
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { depart, destination, date, heure, prix, places_total } = req.body;
    await pool.execute(
      'UPDATE trajets SET depart=?, destination=?, date=?, heure=?, prix=?, places_total=? WHERE id=?',
      [depart, destination, date, heure, prix, places_total, id]
    );
    res.json({ message: 'Trajet mis à jour' });
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ADMIN : supprimer un trajet
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM trajets WHERE id=?', [req.params.id]);
    res.json({ message: 'Trajet supprimé' });
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// SIÈGES OCCUPÉS pour un trajet (plan de sièges)
router.get('/:id/sieges', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT rs.siege_numero 
       FROM reservations_sieges rs
       JOIN reservations r ON rs.reservation_id = r.id
       WHERE r.trajet_id = ? AND r.statut = 'confirmée'`,
      [req.params.id]
    );
    const siegesOccupes = rows.map(r => r.siege_numero);
    res.json(siegesOccupes);
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;