import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

/* ─── WebGL image plane with mouse-driven wave distortion ─── */

const VERT = /* glsl */`
  varying vec2 vUv;
  uniform vec2  uMouse;
  uniform float uStrength;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float d = distance(uv, uMouse);
    float r = 0.40;
    float wave = sin((1.0 - d/r) * 3.14159) * uStrength
                 * (1.0 - smoothstep(0.0, r, d)) * 0.06;
    // ambient breathe
    pos.z += sin(uTime * 0.4 + uv.x * 2.0) * 0.003;
    pos.z += wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const FRAG = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2  uMouse;
  uniform vec2  uVelocity;
  uniform float uStrength;

  void main() {
    vec2 uv = vUv;
    float d = distance(uv, uMouse);
    float mask = (1.0 - smoothstep(0.0, 0.36, d)) * uStrength;
    uv += uVelocity * mask * 4.5;
    gl_FragColor = texture2D(uTex, uv);
  }
`

function RoomPlane ({ src, accent }) {
  const meshRef  = useRef()
  const mouse    = useRef(new THREE.Vector2(0.5, 0.5))
  const tMouse   = useRef(new THREE.Vector2(0.5, 0.5))
  const strength = useRef(0)
  const tStrength = useRef(0)
  const prevMouse = useRef(new THREE.Vector2(0.5, 0.5))
  const { gl, size, viewport } = useThree()

  const texture = useTexture(src)
  texture.minFilter = texture.magFilter = THREE.LinearFilter
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping

  // cover-fit texture to viewport aspect
  useEffect(() => {
    const iAspect = 1400 / 933   // source image native aspect
    const cAspect = size.width / size.height
    if (cAspect > iAspect) {
      texture.repeat.set(1, iAspect / cAspect)
      texture.offset.set(0, (1 - iAspect / cAspect) / 2)
    } else {
      texture.repeat.set(cAspect / iAspect, 1)
      texture.offset.set((1 - cAspect / iAspect) / 2, 0)
    }
    texture.needsUpdate = true
  }, [size, texture])

  useEffect(() => {
    const canvas = gl.domElement
    const onMove = e => {
      const r  = canvas.getBoundingClientRect()
      tMouse.current.set(
        (e.clientX - r.left) / r.width,
        1 - (e.clientY - r.top) / r.height
      )
      tStrength.current = 1
    }
    const onLeave = () => { tStrength.current = 0 }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)
    return () => {
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [gl])

  const uni = useRef({
    uTex:      { value: texture },
    uMouse:    { value: new THREE.Vector2(0.5, 0.5) },
    uVelocity: { value: new THREE.Vector2(0, 0) },
    uStrength: { value: 0 },
    uTime:     { value: 0 },
  })

  // Keep uniform in sync when texture object changes (style switch)
  useEffect(() => {
    uni.current.uTex.value = texture
  }, [texture])

  useFrame(({ clock }) => {
    const px = mouse.current.x, py = mouse.current.y
    mouse.current.x  += (tMouse.current.x - mouse.current.x) * 0.07
    mouse.current.y  += (tMouse.current.y - mouse.current.y) * 0.07
    strength.current += (tStrength.current - strength.current) * 0.055

    const m = meshRef.current.material
    m.uniforms.uMouse.value.set(mouse.current.x, mouse.current.y)
    m.uniforms.uVelocity.value.set(mouse.current.x - px, mouse.current.y - py)
    m.uniforms.uStrength.value = strength.current
    m.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh ref={meshRef}>
      {/* viewport.width/height are world-space units — fills the orthographic frustum exactly */}
      <planeGeometry args={[viewport.width, viewport.height, 32, 32]} />
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uni.current}
      />
    </mesh>
  )
}

/* ─── Full Canvas export ─── */
export default function Scene3D ({ style, accent }) {
  return (
    <Canvas
      orthographic
      camera={{ near: 0.1, far: 1000, zoom: 1, position: [0, 0, 5] }}
      gl={{ antialias: false, alpha: false }}
      dpr={[1, 1.5]}
      style={{ background: '#0e0e0e' }}
    >
      <Suspense fallback={null}>
        <RoomPlane src={style.image} accent={accent} />
      </Suspense>
    </Canvas>
  )
}
