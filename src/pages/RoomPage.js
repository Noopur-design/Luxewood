export class RoomPage {
  constructor () {
    this._roomId  = null
    this._isNight = false
    this._setup()
  }

  _setup () {
    document.getElementById('dn-checkbox')?.addEventListener('change', () => this._toggleDayNight())
    document.getElementById('other-styles-btn')?.addEventListener('click', () => {
      window._navigate('collection', this._roomId || 'living-room')
    })
    document.getElementById('hotspot-close')?.addEventListener('click', () => this._closeHotspot())
    document.getElementById('room-back')?.addEventListener('click', () => {
      window._navigate('collection', this._roomId || 'living-room')
    })
  }

  render (roomId) {
    this._roomId  = roomId
    this._isNight = false

    const dn = document.getElementById('dn-checkbox')
    if (dn) dn.checked = false

    const crumb = document.getElementById('room-breadcrumb')
    if (crumb) crumb.textContent = roomId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    // Clear canvas container — scene-explorer handles the 3D
    const container = document.getElementById('room-canvas-container')
    if (container) {
      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:16px;color:#9C8060;font-family:'DM Sans',sans-serif;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <p style="font-size:.9rem;letter-spacing:.04em;">Open in Scene Explorer for full 3D view</p>
          <a href="/scene-explorer.html#${this._roomId}" style="padding:10px 22px;background:#2E1A06;color:#fff;border-radius:100px;font-size:.78rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;">
            Open Scene Explorer
          </a>
        </div>
      `
    }

    this._closeHotspot()
  }

  _toggleDayNight () {
    this._isNight = document.getElementById('dn-checkbox')?.checked
  }

  _openHotspot (key) {
    const panel = document.getElementById('hotspot-panel')
    if (panel) {
      panel.setAttribute('aria-hidden', 'false')
    }
  }

  _closeHotspot () {
    const panel = document.getElementById('hotspot-panel')
    if (panel) panel.setAttribute('aria-hidden', 'true')
  }
}
