import { CameraControls } from "@react-three/drei";
import { Canvas } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import Utilities from "../r3f-gist/utility/Utilities";
import Refraction from "../component/Refraction";
import { Environment } from "@react-three/drei";
import * as THREE from 'three'

export default function App() {
    return <>
        <Canvas
            shadows
            camera={{
                fov: 45,
                near: 0.1,
                far: 200,
                position: [0, 0, 6]
            }}
            gl={{ preserveDrawingBuffer: true }}
        >
            <color attach="background" args={['#ffffff']} />
            <CameraControls makeDefault />
            <Refraction />
            <Utilities />
            <Environment preset="sunset" />
        </Canvas>
    </>
}