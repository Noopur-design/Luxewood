import gsap from 'gsap'

const ROOMS = {
  'living-room': {
    title: 'Living Room',
    styles: [
      {
        id: 'grand', name: 'Grand Classic',
        tagline: 'Timeless Opulence',
        description: 'Rich mahogany accents, deep velvet seating, and gilded details conjure old-world grandeur with a modern sensibility.',
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=85&fit=crop'
      },
      {
        id: 'boho', name: 'Boho Luxe',
        tagline: 'Layered & Earthy',
        description: 'Rattan, linen, and terracotta woven together in effortless bohemian warmth. Every texture tells a story.',
        image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=85&fit=crop'
      },
      {
        id: 'nordic', name: 'Nordic Minimal',
        tagline: 'Clean & Considered',
        description: 'Light oak, muted linen, and negative space. Scandinavian restraint elevated to art.',
        image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=900&q=85&fit=crop'
      },
      {
        id: 'scandi', name: 'Scandi Rustic',
        tagline: 'Warm & Natural',
        description: 'Raw timber grain, sheepskin throws, and amber candlelight. A cabin brought into the city.',
        image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=900&q=85&fit=crop'
      }
    ]
  },
  'bedroom': {
    title: 'Bedroom',
    styles: [
      {
        id: 'bedroom-serene', name: 'Serene Retreat',
        tagline: 'Calm & Luxurious',
        description: 'Platform beds in solid oak, linen bedding in undyed ivory, and warm low lighting for perfect rest.',
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=85&fit=crop'
      },
      {
        id: 'bedroom-dark', name: 'Dark Romance',
        tagline: 'Moody & Elegant',
        description: 'Deep walnut frames, forest-green walls, and burnished brass hardware for an evening retreat.',
        image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900&q=85&fit=crop'
      }
    ]
  },
  'dining': {
    title: 'Dining Room',
    styles: [
      {
        id: 'dining-formal', name: 'Formal Gathering',
        tagline: 'Impressive & Warm',
        description: 'A 3-metre white oak slab table, turned walnut chairs, and hand-woven rattan pendants overhead.',
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=900&q=85&fit=crop'
      },
      {
        id: 'dining-casual', name: 'Casual Feast',
        tagline: 'Relaxed & Inviting',
        description: 'Bench seating, reclaimed elm, and industrial-style fixtures that say come as you are.',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=85&fit=crop'
      }
    ]
  },
  'home-office': {
    title: 'Home Office',
    styles: [
      {
        id: 'office-focus', name: 'Deep Focus',
        tagline: 'Minimal & Productive',
        description: 'Motorised walnut desks, ergonomic chairs in full-grain leather, and oak shelving that thinks with you.',
        image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=900&q=85&fit=crop'
      },
      {
        id: 'office-creative', name: 'Creative Studio',
        tagline: 'Open & Inspired',
        description: 'Wide trestle tables, pegboard tool walls, and raw timber accents for makers and thinkers.',
        image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=85&fit=crop'
      }
    ]
  },
  'kitchen': {
    title: 'Kitchen',
    styles: [
      {
        id: 'kitchen-shaker', name: 'Shaker Classic',
        tagline: 'Enduring Simplicity',
        description: 'Calacatta marble worktops, Shaker-profile oak cabinetry, and aged brass hardware throughout.',
        image: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=900&q=85&fit=crop'
      },
      {
        id: 'kitchen-modern', name: 'Handleless Modern',
        tagline: 'Sleek & Functional',
        description: 'Touch-release doors, honed Nero Marquina marble, and integrated appliances behind seamless oak faces.',
        image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=900&q=85&fit=crop'
      }
    ]
  }
}

export class CollectionPage {
  constructor () {
    this._currentRoom = null
    this._setupBackButton()
  }

  render (roomId) {
    this._currentRoom = roomId
    const room = ROOMS[roomId]
    if (!room) {
      // Unknown room — default to living room
      return this.render('living-room')
    }

    const eyebrow = document.getElementById('col-eyebrow')
    const title   = document.getElementById('col-title')
    if (eyebrow) eyebrow.textContent = 'Choose Your Style'
    if (title)   title.textContent   = room.title

    this._buildGrid(roomId, room)
    this._buildOtherRooms(roomId)

    const el = document.getElementById('page-collection')
    if (el) el.scrollTop = 0
  }

  _buildGrid (roomId, room) {
    const grid = document.getElementById('styles-grid')
    if (!grid) return
    grid.innerHTML = ''

    room.styles.forEach((style, i) => {
      const flip = i % 2 === 1
      const card = document.createElement('div')
      card.className = `style-card style-card--editorial${flip ? ' style-card--flip' : ''}`
      card.innerHTML = `
        <div class="style-card__img">
          <img src="${style.image}" alt="${style.name}" loading="${i < 2 ? 'eager' : 'lazy'}"/>
          <div class="style-card__img-overlay"></div>
        </div>
        <div class="style-card__body">
          <p class="style-card__num">0${i + 1}</p>
          <p class="style-card__tagline">${style.tagline}</p>
          <h3 class="style-card__name">${style.name}</h3>
          <p class="style-card__desc">${style.description}</p>
          <button class="style-card__cta">
            Explore in 3D
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      `

      // "Explore in 3D" → scene explorer
      card.querySelector('.style-card__cta').addEventListener('click', e => {
        e.stopPropagation()
        // Map room/style to scene-explorer hash key
        const hashKey = roomId === 'living-room' ? style.id : roomId.replace('home-office','office')
        window.location.href = `/scene-explorer.html#${hashKey}`
      })

      grid.appendChild(card)

      gsap.fromTo(card,
        { opacity: 0, y: 48 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', delay: i * 0.10 }
      )
    })
  }

  _buildOtherRooms (currentId) {
    const container = document.getElementById('other-room-pills')
    if (!container) return
    container.innerHTML = ''
    Object.entries(ROOMS).forEach(([id, data]) => {
      if (id === currentId) return
      const btn = document.createElement('button')
      btn.className   = 'room-pill'
      btn.textContent = data.title
      btn.addEventListener('click', () => this.render(id))
      container.appendChild(btn)
    })
  }

  _setupBackButton () {
    document.getElementById('collection-back')?.addEventListener('click', () => {
      window._navigate(null)
    })
  }
}
