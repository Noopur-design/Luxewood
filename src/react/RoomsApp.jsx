import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CollectionView from './pages/CollectionView.jsx'
import RoomViewer    from './pages/RoomViewer.jsx'
import QuotationPage from './pages/QuotationPage.jsx'
import InfoPage from './pages/InfoPage.jsx'

/*
  Navigation state shape:
    { view: 'collection' }
    { view: 'room', roomId: 'living-room', styleId: 'grand' }
*/

const overlayEnter = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35 } },
}

const pageVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -28, transition: { duration: 0.3 } },
}

export default function RoomsApp () {
  const [nav, setNav] = useState(null) // null = closed
  const [visible, setVisible] = useState(false)

  /* Listen for navigation events from main.js */
  useEffect(() => {
    const handler = e => {
      const { view: targetView, room, style } = e.detail || {}
      if (targetView === 'room' && room) {
        // direct deep-link into a specific room viewer
        setNav({ view: 'room', roomId: room, styleId: style || null })
      } else if (targetView === 'quote') {
        // dedicated quotation page
        setNav({ view: 'quote', roomId: room || null })
      } else if (targetView === 'page') {
        // static info page (about / contact / privacy / terms / cookies)
        setNav({ view: 'page', slug: room || 'about' })
      } else {
        // collection view — optionally pre-select a room tab
        setNav({ view: 'collection', initialRoom: room || null })
      }
      setVisible(true)
      // prevent body scroll
      document.body.style.overflow = 'hidden'
    }

    const closeHandler = () => close()

    window.addEventListener('lw-navigate', handler)
    window.addEventListener('lw-close', closeHandler)

    return () => {
      window.removeEventListener('lw-navigate', handler)
      window.removeEventListener('lw-close', closeHandler)
    }
  }, [])

  const close = useCallback(() => {
    setVisible(false)
    document.body.style.overflow = ''
    // update hash so browser back works
    if (location.hash && location.hash !== '#/') {
      location.hash = '#/'
    }
    setTimeout(() => {
      setNav(null)
      window.dispatchEvent(new CustomEvent('lw-close-ack'))
    }, 400)
  }, [])

  const openRoom = useCallback((roomId, styleId) => {
    // update hash → triggers hashchange → which fires lw-navigate
    const hash = styleId ? `#/room/${roomId}/${styleId}` : `#/room/${roomId}`
    location.hash = hash
  }, [])

  const backToCollection = useCallback(() => {
    // navigate back via hash so browser history is correct
    const current = location.hash
    const roomMatch = current.match(/^#\/room\/([^/]+)/)
    const roomId = roomMatch ? roomMatch[1] : null
    location.hash = roomId ? `#/collection/${roomId}` : '#/collection'
  }, [])

  if (!visible && !nav) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="rooms-app-overlay"
          variants={overlayEnter}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          key="rooms-overlay"
        >
          {/* Close button */}
          <button className="rapp-close" onClick={close} aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 22 22">
              <line x1="3" y1="3" x2="19" y2="19" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="19" y1="3" x2="3" y2="19" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>

          {/* Page content */}
          <AnimatePresence mode="wait">
            {nav?.view === 'collection' && (
              <motion.div
                key="collection"
                className="rapp-page"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <CollectionView onSelectStyle={openRoom} initialRoom={nav?.initialRoom} onClose={close} />
              </motion.div>
            )}

            {nav?.view === 'room' && (
              <motion.div
                key={'room-' + nav.roomId + '-' + nav.styleId}
                className="rapp-page"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <RoomViewer
                  roomId={nav.roomId}
                  styleId={nav.styleId}
                  onBack={backToCollection}
                />
              </motion.div>
            )}

            {nav?.view === 'quote' && (
              <motion.div
                key={'quote-' + nav.roomId}
                className="rapp-page"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <QuotationPage roomId={nav.roomId} onClose={close} />
              </motion.div>
            )}

            {nav?.view === 'page' && (
              <motion.div
                key={'page-' + nav.slug}
                className="rapp-page"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <InfoPage slug={nav.slug} onClose={close} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
