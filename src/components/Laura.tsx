import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { useAppStore } from '../store/useAppStore';

export const Laura = () => {
    const meshRef = useRef<Mesh>(null);
    const { isSpeaking } = useAppStore();

    // Base scale
    const baseScale = new Vector3(1, 1, 1);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Gentle floating animation
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;

        // Pulsating effect when speaking
        if (isSpeaking) {
            const speed = 10;
            const scale = 1 + Math.sin(state.clock.elapsedTime * speed) * 0.1;
            meshRef.current.scale.set(scale, scale, scale);
        } else {
            // Smooth return to base scale
            meshRef.current.scale.lerp(baseScale, delta * 2);
        }

        // Rotate slowly
        meshRef.current.rotation.y += delta * 0.2;
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshStandardMaterial
                color={isSpeaking ? "#00ff88" : "#ffffff"}
                emissive={isSpeaking ? "#00ff88" : "#444444"}
                emissiveIntensity={isSpeaking ? 0.5 : 0.1}
                roughness={0.1}
                metalness={0.8}
            />
        </mesh>
    );
};
