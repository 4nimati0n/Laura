

export type Pose = {
    [boneName: string]: { rotation: [number, number, number] };
};

export const POSES: Record<string, Pose> = {
    idle: {
        leftUpperArm: { rotation: [0, 0, 1.1] }, // Arms down ~60 deg
        rightUpperArm: { rotation: [0, 0, -1.1] },
        leftLowerArm: { rotation: [0, 0, 0.1] },
        rightLowerArm: { rotation: [0, 0, -0.1] },
        spine: { rotation: [0, 0, 0] },
        head: { rotation: [0, 0, 0] },
    },
    happy: {
        leftUpperArm: { rotation: [0, 0, 2.5] }, // Arms up (Joy)
        rightUpperArm: { rotation: [0, 0, -2.5] },
        leftLowerArm: { rotation: [0, 0, 0.5] },
        rightLowerArm: { rotation: [0, 0, -0.5] },
        spine: { rotation: [-0.1, 0, 0] }, // Lean back slightly
        head: { rotation: [-0.1, 0, 0] },
    },
    thinking: {
        leftUpperArm: { rotation: [0, 0, 1.1] },
        rightUpperArm: { rotation: [0, 0, -1.5] }, // Right arm up to chin
        rightLowerArm: { rotation: [0, 0, -2.0] }, // Bend elbow
        rightHand: { rotation: [0, 0, -0.5] },
        spine: { rotation: [0.1, 0, 0] }, // Lean forward
        head: { rotation: [0.1, -0.2, 0] }, // Look down/side
    },
    greeting: {
        leftUpperArm: { rotation: [0, 0, 1.1] },
        rightUpperArm: { rotation: [0, 0, -2.0] }, // Wave
        rightLowerArm: { rotation: [0, 0, -1.0] },
        rightHand: { rotation: [0, 0, -0.5] },
        spine: { rotation: [0, 0, 0] },
        head: { rotation: [0, 0.1, 0] },
    }
};
