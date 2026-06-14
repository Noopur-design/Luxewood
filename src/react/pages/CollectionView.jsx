import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ROOMS, ROOM_ORDER, BUDGET_COLORS } from '../data/rooms.js'

const ease = [0.22, 1, 0.36, 1]

/* ── Palette strip ── */
function Palette({ colors }) {
  return (
    <div className="cvz-palette">
      {colors.map((c, i) => (
        <span key={i} className="cvz-swatch" style={{ background: c }} title={c} />
      ))}
    </div>
  )
}

/* ── Furniture piece card ── */
function PieceCard({ piece, accent }) {
  return (
    <div className="cvz-piece" style={{ '--accent': accent }}>
      <div className="cvz-piece-head">
        <div>
          <span className="cvz-piece-cat">{piece.cat}</span>
          <h4 className="cvz-piece-name">{piece.name}</h4>
        </div>
        <span className="cvz-piece-price">{piece.price}</span>
      </div>
      <p className="cvz-piece-desc">{piece.desc}</p>
    </div>
  )
}

/* ── Room nav tab ── */
function RoomTab({ roomId, active, onClick }) {
  const room = ROOMS[roomId]
  return (
    <button
      className={`cvz-room-tab ${active ? 'cvz-room-tab--active' : ''}`}
      onClick={() => onClick(roomId)}
      style={{ '--accent': room.accent }}
    >
      {active && (
        <motion.div
          className="cvz-room-tab-bg"
          layoutId="cvz-tab-bg"
          transition={{ type: 'spring', stiffness: 480, damping: 42 }}
        />
      )}
      <span className="cvz-room-tab-label">{room.title}</span>
    </button>
  )
}

/* ── Single zigzag row ── */
function StyleRow({ id, style, index, accent, flip, onQuote }) {
  const budgetColor = BUDGET_COLORS[style.budget] || accent
  const [piecesOpen, setPiecesOpen] = useState(false)

  return (
    <motion.div
      id={id}
      className={`cvz-row ${flip ? 'cvz-row--flip' : ''}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, ease }}
    >
      {/* ── Image side ── */}
      <div className="cvz-row-img">
        <motion.img
          src={style.image}
          alt={style.name}
          loading="lazy"
          draggable={false}
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.8, ease }}
        />
        <div className="cvz-row-img-overlay" />

        {/* Top labels */}
        <div className="cvz-row-img-top">
          <span className="cvz-row-tagline">{style.tagline}</span>
          <span className="cvz-row-pieces">{style.pieces} pieces</span>
        </div>

        {/* Bottom palette */}
        <div className="cvz-row-img-bot">
          <Palette colors={style.palette} />
          <span className="cvz-row-budget" style={{ color: budgetColor }}>{style.budget}</span>
        </div>

        {/* Large index number watermark */}
        <span className="cvz-row-index" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* ── Content side ── */}
      <div className="cvz-row-content">
        <div className="cvz-row-content-inner">

          {/* Header */}
          <div className="cvz-row-header">
            <span className="cvz-row-num">
              {String(index + 1).padStart(2, '0')} / {style.tagline}
            </span>
            <h2 className="cvz-row-name">{style.name}</h2>
            <p className="cvz-row-desc">{style.description}</p>
          </div>

          {/* Specs row */}
          <div className="cvz-row-specs">
            <div className="cvz-spec">
              <span className="cvz-spec-n">{style.leadTime}</span>
              <span className="cvz-spec-l">Lead Time</span>
            </div>
            <div className="cvz-spec-divider" />
            <div className="cvz-spec">
              <span className="cvz-spec-n" style={{ color: budgetColor, fontSize: '.85rem' }}>{style.budgetRange}</span>
              <span className="cvz-spec-l">Investment</span>
            </div>
            <div className="cvz-spec-divider" />
            <div className="cvz-spec">
              <span className="cvz-spec-n">{style.pieces}</span>
              <span className="cvz-spec-l">Pieces</span>
            </div>
          </div>

          {/* Materials */}
          <div className="cvz-row-materials">
            {style.materials.map(m => (
              <span key={m} className="cvz-mat-chip">{m}</span>
            ))}
          </div>

          {/* Furniture pieces — smooth expand/collapse */}
          <div className="cvz-pieces-section">
            <button
              className="cvz-pieces-toggle"
              aria-expanded={piecesOpen}
              onClick={() => setPiecesOpen(o => !o)}
            >
              <p className="cvz-pieces-label">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                  <path d="M3 6h14M3 10h14M3 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Furniture in this space
              </p>
              <span className="cvz-pieces-icon">+</span>
            </button>
            <AnimatePresence initial={false}>
              {piecesOpen && (
                <motion.div
                  className="cvz-pieces-collapse"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease }}
                >
                  <div className="cvz-pieces-list">
                    {style.hotspots.map(piece => (
                      <PieceCard
                        key={piece.id}
                        piece={piece}
                        accent={accent}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Request quote CTA */}
          <motion.button
            className="cvz-row-cta"
            style={{ '--accent': accent, background: accent }}
            onClick={() => onQuote(style.name)}
            whileHover={{ scale: 1.02, filter: 'brightness(1.08)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <span>Request a Quote</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </motion.button>

        </div>
      </div>
    </motion.div>
  )
}

/* Quote flow now lives on the dedicated QuotationPage (#/quote). */


/* ── Main component ── */
export default function CollectionView({ onSelectStyle, initialRoom, onClose }) {
  const [activeRoom, setActiveRoom] = useState(
    initialRoom && ROOMS[initialRoom] ? initialRoom : ROOM_ORDER[0]
  )

  const room = ROOMS[activeRoom]

  // Open the dedicated quotation page for the current room
  const openQuote = useCallback(() => {
    window.location.hash = `#/quote/${activeRoom}`
  }, [activeRoom])

  const handleRoomChange = useCallback(id => {
    setActiveRoom(id)
    window.history.replaceState(null, '', `#/collection/${id}`)
  }, [])

  // On room change, jump to top so the hero summary transition is visible
  useEffect(() => {
    const scroller = document.querySelector('.rapp-page')
    if (scroller) scroller.scrollTop = 0
    window.scrollTo(0, 0)
  }, [activeRoom])

  return (
    <div className="cvz">

      {/* ── Nav — mirrors home page ── */}
      <div className="cvz-nav">
        <button className="cvz-nav-logo" onClick={onClose}>
          Luxe<span>Wood</span>
        </button>

        <nav className="cvz-nav-tabs" role="tablist">
          {ROOM_ORDER.map(id => (
            <RoomTab key={id} roomId={id} active={id === activeRoom} onClick={handleRoomChange} />
          ))}
        </nav>

        <button className="cvz-nav-cta" onClick={() => openQuote()}>
          Request Quote
        </button>

        <button className="cvz-nav-ham" onClick={() => {
          document.getElementById('cvz-drawer')?.classList.toggle('open')
        }}>
          <span/><span/>
        </button>
      </div>

      <div className="cvz-drawer" id="cvz-drawer">
        {ROOM_ORDER.map(id => (
          <button key={id}
            className={`cvz-drawer-link ${id === activeRoom ? 'active' : ''}`}
            onClick={() => { handleRoomChange(id); document.getElementById('cvz-drawer')?.classList.remove('open') }}>
            {ROOMS[id].title}
          </button>
        ))}
        <button className="cvz-drawer-cta"
          onClick={() => { document.getElementById('cvz-drawer')?.classList.remove('open'); openQuote() }}>
          Request Quote
        </button>
      </div>

      {/* ── Room hero banner — clean band, no bg image ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRoom + '-hero'}
          className="cvz-room-hero"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          <div className="cvz-room-hero-text">
            <span className="cvz-room-hero-eyebrow" style={{ color: room.accent }}>
              {room.styles.length} curated styles
            </span>
            <h2 className="cvz-room-hero-title">{room.title}</h2>
            <p className="cvz-room-hero-sub">{room.subtitle}</p>
          </div>
          {/* Room quick-nav pills */}
          <div className="cvz-room-hero-pills">
            {room.styles.map((s, i) => (
              <button
                key={s.id}
                className="cvz-hero-pill"
                style={{ '--accent': room.accent }}
                onClick={() => {
                  document.getElementById(`style-row-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                <span className="cvz-hero-pill-num">{String(i + 1).padStart(2, '0')}</span>
                {s.name}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Zigzag style rows ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRoom + '-rows'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {room.styles.map((style, i) => (
            <StyleRow
              key={style.id}
              id={`style-row-${style.id}`}
              style={style}
              index={i}
              accent={room.accent}
              flip={i % 2 !== 0}
              onQuote={openQuote}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer className="cvz-footer">
        <div className="cvz-footer-brand">
          <span className="cvz-footer-logo">Luxe<em>Wood</em></span>
          <p className="cvz-footer-tagline">Spaces that feel like you.</p>
        </div>
        <div className="cvz-footer-links">
          <button className="cvz-footer-link" onClick={onClose}>Home</button>
          <a className="cvz-footer-link" href="mailto:hello@luxewood.in">hello@luxewood.in</a>
          <a className="cvz-footer-link" href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          <a className="cvz-footer-link" href="https://pinterest.com" target="_blank" rel="noreferrer">Pinterest</a>
        </div>
        <div className="cvz-footer-bottom">
          <span>© {new Date().getFullYear()} LuxeWood Interior Design. Mumbai · Delhi NCR · Bengaluru</span>
        </div>
      </footer>

    </div>
  )
}
