import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import fragmentShader from '../shader/test/fragment.glsl'
import { useControls } from 'leva'
import * as THREE from 'three'

export default function Refraction() {
  const { gl, scene, camera, size } = useThree()
  const fboRef = useRef(null)
  const dpr = gl.getPixelRatio()
  if (!fboRef.current) {
    fboRef.current = new THREE.WebGLRenderTarget(
      size.width * dpr,
      size.height * dpr         // 初始高
    )
  }
  const sceneFBO = fboRef.current

  const groupRef = useRef()

  const uniforms = useMemo(() => ({
    uAlpha: { value: 1 },
    uResolution: { value: new THREE.Vector2(sceneFBO.width, sceneFBO.height) },
    uSceneFBO: { value: null },
  }), [])


  useFrame(() => {

    groupRef.current.visible = false
    gl.setRenderTarget(sceneFBO)
    gl.render(scene, camera)

    groupRef.current.visible = true
    gl.setRenderTarget(null)
    gl.render(scene, camera)

    uniforms.uResolution.value.set(sceneFBO.width, sceneFBO.height)
    uniforms.uSceneFBO.value = sceneFBO.texture

  }, 1)

  const thickness = 0.1

  return (
    <>
      <mesh position={[0, 0, -2]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial color="#ffffff" metalness={0.5} roughness={0.2} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>

      <group ref={groupRef}>
        {Array.from({ length: 100 }).map((_, i) => (
          <mesh key={i} position={[(i - 50) * thickness * 2, 0, 0]}>
            <cylinderGeometry args={[thickness, thickness, 1, 32]} />
            <shaderMaterial
              vertexShader={`
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
                }
              `}
              fragmentShader={fragmentShader}
              uniforms={uniforms}
            />
          </mesh>
        ))}
      </group>
    </>
  )
}
