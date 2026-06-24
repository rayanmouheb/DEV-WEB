import 'dotenv/config'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env

const pool = mysql.createPool({
  host: DB_HOST ?? 'localhost',
  port: Number(DB_PORT ?? 3306),
  user: DB_USER ?? 'root',
  password: DB_PASSWORD ?? '',
  database: DB_NAME ?? 'cybertwin',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
})

export async function initDB() {
  // Créer la base si elle n'existe pas
  const root = await mysql.createConnection({
    host: DB_HOST ?? 'localhost',
    port: Number(DB_PORT ?? 3306),
    user: DB_USER ?? 'root',
    password: DB_PASSWORD ?? '',
  })
  await root.execute(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME ?? 'cybertwin'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )
  await root.end()

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS company (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sector VARCHAR(255) NOT NULL,
      employee_count INT DEFAULT 0,
      server_count INT DEFAULT 0,
      client_count INT DEFAULT 0,
      exposed_services TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS assets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      is_internet_exposed TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS vulnerabilities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      asset_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      criticality ENUM('faible','moyen','eleve') NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS risk_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      score INT NOT NULL,
      level VARCHAR(50) NOT NULL,
      details JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // Seed demo data si tables vides
  const [[{ n: companyCount }]] = await pool.execute('SELECT COUNT(*) as n FROM company')
  if (companyCount === 0) {
    const [{ insertId: cid }] = await pool.execute(
      'INSERT INTO company (name, sector, employee_count, server_count, client_count, exposed_services) VALUES (?,?,?,?,?,?)',
      ['TechNova SAS', 'Informatique & Services', 45, 6, 38, JSON.stringify(['HTTP', 'HTTPS', 'SMTP'])]
    )

    const assetDefs = [
      { name: 'Serveur Web principal', type: 'serveur_web', exposed: 1 },
      { name: 'Base de données clients', type: 'base_de_donnees', exposed: 0 },
      { name: 'Pare-feu périmètre', type: 'pare_feu', exposed: 1 },
      { name: 'ERP interne', type: 'application_metier', exposed: 0 },
      { name: 'Routeur réseau', type: 'routeur', exposed: 1 },
      { name: 'Poste RH', type: 'poste_utilisateur', exposed: 0 },
    ]
    const assetIds = []
    for (const a of assetDefs) {
      const [{ insertId }] = await pool.execute(
        'INSERT INTO assets (company_id, name, type, is_internet_exposed) VALUES (?,?,?,?)',
        [cid, a.name, a.type, a.exposed]
      )
      assetIds.push(insertId)
    }

    const vulnDefs = [
      { idx: 0, name: 'Port 22 exposé publiquement', desc: 'Le port SSH est accessible depuis Internet sans restriction IP.', crit: 'eleve' },
      { idx: 0, name: 'Certificat SSL expiré', desc: 'Le certificat TLS du serveur a expiré depuis plus de 30 jours.', crit: 'moyen' },
      { idx: 1, name: 'Absence de sauvegarde', desc: "Aucune sauvegarde automatique des données clients n'est configurée.", crit: 'eleve' },
      { idx: 1, name: 'Mot de passe par défaut', desc: "Le compte administrateur utilise le mot de passe d'usine.", crit: 'eleve' },
      { idx: 2, name: 'Firmware obsolète', desc: "Le firmware du pare-feu n'a pas été mis à jour depuis 18 mois.", crit: 'moyen' },
      { idx: 3, name: 'Logiciel non mis à jour', desc: "L'ERP tourne sur une version obsolète avec des failles connues.", crit: 'faible' },
      { idx: 4, name: 'Configuration par défaut', desc: "Les règles de routage par défaut n'ont pas été durcies.", crit: 'moyen' },
      { idx: 5, name: "Absence d'antivirus", desc: 'Aucun antivirus installé sur ce poste utilisateur.', crit: 'faible' },
    ]
    for (const v of vulnDefs) {
      await pool.execute(
        'INSERT INTO vulnerabilities (asset_id, name, description, criticality) VALUES (?,?,?,?)',
        [assetIds[v.idx], v.name, v.desc, v.crit]
      )
    }
  }

  const [[{ n: userCount }]] = await pool.execute('SELECT COUNT(*) as n FROM users')
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10)
    await pool.execute('INSERT INTO users (username, password) VALUES (?,?)', ['admin', hash])
  }

  console.log('Base de données MySQL initialisée')
}

export default pool
