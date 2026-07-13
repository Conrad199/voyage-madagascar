const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function initAdmin() {
    const email = 'admin@voyage.mg';
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);

    try {
        await pool.execute(
            'INSERT INTO admins (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
            [email, hash]
        );
        console.log('✅ Admin inséré avec succès');
    } catch (err) {
        console.error('❌ Erreur insertion admin :', err);
    }
    process.exit();
}

initAdmin();