const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = require('./config/database');
const trajetsRoutes = require('./routes/trajets');
const reservationsRoutes = require('./routes/reservations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware anti-cache pour les pages sensibles
app.use((req, res, next) => {
  if (req.path === '/admin.html' || req.path === '/login.html') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Route d'authentification
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const token = 'token_voyage_' + Date.now();
    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Routes API
app.use('/api/trajets', trajetsRoutes);
app.use('/api/reservations', reservationsRoutes);

// Page d'accueil
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});