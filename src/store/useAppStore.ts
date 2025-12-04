import { create } from 'zustand';
import { config } from '../config';

interface PoseRotation {
  x: number;
  y: number;
  z: number;
}

interface PoseControls {
  shoulder: PoseRotation;
  upperArm: PoseRotation;
  lowerArm: PoseRotation;
}

interface EyeControls {
  yaw: number;    // horizontal: -90 (right) to +90 (left)
  pitch: number;  // vertical: -45 (down) to +45 (up)
  enabled: boolean; // manual control mode
}

interface AppState {
  isPlaying: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  userMessage: string;
  aiResponse: string;
  error: string | null;
  openAiKey: string;
  mistralKey: string;
  elevenLabsKey: string;
  deepgramKey: string;
  voiceId: string;
  humeApiKey: string;
  humeSecretKey: string;
  humeConfigId: string;
  humeAccessToken: string | null;
  humeFft: number[];
  useHume: boolean;
  isSettingsOpen: boolean;
  poseControls: PoseControls;
  eyeControls: EyeControls;
  setEyeControls: (controls: Partial<EyeControls>) => void;
  useElevenLabsAgent: boolean;
  triggeredEmotion: string | null;
  emotionIntensity: number;
  audioAnalyser: AnalyserNode | null;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setIsListening: (isListening: boolean) => void;
  setUserMessage: (message: string) => void;
  setAiResponse: (response: string) => void;
  setError: (error: string | null) => void;
  setKeys: (openAiKey: string, mistralKey: string, elevenLabsKey: string, deepgramKey: string, humeApiKey: string, humeSecretKey: string) => void;
  setVoiceId: (voiceId: string) => void;
  setUseHume: (useHume: boolean) => void;
  setHumeAccessToken: (token: string | null) => void;
  setHumeFft: (fft: number[]) => void;
  setHumeConfigId: (id: string) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setPoseRotation: (part: keyof PoseControls, axis: keyof PoseRotation, value: number) => void;
  setUseElevenLabsAgent: (use: boolean) => void;
  triggerEmotion: (emotion: string) => void;
  setEmotionIntensity: (intensity: number) => void;
  setAudioAnalyser: (analyser: AnalyserNode | null) => void;
  // Lip Sync Settings
  lipSyncSensitivity: number;
  lipSyncSmoothing: number;
  lipSyncNoiseFloor: number;
  lipSyncSibilantThreshold: number;
  lipSyncClosedThreshold: number;
  setLipSyncSettings: (settings: Partial<{ sensitivity: number; smoothing: number; noiseFloor: number; sibilantThreshold: number; closedThreshold: number }>) => void;
  // Conversation History
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  addToConversationHistory: (role: 'user' | 'assistant', content: string) => void;
  clearConversationHistory: () => void;

  showPoseControls: boolean;
  setShowPoseControls: (show: boolean) => void;
  showConversation: boolean;
  setShowConversation: (show: boolean) => void;
  lastAudioBuffer: ArrayBuffer | null;
  setLastAudioBuffer: (buffer: ArrayBuffer | null) => void;
  useDeepgram: boolean;
  setUseDeepgram: (use: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isPlaying: false,
  isSpeaking: false,
  isListening: false,
  userMessage: '',
  aiResponse: '',
  error: null,
  openAiKey: localStorage.getItem('laura_openai_key') || '',
  mistralKey: localStorage.getItem('laura_mistral_key') || config.mistralApiKey || '',
  elevenLabsKey: localStorage.getItem('laura_elevenlabs_key') || config.elevenLabsApiKey || '',
  deepgramKey: localStorage.getItem('laura_deepgram_key') || '8411cfdb5c0b8cd2d930a5f4608d765c62b0083e',
  voiceId: localStorage.getItem('laura_voice_id') || config.elevenLabsVoiceId || 'e68bf5ad-da47-4881-83fa-19307ea1c2f8',
  humeApiKey: localStorage.getItem('laura_hume_api_key') || 'mGl3j4Up57bW9CI8nCwMriEmtrWehurLkcASLL8afOuAaGY2',
  humeSecretKey: localStorage.getItem('laura_hume_secret_key') || 'AZGe4gT9duS6ccYwd4YuiXb4olr1DAsICTnGaPlUoKczU5phn8YM9kOdLR1h3uQg',
  humeConfigId: localStorage.getItem('laura_hume_config_id') || '392c88d6-ae2b-4d98-8816-4b8da51d03ed',
  humeAccessToken: null,
  humeFft: [],
  useHume: localStorage.getItem('laura_use_hume') === 'true',
  isSettingsOpen: false,
  useElevenLabsAgent: localStorage.getItem('laura_use_agent') === 'true',
  triggeredEmotion: null,
  emotionIntensity: 1.0,
  audioAnalyser: null,

  // Default Lip Sync Settings
  lipSyncSensitivity: 0.3,
  lipSyncSmoothing: 0.71,
  lipSyncNoiseFloor: 0.02,
  lipSyncSibilantThreshold: 1.2,
  lipSyncClosedThreshold: 0.2,

  // Conversation History for multi-turn chat
  conversationHistory: [],

  lastAudioBuffer: null,

  useDeepgram: localStorage.getItem('laura_use_deepgram') !== 'false', // Default to true if not set

  showPoseControls: localStorage.getItem('laura_show_pose_controls') !== 'false',
  showConversation: localStorage.getItem('laura_show_conversation') !== 'false',

  poseControls: {
    shoulder: { x: 0, y: 0, z: 0 },
    upperArm: { x: 0.13, y: 0, z: 1.25 },
    lowerArm: { x: 0, y: 0, z: 0.09 },
  },
  eyeControls: {
    yaw: 0,
    pitch: 0,
    enabled: false,
  },
  setEyeControls: (controls) => set((state) => ({
    eyeControls: { ...state.eyeControls, ...controls }
  })),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setIsListening: (isListening) => set({ isListening }),
  setUserMessage: (userMessage) => set({ userMessage }),
  setAiResponse: (aiResponse) => set({ aiResponse }),
  setError: (error) => set({ error }),
  setKeys: (openAiKey, mistralKey, elevenLabsKey, deepgramKey, humeApiKey, humeSecretKey) => {
    localStorage.setItem('laura_openai_key', openAiKey);
    localStorage.setItem('laura_mistral_key', mistralKey);
    localStorage.setItem('laura_elevenlabs_key', elevenLabsKey);
    localStorage.setItem('laura_deepgram_key', deepgramKey);
    localStorage.setItem('laura_hume_api_key', humeApiKey);
    localStorage.setItem('laura_hume_secret_key', humeSecretKey);
    set({ openAiKey, mistralKey, elevenLabsKey, deepgramKey, humeApiKey, humeSecretKey });
  },
  setUseHume: (useHume) => {
    localStorage.setItem('laura_use_hume', String(useHume));
    set({ useHume });
  },
  setHumeAccessToken: (humeAccessToken) => set({ humeAccessToken }),
  setHumeFft: (humeFft) => set({ humeFft }),
  setHumeConfigId: (humeConfigId) => {
    localStorage.setItem('laura_hume_config_id', humeConfigId);
    set({ humeConfigId });
  },
  setVoiceId: (voiceId) => {
    localStorage.setItem('laura_voice_id', voiceId);
    set({ voiceId });
  },
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setPoseRotation: (part, axis, value) =>
    set((state) => ({
      poseControls: {
        ...state.poseControls,
        [part]: {
          ...state.poseControls[part],
          [axis]: value,
        },
      },
    })),
  setUseElevenLabsAgent: (useElevenLabsAgent) => {
    localStorage.setItem('laura_use_agent', String(useElevenLabsAgent));
    set({ useElevenLabsAgent });
  },
  triggerEmotion: (emotion) => set({ triggeredEmotion: emotion }),
  setEmotionIntensity: (intensity) => set({ emotionIntensity: intensity }),
  setAudioAnalyser: (audioAnalyser) => set({ audioAnalyser }),
  setLipSyncSettings: (settings) => set((state) => ({
    lipSyncSensitivity: settings.sensitivity ?? state.lipSyncSensitivity,
    lipSyncSmoothing: settings.smoothing ?? state.lipSyncSmoothing,
    lipSyncNoiseFloor: settings.noiseFloor ?? state.lipSyncNoiseFloor,
    lipSyncSibilantThreshold: settings.sibilantThreshold ?? state.lipSyncSibilantThreshold,
    lipSyncClosedThreshold: settings.closedThreshold ?? state.lipSyncClosedThreshold
  })),
  addToConversationHistory: (role, content) => set((state) => ({
    conversationHistory: [...state.conversationHistory, { role, content }]
  })),
  clearConversationHistory: () => set({ conversationHistory: [] }),
  setLastAudioBuffer: (lastAudioBuffer) => set({ lastAudioBuffer }),
  setUseDeepgram: (useDeepgram) => {
    localStorage.setItem('laura_use_deepgram', String(useDeepgram));
    set({ useDeepgram });
  },
  setShowPoseControls: (showPoseControls) => {
    localStorage.setItem('laura_show_pose_controls', String(showPoseControls));
    set({ showPoseControls });
  },
  setShowConversation: (showConversation) => {
    localStorage.setItem('laura_show_conversation', String(showConversation));
    set({ showConversation });
  },
}));
