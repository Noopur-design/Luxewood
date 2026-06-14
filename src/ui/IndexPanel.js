/**
 * IndexPanel.js
 * Renders the table-of-contents overlay that appears after the book opens.
 * Sections are built from the sections.json array injected via constructor.
 * Cards stagger-animate in via GSAP; bookmarks persist via the storage utils.
 */

import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { isBookmarked, addBookmark, removeBookmark } from '../utils/storage.js'

gsap.registerPlugin(Flip)

export class IndexPanel {
  /**
   * @param {HTMLElement} el       - #index-panel element
   * @param {Array}       sections - parsed sections.json array
   */
  constructor(el, sections) {
    this.el       = el
    this.sections = sections
    this.onSectionSelect = null   // (section) => void
    this._built   = false
  }

  show() {
    if (!this._built) this._build()
    this.el.removeAttribute('aria-hidden')
    this.el.classList.add('visible')
    this._animateIn()
  }

  hide() {
    this.el.setAttribute('aria-hidden', 'true')
    this.el.classList.remove('visible')
  }

  // ─── Build DOM ─────────────────────────────────────────────────────────────

  _build() {
    const grid = this.el.querySelector('#section-grid')
    grid.innerHTML = ''

    this.sections.forEach((sec) => {
      const bookmarked = isBookmarked(sec.id)
      const card = document.createElement('div')
      card.className = 'section-card' + (bookmarked ? ' bookmarked' : '')
      card.dataset.id = sec.id
      card.setAttribute('role', 'button')
      card.setAttribute('tabindex', '0')
      card.setAttribute('aria-label', `Explore ${sec.title}`)

      card.innerHTML = `
        <div class="section-thumb">
          <div class="section-thumb-inner">
            ${sec.thumbnail
              ? `<img src="${sec.thumbnail}" alt="${sec.title}" loading="lazy" />`
              : this._placeholderSVG()
            }
          </div>
          <div class="bookmark-badge" title="${bookmarked ? 'Remove bookmark' : 'Bookmark'}">
            ${bookmarked ? '★' : '☆'}
          </div>
        </div>
        <div class="section-info">
          <h3>${sec.title}</h3>
          <p>${sec.subtitle ?? ''}</p>
        </div>
      `

      // Click bookmark badge (stop propagation so it doesn't open the section)
      const badge = card.querySelector('.bookmark-badge')
      badge.addEventListener('click', (e) => {
        e.stopPropagation()
        this._toggleBookmark(card, sec.id, badge)
      })

      // Click card → select section
      card.addEventListener('click',  () => this.onSectionSelect?.(sec))
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') this.onSectionSelect?.(sec)
      })

      grid.appendChild(card)
    })

    this._built = true
  }

  _placeholderSVG() {
    return `
      <div class="section-thumb-placeholder">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="14" width="36" height="26" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M6 20h36" stroke="currentColor" stroke-width="1.5"/>
          <rect x="12" y="26" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/>
          <path d="M28 26h8M28 31h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M18 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    `
  }

  // ─── Bookmark toggle ───────────────────────────────────────────────────────

  _toggleBookmark(card, id, badge) {
    const nowBookmarked = isBookmarked(id)

    if (nowBookmarked) {
      removeBookmark(id)
      card.classList.remove('bookmarked')
      badge.textContent = '☆'
      badge.title = 'Bookmark'
    } else {
      addBookmark(id)
      card.classList.add('bookmarked')
      badge.textContent = '★'
      badge.title = 'Remove bookmark'
    }

    gsap.fromTo(badge, { scale: 0.6 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' })
  }

  // ─── Enter animation ───────────────────────────────────────────────────────

  _animateIn() {
    const cards = this.el.querySelectorAll('.section-card')
    const header = this.el.querySelector('.index-header')

    // Header slides down
    gsap.fromTo(header,
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', delay: 0.1 },
    )

    // Cards stagger up (Flip-ready state snapshot → animate)
    const state = Flip.getState(cards)
    cards.forEach((c) => {
      c.style.opacity = '0'
      c.style.transform = 'translateY(22px)'
    })
    Flip.from(state, {
      duration: 0,
      onComplete: () => {
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: { amount: 0.45, from: 'start' },
          clearProps: 'transform',
        })
      },
    })
  }
}
