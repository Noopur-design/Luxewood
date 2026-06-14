/* ═══════════════════════════════════════════════════════════════════
   LUXEWOOD — MAIN JS  (v3)
   Three.js WebGL hero | GSAP pinned horizontal rooms | Lenis | Splitting
═══════════════════════════════════════════════════════════════════ */

import './style.css'
import Lenis     from 'lenis'
import gsap      from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// Inline word-splitter — accepts a CSS selector string or a single DOM element
function splitWords (target) {
  const els = (typeof target === 'string')
    ? [...document.querySelectorAll(target)]
    : [target]
  els.forEach(el => {
    if (!el || el.querySelector('.word')) return  // skip already-split
    // Only wrap text nodes, not child elements
    el.childNodes.forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE) return
      const raw  = node.textContent
      const text = raw.trim()
      if (!text) return
      const frag = document.createDocumentFragment()
      // keep boundary spaces so words don't fuse with adjacent <em>/elements
      if (/^\s/.test(raw)) frag.appendChild(document.createTextNode(' '))
      text.split(/\s+/).forEach((word, i, arr) => {
        const span = document.createElement('span')
        span.className = 'word'
        span.textContent = word
        frag.appendChild(span)
        if (i < arr.length - 1) frag.appendChild(document.createTextNode(' '))
      })
      if (/\s$/.test(raw)) frag.appendChild(document.createTextNode(' '))
      node.replaceWith(frag)
    })
  })
}

import { CollectionPage } from './pages/CollectionPage.js'
import { RoomPage }       from './pages/RoomPage.js'
import { HeroGL }         from './gl/HeroGL.js'

gsap.registerPlugin(ScrollTrigger)

/* ─────────────────────────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────────────────────────── */
const loadingOverlay = document.getElementById('loading-overlay')
const loadingFill    = loadingOverlay?.querySelector('.loading-fill')

let loadPct = 0
const fakeLoad = setInterval(() => {
  loadPct += Math.random() * 16 + 5
  if (loadPct >= 100) {
    loadPct = 100
    clearInterval(fakeLoad)
    setTimeout(() => {
      loadingOverlay?.classList.add('out')
      setTimeout(initApp, 680)
    }, 160)
  }
  if (loadingFill) loadingFill.style.width = loadPct + '%'
}, 80)

/* ─────────────────────────────────────────────────────────────────
   APP INIT
───────────────────────────────────────────────────────────────── */
let lenis

function initApp () {
  const fns = [initLenis, initCursor, initMagnetic, initNav, initHero, initRoomsHScroll, initGallery, initScrollReveal, initCounters, initFAQ, initFooterLinks, initWaFab, initRouting]
  fns.forEach(fn => {
    try { fn() }
    catch (e) { console.error(`[LuxeWood] ${fn.name} failed:`, e) }
  })
}

/* ─────────────────────────────────────────────────────────────────
   LENIS
───────────────────────────────────────────────────────────────── */
function initLenis () {
  lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    // Don't intercept scroll inside the React overlay scroll container
    prevent: node => !!(node && node.closest && node.closest('.rapp-page')),
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

/* ─────────────────────────────────────────────────────────────────
   CURSOR
───────────────────────────────────────────────────────────────── */
function initCursor () {
  // Cursor removed — using default OS pointer
}

/* ─────────────────────────────────────────────────────────────────
   MAGNETIC BUTTONS
───────────────────────────────────────────────────────────────── */
function initMagnetic () {
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r  = el.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.28
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.28
      gsap.to(el, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' })
    })
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,.4)' })
    })
  })
}

/* ─────────────────────────────────────────────────────────────────
   NAV
───────────────────────────────────────────────────────────────── */
function initNav () {
  const nav      = document.getElementById('site-nav')
  const burger   = document.getElementById('nav-hamburger')
  const drawer   = document.getElementById('nav-drawer')
  const backdrop = document.getElementById('nav-backdrop')
  if (!nav) return

  ScrollTrigger.create({
    start: 80,
    onEnter:     () => nav.classList.add('scrolled'),
    onLeaveBack: () => nav.classList.remove('scrolled'),
  })

  nav.querySelector('.nav-logo')?.addEventListener('click', e => {
    e.preventDefault(); closeDrawer(); window._navigate(null)
  })
  nav.querySelector('.nav-cta')?.addEventListener('click', () => {
    window._navigate('quote')   // dedicated quotation page
  })

  // Mobile drawer
  function openDrawer () {
    drawer?.classList.add('open')
    backdrop?.classList.add('open')
    burger?.classList.add('open')
    burger?.setAttribute('aria-expanded', 'true')
    drawer?.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
  }
  function closeDrawer () {
    drawer?.classList.remove('open')
    backdrop?.classList.remove('open')
    burger?.classList.remove('open')
    burger?.setAttribute('aria-expanded', 'false')
    drawer?.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
  }

  burger?.addEventListener('click', () => {
    drawer?.classList.contains('open') ? closeDrawer() : openDrawer()
  })
  backdrop?.addEventListener('click', closeDrawer)

  // Close drawer on nav link click
  drawer?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeDrawer)
  })
  drawer?.querySelector('.nav-drawer-cta')?.addEventListener('click', () => {
    closeDrawer()
    window._navigate('quote')
  })
}

/* ─────────────────────────────────────────────────────────────────
   HERO — Three.js WebGL + GSAP entrance
───────────────────────────────────────────────────────────────── */
function initHero () {
  const HERO_IMG = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1800&q=90&fit=crop'

  // Three.js WebGL distortion
  const canvas = document.getElementById('hero-canvas')
  if (canvas) {
    new HeroGL(canvas).init(HERO_IMG, () => {
      // Once Three.js texture loaded, fade out the fallback img
      const fallback = document.getElementById('hero-img-fallback')
      if (fallback) gsap.to(fallback, { opacity: 0, duration: 0.5 })
    })
  }

  // GSAP entrance animation
  splitWords('[data-split]')

  const eyebrow = document.querySelector('.hero-eyebrow')
  const lines   = document.querySelectorAll('.hero-line')
  const bar     = document.querySelector('.hero-bar')
  const pins    = document.querySelectorAll('.hero-pin')

  const tl = gsap.timeline({ delay: 0.12 })

  tl.fromTo(document.querySelector('.hero-gradient'),
    { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }
  )

  if (eyebrow) {
    tl.fromTo(eyebrow.querySelectorAll('.word'),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: 'power2.out' },
      0.35
    )
  }

  lines.forEach((line, i) => {
    const words = line.querySelectorAll('.word')
    tl.fromTo(words,
      { opacity: 0, y: 70, rotateX: -8 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.8, ease: 'power3.out', stagger: 0.04 },
      0.5 + i * 0.14
    )
  })

  if (bar)
    tl.fromTo(bar, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 1.05)

  tl.fromTo(pins,
    { opacity: 0, scale: 0.3 },
    { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', stagger: 0.12 },
    1.1
  )

  // Subtle parallax on scroll
  gsap.to('#hero-canvas', {
    y: '10%', ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  })

  // Hero CTA
  document.getElementById('hero-explore')?.addEventListener('click', () => {
    window._navigate('collection', 'living-room')
  })
}

/* ─────────────────────────────────────────────────────────────────
   ROOMS — grid card click handlers
───────────────────────────────────────────────────────────────── */
function initRoomsHScroll () {
  // Room pill links in design section — hash routing handled by browser natively
  // BA internal links also use hash hrefs — no JS needed
}

function initGallery () {
  // Tab switching
  document.querySelectorAll('.rg-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rg-tab').forEach(t => t.classList.remove('rg-tab--active'))
      document.querySelectorAll('.rg-panel').forEach(p => p.classList.remove('rg-panel--active'))
      tab.classList.add('rg-tab--active')
      const panel = document.querySelector(`.rg-panel[data-panel="${tab.dataset.tab}"]`)
      if (panel) panel.classList.add('rg-panel--active')
    })
  })
  // Shop This Look toggle
  document.addEventListener('click', e => {
    const btn = e.target.closest('.rg-shop-toggle')
    if (!btn) return
    const card = btn.closest('.rg-card')
    if (card) card.classList.toggle('is-open')
  })
}

/* ─────────────────────────────────────────────────────────────────
   SCROLL REVEALS (generic)
───────────────────────────────────────────────────────────────── */
function initScrollReveal () {
  // ── Split-text headings (word-by-word stagger) ──
  splitWords('[data-split-reveal]')
  document.querySelectorAll('[data-split-reveal] .word').forEach((w, i) => {
    w.style.setProperty('--wi', i)
  })

  // ── Tag elements with reveal classes ──
  document.querySelectorAll('.section-eyebrow').forEach(el => el.classList.add('reveal-left'))
  document.querySelectorAll('.craft-img').forEach((el, i) => { el.classList.add('reveal-up'); el.style.setProperty('--si', i) })
  document.querySelectorAll('.pcard').forEach((el, i)      => { el.classList.add('reveal-up'); el.style.setProperty('--si', i) })
  document.querySelectorAll('.faq-item').forEach((el, i)   => { el.classList.add('reveal-up'); el.style.setProperty('--si', i) })
  document.querySelectorAll('.cp-step').forEach((el, i)    => { el.classList.add('reveal-up'); el.style.setProperty('--si', i) })
  document.querySelectorAll('[data-reveal]').forEach(el    => el.classList.add('reveal-up'))

  // ── Check which elements are in view and add .in ──
  // Uses Lenis scroll event so it's perfectly in sync with smooth scroll
  const vh = window.innerHeight

  function checkReveals () {
    // words (split-text)
    document.querySelectorAll('[data-split-reveal] .word:not(.in)').forEach(w => {
      if (w.getBoundingClientRect().top < vh * 0.9) w.classList.add('in')
    })
    // all other reveal elements
    document.querySelectorAll('.reveal-up:not(.in), .reveal-left:not(.in)').forEach(el => {
      if (el.getBoundingClientRect().top < vh * 0.88) el.classList.add('in')
    })
  }

  // Run once on init (above-fold elements)
  checkReveals()

  // Native scroll event — Lenis dispatches this on window every frame it scrolls
  window.addEventListener('scroll', checkReveals, { passive: true })

  // Fallback RAF loop — catches any missed frames (e.g. programmatic scroll)
  let rafId
  function rafCheck () {
    checkReveals()
    // Stop once everything is revealed
    const pending = document.querySelectorAll('.reveal-up:not(.in), .reveal-left:not(.in), [data-split-reveal] .word:not(.in)').length
    if (pending > 0) rafId = requestAnimationFrame(rafCheck)
  }
  rafId = requestAnimationFrame(rafCheck)
}

/* ─────────────────────────────────────────────────────────────────
   COUNTERS
───────────────────────────────────────────────────────────────── */
function initCounters () {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      io.unobserve(entry.target)
      const el     = entry.target
      const target = parseInt(el.dataset.count, 10)
      const suffix = el.dataset.suffix || ''
      const dur    = 2000  // ms
      const start  = performance.now()
      const tick   = now => {
        const p = Math.min((now - start) / dur, 1)
        // ease out cubic
        const eased = 1 - Math.pow(1 - p, 3)
        el.textContent = Math.round(eased * target) + suffix
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
  }, { threshold: 0.3 })

  document.querySelectorAll('[data-count]').forEach(el => io.observe(el))
}

/* ─────────────────────────────────────────────────────────────────
   FAQ ACCORDION
───────────────────────────────────────────────────────────────── */
function initFAQ () {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item    = btn.closest('.faq-item')
      const wasOpen = item.classList.contains('open')
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'))
      if (!wasOpen) item.classList.add('open')
    })
  })
}

/* ─────────────────────────────────────────────────────────────────
   FOOTER ROOM LINKS
───────────────────────────────────────────────────────────────── */
function initFooterLinks () {
  document.querySelectorAll('[data-room]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault()
      // Set hash → hashchange fires → React navigates
      location.hash = `#/collection/${el.dataset.room}`
    })
  })
  const yr = document.getElementById('footer-year')
  if (yr) yr.textContent = new Date().getFullYear()
}

/* ─────────────────────────────────────────────────────────────────
   FLOATING WHATSAPP — hide while the footer is on screen so it never
   overlaps the legal links
───────────────────────────────────────────────────────────────── */
function initWaFab () {
  const fab = document.getElementById('wa-fab')
  const footer = document.querySelector('.site-footer')
  if (!fab || !footer) return
  const update = () => {
    // Hide the button once the footer starts entering the viewport,
    // so it never overlaps the legal links.
    const top = footer.getBoundingClientRect().top
    fab.classList.toggle('wa-fab--hidden', top < window.innerHeight - 80)
  }
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update, { passive: true })
  update()
}

/* ─────────────────────────────────────────────────────────────────
   ROUTING  (hash-based: #/collection/living-room  |  #/room/living-room/grand)
───────────────────────────────────────────────────────────────── */

/** Parse a hash string into { view, room, style } */
function parseHash (hash) {
  // e.g.  #/collection/living-room  or  #/room/living-room/grand  or  ''
  const parts = hash.replace(/^#\/?/, '').split('/')
  const view  = parts[0] || null
  const room  = parts[1] || null
  const style = parts[2] || null
  return { view, room, style }
}

/** Build a clean hash from parts */
function buildHash (view, room, style) {
  if (!view || view === 'home') return '#/'
  let h = `#/${view}`
  if (room)  h += `/${room}`
  if (style) h += `/${style}`
  return h
}

/** Fire the React event */
function fireReactNav (view, room, style) {
  window.dispatchEvent(new CustomEvent('lw-navigate', {
    detail: { view, room: room || null, style: style || null }
  }))
  lenis?.stop()
}

/** Main navigate — updates hash and fires React */
function navigateTo (view, room, style) {
  if (view === 'collection' || view === 'room' || view === 'quote' || view === 'page') {
    location.hash = buildHash(view, room, style)
    // hashchange listener will fire fireReactNav
  } else {
    location.hash = '#/'
    // hashchange listener will close overlay
  }
}

window._navigate = navigateTo

// Let React signal back when it closes
window.addEventListener('lw-close-ack', () => lenis?.start())

/** Handle hash changes (browser back/forward + programmatic) */
function handleHash () {
  const { view, room, style } = parseHash(location.hash)
  if (view === 'collection' || view === 'room' || view === 'quote' || view === 'page') {
    fireReactNav(view, room, style)
  } else {
    // home — close React overlay if open
    window.dispatchEvent(new CustomEvent('lw-close'))
    lenis?.start()
  }
}

window.addEventListener('hashchange', handleHash)

/** On first load, parse current hash */
function initRouting () {
  const { view } = parseHash(location.hash)
  if (view === 'collection' || view === 'room' || view === 'quote' || view === 'page') {
    // small delay so React has mounted
    setTimeout(handleHash, 120)
  }
}
