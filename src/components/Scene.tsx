import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, DragControls } from '@react-three/drei';
import { Avatar } from './Avatar';
import { Suspense, useRef } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Group } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export const Scene = () => {
    const groupRef = useRef<Group>(null);
    const orbitRef = useRef<OrbitControlsImpl>(null);

    return (
        <div className="scene-container">
            <Canvas camera={{ position: [0, 1.4, 2], fov: 35 }}>
                <color attach="background" args={['#000000']} />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />

                <Suspense fallback={null}>
                    <ErrorBoundary fallback={
                        <mesh>
                            <sphereGeometry args={[0.5]} />
                            <meshStandardMaterial color="red" wireframe />
                        </mesh>
                    }>
                        <DragControls
                            onDragStart={() => {
                                console.log("Drag Started");
                                if (orbitRef.current) orbitRef.current.enabled = false;
                            }}
                            onDragEnd={() => {
                                console.log("Drag Ended");
                                if (orbitRef.current) orbitRef.current.enabled = true;
                            }}
                        >
                            <group ref={groupRef} position={[0, -0.9, 0]}>
                                <Avatar />
                            </group>
                        </DragControls>
                    </ErrorBoundary>
                </Suspense>

                <OrbitControls
                    ref={orbitRef}
                    enableZoom={true}
                    enablePan={false}
                    target={[0, 0.4, 0]}
                    minDistance={1.5}
                    maxDistance={3}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 1.8}
                    makeDefault
                />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
};
