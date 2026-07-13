const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const pool = mysql.createPool({
    port: process.env.DB_PORT || 11563,
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

// Créer les tables si elles n'existent pas
async function createTables() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS trajets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            depart VARCHAR(100) NOT NULL,
            destination VARCHAR(100) NOT NULL,
            date DATE NOT NULL,
            heure TIME NOT NULL,
            prix DECIMAL(10,2) NOT NULL,
            places_total INT NOT NULL DEFAULT 22
        )`,
        `CREATE TABLE IF NOT EXISTS reservations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trajet_id INT NOT NULL,
            client_nom VARCHAR(100) NOT NULL,
            client_email VARCHAR(150) NOT NULL,
            date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            statut VARCHAR(20) DEFAULT 'confirmée',
            FOREIGN KEY (trajet_id) REFERENCES trajets(id)
        )`,
        `CREATE TABLE IF NOT EXISTS reservations_sieges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reservation_id INT NOT NULL,
            siege_numero INT NOT NULL,
            FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL
        )`
    ];

    const connection = await pool.getConnection();
    try {
        for (const query of queries) {
            await connection.execute(query);
        }
        console.log('✅ Tables vérifiées/créées avec succès');
    } catch (err) {
        console.error('❌ Erreur lors de la création des tables :', err);
    } finally {
        connection.release();
    }
}

// Insérer l'administrateur par défaut s'il n'existe pas
async function initAdmin() {
    try {
        const [rows] = await pool.execute('SELECT id FROM admins WHERE email = ?', ['admin@voyage.mg']);
        if (rows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash('admin123', 10);
            await pool.execute('INSERT INTO admins (email, password_hash) VALUES (?, ?)', ['admin@voyage.mg', hash]);
            console.log('✅ Admin par défaut créé (admin@voyage.mg / admin123)');
        } else {
            console.log('ℹ️ Admin déjà existant');
        }
    } catch (err) {
        console.error('❌ Erreur initAdmin :', err.message);
    }
}

// Test de connexion et initialisation au démarrage
pool.getConnection()
    .then(async (conn) => {
        console.log('✅ Connecté à MySQL Aiven');
        conn.release();
        await createTables();
        await initAdmin();
    })
    .catch(err => console.error('❌ Erreur DB :', err.message));

module.exports = pool;