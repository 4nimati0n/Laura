import { useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { useAppStore } from '../store/useAppStore';
import { MathUtils, Quaternion, Euler, Vector3 } from 'three';
import { useEmotion } from '../hooks/useEmotion';

export const Avatar = () => {
    const isSpeaking = useAppStore(state => state.isSpeaking);
    const poseControls = useAppStore(state => state.poseControls);
    const triggeredEmotion = useAppStore(state => state.triggeredEmotion);
    const emotionIntensity = useAppStore(state => state.emotionIntensity);

    const [vrm, setVrm] = useState<VRM | null>(null);
    const { updateEmotion, setEmotionWithIntensity } = useEmotion();

    // Load VRM Model
    const gltf = useLoader(GLTFLoader, '/model.vrm', (loader) => {
        loader.register((parser) => {
            return new VRMLoaderPlugin(parser);
        });
    });

    useEffect(() => {
        if (gltf) {
            const vrmInstance = gltf.userData.vrm;
            VRMUtils.removeUnnecessaryVertices(gltf.scene);
            VRMUtils.combineSkeletons(gltf.scene);
            vrmInstance.scene.rotation.y = Math.PI; // Rotate to face camera

            // Log available expressions with their bindings
            if (vrmInstance.expressionManager) {
                const expressions = Object.keys(vrmInstance.expressionManager.expressionMap);
                console.log("Available Expressions:", expressions);

                // Log detailed binding info for each expression
                console.log("🔍 Expression Bindings:");
                expressions.forEach((name: string) => {
                    const expr = vrmInstance.expressionManager.getExpression(name);
                    if (expr) {
                        // Check if it has morph target binds
                        const binds = (expr as any)._binds || (expr as any).binds || [];
                        if (binds.length > 0) {
                            console.log(`  ${name}:`, binds.map((b: any) => ({
                                mesh: b.primitives?.[0]?.name || 'unknown',
                                index: b.index,
                                weight: b.weight
                            })));
                        }
                    }
                });
            }

            // Find the face mesh and add a morph tester
            let faceMesh: any = null;
            vrmInstance.scene.traverse((child: any) => {
                if (child.isMesh && child.morphTargetDictionary) {
                    if (child.name.toLowerCase().includes('face')) {
                        faceMesh = child;
                        console.log(`📋 Face mesh "${child.name}" has ${Object.keys(child.morphTargetDictionary).length} morphs`);
                        console.log("Morph influences array length:", child.morphTargetInfluences?.length);
                    }
                }
            });

            // Store face mesh for morph testing
            if (faceMesh) {
                (window as any).__faceMesh = faceMesh;
                console.log("🎛️ Face mesh stored. Test morphs with: window.__faceMesh.morphTargetInfluences[INDEX] = 1");
                console.log("   Example: window.__faceMesh.morphTargetInfluences[0] = 1");
            }

            setVrm(vrmInstance);
        }
    }, [gltf]);

    // Apply pose from controls
    useEffect(() => {
        if (!vrm) return;

        const applyPose = () => {
            const pose = vrm.humanoid.getNormalizedPose();

            const getRotation = (x: number, y: number, z: number) => {
                return new Quaternion().setFromEuler(new Euler(x, y, z)).toArray() as [number, number, number, number];
            };

            // Apply symmetrical pose (left positive Z, right negative Z)
            const { shoulder, upperArm, lowerArm } = poseControls;

            pose.leftShoulder = { rotation: getRotation(shoulder.x, shoulder.y, shoulder.z) };
            pose.leftUpperArm = { rotation: getRotation(upperArm.x, upperArm.y, upperArm.z) };
            pose.leftLowerArm = { rotation: getRotation(lowerArm.x, lowerArm.y, lowerArm.z) };

            pose.rightShoulder = { rotation: getRotation(shoulder.x, shoulder.y, -shoulder.z) };
            pose.rightUpperArm = { rotation: getRotation(upperArm.x, upperArm.y, -upperArm.z) };
            pose.rightLowerArm = { rotation: getRotation(lowerArm.x, lowerArm.y, -lowerArm.z) };

            vrm.humanoid.setNormalizedPose(pose);
        };

        applyPose();

        // LOG AVAILABLE EXPRESSIONS - Remove after checking
        if (vrm.expressionManager) {
            const expressions = Object.keys(vrm.expressionManager.expressionMap);
            console.log("🎭 Available VRM Expressions:", expressions);
        }
    }, [vrm, poseControls]);

    // Watch for emotion triggers from PoseControls
    useEffect(() => {
        if (triggeredEmotion) {
            setEmotionWithIntensity(triggeredEmotion as any, emotionIntensity);
        }
    }, [triggeredEmotion, emotionIntensity, setEmotionWithIntensity]);

    useFrame((state, delta) => {
        if (vrm) {
            vrm.update(delta);
            updateEmotion(vrm, delta);

            // --- Procedural Animations ---

            // Lip Sync
            const { audioAnalyser, humeFft, useHume, lipSyncSensitivity, lipSyncSmoothing } = useAppStore.getState();

            let energyOu = 0, energyOh = 0, energyAa = 0, energyEe = 0, energyIh = 0;
            let hasAudio = false;

            if (useHume && humeFft && humeFft.length > 0) {
                // Hume FFT Logic
                // humeFft is likely 0-1 range? Or dB? Assuming 0-1 for now or normalized.
                // If it's 24 bands or similar.
                // Let's assume standard mapping if possible, or just map ranges.
                // We'll map indices roughly to the same bands.
                const fft = humeFft;
                const len = fft.length;

                // Simple mapping based on index ranges
                // Low
                for (let i = 0; i < Math.floor(len * 0.1); i++) energyOu += fft[i];
                energyOu /= Math.floor(len * 0.1);

                // Low-Mid
                for (let i = Math.floor(len * 0.1); i < Math.floor(len * 0.2); i++) energyOh += fft[i];
                energyOh /= Math.floor(len * 0.1);

                // Mid
                for (let i = Math.floor(len * 0.2); i < Math.floor(len * 0.4); i++) energyAa += fft[i];
                energyAa /= Math.floor(len * 0.2);

                // Mid-High
                for (let i = Math.floor(len * 0.4); i < Math.floor(len * 0.7); i++) energyEe += fft[i];
                energyEe /= Math.floor(len * 0.3);

                // High
                for (let i = Math.floor(len * 0.7); i < len; i++) energyIh += fft[i];
                energyIh /= Math.ceil(len * 0.3);

                // Scale up if needed (Hume might return small values)
                const scale = 0.5;
                energyOu *= scale; energyOh *= scale; energyAa *= scale; energyEe *= scale; energyIh *= scale;

                hasAudio = true; // Assuming if we have FFT we are speaking or listening

            } else if (isSpeaking && audioAnalyser) {
                // Standard Analyser Logic
                const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
                audioAnalyser.getByteFrequencyData(dataArray);

                // 1. OU (Low) - Bins 1-3 (~170-500Hz)
                for (let i = 1; i <= 3; i++) energyOu += dataArray[i];
                energyOu /= 3;
                energyOu /= 255; // Normalize 0-1

                // 2. OH (Low-Mid) - Bins 4-6 (~680-1000Hz)
                for (let i = 4; i <= 6; i++) energyOh += dataArray[i];
                energyOh /= 3;
                energyOh /= 255;

                // 3. AA (Mid) - Bins 7-12 (~1.2-2kHz)
                for (let i = 7; i <= 12; i++) energyAa += dataArray[i];
                energyAa /= 6;
                energyAa /= 255;

                // 4. EE (Mid-High) - Bins 13-20 (~2.2-3.4kHz)
                for (let i = 13; i <= 20; i++) energyEe += dataArray[i];
                energyEe /= 8;
                energyEe /= 255;

                // 5. IH (High / Sibilants) - Bins 21-50 (~3.6-8.5kHz)
                for (let i = 21; i <= 50; i++) energyIh += dataArray[i];
                energyIh /= 30;
                energyIh /= 255;

                hasAudio = true;
            }

            if (hasAudio) {
                // --- Consonant Simulation Logic ---
                // Sibilant Detection (S, T, CH, SH, Z)
                const isSibilant = energyIh > (energyAa * 1.2) && energyIh > (energyOu * 1.2);
                // Closed/Hum Detection (M, N, B, P)
                const isClosed = energyOu > 0.2 && energyAa < (energyOu * 0.6) && energyIh < (energyOu * 0.4);

                // Apply sensitivity
                let vOu = MathUtils.clamp(energyOu * lipSyncSensitivity, 0, 1);
                let vOh = MathUtils.clamp(energyOh * lipSyncSensitivity, 0, 1);
                let vAa = MathUtils.clamp(energyAa * lipSyncSensitivity, 0, 1);
                let vEe = MathUtils.clamp(energyEe * lipSyncSensitivity, 0, 1);
                let vIh = MathUtils.clamp(energyIh * lipSyncSensitivity, 0, 1);

                // Apply Overrides
                if (isSibilant) {
                    vIh = Math.max(vIh, 0.6 * lipSyncSensitivity);
                    vEe = Math.max(vEe, 0.5 * lipSyncSensitivity);
                    vAa *= 0.2;
                    vOh *= 0.2;
                    vOu *= 0.2;
                } else if (isClosed) {
                    vAa *= 0.05;
                    vOh *= 0.05;
                    vOu = Math.min(vOu, 0.2);
                    vEe *= 0.05;
                    vIh *= 0.05;
                } else {
                    const noiseFloor = 0.1;
                    if (vAa < noiseFloor) vAa = 0;
                    if (vOh < noiseFloor) vOh = 0;
                    if (vOu < noiseFloor) vOu = 0;
                    if (vEe < noiseFloor) vEe = 0;
                    if (vIh < noiseFloor) vIh = 0;
                }

                const lerpFactor = lipSyncSmoothing;
                const currentAa = vrm.expressionManager?.getValue('aa') || 0;
                const currentIh = vrm.expressionManager?.getValue('ih') || 0;
                const currentOu = vrm.expressionManager?.getValue('ou') || 0;
                const currentEe = vrm.expressionManager?.getValue('ee') || 0;
                const currentOh = vrm.expressionManager?.getValue('oh') || 0;

                vrm.expressionManager?.setValue('aa', MathUtils.lerp(currentAa, vAa, lerpFactor));
                vrm.expressionManager?.setValue('ih', MathUtils.lerp(currentIh, vIh, lerpFactor));
                vrm.expressionManager?.setValue('ou', MathUtils.lerp(currentOu, vOu, lerpFactor));
                vrm.expressionManager?.setValue('ee', MathUtils.lerp(currentEe, vEe, lerpFactor));
                vrm.expressionManager?.setValue('oh', MathUtils.lerp(currentOh, vOh, lerpFactor));
            } else {
                // Smoothly close mouth
                ['aa', 'ih', 'ou', 'ee', 'oh'].forEach(vowel => {
                    const current = vrm.expressionManager?.getValue(vowel) || 0;
                    vrm.expressionManager?.setValue(vowel, MathUtils.lerp(current, 0, 0.2));
                });
            }

            // Natural Blinking (2-4 second intervals with random variation)
            const blinkCycle = state.clock.elapsedTime % 3.5;
            const blinkDuration = 0.15;
            if (blinkCycle < blinkDuration) {
                const blinkProgress = blinkCycle / blinkDuration;
                const blinkValue = Math.sin(blinkProgress * Math.PI);
                vrm.expressionManager?.setValue('blink', blinkValue);
            } else {
                vrm.expressionManager?.setValue('blink', 0);
            }

            // Subtle breathing
            const breath = Math.sin(state.clock.elapsedTime * 0.8) * 0.015;
            const chest = vrm.humanoid.getNormalizedBoneNode('chest');
            if (chest) {
                chest.rotation.x = breath;
            }

            // Gaze tracking - head and eyes
            const head = vrm.humanoid.getNormalizedBoneNode('head');
            if (head) {
                // Get camera position in world space
                const cameraPos = state.camera.position.clone();
                const headWorldPos = head.getWorldPosition(new Vector3());

                // Direction from head to camera
                const dirToCamera = cameraPos.clone().sub(headWorldPos).normalize();

                // Laura is rotated 180° on Y, so her forward is world +Z
                // When camera is at positive X (our right), she should turn her head to HER left
                // Her local left = positive rotation.y (counterclockwise from above)
                // atan2(x, z) gives angle where +X is positive angle
                // Since she faces +Z, positive X camera = positive angle = should be positive head.rotation.y
                const angleToCamera = Math.atan2(dirToCamera.x, dirToCamera.z);

                // Comfortable field of view: ~70° each side
                const comfortableAngle = Math.PI * 0.4;
                const absAngle = Math.abs(angleToCamera);
                const isInFOV = absAngle < comfortableAngle;

                if (isInFOV) {
                    // === HEAD GAZE TRACKING ===
                    // Calculate vertical angle to camera
                    const verticalAngle = Math.atan2(dirToCamera.y, Math.sqrt(dirToCamera.x ** 2 + dirToCamera.z ** 2));

                    // HEAD: Full tracking toward camera
                    const headYawTarget = angleToCamera * 0.7; // 70% compensation for natural look
                    const headPitchTarget = verticalAngle * 0.5;

                    // Smoother movement (lerp 0.08) to avoid abruptness
                    head.rotation.y = MathUtils.lerp(head.rotation.y, headYawTarget, 0.08);
                    head.rotation.x = MathUtils.lerp(head.rotation.x, headPitchTarget, 0.08);
                    head.rotation.z = MathUtils.lerp(head.rotation.z, 0, 0.08);

                    /* NOTE: Eye tracking disabled - model VRM doesn't support it properly
                     * The model has eye bones but mesh doesn't follow them.
                     * Expressions lookLeft/lookRight/lookUp/lookDown don't exist.
                     * Morph targets are numbered (0-40) without descriptive names.
                     * Future implementation would require:
                     * 1. Modifying VRM model to add proper eye controls
                     * 2. Or manually mapping numbered morphs to eye movements
                     * See eyeControls in store for slider implementation reference.
                     */
                } else {
                    // Outside FOV: subtle idle movements
                    const sway = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
                    const tilt = Math.cos(state.clock.elapsedTime * 0.25) * 0.015;
                    head.rotation.y = MathUtils.lerp(head.rotation.y, sway, 0.05);
                    head.rotation.x = MathUtils.lerp(head.rotation.x, 0, 0.05);
                    head.rotation.z = MathUtils.lerp(head.rotation.z, tilt, 0.05);
                }
            }
        }
    });

    return vrm ? <primitive object={vrm.scene} /> : null;
};
