import { useEffect } from 'react'
import { whatsappLink } from '../quoteData.js'

const ACCENT = '#B85C38'
const UPDATED = 'June 2026'

/* ── Page content ── */
const PAGES = {
  about: {
    title: 'About LuxeWood',
    eyebrow: 'Our Story',
    body: [
      { h: 'Who we are', p: 'LuxeWood is a bespoke interior design studio crafting warm, considered homes across India. We blend handcrafted Indian materials — teak, sheesham, cane, brass and handloom textiles — with a clean, modern sensibility.' },
      { h: 'How we work', p: 'Every project begins with a conversation about how you live. From mood board to 3D visuals to a curated, real-product shopping list, we guide you through a transparent, four-stage process — and handle procurement, delivery and styling so your space comes together without the stress.' },
      { h: 'Where we work', p: 'We design homes in Mumbai, Delhi NCR, Bengaluru, Pune and Hyderabad, with bespoke joinery crafted in our own workshop. Whether it is a single room refresh or a full-home fit-out, we bring the same care to every detail.' },
      { h: 'Our promise', p: 'No templates. No surprises on reveal day. Just spaces that feel like you — delivered on time, within a budget we agree together up front.' },
    ],
  },
  contact: {
    title: 'Contact Us',
    eyebrow: 'Get in touch',
    contact: true,
    body: [
      { h: 'Talk to a designer', p: 'The fastest way to reach us is WhatsApp — we usually reply within a couple of hours during business days. Prefer email? Drop us a line and our design team will call you back within 24 hours.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    eyebrow: 'Your data',
    body: [
      { h: 'What we collect', p: 'When you request a quotation we collect the details you provide — your name, phone number, optional email, city, chosen package and any requirements you share. We also record the date and time of your enquiry.' },
      { h: 'Why we collect it', p: 'We use these details solely to prepare your quotation and to contact you about your project. We do not sell, rent or share your personal information with third parties for marketing.' },
      { h: 'How it is stored', p: 'Your enquiry is stored securely in our database (Google Firebase) and is accessible only to the LuxeWood team. Submissions are validated and rate-limited to protect against misuse.' },
      { h: 'Your rights', p: 'You may ask us at any time to see, correct or delete the personal data we hold about you. Email hello@luxewood.in and we will action your request promptly, in line with India’s Digital Personal Data Protection Act.' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    eyebrow: 'The fine print',
    body: [
      { h: 'Quotations', p: 'Prices shown on this site are indicative ranges to help you plan. A binding quotation is provided only after a design consultation and is valid for 30 days unless stated otherwise.' },
      { h: 'Product links', p: 'Some pieces may link to third-party stores. Those products, prices and availability are set by the respective platforms and are subject to change. LuxeWood is not responsible for third-party transactions.' },
      { h: 'Engagement', p: 'Design services begin once a quotation is accepted and any agreed advance is received. Lead times are estimates and may vary with material availability and custom joinery schedules.' },
      { h: 'Liability', p: 'We take great care in our work, but to the extent permitted by law our liability is limited to the value of the services provided. Nothing here limits rights you have under applicable consumer law.' },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    eyebrow: 'Cookies & tracking',
    body: [
      { h: 'What we use', p: 'This website uses only essential cookies and local storage needed for it to function — for example, to remember your place as you browse. We do not use advertising or cross-site tracking cookies.' },
      { h: 'Analytics', p: 'We may use privacy-respecting analytics to understand which pages are popular so we can improve the site. This data is aggregated and never used to identify you personally.' },
      { h: 'Managing cookies', p: 'You can clear or block cookies in your browser settings at any time. Essential cookies are required for the site to work correctly.' },
    ],
  },
}

const WaIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
)

export default function InfoPage ({ slug, onClose }) {
  const page = PAGES[slug] || PAGES.about
  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  return (
    <div className="info-page">
      {/* Nav */}
      <div className="cvz-nav">
        <button className="cvz-nav-logo" onClick={onClose}>Luxe<span>Wood</span></button>
        <span className="qp-nav-title">{page.title}</span>
        <button className="cvz-nav-cta" onClick={onClose}>← Home</button>
      </div>

      <article className="info-wrap">
        <span className="info-eyebrow" style={{ color: ACCENT }}>{page.eyebrow}</span>
        <h1 className="info-title">{page.title}</h1>

        {page.body.map(s => (
          <section key={s.h} className="info-section">
            <h2 className="info-h">{s.h}</h2>
            <p className="info-p">{s.p}</p>
          </section>
        ))}

        {page.contact && (
          <div className="info-contact-grid">
            <a className="info-contact-card" href={whatsappLink('Hi LuxeWood! I have a question.')} target="_blank" rel="noopener noreferrer">
              <span className="info-contact-ico" style={{ color: '#25D366' }}><WaIcon size={22} /></span>
              <span className="info-contact-k">WhatsApp</span>
              <span className="info-contact-v">+91 99108 09899</span>
            </a>
            <a className="info-contact-card" href="mailto:hello@luxewood.in">
              <span className="info-contact-ico" style={{ color: ACCENT }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </span>
              <span className="info-contact-k">Email</span>
              <span className="info-contact-v">hello@luxewood.in</span>
            </a>
            <div className="info-contact-card">
              <span className="info-contact-ico" style={{ color: ACCENT }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6"/></svg>
              </span>
              <span className="info-contact-k">Studios</span>
              <span className="info-contact-v">Mumbai · Delhi NCR · Bengaluru</span>
            </div>
          </div>
        )}

        {!page.contact && (
          <p className="info-updated">Last updated: {UPDATED}</p>
        )}

        <button className="info-back" onClick={onClose}>← Back to LuxeWood</button>
      </article>
    </div>
  )
}
