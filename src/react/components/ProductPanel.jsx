import { motion } from 'framer-motion'

const panelVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0, opacity: 1,
    transition: { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }
  },
  exit: {
    x: '110%', opacity: 0,
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] }
  },
}

const lineVariants = {
  hidden:  { scaleX: 0, originX: 0 },
  visible: { scaleX: 1, transition: { delay: 0.18, duration: 0.5, ease: 'easeOut' } },
}

const rowVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.12 + i * 0.06, duration: 0.4, ease: 'easeOut' }
  }),
}

export default function ProductPanel ({ hotspot, onClose, accent }) {
  if (!hotspot) return null

  return (
    <motion.aside
      className="product-panel"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="dialog"
      aria-modal="true"
      aria-label={hotspot.name}
      style={{ '--accent': accent }}
    >
      <button
        className="pp-close"
        onClick={onClose}
        aria-label="Close panel"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </button>

      <motion.span
        className="pp-cat"
        custom={0}
        variants={rowVariants}
        initial="hidden"
        animate="visible"
      >
        {hotspot.cat}
      </motion.span>

      <motion.h3
        className="pp-name"
        custom={1}
        variants={rowVariants}
        initial="hidden"
        animate="visible"
      >
        {hotspot.name}
      </motion.h3>

      <motion.div className="pp-divider" variants={lineVariants} initial="hidden" animate="visible" />

      <motion.p
        className="pp-desc"
        custom={2}
        variants={rowVariants}
        initial="hidden"
        animate="visible"
      >
        {hotspot.desc}
      </motion.p>

      <motion.div
        className="pp-price"
        custom={3}
        variants={rowVariants}
        initial="hidden"
        animate="visible"
      >
        {hotspot.price}
      </motion.div>

      <motion.div
        className="pp-actions"
        custom={4}
        variants={rowVariants}
        initial="hidden"
        animate="visible"
      >
        <button className="pp-btn pp-btn--primary">Enquire</button>
        <button className="pp-btn pp-btn--secondary">Add to Wishlist</button>
      </motion.div>
    </motion.aside>
  )
}
