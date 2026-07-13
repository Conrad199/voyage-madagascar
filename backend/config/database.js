const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const db = mysql.createPool({
    port: process.env.DB_PORT || 21699,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'defaultdb',
    ssl: {
        ca: fs.readFileSync('./ca.pem')
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test de connexion (pratique mais pas obligatoire en production)
db.getConnection()
    .then(conn => {
        console.log('✅ Connecté à MySQL Aiven');
        conn.release();
    })
    .catch(err => {
    console.error('❌ Erreur DB complète :');
    console.error(err);          // Affiche l'objet complet
    if (err.code) console.error('Code erreur :', err.code);
    if (err.sqlMessage) console.error('SQL Message :', err.sqlMessage);
});

module.exports = db;