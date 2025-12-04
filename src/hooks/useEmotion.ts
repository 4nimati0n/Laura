import { useState, useCallback } from 'react';
import { VRM } from '@pixiv/three-vrm';

export type Emotion = 'neutral' | 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised' | 'extra' | 'blink';

export const useEmotion = () => {
    const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
    const [emotionIntensity, setEmotionIntensity] = useState<number>(1.0);

    const updateEmotion = useCallback((vrm: VRM, delta: number) => {
        if (!vrm.expressionManager) return;

        // VRM expressions are clamped to 0-1, so we clamp intensity here
        const clampedIntensity = Math.min(Math.max(emotionIntensity, 0), 1);

        const emotionMap: Record<Emotion, string[]> = {
            neutral: ['neutral'],
            happy: ['happy'],
            angry: ['angry'],
            sad: ['sad'],
            relaxed: ['relaxed'],
            surprised: ['Surprised'],
            extra: ['Extra'],
            blink: ['blink', 'blinkLeft', 'blinkRight'],
        };

        // List of viseme blend shapes used by lip sync - DON'T override these
        const lipSyncVisemes = ['aa', 'ih', 'ou', 'ee', 'oh'];

        // Faster transition for more responsive emotions
        const lerpSpeed = 15 * delta; // Increased from 5 to 15
        Object.keys(emotionMap).forEach((key) => {
            const names = emotionMap[key as Emotion];
            const targetValue = key === currentEmotion ? clampedIntensity : 0.0;

            // Try all possible names for this emotion
            for (const name of names) {
                // Skip if this is a lip sync viseme
                if (lipSyncVisemes.includes(name)) continue;

                const currentValue = vrm.expressionManager?.getValue(name) || 0;
                // Simple lerp
                const nextValue = currentValue + (targetValue - currentValue) * lerpSpeed;
                vrm.expressionManager?.setValue(name, nextValue);
            }
        });
    }, [currentEmotion, emotionIntensity]);

    const setEmotionWithIntensity = useCallback((emotion: Emotion, intensity: number) => {
        setCurrentEmotion(emotion);
        setEmotionIntensity(intensity);
    }, []);

    return {
        currentEmotion,
        emotionIntensity,
        setEmotion: setCurrentEmotion,
        setEmotionWithIntensity,
        updateEmotion
    };
};
