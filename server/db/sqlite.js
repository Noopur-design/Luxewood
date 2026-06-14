import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')
fs.mkdirSync(dir, { recursive: true })

const db = new Database(path.join(dir, 'luxewood.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL DEFAULT '',
    phone      TEXT NOT NULL DEFAULT '',
    city       TEXT NOT NULL,
    room       TEXT,
    style      TEXT,
    message    TEXT,
    ip         TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

/* Migration: add `email` to pre-existing quotes tables */
const cols = db.prepare(`PRAGMA table_info(quotes)`).all().map(c => c.name)
if (!cols.includes('email')) {
  db.exec(`ALTER TABLE quotes ADD COLUMN email TEXT NOT NULL DEFAULT ''`)
}

/* All access goes through prepared statements — never string-built SQL,
   which makes SQL injection structurally impossible. */
const stmts = {
  insertQuote: db.prepare(`
    INSERT INTO quotes (name, email, phone, city, room, style, message, ip)
    VALUES (@name, @email, @phone, @city, @room, @style, @message, @ip)
  `),
  listQuotes: db.prepare(`SELECT * FROM quotes ORDER BY id DESC LIMIT @limit`),
}

export function insertQuote (q) {
  return stmts.insertQuote.run(q).lastInsertRowid
}

export function listQuotes (limit = 200) {
  return stmts.listQuotes.all({ limit })
}
