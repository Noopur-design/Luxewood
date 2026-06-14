/**
 * BookScene.js
 * Renders a closed hardcover book lying flat on a table using Three.js.
 * Call .init() to mount, then listen to .onBookOpen for when the animation ends.
 *
 * Book orientation:
 *   X → width   Y → up (thickness)   Z → depth/length
 *   The book lies flat; camera looks down at a slight angle.
 *
 * Opening mechanic:
 *   The front cover pivots around the spine (left edge, running along Z).
 *   coverPivot.rotation.z goes from 0 → Math.PI via GSAP.
 */

import * as THREE from 'three'
import gsap from 'gsap'

const BW = 2.2       // book width  (X)
const BD = 3.0       // book depth  (Z)
const CT = 0.055     // cover thickness (Y)
const PT = 0.30      // pages stack thickness (Y)

export class BookScene {
  /** @param {HTMLElement} container */
  constructor(container) {
    this.container   = container
    this.onBookOpen  = null   // callback fired when the open animation completes
    this._isOpen     = false
    this._raycaster  = new THREE.Raycaster()
    this._mouse      = new THREE.Vector2()
    this._clock      = new THREE.Clock()
  }

  init() {
    this._setupRenderer()
    this._setupScene()
    this._setupCamera()
    this._setupLights()
    this._buildBook()
    this._setupEvents()
    this._tick()
  }

  // ─── Renderer ──────────────────────────────────────────────────────────────

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace  = THREE.SRGBColorSpace
    this.renderer.toneMapping       = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    this.container.appendChild(this.renderer.domElement)
  }

  // ─── Scene ─────────────────────────────────────────────────────────────────

  _setupScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#F2EDE3')
    this.scene.fog = new THREE.FogExp2('#F2EDE3', 0.05)
  }

  // ─── Camera ────────────────────────────────────────────────────────────────

  _setupCamera() {
    const { clientWidth: w, clientHeight: h } = this.container
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 80)
    this.camera.position.set(0, 4.5, 5.2)
    this._lookTarget = new THREE.Vector3(0, 0.15, 0)
    this.camera.lookAt(this._lookTarget)
  }

  // ─── Lights ────────────────────────────────────────────────────────────────

  _setupLights() {
    // Warm ambient fill
    this.scene.add(new THREE.AmbientLight('#FFF6E8', 0.65))

    // Key — warm overhead-ish
    const key = new THREE.DirectionalLight('#FFFAF2', 2.2)
    key.position.set(3, 9, 5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 1
    key.shadow.camera.far  = 30
    key.shadow.camera.left = key.shadow.camera.bottom = -5
    key.shadow.camera.right = key.shadow.camera.top  =  5
    key.shadow.bias = -0.0008
    this.scene.add(key)

    // Cool-ish rim from behind-left
    const rim = new THREE.DirectionalLight('#D0E8FF', 0.45)
    rim.position.set(-5, 4, -4)
    this.scene.add(rim)

    // Warm bounce from below-right
    const bounce = new THREE.DirectionalLight('#FFE8C0', 0.3)
    bounce.position.set(4, -2, 3)
    this.scene.add(bounce)

    // Table surface
    const tableMat = new THREE.MeshStandardMaterial({
      color: '#EDE6D8',
      roughness: 0.88,
      metalness: 0.0,
    })
    const table = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), tableMat)
    table.rotation.x = -Math.PI / 2
    table.position.y  = 0
    table.receiveShadow = true
    this.scene.add(table)
  }

  // ─── Book geometry ─────────────────────────────────────────────────────────

  _buildBook() {
    // ── Materials ──────────────────────────────────────────────────────────
    const coverTopMat = new THREE.MeshStandardMaterial({
      color:     '#6B3A1F',   // warmer, lighter brown for the visible top face
      roughness: 0.58,
      metalness: 0.05,
    })
    const coverEdgeMat = new THREE.MeshStandardMaterial({
      color:     '#3A2008',
      roughness: 0.75,
      metalness: 0.02,
    })
    const pagesMat = new THREE.MeshStandardMaterial({
      color:     '#F7F2EA',
      roughness: 0.92,
    })
    const goldMat = new THREE.MeshStandardMaterial({
      color:     '#D4A020',   // brighter base color so it reads as gold under tone mapping
      roughness: 0.38,
      metalness: 0.45,        // lower metalness so ambient light reveals the color
    })
    const spineTextMat = new THREE.MeshStandardMaterial({
      color:     '#2E1A06',
      roughness: 0.7,
    })

    // BoxGeometry face order: +x, -x, +y(top), -y(bottom), +z, -z
    // For a flat book: index 2 (+y) is the visible top face seen by camera
    const coverMats = [coverEdgeMat, coverEdgeMat, coverTopMat, coverEdgeMat, coverEdgeMat, coverEdgeMat]

    this.bookGroup = new THREE.Group()

    // ── Back cover ─────────────────────────────────────────────────────────
    const back = new THREE.Mesh(new THREE.BoxGeometry(BW, CT, BD), coverMats)
    back.position.y  = CT / 2
    back.castShadow  = true
    back.receiveShadow = true
    this.bookGroup.add(back)

    // ── Pages block ────────────────────────────────────────────────────────
    const pages = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.12, PT, BD - 0.12), pagesMat)
    pages.position.set(0.04, CT + PT / 2, 0)
    pages.castShadow = true
    this.bookGroup.add(pages)

    // ── Spine strip ────────────────────────────────────────────────────────
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, CT + PT + CT, BD),
      spineTextMat,
    )
    spine.position.set(-(BW / 2 + 0.045), (CT + PT + CT) / 2, 0)
    spine.castShadow = true
    this.bookGroup.add(spine)

    // ── Front cover pivot ──────────────────────────────────────────────────
    // Pivot is at the spine: x = -(BW/2), y = top of pages stack
    this.coverPivot = new THREE.Group()
    this.coverPivot.position.set(-(BW / 2), CT + PT, 0)

    // Index 2 (+y) = top face (visible from camera when closed) = coverTopMat
    const frontCoverMats = [coverEdgeMat, coverEdgeMat, coverTopMat, coverEdgeMat, coverEdgeMat, coverEdgeMat]
    const frontCover = new THREE.Mesh(new THREE.BoxGeometry(BW, CT, BD), frontCoverMats)
    // Offset so: left edge aligns with pivot (x), cover sits on top of pages (y = CT/2)
    frontCover.position.set(BW / 2, CT / 2, 0)
    frontCover.castShadow = true
    this.coverPivot.add(frontCover)
    this._frontCover = frontCover

    // ── Gold decorations on cover top face ────────────────────────────────
    // frontCover center is at local y = CT/2, so top face = CT.
    // Decorations sit just above: y = CT + 0.005 in pivot-local space.
    const DECO_Y = CT + 0.005

    const addBar = (w, d, oz) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.007, d), goldMat)
      m.position.set(BW / 2, DECO_Y, oz)
      this.coverPivot.add(m)
    }

    // Two horizontal rules top and bottom of title zone
    addBar(1.5, 0.022, -0.55)
    addBar(1.5, 0.022,  0.55)

    // Corner dots
    ;[[-0.58, -1.1], [0.58, -1.1], [-0.58, 1.1], [0.58, 1.1]].forEach(([dx, dz]) => {
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.007, 8), goldMat)
      dot.position.set(BW / 2 + dx, DECO_Y, dz)
      this.coverPivot.add(dot)
    })

    // Central rectangle ornament (title frame)
    const centRect = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.007, 0.8), goldMat)
    centRect.position.set(BW / 2, DECO_Y, 0)
    this.coverPivot.add(centRect)

    // Inner frame lines
    ;[
      { w: 1.06, d: 0.018, ox: 0,     oz: -0.39 },
      { w: 1.06, d: 0.018, ox: 0,     oz:  0.39 },
      { w: 0.018, d: 0.76, ox: -0.52, oz: 0     },
      { w: 0.018, d: 0.76, ox:  0.52, oz: 0     },
    ].forEach(({ w, d, ox, oz }) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.007, d), goldMat)
      b.position.set(BW / 2 + ox, DECO_Y, oz)
      this.coverPivot.add(b)
    })

    this.bookGroup.add(this.coverPivot)

    // Lift group so back cover rests on table (y=0)
    this.bookGroup.position.set(0, 0, 0)
    this.scene.add(this.bookGroup)

    // Meshes used for hover/click detection
    this._clickTargets = [frontCover]
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  _setupEvents() {
    const el = this.renderer.domElement

    el.addEventListener('click', (e) => {
      if (this._isOpen) return
      if (this._hitTest(e)) this._openBook()
    })

    el.addEventListener('mousemove', (e) => {
      if (this._isOpen) return
      el.style.cursor = this._hitTest(e) ? 'pointer' : 'default'
    })

    window.addEventListener('resize', () => this._onResize())
  }

  _hitTest(e) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this._mouse.set(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top)  / rect.height) * 2 + 1,
    )
    this._raycaster.setFromCamera(this._mouse, this.camera)
    return this._raycaster.intersectObjects(this._clickTargets, true).length > 0
  }

  // ─── Book open animation ───────────────────────────────────────────────────

  _openBook() {
    if (this._isOpen) return
    this._isOpen = true

    const tl = gsap.timeline({ onComplete: () => this.onBookOpen?.() })

    // 1. Camera pulls back and angles up slightly
    tl.to(this.camera.position, {
      y: 5.5, z: 5.5,
      duration: 0.55,
      ease: 'power2.inOut',
      onUpdate: () => this.camera.lookAt(this._lookTarget),
    })

    // 2. Cover sweeps open — rotates around spine (Z axis)
    //    rotation.z: 0 (closed flat) → Math.PI (open flat on other side)
    tl.to(this.coverPivot.rotation, {
      z: Math.PI,
      duration: 1.55,
      ease: 'power3.inOut',
    }, '-=0.25')

    // 3. Camera drifts to top-down "reading" angle
    tl.to(this.camera.position, {
      y: 8.2, z: 1.6,
      duration: 0.95,
      ease: 'power2.out',
      onUpdate: () => this.camera.lookAt(this._lookTarget),
    }, '-=0.55')
  }

  // ─── Resize ────────────────────────────────────────────────────────────────

  _onResize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  // ─── Render loop ───────────────────────────────────────────────────────────

  _tick() {
    requestAnimationFrame(() => this._tick())

    if (!this._isOpen) {
      const t = this._clock.getElapsedTime()
      // Subtle idle float and sway
      this.bookGroup.position.y  = Math.sin(t * 0.75) * 0.025
      this.bookGroup.rotation.y  = Math.sin(t * 0.38) * 0.028
    }

    this.renderer.render(this.scene, this.camera)
  }

  destroy() {
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
