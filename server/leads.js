/* View / export leads from the SQLite database.
     node server/leads.js          → print all leads as a table
     node server/leads.js --csv     → write server/data/leads.csv  */
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data')
const db = new Database(path.join(dir, 'luxewood.db'), { readonly: true })
const rows = db.prepare('SELECT id,name,phone,email,city,room,style,message,created_at FROM quotes ORDER BY id DESC').all()

if (process.argv.includes('--csv')) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const cols = ['id', 'name', 'phone', 'email', 'city', 'room', 'style', 'message', 'created_at']
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n')
  const out = path.join(dir, 'leads.csv')
  fs.writeFileSync(out, '﻿' + csv, 'utf8')   // BOM so Excel shows ₹ correctly
  console.log(`Exported ${rows.length} leads → ${out}`)
} else {
  console.log(`Total leads: ${rows.length}\n`)
  console.table(rows)
}
