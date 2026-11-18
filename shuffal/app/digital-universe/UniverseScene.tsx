'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { domains } from './data';

function randomUnit(seed: number) {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

function Stars() {
  const viewportWidth = useThree((state) => state.size.width);
  const count = viewportWidth < 600 ? 700 : 1800;
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 5 + randomUnit(i * 4 + 1) * 38;
      const angle = randomUnit(i * 4 + 2) * Math.PI * 2;
      values[i * 3] = Math.cos(angle) * radius;
      values[i * 3 + 1] = (randomUnit(i * 4 + 3) - 0.5) * 19;
      values[i * 3 + 2] = (randomUnit(i * 4 + 4) - 0.5) * 75 - 12;
    }
    return values;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.z += 0.00022;
    points.current.rotation.y = THREE.MathUtils.lerp(
      points.current.rotation.y,
      state.pointer.x * 0.025,
      0.025,
    );
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#70bfff" size={0.035} transparent opacity={0.72} sizeAttenuation />
    </points>
  );
}

function Tunnel() {
  const group = useRef<THREE.Group>(null);
  const rings = useMemo(() => Array.from({ length: 18 }, (_, index) => -70 + index * 4.1), []);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.035;
  });

  return (
    <group ref={group}>
      {rings.map((z, index) => (
        <mesh key={z} position={[0, 0, z]} rotation={[0, 0, index * 0.035]}>
          <torusGeometry args={[5.6 + (index % 3) * 0.25, 0.018, 6, 64]} />
          <meshBasicMaterial
            color={index % 4 === 0 ? '#8b5cf6' : '#00a3ff'}
            transparent
            opacity={0.34}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloatingObject({
  position,
  color,
  shape,
  label,
}: {
  position: [number, number, number];
  color: string;
  shape: 'box' | 'sphere' | 'octahedron';
  label?: string;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += hovered ? 0.012 : 0.003;
    mesh.current.rotation.y += hovered ? 0.014 : 0.005;
    const target = hovered ? 1.28 : 1;
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.09);
    mesh.current.position.x +=
      (position[0] + state.pointer.x * 0.42 - mesh.current.position.x) * 0.018;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.5} floatIntensity={0.75}>
      <mesh
        ref={mesh}
        position={position}
        onPointerEnter={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        {shape === 'box' && <boxGeometry args={[0.72, 0.72, 0.72]} />}
        {shape === 'sphere' && <sphereGeometry args={[0.5, 24, 24]} />}
        {shape === 'octahedron' && <octahedronGeometry args={[0.58, 0]} />}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.1 : 0.28}
          metalness={0.64}
          roughness={0.22}
          transparent
          opacity={0.9}
        />
        {label && (
          <Html
            center
            distanceFactor={8}
            position={[0, 0.86, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <span className="universeObjectLabel">{label}</span>
          </Html>
        )}
      </mesh>
    </Float>
  );
}

function SceneObjects() {
  const group = useRef<THREE.Group>(null);
  const objects: Array<{
    position: [number, number, number];
    color: string;
    shape: 'box' | 'sphere' | 'octahedron';
    label: string;
  }> = [
    { position: [-4.1, 2.4, -10], color: '#00a3ff', shape: 'box', label: 'JS' },
    { position: [4.2, 1.8, -15], color: '#3178c6', shape: 'octahedron', label: 'TS' },
    { position: [-3.7, -2.1, -23], color: '#3776ab', shape: 'sphere', label: 'PYTHON' },
    { position: [3.7, -1.7, -29], color: '#659ad2', shape: 'box', label: 'C++' },
    { position: [-5.2, 0.4, -37], color: '#f89820', shape: 'octahedron', label: 'JAVA' },
    { position: [5.1, 2.1, -43], color: '#61dafb', shape: 'box', label: 'REACT' },
    { position: [-3.8, 2.6, -51], color: '#e34f26', shape: 'sphere', label: 'HTML' },
    { position: [4.4, -2.4, -58], color: '#264de4', shape: 'box', label: 'CSS' },
    { position: [-5.4, -2.8, -66], color: '#8b5cf6', shape: 'octahedron', label: 'AI' },
    { position: [5.5, 2.8, -73], color: '#00f0ff', shape: 'sphere', label: 'CYBER' },
    { position: [-2.8, 2.9, -80], color: '#f34f29', shape: 'box', label: 'GIT' },
    { position: [3.2, -2.7, -88], color: '#00a3ff', shape: 'sphere', label: 'CLOUD' },
    { position: [-4.8, 1.1, -94], color: '#7c5cff', shape: 'box', label: 'DB' },
  ];

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.14) * 0.16;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.09) * 0.035;
  });

  return (
    <group ref={group}>
      {objects.map((object) => (
        <FloatingObject key={object.label} {...object} />
      ))}
    </group>
  );
}

function DomainNodes() {
  return (
    <group position={[0, 0, -44]}>
      {domains.map((domain, index) => {
        const angle = (index / domains.length) * Math.PI * 2;
        const radius = 4.8;
        return (
          <Float key={domain} speed={0.7 + (index % 3) * 0.15}>
            <mesh position={[Math.cos(angle) * radius, Math.sin(angle) * radius * 0.58, index * 0.42]}>
              <icosahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial
                color={index % 2 ? '#8b5cf6' : '#00a3ff'}
                emissive={index % 2 ? '#8b5cf6' : '#00a3ff'}
                emissiveIntensity={0.7}
              />
              <Html center distanceFactor={9} style={{ pointerEvents: 'none' }}>
                <span className="domainNodeLabel">{domain}</span>
              </Html>
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

function CommunityNetwork() {
  const nodes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => {
        const angle = (index / 24) * Math.PI * 2;
        const radius = 2.2 + (index % 4) * 0.7;
        return [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, Math.sin(index) * 1.2] as [
          number,
          number,
          number,
        ];
      }),
    [],
  );

  return (
    <group position={[0, 0, -69]}>
      {nodes.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshBasicMaterial color={index % 3 === 0 ? '#8b5cf6' : '#00f0ff'} />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig() {
  const { camera } = useThree();
  const cameraRef = useRef(camera);
  const mouse = useRef({ x: 0, y: 0 });

  useFrame(() => {
    const scrollY = window.scrollY;
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = scrollY / maxScroll;
    const targetZ = 8 - progress * 73;
    const targetX = THREE.MathUtils.lerp(0, Math.sin(progress * Math.PI * 3) * 1.7, 0.32);
    const targetY = THREE.MathUtils.lerp(0, Math.cos(progress * Math.PI * 2) * 0.8, 0.32);

    const touchX = window.__universeTouchX || 0;
    const touchY = window.__universeTouchY || 0;
    const touchZ = window.__universeTouchZ || 0;
    mouse.current.x = THREE.MathUtils.lerp(
      mouse.current.x,
      targetX + window.__universePointerX * 0.8 + touchX * 1.2,
      0.028,
    );
    mouse.current.y = THREE.MathUtils.lerp(
      mouse.current.y,
      targetY + window.__universePointerY * 0.45 + touchY * 0.8,
      0.028,
    );

    const activeCamera = cameraRef.current;
    activeCamera.position.x = THREE.MathUtils.lerp(activeCamera.position.x, mouse.current.x, 0.055);
    activeCamera.position.y = THREE.MathUtils.lerp(activeCamera.position.y, mouse.current.y, 0.055);
    activeCamera.position.z = THREE.MathUtils.lerp(activeCamera.position.z, targetZ + touchZ, 0.045);
    activeCamera.lookAt(0, 0, targetZ - 12);
  });

  return null;
}

declare global {
  interface Window {
    __universePointerX: number;
    __universePointerY: number;
    __universeTouchX: number;
    __universeTouchY: number;
    __universeTouchZ: number;
  }
}

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 8, 54]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[6, 8, 4]} intensity={1.7} color="#90d8ff" />
      <pointLight position={[-5, 2, -18]} intensity={18} distance={18} color="#8b5cf6" />
      <pointLight position={[5, -2, -38]} intensity={16} distance={20} color="#00a3ff" />
      <Stars />
      <Tunnel />
      <SceneObjects />
      <DomainNodes />
      <CommunityNetwork />
      <CameraRig />
    </>
  );
}

export default function UniverseScene() {
  return (
    <div className="universeCanvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 8], fov: 52, near: 0.1, far: 120 }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
