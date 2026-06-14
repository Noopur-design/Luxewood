/**
 * RoomScene.js
 * Procedural Three.js room generator.
 * Builds a fully furnished room (walls, floor, furniture) from palette colours
 * and exposes setDayMode() / setNightMode() for the day/night toggle.
 * Clickable furniture pieces carry .userData.hotspot = { key, position }.
 */

import * as THREE from 'three'
import gsap from 'gsap'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass }     from 'three/addons/postprocessing/OutputPass.js'
import { SSAOPass }       from 'three/addons/postprocessing/SSAOPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'

/* ── Room dimensions (shared) ────────────────────────────────────────────── */
const RW = 9    // width  (X)
const RH = 3.6  // height (Y)
const RD = 9    // depth  (Z)

/* ── Palette helpers ─────────────────────────────────────────────────────── */
function hex(h) {
  return h instanceof THREE.Color ? h : new THREE.Color(h)
}

function mat(color, roughness = 0.8, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color: hex(color), roughness, metalness })
}

// Physical material — wood, metal, fabric with realistic PBR properties
function phys(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({ color: hex(color), ...opts })
}

/* ── Texture CDN ─────────────────────────────────────────────────────────── */
const TEX_BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures'
const _texLoader = new THREE.TextureLoader()

function loadTex(path, repeatX = 1, repeatY = 1, rotate = 0) {
  const t = _texLoader.load(`${TEX_BASE}/${path}`)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeatX, repeatY)
  t.rotation = rotate
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Pre-load shared textures (load once, reuse across rooms)
const _T = {
  // Dark hardwood floor planks
  darkWood:  loadTex('hardwood2_diffuse.jpg', 5, 5),
  // Light wood (for accents, small items)
  lightWood: loadTex('hardwood2_diffuse.jpg', 2, 2),
  // Wood planks rotated 90° for horizontal grain (accent walls)
  plankWall: loadTex('hardwood2_diffuse.jpg', 2, 0.8),
}

export class RoomScene {
  /** @param {HTMLElement} container */
  constructor(container) {
    this.container     = container
    this.onHotspotClick = null   // (hotspotKey) => void
    this._isNight       = false
    this._raycaster     = new THREE.Raycaster()
    this._mouse         = new THREE.Vector2()
    this._clickables    = []
    this._furniture     = new THREE.Group()
    this._hotspotMarkers = []
  }

  /* ── Lifecycle ─────────────────────────────────────────────────────────── */

  init() {
    this._setupRenderer()
    this._setupScene()
    this._setupCamera()
    this._setupPostProcessing()
    this._setupEvents()
    this._tick()
  }

  _setupRenderer() {
    RectAreaLightUniformsLib.init()
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace  = THREE.SRGBColorSpace
    this.renderer.toneMapping       = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.70
    this.container.appendChild(this.renderer.domElement)
  }

  _setupScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#F0EDE8')
    this.scene.fog = new THREE.FogExp2('#F0EDE8', 0.03)

    // Warm indoor environment map — adds realistic reflections to all surfaces
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.30
    pmrem.dispose()
  }

  _setupCamera() {
    const { clientWidth: w, clientHeight: h } = this.container
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 80)
    this.camera.position.set(0, 1.65, 7.8)
    this.camera.lookAt(0, 1.1, 0)
    this._camTarget = new THREE.Vector3(0, 1.1, 0)
  }

  _setupPostProcessing() {
    const { clientWidth: w, clientHeight: h } = this.container
    this._composer = new EffectComposer(this.renderer)
    this._composer.addPass(new RenderPass(this.scene, this.camera))

    // SSAO — ambient occlusion darkens corners/contact points (essential for realism)
    this._ssaoPass = new SSAOPass(this.scene, this.camera, w, h)
    this._ssaoPass.kernelRadius  = 0.25
    this._ssaoPass.minDistance   = 0.0008
    this._ssaoPass.maxDistance   = 0.04
    this._ssaoPass.output        = SSAOPass.OUTPUT.Default
    this._composer.addPass(this._ssaoPass)

    // Bloom — makes emissive lamps glow realistically
    this._bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.22, 0.45, 0.85)
    this._composer.addPass(this._bloomPass)
    this._composer.addPass(new OutputPass())
  }

  _setupEvents() {
    const el = this.renderer.domElement
    el.addEventListener('click',     (e) => this._onClick(e))
    el.addEventListener('mousemove', (e) => this._onMove(e))
    window.addEventListener('resize', () => this._onResize())
  }

  /* ── Room building ─────────────────────────────────────────────────────── */

  /**
   * @param {'living-room'|'dining'|'bedroom'|'home-office'|'kitchen'} roomId
   * @param {object} palette  colours from rooms.json
   */
  build(roomId, palette) {
    this._palette = palette
    // Clear old furniture
    this._furniture.children.slice().forEach(c => this._furniture.remove(c))
    this._clickables = []
    this._hotspotMarkers = []
    this.scene.remove(this._furniture)
    this._furniture = new THREE.Group()
    this.scene.add(this._furniture)

    this._lampLight     = null
    this._pendantLight  = null
    this._bedLampMesh1  = null
    this._bedLampMesh2  = null
    this._windowMeshRef = null

    this._buildRoom(palette)

    switch (roomId) {
      case 'living-room': this._buildLivingRoom(palette); break
      case 'dining':      this._buildDining(palette);     break
      case 'bedroom':     this._buildBedroom(palette);    break
      case 'home-office': this._buildOffice(palette);     break
      case 'kitchen':     this._buildKitchen(palette);    break
    }

    this._buildLights()
    this._isNight = false
    this.setDayMode()

    // Camera intro animation
    this.camera.position.set(0, 1.65, 12)
    gsap.to(this.camera.position, { z: 7.8, duration: 1.5, ease: 'power3.out' })
  }

  _buildRoom(p) {
    // Choose floor texture — dark rooms get dark-tinted wood, light rooms get warm wood
    const floorColor = new THREE.Color(p.floor ?? '#D4C8A8')
    const floorTex   = _T.darkWood.clone()
    floorTex.needsUpdate = true
    floorTex.repeat.set(6, 6)

    const floorMat = phys(p.floor ?? '#D4C8A8', {
      map: floorTex,
      roughness: 0.55, metalness: 0,
      clearcoat: 0.18, clearcoatRoughness: 0.55,
    })

    // Wall — smooth painted surface (no texture, just colour)
    const wallMat  = phys(p.wall ?? '#F5F3EE', { roughness: 0.97, metalness: 0 })
    const ceilMat = mat('#F8F6F2', 0.95)

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this._furniture.add(floor)

    // Back wall
    const back = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), wallMat)
    back.position.set(0, RH / 2, -RD / 2)
    back.receiveShadow = true
    this._furniture.add(back)

    // Left wall
    const left = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), wallMat)
    left.rotation.y = Math.PI / 2
    left.position.set(-RW / 2, RH / 2, 0)
    left.receiveShadow = true
    this._furniture.add(left)

    // Right wall
    const right = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), wallMat)
    right.rotation.y = -Math.PI / 2
    right.position.set(RW / 2, RH / 2, 0)
    right.receiveShadow = true
    this._furniture.add(right)

    // Ceiling — emissive so it reads as bright even without direct light
    const ceilEmit = new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFFFFF'), roughness: 1, emissive: new THREE.Color('#F8F5EE'), emissiveIntensity: 0.35 })
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), ceilEmit)
    ceil.rotation.x = Math.PI / 2
    ceil.position.y = RH
    this._furniture.add(ceil)

    // Window on left wall
    this._windowMesh = this._addWindow(-RW / 2 + 0.02, 2.0, 0, false)
  }

  _addWindow(x, y, z, isBack) {
    const winMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D8EEFF'),
      emissive: new THREE.Color('#A0C8F8'),
      emissiveIntensity: 0.7,
      roughness: 0.1,
      transparent: true, opacity: 0.7,
    })
    const frame = mat('#D8CFC0', 0.9)
    const win = new THREE.Group()

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), winMat)
    win.add(glass)

    // Frame bars
    ;[[-1.2, 0], [1.2, 0], [0, -0.9], [0, 0.9]].forEach(([fx, fy], i) => {
      const bar = new THREE.Mesh(
        i < 2 ? new THREE.BoxGeometry(0.06, 1.9, 0.04) : new THREE.BoxGeometry(2.5, 0.06, 0.04),
        frame,
      )
      bar.position.set(fx, fy, 0.01)
      win.add(bar)
    })

    if (isBack) {
      win.position.set(x, y, -RD / 2 + 0.04)
    } else {
      win.rotation.y = Math.PI / 2
      win.position.set(-RW / 2 + 0.04, y, z)
    }
    this._furniture.add(win)
    this._windowMeshRef = glass
    return win
  }

  /* ── Living Room ───────────────────────────────────────────────────────── */
  _buildLivingRoom(p) {
    const sofaColor = p.sofa ?? '#E0DDD8'
    const woodColor = p.accent ?? '#A08060'
    // Upholstery — fabric sheen for realistic cloth look
    const sofaMat = phys(sofaColor, {
      roughness: 0.93, metalness: 0,
      sheen: 0.7, sheenRoughness: 0.65,
      sheenColor: new THREE.Color(sofaColor).lerp(new THREE.Color('#FFFFFF'), 0.15),
    })
    const cushMat = phys(new THREE.Color(sofaColor).addScalar(0.05), {
      roughness: 0.95, metalness: 0,
      sheen: 0.6, sheenRoughness: 0.7,
      sheenColor: new THREE.Color(sofaColor).lerp(new THREE.Color('#FFFFFF'), 0.2),
    })
    // Varnished wood — clearcoat for polished finish
    const woodMat = phys(woodColor, {
      roughness: 0.4, metalness: 0.02,
      clearcoat: 0.5, clearcoatRoughness: 0.35,
    })
    const accentMat = phys(woodColor, {
      roughness: 0.35, metalness: 0.05,
      clearcoat: 0.3, clearcoatRoughness: 0.4,
    })
    const legMat = phys(woodColor, {
      roughness: 0.38, metalness: 0.04,
      clearcoat: 0.4, clearcoatRoughness: 0.3,
    })
    const rugBase = new THREE.Color(p.rug ?? '#DEDBD6')
    rugBase.lerp(new THREE.Color('#FFFFFF'), 0.12)
    const rugMat = new THREE.MeshStandardMaterial({ color: rugBase, roughness: 0.92 })

    // ── Large area rug ────────────────────────────────────────────────────
    const rug = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.012, 3.8), rugMat)
    rug.position.set(0.3, 0.006, 0.0)
    rug.receiveShadow = true
    this._furniture.add(rug)

    // ── Main sofa (3-seater, centre-back, facing camera) ─────────────────
    const sofaBody = this._box(3.2, 0.52, 1.0, 0.3, 0.26, -2.0, sofaMat)
    this._tag(sofaBody, 'sofa', 'Sofa body')
    this._box(3.2, 0.62, 0.2, 0.3, 0.52 + 0.31, -2.35, sofaMat)  // backrest
    this._box(0.2, 0.68, 1.0, -1.3, 0.34, -2.0, sofaMat)           // left arm
    this._box(0.2, 0.68, 1.0,  1.9, 0.34, -2.0, sofaMat)           // right arm
    ;[-0.65, 0.3, 1.25].forEach(cx => {
      this._box(0.95, 0.17, 0.85, cx, 0.52 + 0.085, -1.95, cushMat)
    })
    // Sofa legs (slim tapered)
    ;[[-1.15, -1.55], [1.7, -1.55], [-1.15, -2.4], [1.7, -2.4]].forEach(([lx, lz]) => {
      this._box(0.06, 0.18, 0.06, lx, 0.09, lz, legMat)
    })
    // Accent throw pillows at each end
    this._box(0.28, 0.3, 0.1, -1.2, 0.52 + 0.15, -2.3, accentMat)
    this._box(0.28, 0.3, 0.1,  1.8, 0.52 + 0.15, -2.3, accentMat)

    // ── Accent sofa / loveseat (left side, perpendicular) ────────────────
    const ls = this._box(1.6, 0.52, 1.0, -2.9, 0.26, -0.7, sofaMat)
    this._tag(ls, 'sofa', 'Loveseat')
    this._box(1.6, 0.62, 0.2, -2.9, 0.52 + 0.31, -1.05, sofaMat)
    this._box(0.2, 0.68, 1.0, -3.65, 0.34, -0.7, sofaMat)
    this._box(0.2, 0.68, 1.0, -2.15, 0.34, -0.7, sofaMat)
    ;[-0.5, 0.5].forEach(cx => {
      this._box(0.68, 0.17, 0.85, cx - 2.9, 0.52 + 0.085, -0.65, cushMat)
    })
    ;[[-3.5, -0.25], [-2.3, -0.25], [-3.5, -1.1], [-2.3, -1.1]].forEach(([lx, lz]) => {
      this._box(0.06, 0.18, 0.06, lx, 0.09, lz, legMat)
    })

    // ── Coffee table (square, slim hairpin-style legs) ────────────────────
    const ct = this._box(1.5, 0.05, 1.1, -0.3, 0.44, -0.8, woodMat)
    this._tag(ct, 'coffee-table', 'Coffee table')
    ;[[-0.97, -0.32], [0.37, -0.32], [-0.97, -1.27], [0.37, -1.27]].forEach(([lx, lz]) => {
      this._box(0.04, 0.40, 0.04, lx, 0.20, lz, legMat)
    })
    // Decorative tray + books on table
    this._box(0.7, 0.025, 0.5, -0.2, 0.465, -0.8, mat('#E8E2D8', 0.85))
    this._box(0.18, 0.06, 0.25, -0.4, 0.49, -0.72, mat('#D0C8B8', 0.8))
    this._box(0.18, 0.05, 0.25, -0.4, 0.545, -0.72, mat('#C8C0B0', 0.8))

    // ── Side tables + table lamps ─────────────────────────────────────────
    const stMat = woodMat
    const lampBaseMat  = phys('#D0CCC4', { roughness: 0.35, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.2 })
    const lampShadeMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#F8F4EC'), roughness: 0.75,
      emissive: new THREE.Color('#FFF8F0'), emissiveIntensity: 0.05,
      transmission: 0.25, thickness: 0.1,
    })

    const _sideLamp = (x, z) => {
      // drum table
      const st = this._box(0.5, 0.02, 0.5, x, 0.64, z, stMat)
      this._tag(st, 'floor-lamp', 'Table lamp')
      ;[[x-0.21, z-0.21],[x+0.21, z-0.21],[x-0.21, z+0.21],[x+0.21, z+0.21]].forEach(([lx, lz]) => {
        this._box(0.04, 0.64, 0.04, lx, 0.32, lz, legMat)
      })
      // lamp base (ceramic sphere)
      const base = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), lampBaseMat)
      base.position.set(x, 0.64 + 0.1 + 0.06, z)
      this._furniture.add(base)
      // cylindrical shade
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.25, 14), lampShadeMat)
      shade.position.set(x, 0.64 + 0.2 + 0.25 * 0.5 + 0.04, z)
      this._furniture.add(shade)
    }
    _sideLamp(-1.3, -2.45)   // left end of main sofa
    _sideLamp( 1.9, -2.45)   // right end of main sofa

    // ── Ceiling pendant light ─────────────────────────────────────────────
    const pendantMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#F5F2EC'), roughness: 0.5,
      emissive: new THREE.Color('#FFF8F0'), emissiveIntensity: 0.6,
    })
    const pendantRing = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.58, 0.08, 24), pendantMat)
    pendantRing.position.set(0.3, RH - 0.04, -1.2)
    this._furniture.add(pendantRing)
    const pendantDome = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.52, 0.18, 24), pendantMat)
    pendantDome.position.set(0.3, RH - 0.04 - 0.18 * 0.5, -1.2)
    this._furniture.add(pendantDome)
    // Pendant light source
    const pendLight = new THREE.PointLight('#FFF8EE', 1.2, 7)
    pendLight.position.set(0.3, RH - 0.3, -1.2)
    this.scene.add(pendLight)

    // ── Back wall: panel moulding + two artworks ──────────────────────────
    const moulding = mat(p.wall ? new THREE.Color(p.wall).addScalar(-0.04) : '#D0CEC8', 0.95)
    const panelW = 1.55
    ;[-1.55, 1.55].forEach(px => {
      // outer frame
      this._box(panelW, 0.025, 0.025, px, 0.025 * 0.5, -4.47, moulding)          // bottom
      this._box(panelW, 0.025, 0.025, px, 1.85, -4.47, moulding)                   // top
      this._box(0.025, 1.85, 0.025, px - panelW * 0.5, 1.85 * 0.5, -4.47, moulding)  // left
      this._box(0.025, 1.85, 0.025, px + panelW * 0.5, 1.85 * 0.5, -4.47, moulding)  // right
    })
    // Artwork on back wall — two framed canvases
    const frame = mat('#E8E4DC', 0.7)
    // Left canvas
    this._box(0.82, 1.05, 0.035, -1.55, 1.85, -4.46, frame)
    this._box(0.7, 0.93, 0.04, -1.55, 1.85, -4.44, mat('#E8C8A8', 0.85))
    // Right canvas (cooler tone)
    this._box(0.82, 1.05, 0.035, 1.55, 1.85, -4.46, frame)
    this._box(0.7, 0.93, 0.04, 1.55, 1.85, -4.44, mat('#B8C8CC', 0.85))

    // ── Window curtains (flanking left-wall window) ───────────────────────
    const curtainMat = mat(p.wall ? new THREE.Color(p.wall).lerp(new THREE.Color('#F8F4EE'), 0.7) : '#EDE9E2', 0.95)
    this._box(0.12, 2.2, 0.08, -4.45, 1.1,  0.8, curtainMat)   // curtain panel top
    this._box(0.12, 2.2, 0.08, -4.45, 1.1, -0.8, curtainMat)

    // ── Floor lamp (back-right corner) ────────────────────────────────────
    this._buildFloorLamp(3.2, -3.0, accentMat, 'floor-lamp')

    // ── Decorative plant vase on coffee table ─────────────────────────────
    const potMat = mat('#C0B8A8', 0.8)
    const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.22, 10), potMat)
    potBody.position.set(0.4, 0.464 + 0.11, -0.88)
    this._furniture.add(potBody)

    // ── Hotspot markers ───────────────────────────────────────────────────
    this._addHotspotMarker(new THREE.Vector3(0.3, 1.0, -2.0),    'sofa')
    this._addHotspotMarker(new THREE.Vector3(-0.3, 0.56, -0.8),  'coffee-table')
    this._addHotspotMarker(new THREE.Vector3(3.2, 2.3, -3.0),    'floor-lamp')
    this._addHotspotMarker(new THREE.Vector3(0.3, 0.01, 0.5),    'rug')
  }

  /* ── Dining Room ───────────────────────────────────────────────────────── */
  _buildDining(p) {
    const tableMat   = mat(p.table  ?? '#C0A880', 0.55, 0.06)
    const chairMat   = mat(p.chair  ?? '#B0A080', 0.8)
    const legMat     = mat('#5C4020', 0.55, 0.05)
    const sideboardM = mat(p.table  ?? '#A89870', 0.7)

    // Rug under table
    const rug = new THREE.Mesh(new THREE.BoxGeometry(5, 0.012, 3.5), mat(p.accent ?? '#D0C8B0', 0.9))
    rug.position.set(0, 0.006, 0); rug.receiveShadow = true
    this._furniture.add(rug)

    // Dining table
    const top = this._box(3.2, 0.07, 1.6, 0, 0.77, 0, tableMat)
    this._tag(top, 'table', 'Dining table')
    ;[[-1.4,-0.65],[1.4,-0.65],[-1.4,0.65],[1.4,0.65]].forEach(([lx,lz]) => {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.76,8), legMat)
      l.position.set(lx,0.38,lz); this._furniture.add(l)
    })

    // 6 chairs
    const chairPositions = [
      [-1.3, 0,-1.4, 0], [0, 0, -1.4, 0], [1.3, 0, -1.4, 0],
      [-1.3, 0,  1.4, Math.PI], [0, 0, 1.4, Math.PI], [1.3, 0, 1.4, Math.PI],
    ]
    chairPositions.forEach(([cx,,cz,ry]) => {
      const g = new THREE.Group(); g.rotation.y = ry
      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48,0.06,0.48), chairMat)
      seat.position.set(cx,0.46,cz); this._tag(seat,'chair','Chair')
      this._furniture.add(seat)
      // Back
      const bk = new THREE.Mesh(new THREE.BoxGeometry(0.46,0.52,0.06), chairMat)
      bk.position.set(cx,0.75,cz+(ry===0?-0.22:0.22)); this._tag(bk,'chair','Chair back')
      this._furniture.add(bk)
      // Legs
      ;[[-0.18,-0.18],[-0.18,0.18],[0.18,-0.18],[0.18,0.18]].forEach(([lx,lz2])=>{
        const l=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.46,6),legMat)
        l.position.set(cx+lx,0.23,cz+lz2); this._furniture.add(l)
      })
    })

    // Sideboard
    const sb = this._box(2.4,0.75,0.5, 0,0.375,-3.9, sideboardM)
    this._tag(sb,'sideboard','Sideboard')

    // Pendant light position (light only, visual mesh)
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.32,0.28,16), mat('#D4A840',0.3,0.5))
    shade.position.set(0,2.8,0); this._furniture.add(shade)
    this._pendantLight = new THREE.PointLight('#FFB060', 1.5, 6)
    this._pendantLight.position.set(0,2.7,0); this._furniture.add(this._pendantLight)

    this._addHotspotMarker(new THREE.Vector3(0,1.0,0),    'table')
    this._addHotspotMarker(new THREE.Vector3(-1.3,0.8,-1.4),'chair')
    this._addHotspotMarker(new THREE.Vector3(0,0.9,-3.9), 'sideboard')
    this._addHotspotMarker(new THREE.Vector3(0,2.8,0),    'pendant')
  }

  /* ── Bedroom ───────────────────────────────────────────────────────────── */
  _buildBedroom(p) {
    // ── Materials ─────────────────────────────────────────────────────────
    const plankColor  = p.accent  ?? '#8A7B68'   // wood-plank wall
    const bedColor    = p.bed     ?? '#2C2C2C'   // dark charcoal bed
    const floorColor  = p.floor   ?? '#221408'   // dark espresso floor
    const nsColor     = p.accent  ?? '#2A1E10'   // floating nightstand

    const plankMat = phys(plankColor, {
      roughness: 0.82, metalness: 0,
      clearcoat: 0.08, clearcoatRoughness: 0.9,
    })
    const bedMat = phys(bedColor, {
      roughness: 0.88, metalness: 0,
      sheen: 0.3, sheenRoughness: 0.8,
      sheenColor: new THREE.Color('#555555'),
    })
    const mattMat = phys('#4A4A4A', {
      roughness: 0.90, sheen: 0.5, sheenRoughness: 0.75,
    })
    const duvetMat = phys('#C8C4BE', {
      roughness: 0.93, sheen: 0.65, sheenRoughness: 0.68,
      sheenColor: new THREE.Color('#E0DDD8'),
    })
    const pilMat = phys('#A8A49E', {
      roughness: 0.88, sheen: 0.5, sheenRoughness: 0.75,
      sheenColor: new THREE.Color('#C0BCB6'),
    })
    const throwMat = phys('#F0EEE8', {
      roughness: 0.94, sheen: 0.7, sheenRoughness: 0.68,
      sheenColor: new THREE.Color('#FFFFFF'),
    })
    const nsMat = phys(nsColor, {
      roughness: 0.42, metalness: 0.02,
      clearcoat: 0.55, clearcoatRoughness: 0.3,
    })
    const metalMat = phys('#1A1A1A', { roughness: 0.3, metalness: 0.85 })
    const curtainMat = phys('#A89880', {
      roughness: 0.97, sheen: 0.85, sheenRoughness: 0.58,
      sheenColor: new THREE.Color('#C8B8A8'),
      side: THREE.DoubleSide,
    })

    // ── Horizontal wood-plank accent wall (back) — textured ──────────────
    // One wide plane with a tiled horizontal-grain wood texture is more realistic
    // than many boxes. We use a single PlaneGeometry with high-res wood texture.
    const wallWoodTex = _T.plankWall.clone(); wallWoodTex.needsUpdate = true
    wallWoodTex.repeat.set(2, 0.9)
    wallWoodTex.rotation = Math.PI / 2   // rotate 90° → horizontal grain
    const plankWallMat = phys(plankColor, {
      map: wallWoodTex,
      roughness: 0.78, metalness: 0,
      clearcoat: 0.06, clearcoatRoughness: 0.85,
    })
    const plankWall = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), plankWallMat)
    plankWall.position.set(0, RH / 2, -RD / 2 + 0.02)
    plankWall.receiveShadow = true
    this._furniture.add(plankWall)

    // Add subtle raised plank lines (thin boxes) for depth
    const plankH   = 0.145
    const plankGap = 0.008
    const plankCount = Math.ceil(RH / (plankH + plankGap)) + 1
    for (let i = 0; i < plankCount; i++) {
      const y = i * (plankH + plankGap) + plankH / 2
      // Only the gap lines, very thin dark strips
      const gap = this._box(RW, plankGap, 0.028, 0, y - plankH/2, -RD/2 + 0.025,
        phys(new THREE.Color(plankColor).multiplyScalar(0.6), { roughness:0.95 }))
      gap.receiveShadow = false
    }

    // ── Floor – dark espresso hardwood planks ─────────────────────────────
    // Override floor material already placed by _buildRoom; add plank lines
    ;[-3,-2,-1,0,1,2,3].forEach(px => {
      const line = this._box(0.02, 0.003, RD, px * 1.1, 0.002, 0, phys('#110A04', { roughness:0.95 }))
      line.receiveShadow = false
    })

    // ── White/cream fluffy rug in front of bed ────────────────────────────
    const rugMat = phys('#F2F0EB', {
      roughness: 0.97, sheen: 0.85, sheenRoughness: 0.6,
      sheenColor: new THREE.Color('#FFFFFF'),
    })
    const rug = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.022, 2.8), rugMat)
    rug.position.set(0.3, 0.011, 1.4); rug.receiveShadow = true
    this._furniture.add(rug)

    // ── Platform bed (very low, near-floor) ───────────────────────────────
    // Stage platform
    const platform = this._box(2.8, 0.10, 3.8, 0, 0.05, -0.6, bedMat)
    platform.castShadow = true; this._tag(platform, 'bed', 'Platform')

    // Bed frame on platform (dark, low)
    const frame = this._box(2.5, 0.20, 3.4, 0, 0.20, -0.6, bedMat)
    frame.castShadow = true; this._tag(frame, 'bed', 'Bed frame')

    // Mattress
    const matt = this._box(2.3, 0.22, 3.0, 0, 0.41, -0.6, mattMat)
    matt.castShadow = true

    // Duvet (pulled slightly down)
    const duvet = this._box(2.2, 0.12, 2.0, 0, 0.60, -0.2, duvetMat)
    duvet.castShadow = true; this._tag(duvet, 'bed', 'Bedding')

    // White throw blanket (draped at foot, ref image)
    const thr = this._box(1.8, 0.06, 0.65, 0.2, 0.62, 1.0, throwMat)
    thr.castShadow = true

    // Pillows × 4 (2 rows like reference)
    ;[-0.55, 0.55].forEach((px, i) => {
      // Sleeping pillows (back)
      const pl = this._box(0.68, 0.14, 0.42, px, 0.65, -1.55, pilMat)
      pl.castShadow = true; this._tag(pl, 'bed', 'Pillow')
      // Accent cushions (front, upright)
      const dp = this._box(0.5, 0.42, 0.10, px * 0.85, 0.73, -1.28,
        phys(i === 0 ? '#7A7068' : '#9A8E80', { roughness:0.88, sheen:0.4 }))
      dp.castShadow = true
    })


    // ── Floating wall-mounted nightstands ─────────────────────────────────
    const nsZ = -1.48   // flush against wood wall (not headboard)
    ;[-1.38, 1.38].forEach((nx, si) => {
      // Thin floating shelf
      const ns = this._box(0.55, 0.06, 0.38, nx, 0.55, nsZ, nsMat)
      ns.castShadow = true; this._tag(ns, 'nightstand', 'Floating nightstand')
      // Wall bracket
      this._box(0.04, 0.18, 0.36, nx, 0.46, nsZ, nsMat)

      // Glowing cube lamp (reference — white box with warm emissive glow)
      const cubeLamp = this._box(0.20, 0.22, 0.20, nx, 0.69, nsZ,
        phys('#FFF8F0', {
          roughness: 0.4,
          emissive: new THREE.Color('#FFE0A0'),
          emissiveIntensity: 0.0,   // animated in setNightMode
        }))
      cubeLamp.castShadow = false
      this._tag(cubeLamp, 'lamp', 'Bedside lamp')

      // Store ref for emissive animation
      if (si === 0) this._bedLampMesh1 = cubeLamp.material
      else          this._bedLampMesh2 = cubeLamp.material

      // Point light from cube
      const lmp = new THREE.PointLight('#FFD080', 0, 2.6)
      lmp.position.set(nx, 0.80, nsZ - 0.1)
      this._furniture.add(lmp)
      if (!this._lampLight) this._lampLight = lmp
    })

    // ── Black arm wall sconces above headboard ────────────────────────────
    ;[-0.5, 0.5].forEach(sx => {
      // Wall plate
      this._box(0.04, 0.06, 0.04, sx, 1.72, -4.46, metalMat)
      // Arm — angled down
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.30,6), metalMat)
      arm.rotation.z = Math.PI / 5
      arm.position.set(sx + (sx<0?-0.06:0.06), 1.62, -4.40)
      this._furniture.add(arm)
      // Small spot shade
      const scShade = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.055,0.10,8), metalMat)
      scShade.position.set(sx + (sx<0?-0.14:0.14), 1.50, -4.35)
      scShade.rotation.z = sx < 0 ? -0.5 : 0.5
      this._furniture.add(scShade)
    })

    // ── Colorful abstract artwork — left of wood wall ─────────────────────
    // Canvas
    const canvas = this._box(1.35, 1.10, 0.03, -2.8, 2.05, -4.46,
      phys('#1A1208', { roughness:0.5 }))
    // Color patches (abstract art)
    const artColors = ['#C04828','#3A78A8','#D88830','#2A4A6A','#E84020','#5090C0']
    artColors.forEach((col, i) => {
      const px2 = -2.8 + (i % 3 - 1) * 0.38
      const py2 = 2.05 + (i < 3 ? 0.28 : -0.28)
      this._box(0.34, 0.44, 0.035, px2, py2, -4.44, phys(col, { roughness:0.65 }))
    })
    // Picture frame
    ;[[-2.8, 2.05, 1.38, 0.04],[-2.8, 2.05, 0.04, 1.14]].forEach(([fx,fy,fw,fh]) => {
      ;[-1,1].forEach(side => {
        this._box(fw, 0.03, 0.04, fx + (fw>0.1 ? 0 : side*0.675), fy + (fh>0.1 ? side*0.565 : 0), -4.43,
          phys('#1A1208', { roughness:0.4, metalness:0.1 }))
      })
    })

    // ── Floor-to-ceiling curtains — right wall ────────────────────────────
    const curtainW = 1.2
    const curtainH = RH * 0.94
    ;[0.0, 1.3].forEach((cz, ci) => {
      const fold = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, curtainH, curtainW),
        curtainMat)
      fold.position.set(RW/2 - 0.08, curtainH/2, cz - 0.5)
      fold.castShadow = true
      this._furniture.add(fold)
    })
    // Curtain rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,3.0,8), metalMat)
    rod.rotation.z = Math.PI/2
    rod.position.set(RW/2 - 0.08, RH - 0.12, 0.1)
    this._furniture.add(rod)

    // ── Wardrobe (right back, minimal presence) ───────────────────────────
    const wardMat2 = phys(nsColor, { roughness:0.5, clearcoat:0.3 })
    const ward = this._box(2.0, 2.7, 0.58, 2.8, 1.35, -3.9, wardMat2)
    ward.castShadow = true; this._tag(ward, 'wardrobe', 'Wardrobe')
    ;[-0.48, 0.48].forEach(dx => {
      this._box(0.9, 2.5, 0.02, 2.8 + dx, 1.35, -3.62, phys('#3A2A1A', { roughness:0.45 }))
    })

    // ── Hotspot markers ───────────────────────────────────────────────────
    this._addHotspotMarker(new THREE.Vector3(0, 1.0, -0.6),      'bed')
    this._addHotspotMarker(new THREE.Vector3(-1.38, 0.8, -1.48), 'nightstand')
    this._addHotspotMarker(new THREE.Vector3(2.8, 1.8, -3.9),    'wardrobe')
    this._addHotspotMarker(new THREE.Vector3(-1.38, 0.9, -1.48), 'lamp')
  }

  /* ── Home Office ───────────────────────────────────────────────────────── */
  _buildOffice(p) {
    const deskM   = mat(p.desk    ?? '#C8BBA8', 0.6, 0.04)
    const shelfM  = mat(p.shelves ?? '#D0C8B8', 0.65)
    const legM    = mat('#3A3A3A', 0.5, 0.4)
    const chairM  = mat('#2A2A2A', 0.6)

    // Desk
    const desk = this._box(2.2,0.05,0.8, 0,0.76,0, deskM)
    this._tag(desk,'desk','Desk top')
    ;[[-0.95,-0.36],[0.95,-0.36],[-0.95,0.36],[0.95,0.36]].forEach(([lx,lz])=>{
      const l=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.77,6),legM)
      l.position.set(lx,0.385,lz); this._furniture.add(l)
    })
    // Monitor
    const mon = this._box(0.06,0.55,0.96, 0,1.1,0, mat('#181818',0.2,0.7))
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.12,0.22,8), legM)
    stand.position.set(0,0.9,0.1); this._furniture.add(stand)
    // Desk lamp
    const deskL = this._box(0.04,0.5,0.04, 0.8,1.01,-0.25, legM)
    const deskShd = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.16,0.14,8), mat('#D4A840',0.3,0.4))
    deskShd.position.set(0.8,1.26,-0.25); this._furniture.add(deskShd)
    this._tag(deskShd,'lamp','Desk lamp')

    // Task chair
    const seat = this._box(0.54,0.07,0.54, 0,0.5,1.2, chairM)
    this._tag(seat,'chair','Chair seat')
    const chBack = this._box(0.48,0.52,0.06, 0,0.8,1.46, chairM)
    this._tag(chBack,'chair','Chair back')
    const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.5,6), legM)
    pole2.position.set(0,0.25,1.2); this._furniture.add(pole2)

    // Shelves on back wall
    ;[-0.6,0.0,0.6].forEach(sy => {
      const s = this._box(2.6,0.04,0.22, -3.5,2.4+sy,-3.5, shelfM)
      this._tag(s,'shelves','Shelf')
    })
    // Shelf bracket
    const br = this._box(0.04,0.7,0.2, -2.2,2.1,-3.5, legM)

    // Rug
    const rug = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.012, 2.5), mat('#D8D0C0',0.92))
    rug.position.set(0, 0.006, 0.5); rug.receiveShadow = true
    this._furniture.add(rug)

    this._addHotspotMarker(new THREE.Vector3(0,0.9,0),    'desk')
    this._addHotspotMarker(new THREE.Vector3(0,0.9,1.2),  'chair')
    this._addHotspotMarker(new THREE.Vector3(-3.5,2.5,-3.5),'shelves')
    this._addHotspotMarker(new THREE.Vector3(0.8,1.3,-0.25),'lamp')
  }

  /* ── Kitchen ───────────────────────────────────────────────────────────── */
  _buildKitchen(p) {
    const cabM    = mat(p.cabinet ?? '#EEEBE4', 0.75)
    const countM  = mat(p.counter ?? '#D8D0C0', 0.4, 0.05)
    const accentM = mat(p.accent  ?? '#C09030', 0.3, 0.5)

    // Left counter run
    this._box(0.6,0.88,5.5, -4.1,0.44,0, cabM)
    const cLeft = this._box(0.65,0.05,5.6, -4.05,0.9,0, countM)
    this._tag(cLeft,'counter','Counter L')

    // Back counter run
    this._box(5.5,0.88,0.6, -1.0,0.44,-3.9, cabM)
    const cBack = this._box(5.6,0.05,0.65, -1.0,0.9,-3.85, countM)
    this._tag(cBack,'counter','Counter back')

    // Upper cabinets
    this._box(0.54,0.9,5.2, -4.12,2.35,0, mat('#F5F2EC',0.8))
    this._box(5.2,0.9,0.54, -1.0,2.35,-3.86, mat('#F5F2EC',0.8))

    // Island
    const isl = this._box(2.2,0.9,1.0, 1.4,0.45,0.5, cabM)
    this._tag(isl,'island','Island')
    const islTop = this._box(2.3,0.05,1.1, 1.4,0.92,0.5, countM)
    this._tag(islTop,'island','Island top')

    // Bar stools
    ;[0.6,1.4,2.2].forEach(sx => {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.05,10), mat('#D0C8B8',0.8))
      stool.position.set(sx,1.02,1.6); this._tag(stool,'stool','Bar stool')
      this._furniture.add(stool)
      const sleg = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,1.0,6), mat('#5A5A5A',0.5,0.4))
      sleg.position.set(sx,0.52,1.6); this._furniture.add(sleg)
    })

    // Open shelves on right wall
    ;[1.6, 2.1].forEach(sy => {
      const sh = this._box(2.0,0.04,0.22, 3.5,sy,-3.5, countM)
      this._tag(sh,'shelves','Open shelf')
    })

    // Sink
    const sink = this._box(0.7,0.04,0.5, -4.05,0.92,1.0, mat('#D8D8D4',0.3,0.3))

    // Handles (accent)
    ;[0,1,2,3].forEach(i => {
      this._box(0.03,0.18,0.03, -3.75,0.5+i*0, -0.5+i*0.6, accentM)
    })

    this._addHotspotMarker(new THREE.Vector3(-4.05,1.1,0),   'counter')
    this._addHotspotMarker(new THREE.Vector3(1.4,1.1,0.5),   'island')
    this._addHotspotMarker(new THREE.Vector3(1.4,1.3,1.6),   'stool')
    this._addHotspotMarker(new THREE.Vector3(3.5,1.9,-3.5),  'shelves')
  }

  /* ── Furniture helpers ─────────────────────────────────────────────────── */

  _box(w, h, d, x, y, z, material) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    this._furniture.add(m)
    return m
  }

  _tag(mesh, key, label) {
    mesh.userData.hotspot = { key, label }
    this._clickables.push(mesh)
  }

  _addHotspotMarker(pos, key) {
    const mat2 = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#C8920A'),
      emissive: new THREE.Color('#C8920A'),
      emissiveIntensity: 0.4,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85,
    })
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), mat2)
    sphere.position.copy(pos)
    sphere.userData.hotspot = { key }
    this._hotspotMarkers.push(sphere)
    this._clickables.push(sphere)
    this._furniture.add(sphere)
  }

  _buildFloorLamp(x, z, accentMat, key) {
    const poleM = mat('#8B8070', 0.5, 0.3)
    const base  = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,0.04,16), poleM)
    base.position.set(x, 0.02, z); this._furniture.add(base)
    const pole  = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,2.2,8), poleM)
    pole.position.set(x, 1.12, z); this._furniture.add(pole)
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.36,0.3,14), accentMat)
    shade.position.set(x, 2.35, z); this._tag(shade, key, 'Lamp shade')
    this._furniture.add(shade)
    this._lampLight = new THREE.PointLight('#FFA040', 0.0, 4.5)
    this._lampLight.position.set(x, 2.2, z)
    this._furniture.add(this._lampLight)
  }

  /* ── Lighting ──────────────────────────────────────────────────────────── */

  _buildLights() {
    // Remove existing lights
    const toRemove = []
    this.scene.traverse(c => { if (c.isLight && c !== this._lampLight && c !== this._pendantLight) toRemove.push(c) })
    toRemove.forEach(l => this.scene.remove(l))

    // Sky/ground hemisphere — gives a natural gradient ambient
    this._hemiLight = new THREE.HemisphereLight('#B0CCE8', '#D4A860', 0)
    this.scene.add(this._hemiLight)

    // Soft fill ambient
    this._ambientLight = new THREE.AmbientLight('#FFF8EE', 0)
    this.scene.add(this._ambientLight)

    // Key sun light (casting shadows)
    this._sunLight = new THREE.DirectionalLight('#FFFAF0', 0)
    this._sunLight.position.set(5, 9, 5)
    this._sunLight.castShadow = true
    this._sunLight.shadow.mapSize.set(4096, 4096)
    this._sunLight.shadow.camera.near = 1
    this._sunLight.shadow.camera.far  = 32
    this._sunLight.shadow.camera.left = this._sunLight.shadow.camera.bottom = -8
    this._sunLight.shadow.camera.right = this._sunLight.shadow.camera.top  =  8
    this._sunLight.shadow.bias         = -0.0008
    this._sunLight.shadow.normalBias   = 0.02
    this.scene.add(this._sunLight)

    // Warm fill from camera-side
    this._fillLight = new THREE.DirectionalLight('#FFE8C8', 0)
    this._fillLight.position.set(0, 3, 8)
    this.scene.add(this._fillLight)

    // Window area light — simulates light flooding through the window
    this._winAreaLight = new THREE.RectAreaLight('#C8E4FF', 0, 2.8, 2.0)
    this._winAreaLight.position.set(-RW / 2 + 0.15, 2.0, 0)
    this._winAreaLight.rotation.y = Math.PI / 2
    this.scene.add(this._winAreaLight)

    // Night — cool moonlight
    this._moonLight = new THREE.DirectionalLight('#2838B0', 0)
    this._moonLight.position.set(-6, 5, -2)
    this.scene.add(this._moonLight)
  }

  setDayMode() {
    this._isNight = false
    const dur = 1.4

    gsap.to(this._hemiLight,    { intensity: 0.10, duration: dur })
    gsap.to(this._ambientLight, { intensity: 0.08, duration: dur })
    gsap.to(this._sunLight,     { intensity: 0.75, duration: dur })
    gsap.to(this._fillLight,    { intensity: 0.14, duration: dur })
    gsap.to(this._winAreaLight, { intensity: 1.8,  duration: dur })
    gsap.to(this._moonLight,    { intensity: 0.0,  duration: dur })
    if (this._lampLight)    gsap.to(this._lampLight,    { intensity: 0.0, duration: dur })
    if (this._pendantLight) gsap.to(this._pendantLight, { intensity: 0.0, duration: dur })
    if (this._bedLampMesh1) gsap.to(this._bedLampMesh1, { emissiveIntensity: 0.0, duration: dur })
    if (this._bedLampMesh2) gsap.to(this._bedLampMesh2, { emissiveIntensity: 0.0, duration: dur })

    if (this._windowMeshRef) {
      gsap.to(this._windowMeshRef.material.color,    { r: 0.9,  g: 0.96, b: 1.0,  duration: dur })
      gsap.to(this._windowMeshRef.material.emissive, { r: 0.65, g: 0.82, b: 1.0,  duration: dur })
      gsap.to(this._windowMeshRef.material, { emissiveIntensity: 0.9, opacity: 0.65, duration: dur })
    }

    gsap.to(this.scene.background, { r: 0.94, g: 0.93, b: 0.91, duration: dur })
    gsap.to(this.renderer, { toneMappingExposure: 0.70, duration: dur })
  }

  setNightMode() {
    this._isNight = true
    const dur = 1.4

    gsap.to(this._hemiLight,    { intensity: 0.0,  duration: dur })
    gsap.to(this._ambientLight, { intensity: 0.12, duration: dur })
    gsap.to(this._sunLight,     { intensity: 0.0,  duration: dur })
    gsap.to(this._fillLight,    { intensity: 0.0,  duration: dur })
    gsap.to(this._winAreaLight, { intensity: 0.0,  duration: dur })
    gsap.to(this._moonLight,    { intensity: 0.35, duration: dur })
    if (this._lampLight)    gsap.to(this._lampLight,    { intensity: 2.8,  duration: dur })
    if (this._pendantLight) gsap.to(this._pendantLight, { intensity: 2.5,  duration: dur })
    if (this._bedLampMesh1) gsap.to(this._bedLampMesh1, { emissiveIntensity: 1.8, duration: dur })
    if (this._bedLampMesh2) gsap.to(this._bedLampMesh2, { emissiveIntensity: 1.8, duration: dur })

    if (this._windowMeshRef) {
      gsap.to(this._windowMeshRef.material.color,    { r: 0.04, g: 0.05, b: 0.12, duration: dur })
      gsap.to(this._windowMeshRef.material.emissive, { r: 0.04, g: 0.05, b: 0.12, duration: dur })
      gsap.to(this._windowMeshRef.material, { emissiveIntensity: 0.15, opacity: 0.9, duration: dur })
    }

    gsap.to(this.scene.background, { r: 0.05, g: 0.05, b: 0.07, duration: dur })
    gsap.to(this.renderer, { toneMappingExposure: 0.28, duration: dur })
  }

  /* ── Interaction ───────────────────────────────────────────────────────── */

  _onClick(e) {
    const hit = this._raycast(e)
    if (hit && hit.object.userData.hotspot) {
      this.onHotspotClick?.(hit.object.userData.hotspot.key)
    }
  }

  _onMove(e) {
    const hit = this._raycast(e)
    this.renderer.domElement.style.cursor = (hit && hit.object.userData.hotspot) ? 'pointer' : 'default'
    // Pulse markers on hover
    this._hotspotMarkers.forEach(m => {
      const isHit = hit && hit.object === m
      gsap.to(m.scale, { x: isHit ? 1.5 : 1, y: isHit ? 1.5 : 1, z: isHit ? 1.5 : 1, duration: 0.2 })
    })
  }

  _raycast(e) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this._mouse.set(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top)  / rect.height) * 2 + 1,
    )
    this._raycaster.setFromCamera(this._mouse, this.camera)
    const hits = this._raycaster.intersectObjects(this._clickables, false)
    return hits.length > 0 ? hits[0] : null
  }

  /* ── Resize / render ───────────────────────────────────────────────────── */

  _onResize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this._composer?.setSize(w, h)
  }

  _tick() {
    requestAnimationFrame(() => this._tick())
    const t = performance.now() * 0.001
    this._hotspotMarkers.forEach((m, i) => {
      m.material.emissiveIntensity = 0.3 + Math.sin(t * 2 + i) * 0.15
    })
    if (this._composer) {
      this._composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

  destroy() {
    this._composer?.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
