/* ── Lead storage helpers ─────────────────────────────────────────
   The Firebase Admin SDK was removed (it pulled in vulnerable transitive
   deps and is no longer needed — auth/OTP were dropped). SQLite is the
   source of truth; this module just provides a lightweight, append-only
   audit trail of submissions as a safety net.
──────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data')
const auditFile = path.join(dir, 'leads-audit.log')

export const firebaseReady = () => false

/* Append-only audit log — never throws into the request path. */
export async function mirrorLead (id, lead) {
  try {
    fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(
      auditFile,
      JSON.stringify({ id, at: new Date().toISOString(), ...lead }) + '\n',
      'utf8'
    )
  } catch { /* best-effort only */ }
}
