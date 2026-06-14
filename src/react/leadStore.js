/* ── Realtime Database lead storage (client) ──────────────────────
   Leads are written to Firebase Realtime Database so they appear in
   your Firebase console (Realtime Database → Data) from any device.
   Locked down by security rules (create-only; clients cannot read).

   Config comes from .env (VITE_FIREBASE_*). The DB URL is required and
   is shown at the top of the Realtime Database "Data" tab after you
   create it. The heavy SDK loads lazily — only on submit.
──────────────────────────────────────────────────────────────────── */

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
}

export const leadStoreReady = () => Boolean(cfg.apiKey && cfg.databaseURL)

let dbPromise = null
async function getDb () {
  if (!dbPromise) {
    dbPromise = (async () => {
      const [{ initializeApp, getApps }, { getDatabase }] = await Promise.all([
        import('firebase/app'),
        import('firebase/database'),
      ])
      const app = getApps()[0] || initializeApp(cfg)
      return getDatabase(app)
    })()
  }
  return dbPromise
}

/** Push one lead into the `leads` node. Returns its generated key. */
export async function saveLead (lead) {
  const db = await getDb()
  const { ref, push, serverTimestamp } = await import('firebase/database')
  const result = await push(ref(db, 'leads'), {
    name: lead.name,
    phone: lead.phone || '',
    email: lead.email || '',
    city: lead.city || '',
    room: lead.room || '',
    style: lead.style || '',
    message: lead.message || '',
    createdAt: serverTimestamp(),
  })
  return result.key
}
