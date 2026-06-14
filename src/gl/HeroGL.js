/**
 * HeroGL — Three.js WebGL mouse-distortion effect for the hero image.
 * Renders the image as a shader plane; on mouse move the image ripples
 * and stretches in the direction of the cursor velocity.
 */
import * as THREE from 'three'

const VERT = /* glsl */`
  varying vec2 vUv;
  uniform vec2  uMouse;
  uniform float uStrength;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float dist   = distance(uv, uMouse);
    float radius = 0.42;
    float bump   = sin((1.0 - dist / radius) * 3.14159)
                   * uStrength
                   * (1.0 - smoothstep(0.0, radius, dist))
                   * 0.05;
    pos.z += bump;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const FRAG = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2      uMouse;
  uniform vec2      uVelocity;
  uniform float     uStrength;

  void main() {
    vec2  uv   = vUv;
    float dist = distance(uv, uMouse);
    float mask = (1.0 - smoothstep(0.0, 0.38, dist)) * uStrength;
    uv += uVelocity * mask * 5.5;
    gl_FragColor = texture2D(uTex, uv);
  }
`

export class HeroGL {
  constructor (container) {
    this.container  = container
    this._mouse     = { x: 0.5, y: 0.5 }
    this._tMouse    = { x: 0.5, y: 0.5 }
    this._strength  = 0
    this._tStrength = 0
    this._alive     = true
  }

  init (src, onReady) {
    const W = this.container.offsetWidth
    const H = this.container.offsetHeight

    /* Renderer */
    this._renderer = new THREE.WebGLRenderer({ antialias: false })
    this._renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    this._renderer.setSize(W, H)

    const c = this._renderer.domElement
    c.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;' +
      'display:block;opacity:0;transition:opacity .7s ease;z-index:1'
    this.container.appendChild(c)

    /* Scene */
    this._scene  = new THREE.Scene()
    this._camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1)

    /* Texture */
    this._tex = new THREE.TextureLoader().load(src, t => {
      t.minFilter = t.magFilter = THREE.LinearFilter
      this._cover(t, W, H)
      c.style.opacity = '1'
      onReady?.()
    })

    /* Uniforms + material */
    this._uni = {
      uTex:      { value: this._tex },
      uMouse:    { value: new THREE.Vector2(0.5, 0.5) },
      uVelocity: { value: new THREE.Vector2(0, 0) },
      uStrength: { value: 0 },
    }

    this._scene.add(
      new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1, 28, 28),
        new THREE.ShaderMaterial({ uniforms: this._uni, vertexShader: VERT, fragmentShader: FRAG })
      )
    )

    /* Events */
    this.container.addEventListener('mousemove', e => {
      const r  = this.container.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width
      const ny = 1 - (e.clientY - r.top) / r.height
      this._tMouse.x = nx
      this._tMouse.y = ny
      this._tStrength = 1
    })
    this.container.addEventListener('mouseleave', () => { this._tStrength = 0 })
    window.addEventListener('resize', () => {
      const nw = this.container.offsetWidth
      const nh = this.container.offsetHeight
      this._renderer.setSize(nw, nh)
      this._cover(this._tex, nw, nh)
    })

    this._raf()
    return this
  }

  _cover (t, w, h) {
    const ia = 1800 / 1200   // source image aspect ~1.5
    const ca = w / h
    if (ca > ia) {
      t.repeat.set(1, ia / ca)
      t.offset.set(0, (1 - ia / ca) / 2)
    } else {
      t.repeat.set(ca / ia, 1)
      t.offset.set((1 - ca / ia) / 2, 0)
    }
    t.needsUpdate = true
  }

  _L (a, b, t) { return a + (b - a) * t }

  _raf () {
    if (!this._alive) return
    requestAnimationFrame(() => this._raf())

    const px = this._mouse.x, py = this._mouse.y
    this._mouse.x  = this._L(this._mouse.x, this._tMouse.x, 0.08)
    this._mouse.y  = this._L(this._mouse.y, this._tMouse.y, 0.08)
    this._strength = this._L(this._strength, this._tStrength, 0.055)

    this._uni.uMouse.value.set(this._mouse.x, this._mouse.y)
    this._uni.uVelocity.value.set(this._mouse.x - px, this._mouse.y - py)
    this._uni.uStrength.value = this._strength

    this._renderer.render(this._scene, this._camera)
  }

  destroy () {
    this._alive = false
    this._renderer.dispose()
    this._renderer.domElement?.remove()
  }
}
