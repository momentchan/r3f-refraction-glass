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

  const { refractionDistance, ior } = useControls('Refraction', {
    refractionDistance: {
      value: 0.3,
      min: 0.1,
      max: 10.0,
      step: 0.1
    },
    ior: {
      value: 1.33,
      min: 1.0,
      max: 2.5,
      step: 0.01
    }
  })


  const uniforms = useMemo(() => ({
    uAlpha: { value: 1 },
    uResolution: { value: new THREE.Vector2(sceneFBO.width, sceneFBO.height) },
    uSceneFBO: { value: null },
    uRefractionDistance: { value: refractionDistance },
    uIOR: { value: ior }
  }), [])


  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewVector;
      varying vec4 vRefractedNDC;

      uniform float uRefractionDistance;
      uniform float uIOR;

      void main() {
          vUv = uv;

          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;

          vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
          vWorldNormal = worldNormal;

          vec3 viewVector = normalize(cameraPosition - vWorldPosition);
          vViewVector = viewVector;

          // Calculate refracted ray and exit point in world space
          vec3 refractedVector = refract(-viewVector, worldNormal, 1.0 / uIOR);
          vec3 refractedRayExit = vWorldPosition + refractedVector * uRefractionDistance;

          // Project it to clip space (MVP)
          vec4 viewPos = viewMatrix * vec4(refractedRayExit, 1.0);
          vRefractedNDC = projectionMatrix * viewPos;

          gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
      fragmentShader: /* glsl */ `
      #include <common>

      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewVector;
      varying vec4 vRefractedNDC;

      uniform float uAlpha;
      uniform vec2 uResolution;
      uniform sampler2D uSceneFBO;

      void main() {
        // Convert from NDC to screen-space UV
        vec2 refractionCoords = vRefractedNDC.xy / vRefractedNDC.w;
        refractionCoords = (refractionCoords + 1.0) / 2.0;
        refractionCoords.y = 1.0 - refractionCoords.y;

        vec4 color = texture2D(uSceneFBO, refractionCoords);

        gl_FragColor = vec4(color.rgb, uAlpha);
        gl_FragColor = linearToOutputTexel(gl_FragColor);
      }
    `,
      uniforms: uniforms
    });
  }, [refractionDistance, ior]);

  useFrame(() => {
    groupRef.current.visible = false
    gl.toneMapping = THREE.LinearToneMapping
    gl.setRenderTarget(sceneFBO)
    gl.render(scene, camera)

    groupRef.current.visible = true


    gl.setRenderTarget(null)
    gl.render(scene, camera)

    uniforms.uResolution.value.set(sceneFBO.width, sceneFBO.height)
    uniforms.uSceneFBO.value = sceneFBO.texture
    uniforms.uRefractionDistance.value = refractionDistance
    uniforms.uIOR.value = ior
  }, 1)




  const thickness = 0.05

  return (
    <>
      <mesh position={[0, 0, -2]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial color="#ffffff" metalness={0.5} roughness={0.2} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>

      <group ref={groupRef}>
        {Array.from({ length: 100 }).map((_, i) => (
          <mesh
            key={i}
            position={[(i - 50) * thickness * 2, 0, 0]}
            material={shaderMaterial}
          >
            <cylinderGeometry args={[thickness, thickness, 1, 32]} />
          </mesh>
        ))}
      </group>
    </>
  )
}
