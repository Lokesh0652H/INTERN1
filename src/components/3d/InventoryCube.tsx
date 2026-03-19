import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface CubeProps {
  metrics: {
    totalUnits: number;
    deadStock: number;
    fastMovers: number;
    q4Forecast: string;
    stockoutRisk: number;
    reorderAlerts: number;
  };
}

function RotatingCube({ metrics }: CubeProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * 0.3;
      groupRef.current.rotation.y = t;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }
  });

  const faces = [
    { pos: [0, 0, 1.01] as [number, number, number], rot: [0, 0, 0] as [number, number, number], label: 'Units Sold', value: metrics.totalUnits.toLocaleString() },
    { pos: [0, 0, -1.01] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], label: 'Dead Stock', value: String(metrics.deadStock) },
    { pos: [1.01, 0, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], label: 'Fast Movers', value: String(metrics.fastMovers) },
    { pos: [-1.01, 0, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], label: 'Q4 Forecast', value: metrics.q4Forecast },
    { pos: [0, 1.01, 0] as [number, number, number], rot: [-Math.PI / 2, 0, 0] as [number, number, number], label: 'Stockout Risk', value: String(metrics.stockoutRisk) },
    { pos: [0, -1.01, 0] as [number, number, number], rot: [Math.PI / 2, 0, 0] as [number, number, number], label: 'Reorder Alerts', value: String(metrics.reorderAlerts) },
  ];

  return (
    <group ref={groupRef}>
      <RoundedBox args={[2, 2, 2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color="#1a1f3a" transparent opacity={0.8} />
      </RoundedBox>
      {faces.map((face, i) => (
        <group key={i} position={face.pos} rotation={face.rot}>
          <Text position={[0, 0.2, 0]} fontSize={0.15} color="#00d4ff" anchorX="center" anchorY="middle">
            {face.label}
          </Text>
          <Text position={[0, -0.15, 0]} fontSize={0.25} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
            {face.value}
          </Text>
        </group>
      ))}
    </group>
  );
}

export default function InventoryCube({ metrics }: CubeProps) {
  return (
    <div className="w-full h-64">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#00d4ff" />
        <pointLight position={[-5, -5, 5]} intensity={0.4} color="#7c3aed" />
        <RotatingCube metrics={metrics} />
      </Canvas>
    </div>
  );
}
