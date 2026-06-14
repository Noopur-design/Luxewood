import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ROOMS } from '../data/rooms.js'
import { QUOTE_PACKAGES, DELIVERABLES, whatsappLink } from '../quoteData.js'
import { saveLead as saveLeadToDb, leadStoreReady } from '../leadStore.js'

const ease = [0.22, 1, 0.36, 1]
const ACCENT = '#B85C38'

/* Best-effort copy to the local SQLite API (only works when the server
   is running). Never blocks or fails the submission. */
function backupToLocalApi (body) {
  fetch('/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {})
}

/* Save a lead — Firestore is the source of truth (visible in your
   Firebase console), with a silent local backup. Times out so the
   user never sees an infinite spinner. */
async function saveLead (body) {
  if (!leadStoreReady()) {
    throw new Error('Lead storage is not configured. Please reach us on WhatsApp.')
  }
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error("Couldn't reach our server. Please try again or message us on WhatsApp.")), 15000)
  )
  await Promise.race([saveLeadToDb(body), timeout])   // primary → Firebase console
  backupToLocalApi(body)                              // optional local copy
}

const WaIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
)

export default function QuotationPage ({ roomId, onClose }) {
  const room = roomId && ROOMS[roomId] ? ROOMS[roomId] : null
  const roomTitle = room ? room.title : 'Your Space'
  const accent = room ? room.accent : ACCENT

  const [form, setForm] = useState({ name: '', phone: '', email: '', city: 'Mumbai', pkg: '', message: '', website: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => { window.scrollTo(0, 0) }, [])

  function choosePackage (name) {
    setForm(f => ({ ...f, pkg: name }))
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function submit (e) {
    e.preventDefault()
    setBusy(true); setError(null)

    // Honeypot — real users never fill this. Pretend success, store nothing.
    if (form.website) { setSent(true); setBusy(false); return }

    try {
      await saveLead({
        name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city,
        room: roomTitle,
        style: form.pkg || '',
        message: form.message
          ? `Package: ${form.pkg || 'Not specified'} — ${form.message}`
          : `Package: ${form.pkg || 'Not specified'}`,
      })
      setSent(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  const waText = `Hi LuxeWood! I'd like a quotation for my ${roomTitle}.`

  return (
    <div className="qp">
      {/* Nav */}
      <div className="cvz-nav">
        <button className="cvz-nav-logo" onClick={onClose}>Luxe<span>Wood</span></button>
        <span className="qp-nav-title">Request a Quotation</span>
        <a className="cvz-nav-cta" style={{ background: '#25D366', borderColor: '#25D366' }}
          href={whatsappLink(waText)} target="_blank" rel="noopener noreferrer">
          WhatsApp Us
        </a>
      </div>

      {sent ? (
        <div className="qp-success">
          <span className="qp-success-icon" style={{ background: accent }}>
            <svg width="30" height="30" viewBox="0 0 20 20" fill="none">
              <path d="M4 10.5l4 4 8-9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <h2 className="qp-success-title">Dhanyavaad, {form.name.split(' ')[0]}!</h2>
          <p className="qp-success-sub">
            Your {form.pkg ? <strong>{form.pkg}</strong> : 'quotation'} request for the {roomTitle.toLowerCase()} is in.
            Our design team will call you on <strong>{form.phone}</strong> within 24 hours.
          </p>
          <div className="qp-success-actions">
            <a className="qp-btn-wa" href={whatsappLink(`Hi LuxeWood! I just requested a ${form.pkg || 'quotation'} for my ${roomTitle} (${form.name}).`)}
              target="_blank" rel="noopener noreferrer">
              <WaIcon /> Continue on WhatsApp
            </a>
            <button className="qp-btn-ghost" onClick={onClose}>Back to site</button>
          </div>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="qp-hero" style={{ background: `linear-gradient(135deg, #2A1A12, ${accent})` }}>
            <span className="qp-hero-eyebrow">Quotation</span>
            <h1 className="qp-hero-title">{roomTitle}</h1>
            <p className="qp-hero-sub">Pick a package or request a custom quote. No account needed — just your contact details.</p>
          </div>

          {/* Packages */}
          <section className="qp-section">
            <h2 className="qp-section-title">Choose a starting point</h2>
            <div className="qp-pkg-grid">
              {QUOTE_PACKAGES.map(pkg => (
                <motion.div key={pkg.id}
                  className={`qp-pkg ${pkg.popular ? 'qp-pkg--popular' : ''}`}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, ease }}>
                  {pkg.popular && <span className="qp-pkg-badge" style={{ background: accent }}>Most Popular</span>}
                  <span className="qp-pkg-tag">{pkg.tag}</span>
                  <h3 className="qp-pkg-name">{pkg.name}</h3>
                  <p className="qp-pkg-price" style={{ color: accent }}>{pkg.price}</p>
                  <ul className="qp-pkg-points">
                    {pkg.points.map(p => (
                      <li key={p}>
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                          <path d="M4 10.5l4 4 8-9" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <button className="qp-pkg-btn" style={{ background: accent }} onClick={() => choosePackage(pkg.name)}>
                    Choose {pkg.name.split(' ')[0]}
                  </button>
                </motion.div>
              ))}
            </div>
          </section>

          {/* What we deliver */}
          <section className="qp-section qp-section--alt">
            <h2 className="qp-section-title">What you get</h2>
            <p className="qp-section-sub">Every LuxeWood quotation includes a clear, end-to-end process — here's what we deliver.</p>
            <div className="qp-deliver-grid">
              {DELIVERABLES.map((d, i) => (
                <motion.div key={d.title} className="qp-deliver"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.45, ease, delay: i * 0.05 }}>
                  <span className="qp-deliver-icon" style={{ color: accent, borderColor: accent + '33' }}>
                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d={d.icon} />
                    </svg>
                  </span>
                  <h4 className="qp-deliver-title">{d.title}</h4>
                  <p className="qp-deliver-desc">{d.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Custom form */}
          <section className="qp-section qp-form-section" ref={formRef}>
            <h2 className="qp-section-title">Request your quotation</h2>
            <p className="qp-section-sub">Tell us a little about your project and we'll prepare a tailored quote.</p>

            <form className="qp-form" onSubmit={submit}>
              {/* Honeypot — hidden from real users, catches bots */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off"
                value={form.website} onChange={set('website')}
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

              <div className="qp-form-row">
                <label className="cvz-quote-field">
                  <span>Name *</span>
                  <input type="text" required minLength={2} maxLength={80}
                    placeholder="Your full name" value={form.name} onChange={set('name')} />
                </label>
                <label className="cvz-quote-field">
                  <span>Phone * (for callback)</span>
                  <input type="tel" required placeholder="98XXX XXXXX" value={form.phone} onChange={set('phone')} />
                </label>
              </div>

              <div className="qp-form-row">
                <label className="cvz-quote-field">
                  <span>Email (optional)</span>
                  <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
                </label>
                <label className="cvz-quote-field">
                  <span>City</span>
                  <select value={form.city} onChange={set('city')}>
                    <option>Mumbai</option><option>Delhi NCR</option><option>Bengaluru</option>
                    <option>Pune</option><option>Hyderabad</option><option>Other</option>
                  </select>
                </label>
              </div>

              <label className="cvz-quote-field">
                <span>Package you're interested in</span>
                <select value={form.pkg} onChange={set('pkg')}>
                  <option value="">Not sure yet — recommend one</option>
                  {QUOTE_PACKAGES.map(p => <option key={p.id} value={p.name}>{p.name} ({p.price})</option>)}
                  <option value="Custom">Custom requirement</option>
                </select>
              </label>

              <label className="cvz-quote-field">
                <span>Your requirements (space, budget, timeline)</span>
                <textarea rows={4} maxLength={1000}
                  placeholder="e.g. 3BHK in Bandra, ₹8L budget, need it before Diwali…"
                  value={form.message} onChange={set('message')} />
              </label>

              {error && <p className="cvz-quote-error">{error}</p>}

              <div className="qp-form-actions">
                <button type="submit" className="qp-submit" style={{ background: accent }} disabled={busy}>
                  {busy ? 'Sending…' : 'Request Quotation'}
                </button>
                <a className="qp-btn-wa" href={whatsappLink(waText)} target="_blank" rel="noopener noreferrer">
                  <WaIcon /> Prefer WhatsApp?
                </a>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  )
}
