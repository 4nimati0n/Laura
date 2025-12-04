import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getOpenAIResponse, getMistralResponse, getElevenLabsAudio } from '../utils/ai';
import { getElevenLabsAgentResponse } from '../utils/elevenLabsAgent';
import { useVoice } from '@humeai/voice-react';

export const useVoiceInteraction = () => {
    const {
        isPlaying,
        setIsListening,
        setIsSpeaking,
        setUserMessage,
        setAiResponse,
        setError,
        openAiKey,
        mistralKey,
        elevenLabsKey,
        useElevenLabsAgent,
        setAudioAnalyser,
        useHume,
        humeAccessToken,
        humeConfigId,
        setHumeFft
    } = useAppStore();

    // Hume Hook
    const {
        connect: connectHume,
        disconnect: disconnectHume,
        readyState: humeReadyState,
        messages: humeMessages,
        sendUserInput: sendHumeUserInput,
        fft: humeFftData
    } = useVoice();

    // Sync Hume FFT to Store
    useEffect(() => {
        if (useHume && humeFftData) {
            setHumeFft(humeFftData);
            // Simple speaking detection based on FFT energy
            const energy = humeFftData.reduce((a, b) => a + b, 0) / humeFftData.length;
            if (energy > 0.01) {
                setIsSpeaking(true);
            } else {
                setIsSpeaking(false);
            }
        }
    }, [useHume, humeFftData, setHumeFft, setIsSpeaking]);

    // Handle Hume Messages
    useEffect(() => {
        if (!useHume) return;

        const lastMessage = humeMessages[humeMessages.length - 1];
        if (lastMessage) {
            if (lastMessage.type === 'user_message' && lastMessage.message.content) {
                setUserMessage(lastMessage.message.content);
            } else if (lastMessage.type === 'assistant_message' && lastMessage.message.content) {
                setAiResponse(lastMessage.message.content);
            }
        }
    }, [useHume, humeMessages, setUserMessage, setAiResponse]);

    // Hume Connection Management
    useEffect(() => {
        if (useHume) {
            if (isPlaying && humeAccessToken && humeReadyState === 'idle') {
                connectHume({
                    auth: { type: 'accessToken', value: humeAccessToken },
                    configId: humeConfigId
                }).catch(e => {
                    console.error("Hume Connection Failed:", e);
                    setError("Failed to connect to Hume AI");
                });
            } else if (!isPlaying && (humeReadyState === 'open' || humeReadyState === 'connecting')) {
                disconnectHume();
            }
        }
    }, [useHume, isPlaying, humeAccessToken, humeConfigId, humeReadyState, connectHume, disconnectHume, setError]);

    // Sync isListening with Hume State
    useEffect(() => {
        if (useHume) {
            if (humeReadyState === 'open' || humeReadyState === 'connecting') {
                setIsListening(true);
            } else {
                setIsListening(false);
                setIsSpeaking(false);
            }
        }
    }, [useHume, humeReadyState, setIsListening, setIsSpeaking]);


    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    // ... (Existing playAudio, speak, processUserMessage functions)
    // We need to wrap them or conditionally execute them only if !useHume

    const playAudio = useCallback(async (audioBuffer: ArrayBuffer) => {
        if (useHume) return; // Hume handles audio playback

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            setAudioAnalyser(analyser);
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        try {
            const bufferClone = audioBuffer.slice(0);
            const buffer = await ctx.decodeAudioData(bufferClone);
            const source = ctx.createBufferSource();
            source.buffer = buffer;

            if (analyserRef.current) {
                source.connect(analyserRef.current);
                analyserRef.current.connect(ctx.destination);
            } else {
                source.connect(ctx.destination);
            }

            source.onended = () => setIsSpeaking(false);
            setIsSpeaking(true);
            source.start(0);
            useAppStore.getState().setLastAudioBuffer(audioBuffer);
        } catch (e) {
            console.error("Error playing audio:", e);
            setError("Failed to play audio response.");
            setIsSpeaking(false);
        }
    }, [setIsSpeaking, setError, setAudioAnalyser, useHume]);

    // Replay Listener
    useEffect(() => {
        const handleReplay = () => {
            const { lastAudioBuffer, isSpeaking } = useAppStore.getState();
            if (lastAudioBuffer && !isSpeaking && !useHume) {
                playAudio(lastAudioBuffer);
            }
        };
        window.addEventListener('replay-audio', handleReplay);
        return () => window.removeEventListener('replay-audio', handleReplay);
    }, [playAudio, useHume]);

    const speak = useCallback(async (text: string) => {
        if (useHume) return; // Hume speaks automatically

        if (elevenLabsKey) {
            try {
                const audioData = await getElevenLabsAudio(text);
                await playAudio(audioData);
                return;
            } catch (e) {
                console.error("ElevenLabs TTS failed", e);
                setError("Voice synthesis failed");
            }
        } else {
            setError("ElevenLabs API key required for voice");
        }
    }, [setIsSpeaking, setError, elevenLabsKey, playAudio, useHume]);

    const isProcessing = useRef(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const processUserMessage = useCallback(async (message: string) => {
        if (useHume) {
            sendHumeUserInput(message);
            return;
        }

        if (isProcessing.current) return;
        isProcessing.current = true;

        let response = "";

        if (useElevenLabsAgent && elevenLabsKey) {
            try {
                const agentResponse = await getElevenLabsAgentResponse(message, elevenLabsKey);
                response = agentResponse.text;
                setAiResponse(response);

                if (agentResponse.audioData) {
                    await playAudio(agentResponse.audioData);
                } else if (agentResponse.audioUrl) {
                    const audioResponse = await fetch(agentResponse.audioUrl);
                    const audioData = await audioResponse.arrayBuffer();
                    await playAudio(audioData);
                } else {
                    await speak(response);
                }
            } catch (e: any) {
                console.error("ElevenLabs Agent failed", e);
                setError(`Agent Error: ${e.message}`);
                response = "I'm having trouble connecting to my conversational agent.";
                await speak(response);
            } finally {
                isProcessing.current = false;
            }
            return;
        }

        if (mistralKey) {
            try {
                response = await getMistralResponse(message);
            } catch (e: any) {
                console.error("Mistral failed", e);
                setError(`Mistral Error: ${e.message}`);
                response = "I'm having trouble thinking right now.";
            }
        } else if (openAiKey) {
            try {
                response = await getOpenAIResponse(message);
            } catch (e: any) {
                console.error("OpenAI failed", e);
                setError(`OpenAI Error: ${e.message}`);
                response = "I'm having trouble thinking right now.";
            }
        } else {
            const lowerMsg = message.toLowerCase();
            if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
                response = "Bonjour! Je suis Laura. Veuillez ajouter votre clé API Mistral dans les paramètres pour débloquer mon plein potentiel.";
            } else if (lowerMsg.includes('time')) {
                response = `Il est actuellement ${new Date().toLocaleTimeString()}.`;
            } else {
                response = `Vous avez dit: ${message}. J'ai besoin d'une clé API Mistral pour mieux comprendre.`;
            }
        }

        setAiResponse(response);
        await speak(response);
        isProcessing.current = false;
    }, [setAiResponse, speak, openAiKey, mistralKey, elevenLabsKey, useElevenLabsAgent, setError, playAudio, useHume, sendHumeUserInput]);

    // Legacy Speech Recognition (Deepgram / Browser)
    useEffect(() => {
        if (useHume) return; // Disable legacy recognition if using Hume

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
            console.error('Speech recognition not supported');
            useAppStore.getState().setError("Speech recognition not supported in this browser.");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'fr-FR';

        recognitionRef.current.onstart = async () => {
            console.log("Voice recognition started");
            setIsListening(true);
            useAppStore.getState().setError(null);

            const { deepgramKey, useDeepgram } = useAppStore.getState();
            if (useDeepgram && deepgramKey) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorderRef.current = new MediaRecorder(stream);
                    audioChunksRef.current = [];

                    mediaRecorderRef.current.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunksRef.current.push(event.data);
                        }
                    };

                    mediaRecorderRef.current.start();
                } catch (e) {
                    console.error("Failed to start audio recording", e);
                }
            }
        };

        recognitionRef.current.onend = async () => {
            console.log("Voice recognition ended");
            setIsListening(false);

            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }

            const { isPlaying, isSpeaking } = useAppStore.getState();
            if (isPlaying && !isSpeaking) {
                console.log("Auto-restarting recognition...");
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    console.error("Failed to restart recognition:", e);
                }
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') {
                useAppStore.getState().setError("Microphone access denied. Please allow access.");
                useAppStore.getState().setIsPlaying(false);
            } else if (event.error === 'no-speech') {
                // Ignore
            } else {
                useAppStore.getState().setError(`Voice Error: ${event.error}`);
            }
        };

        recognitionRef.current.onresult = async (event: any) => {
            const { deepgramKey, useDeepgram } = useAppStore.getState();

            if (useDeepgram && deepgramKey && mediaRecorderRef.current) {
                if (mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }

                setTimeout(async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                    try {
                        const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=fr&smart_format=true&punctuate=true', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Token ${deepgramKey}`,
                                'Content-Type': 'audio/webm'
                            },
                            body: audioBlob
                        });

                        const data = await response.json();
                        const transcript = data.results?.channels[0]?.alternatives[0]?.transcript;

                        if (transcript && transcript.trim().length > 0) {
                            console.log("Deepgram Heard:", transcript);
                            setUserMessage(transcript);
                            processUserMessage(transcript);
                        } else {
                            console.log("Deepgram: No speech detected");
                        }

                        audioChunksRef.current = [];
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
                            mediaRecorderRef.current.start();
                        }

                    } catch (e) {
                        console.error("Deepgram API failed", e);
                        const transcript = event.results[event.results.length - 1][0].transcript;
                        setUserMessage(transcript);
                        processUserMessage(transcript);
                    }
                }, 100);

            } else {
                const transcript = event.results[event.results.length - 1][0].transcript;
                console.log("Browser Heard:", transcript);
                setUserMessage(transcript);
                processUserMessage(transcript);
            }
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
        };
    }, [setIsListening, setUserMessage, processUserMessage, useHume]);

    useEffect(() => {
        if (useHume) return; // Handled by Hume effect

        if (isPlaying) {
            try {
                recognitionRef.current?.start();
            } catch (e) {
                // Already started
            }
        } else {
            recognitionRef.current?.stop();
            setIsSpeaking(false);
            setIsListening(false);
        }
    }, [isPlaying, setIsSpeaking, setIsListening, useHume]);

    return null;
};
