// Hero artifact: a glass gate-core with orbiting rings, shards and dust.
// Follows the pointer, and drifts back as the page scrolls.

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Float } from '@react-three/drei'
import * as THREE from 'three'

function Core({ lite }: { lite: boolean }) {
  const group = useRef<THREE.Group>(null)
  const rings = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Mesh>(null)
  const shards = useRef<THREE.InstancedMesh>(null)

  const SHARDS = 26
  const seeds = useMemo(() => Array.from({ length: SHARDS }, (_, i) => ({
    r: 1.9 + Math.random() * 1.0, a: (i / SHARDS) * Math.PI * 2, y: (Math.random() - 0.5) * 2.2,
    s: 0.05 + Math.random() * 0.12, sp: 0.08 + Math.random() * 0.12, rot: Math.random() * Math.PI,
  })), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.2)
    const g = group.current!
    // pointer parallax
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, state.pointer.x * 0.45 + t * 0.06, 3, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.25, 3, dt)
    // scroll: sink back and fade toward the next section
    g.position.z = THREE.MathUtils.damp(g.position.z, -scroll * 3, 4, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, scroll * 1.2, 4, dt)

    rings.current!.children.forEach((r, i) => { r.rotation.z += dt * (0.12 + i * 0.07) * (i % 2 ? -1 : 1) })
    const pulse = 1 + Math.sin(t * 2.2) * 0.06
    inner.current!.scale.setScalar(pulse)

    seeds.forEach((s, i) => {
      const a = s.a + t * s.sp
      dummy.position.set(Math.cos(a) * s.r, s.y + Math.sin(t * 0.8 + i) * 0.15, Math.sin(a) * s.r)
      dummy.rotation.set(s.rot + t * 0.6, s.rot + t * 0.4, 0)
      dummy.scale.set(s.s, s.s * 2.4, s.s)
      dummy.updateMatrix()
      shards.current!.setMatrixAt(i, dummy.matrix)
    })
    shards.current!.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={group}>
      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
        {/* glass shell */}
        <mesh>
          <icosahedronGeometry args={[1.25, 0]} />
          {lite ? (
            <meshPhysicalMaterial color="#bff8ef" metalness={0.2} roughness={0.05} transparent opacity={0.35} side={THREE.DoubleSide}
              iridescence={0.8} clearcoat={1} envMapIntensity={1.4} depthWrite={false} />
          ) : (
            <meshPhysicalMaterial color="#cffff7" metalness={0.05} roughness={0.04} transmission={1} thickness={1.4} ior={1.45}
              iridescence={0.8} iridescenceIOR={1.3} clearcoat={1} envMapIntensity={1.4} attenuationColor="#2ef2d0" attenuationDistance={2.5} />
          )}
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.IcosahedronGeometry(1.262, 0)]} />
          <lineBasicMaterial color="#7ffff0" transparent opacity={0.55} />
        </lineSegments>
        {/* glowing core */}
        <mesh ref={inner}>
          <icosahedronGeometry args={[0.38, 3]} />
          <meshBasicMaterial color={new THREE.Color('#2ef2d0').multiplyScalar(1.6)} toneMapped={false} />
        </mesh>
        <pointLight color="#2ef2d0" intensity={12} distance={6} />
      </Float>

      <group ref={rings}>
        {[[1.95, 0.012, 1.2, 0.2, '#e7c26b'], [2.35, 0.008, 1.45, -0.5, '#2ef2d0'], [2.8, 0.006, 1.05, 0.9, '#3ba9ff']].map(([r, w, rx, ry, c], i) => (
          <mesh key={i} rotation={[rx as number, ry as number, 0]}>
            <torusGeometry args={[r as number, w as number, 12, 220]} />
            <meshBasicMaterial color={new THREE.Color(c as string).multiplyScalar(1.4)} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <instancedMesh ref={shards} args={[undefined, undefined, SHARDS]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#9fe9df" metalness={0.9} roughness={0.15} envMapIntensity={1.3} />
      </instancedMesh>
    </group>
  )
}

function Dust() {
  const ref = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const n = 900, p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      p[i * 3] = (Math.random() - 0.5) * 22; p[i * 3 + 1] = (Math.random() - 0.5) * 14; p[i * 3 + 2] = (Math.random() - 0.5) * 12 - 3
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g
  }, [])
  useFrame((_, dt) => { ref.current!.rotation.y += dt * 0.012; ref.current!.position.y += Math.sin(Date.now() / 4000) * 0.0008 })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.028} color="#9ffcf0" transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  )
}

export default function Hero3D() {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 760
  return (
    <div className="hero-canvas">
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, mobile ? 12 : 9.2], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 5, 3]} intensity={1.4} />
      <group position={mobile ? [0.4, 2.75, 0] : [3.35, 0.25, 0]} scale={mobile ? 0.6 : 0.92}>
        <Core lite={mobile} />
      </group>
      <Dust />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} color="#2ef2d0" position={[-4, 2, -3]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#3ba9ff" position={[4, -1, -2]} scale={[5, 3, 1]} />
        <Lightformer form="ring" intensity={2.5} color="#ffffff" position={[0, 4, 3]} scale={3} />
        <Lightformer form="rect" intensity={1.2} color="#e7c26b" position={[0, -4, 1]} scale={[8, 1, 1]} />
      </Environment>
    </Canvas>
    </div>
  )
}
