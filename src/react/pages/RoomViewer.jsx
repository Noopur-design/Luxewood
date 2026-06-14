import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ROOMS } from '../data/rooms.js'
import Scene3D from '../components/Scene3D.jsx'

/* ── style selector pill ── */
function StylePill ({ style, active, onClick, accent }) {
  return (
    <motion.button
      className={`rv-pill ${active ? 'rv-pill--active' : ''}`}
      onClick={onClick}
      style={{ '--accent': accent }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.22 }}
    >
      <img src={style.thumb} alt={style.name} className="rv-pill-img" loading="lazy" />
      <span className="rv-pill-name">{style.name}</span>
      {active && (
        <motion.div
          className="rv-pill-active-bar"
          layoutId="rv-pill-bar"
          transition={{ type: 'spring', stiffness: 480, damping: 36 }}
        />
      )}
    </motion.button>
  )
}

/* ── main ── */
export default function RoomViewer ({ roomId, styleId, onBack }) {
  const room  = ROOMS[roomId]
  const [activeStyleId, setActiveStyleId] = useState(styleId || room.styles[0].id)
  const style = room.styles.find(s => s.id === activeStyleId) || room.styles[0]

  const handleStyleChange = useCallback(id => {
    setActiveStyleId(id)
  }, [])

  return (
    <div className="room-viewer">

      {/* Back bar */}
      <motion.div
        className="rv-topbar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
      >
        <button className="rv-back" onClick={onBack} aria-label="Back to collection">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>Collection</span>
        </button>

        <div className="rv-room-id">
          <span className="rv-room-label">{room.title}</span>
          <span className="rv-sep">·</span>
          <span className="rv-style-label">{style.tagline}</span>
        </div>

        <div className="rv-topbar-spacer" />
      </motion.div>

      {/* 3-D Scene — full screen, no hotspots */}
      <div className="rv-canvas-wrap">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStyleId}
            className="rv-canvas-inner"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Scene3D style={style} accent={room.accent} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Style selector strip */}
      <motion.div
        className="rv-style-strip"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="rv-strip-label">Styles</span>
        <div className="rv-pills">
          {room.styles.map(s => (
            <StylePill
              key={s.id}
              style={s}
              active={s.id === activeStyleId}
              accent={room.accent}
              onClick={() => handleStyleChange(s.id)}
            />
          ))}
        </div>
      </motion.div>

    </div>
  )
}
