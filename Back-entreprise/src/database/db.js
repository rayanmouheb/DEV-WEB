import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import bcrypt from 'bcryptjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '..', '..', 'cybertwin.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS company (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  sector           TEXT NOT NULL,
  employee_count   INTEGER NOT NULL DEFAULT 0,
  server_count     INTEGER NOT NULL DEFAULT 0,
  client_count     INTEGER NOT NULL DEFAULT 0,
  exposed_services TEXT NOT NULL DEFAULT '[]',
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assets (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id          INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL CHECK(type IN (
                        'serveur_web','base_de_donnees','poste_utilisateur',
                        'routeur','pare_feu','application_metier'
                      )),
  is_internet_exposed INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vulnerabilities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id    INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  criticality TEXT NOT NULL CHECK(criticality IN ('faible','moyen','eleve')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS risk_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL,
  level      TEXT NOT NULL,
  details    TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`)

const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get()
if (userCount.n === 0) {
  const hash = bcrypt.hashSync('admin123', 10)
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hash)
}

const companyCount = db.prepare('SELECT COUNT(*) as n FROM company').get()
if (companyCount.n === 0) {
  const { lastInsertRowid: cId } = db.prepare(
    'INSERT INTO company (name, sector, employee_count, server_count, client_count, exposed_services) VALUES (?,?,?,?,?,?)'
  ).run('TechNova SAS', 'Informatique & Services', 45, 6, 38, JSON.stringify(['HTTP', 'HTTPS', 'SMTP']))

  const ia = db.prepare('INSERT INTO assets (company_id, name, type, is_internet_exposed) VALUES (?,?,?,?)')
  const a1 = ia.run(cId, 'Serveur Web principal', 'serveur_web', 1)
  const a2 = ia.run(cId, 'Base de données clients', 'base_de_donnees', 0)
  const a3 = ia.run(cId, 'Pare-feu périmètre', 'pare_feu', 1)
  const a4 = ia.run(cId, 'ERP interne', 'application_metier', 0)
  const a5 = ia.run(cId, 'Routeur réseau', 'routeur', 1)
  const a6 = ia.run(cId, 'Poste RH', 'poste_utilisateur', 0)

  const iv = db.prepare('INSERT INTO vulnerabilities (asset_id, name, description, criticality) VALUES (?,?,?,?)')
  iv.run(a1.lastInsertRowid, 'Port 22 exposé publiquement', 'Le port SSH est accessible depuis Internet sans restriction IP.', 'eleve')
  iv.run(a1.lastInsertRowid, 'Certificat SSL expiré', 'Le certificat TLS du serveur a expiré depuis plus de 30 jours.', 'moyen')
  iv.run(a2.lastInsertRowid, 'Absence de sauvegarde', "Aucune sauvegarde automatique des données clients n'est configurée.", 'eleve')
  iv.run(a2.lastInsertRowid, 'Mot de passe par défaut', "Le compte administrateur utilise le mot de passe d'usine.", 'eleve')
  iv.run(a3.lastInsertRowid, 'Firmware obsolète', "Le firmware du pare-feu n'a pas été mis à jour depuis 18 mois.", 'moyen')
  iv.run(a4.lastInsertRowid, 'Logiciel non mis à jour', "L'ERP tourne sur une version obsolète avec des failles connues.", 'faible')
  iv.run(a5.lastInsertRowid, 'Configuration par défaut', "Les règles de routage par défaut n'ont pas été durcies.", 'moyen')
  iv.run(a6.lastInsertRowid, "Absence d'antivirus", 'Aucun antivirus installé sur ce poste utilisateur.', 'faible')
}

export default db
