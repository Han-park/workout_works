'use client'

import { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'

// Define a type for rotation configuration
type RotationConfig = {
  x?: number;
  y?: number;
  z?: number;
}

type ModelProps = {
  url: string;
  scale?: number;
  rotationAxis?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz';
  rotationSpeed?: number;
  rotationConfig?: RotationConfig;
}

type SceneProps = {
  children: React.ReactNode;
}

type GLBModelViewerProps = {
  url: string;
  height?: number;
  rotationAxis?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz';
  rotationSpeed?: number;
  rotationConfig?: RotationConfig;
}

function Model({ url, scale = 1, rotationAxis = 'y', rotationSpeed = 0.005, rotationConfig }: ModelProps) {
  const { scene } = useGLTF(url) as GLTF
  const modelRef = useRef<THREE.Group>(null)
  
  // Create a rotation configuration based on the rotationAxis and rotationSpeed
  const rotConfig = useRef<RotationConfig>({})
  
  useEffect(() => {
    // Set up rotation configuration based on the rotationAxis
    if (rotationConfig) {
      // Use provided custom rotation configuration if available
      rotConfig.current = rotationConfig
    } else {
      // Otherwise, generate based on rotationAxis and rotationSpeed
      rotConfig.current = {
        x: rotationAxis.includes('x') ? rotationSpeed : 0,
        y: rotationAxis.includes('y') ? rotationSpeed : 0,
        z: rotationAxis.includes('z') ? rotationSpeed : 0
      }
      
      // For single axis rotation, use the provided speed directly
      if (rotationAxis === 'x' || rotationAxis === 'y' || rotationAxis === 'z') {
        rotConfig.current[rotationAxis] = rotationSpeed
      } 
      // For multi-axis rotation, adjust speeds slightly for more interesting motion
      else {
        if (rotationAxis.includes('x')) rotConfig.current.x = rotationSpeed * 0.8
        if (rotationAxis.includes('y')) rotConfig.current.y = rotationSpeed * 1.0
        if (rotationAxis.includes('z')) rotConfig.current.z = rotationSpeed * 1.2
      }
    }
  }, [rotationAxis, rotationSpeed, rotationConfig])
  
  useEffect(() => {
    // Properly handle materials and textures
    scene.traverse((node: THREE.Object3D) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh
        
        // Check if the material has a texture map
        if ((mesh.material as THREE.MeshStandardMaterial).map) {
          // If it has a texture, preserve it and enhance the material
          const material = mesh.material as THREE.MeshStandardMaterial
          const newMaterial = new THREE.MeshStandardMaterial({
            map: material.map,
            normalMap: material.normalMap,
            roughnessMap: material.roughnessMap,
            metalnessMap: material.metalnessMap,
            aoMap: material.aoMap,
            emissiveMap: material.emissiveMap,
            color: material.color,
            roughness: 0.3,
            metalness: 0.7,
            envMapIntensity: 1.5,
          })
          mesh.material = newMaterial
        } else {
          // If no texture, just enhance the material properties
          const originalColor = (mesh.material as THREE.MeshStandardMaterial).color 
            ? (mesh.material as THREE.MeshStandardMaterial).color.clone() 
            : new THREE.Color(0xcccccc)
          
          mesh.material = new THREE.MeshStandardMaterial({
            color: originalColor,
            roughness: 0.3,
            metalness: 0.7,
            envMapIntensity: 1.5,
          })
        }
        
        // Enable shadows
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
  }, [scene])
  
  // Rotate the model based on the rotation configuration
  useFrame(() => {
    if (modelRef.current) {
      if (rotConfig.current.x) modelRef.current.rotation.x += rotConfig.current.x
      if (rotConfig.current.y) modelRef.current.rotation.y += rotConfig.current.y
      if (rotConfig.current.z) modelRef.current.rotation.z += rotConfig.current.z
    }
  })
  
  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      scale={scale} 
      position={[0, 0, 0]} 
    />
  )
}

// Scene setup with lighting
function Scene({ children }: SceneProps) {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(0, 0, 5)
  }, [camera])
  
  return (
    <>
      <color attach="background" args={['#222222']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.8} />
      <hemisphereLight intensity={0.5} groundColor="#444444" />
      <Environment preset="studio" />
      {children}
    </>
  )
}

export default function GlbModelViewer({ 
  url, 
  height = 300, 
  rotationAxis = 'y', 
  rotationSpeed = 0.005,
  rotationConfig
}: GLBModelViewerProps) {
  return (
    <div style={{ height, width: '100%', background: '#222222', borderRadius: '0.5rem' }}>
      <Canvas shadows gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}>
        <Scene>
          <Model 
            url={url} 
            scale={1.8} 
            rotationAxis={rotationAxis} 
            rotationSpeed={rotationSpeed}
            rotationConfig={rotationConfig}
          />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            minDistance={5}
            maxDistance={5}
            autoRotate={false}
          />
        </Scene>
      </Canvas>
    </div>
  )
} 