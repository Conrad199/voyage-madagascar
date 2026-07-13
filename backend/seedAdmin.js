const bcrypt = require('bcryptjs');
const pool = require('./config/database');

const email = 'admin@voyage.mg';
const password = 'admin123'; // mot de passe en clair

async function seedAdmin() {
  try {
    // Hachage du mot de passe (coût 10)
    const hash = await bcrypt.hash(password, 10);
    
    // Insertion dans la table admins (remplace si existe déjà)
    await pool.execute(
      'INSERT INTO admins (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
      [email, hash]
    );
    
    console.log('✅ Administrateur créé avec succès :', email);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur :', error);
    process.exit(1);
  }
}

seedAdmin();