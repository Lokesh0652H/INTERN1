import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Wave() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(20, 10, 80, 40);
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const positions = (meshRef.current.geometry as THREE.PlaneGeometry).attributes.position;
    const time = clock.getElapsedTime() * 0.5;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = Math.sin(x * 0.5 + time) * 0.3 + Math.sin(y * 0.8 + time * 0.7) * 0.2;
      positions.setZ(i, z);
    }
    positions.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geo} rotation={[-Math.PI / 3, 0, 0]} position={[0, -2, 0]}>
      <meshStandardMaterial
        color="#7c3aed"
        wireframe
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={300}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#00d4ff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export default function RevenueWave() {
  return (
    <div className="absolute inset-0 -z-10 opacity-60">
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <Wave />
        <Particles />
      </Canvas>
    </div>
  );
}
