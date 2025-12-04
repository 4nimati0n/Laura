import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Settings = () => {
    const {
        openAiKey,
        mistralKey,
        elevenLabsKey,
        deepgramKey,
        voiceId,
        humeApiKey,
        humeSecretKey,
        useHume,
        useElevenLabsAgent,
        useDeepgram,
        showPoseControls,
        showConversation,
        setKeys,
        setVoiceId,
        setUseElevenLabsAgent,
        setUseDeepgram,
        setUseHume,
        setShowPoseControls,
        setShowConversation,
        setIsSettingsOpen
    } = useAppStore();

    const [localOpenAiKey, setLocalOpenAiKey] = useState(openAiKey);
    const [localMistralKey, setLocalMistralKey] = useState(mistralKey);
    const [localElevenLabsKey, setLocalElevenLabsKey] = useState(elevenLabsKey);
    const [localDeepgramKey, setLocalDeepgramKey] = useState(deepgramKey);
    const [localHumeApiKey, setLocalHumeApiKey] = useState(humeApiKey);
    const [localHumeSecretKey, setLocalHumeSecretKey] = useState(humeSecretKey);
    const [localVoiceId, setLocalVoiceId] = useState(voiceId);
    const [localUseAgent, setLocalUseAgent] = useState(useElevenLabsAgent);
    const [localUseDeepgram, setLocalUseDeepgram] = useState(useDeepgram);
    const [localUseHume, setLocalUseHume] = useState(useHume);
    const [localShowPoseControls, setLocalShowPoseControls] = useState(showPoseControls);
    const [localShowConversation, setLocalShowConversation] = useState(showConversation);

    const handleSave = () => {
        setKeys(localOpenAiKey, localMistralKey, localElevenLabsKey, localDeepgramKey, localHumeApiKey, localHumeSecretKey);
        setVoiceId(localVoiceId);
        setUseElevenLabsAgent(localUseAgent);
        setUseDeepgram(localUseDeepgram);
        setUseHume(localUseHume);
        setShowPoseControls(localShowPoseControls);
        setShowConversation(localShowConversation);
        setIsSettingsOpen(false);
    };

    return (
        <div className="settings-overlay">
            <div className="settings-modal">
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="close-button">
                        <X size={24} />
                    </button>
                </div>

                <div className="settings-content">
                    <div className="input-group">
                        <label>OpenAI API Key</label>
                        <input
                            type="password"
                            value={localOpenAiKey}
                            onChange={(e) => setLocalOpenAiKey(e.target.value)}
                            placeholder="sk-..."
                        />
                        <p className="help-text">Required for intelligence (GPT-4o/3.5)</p>
                    </div>

                    <div className="input-group">
                        <label>Mistral API Key (Preferred)</label>
                        <input
                            type="password"
                            value={localMistralKey}
                            onChange={(e) => setLocalMistralKey(e.target.value)}
                            placeholder="Key..."
                        />
                        <p className="help-text">Required for Mistral intelligence</p>
                    </div>

                    <div className="input-group">
                        <label>ElevenLabs API Key</label>
                        <input
                            type="password"
                            value={localElevenLabsKey}
                            onChange={(e) => setLocalElevenLabsKey(e.target.value)}
                            placeholder="xi-..."
                        />
                        <p className="help-text">Required for realistic voice</p>
                    </div>

                    <div className="input-group">
                        <label>Deepgram API Key (Optional)</label>
                        <input
                            type="password"
                            value={localDeepgramKey}
                            onChange={(e) => setLocalDeepgramKey(e.target.value)}
                            placeholder="Token..."
                        />
                        <p className="help-text">For fast, accurate French speech-to-text</p>
                    </div>

                    <div className="input-group">
                        <label>Hume API Key</label>
                        <input
                            type="password"
                            value={localHumeApiKey}
                            onChange={(e) => setLocalHumeApiKey(e.target.value)}
                            placeholder="Hume API Key..."
                        />
                    </div>

                    <div className="input-group">
                        <label>Hume Secret Key</label>
                        <input
                            type="password"
                            value={localHumeSecretKey}
                            onChange={(e) => setLocalHumeSecretKey(e.target.value)}
                            placeholder="Hume Secret Key..."
                        />
                        <p className="help-text">Required for EVI 4 mini / Octave 2</p>
                    </div>

                    <div className="input-group">
                        <label>Voice ID</label>
                        <input
                            type="text"
                            value={localVoiceId}
                            onChange={(e) => setLocalVoiceId(e.target.value)}
                            placeholder="Voice ID"
                        />
                        <p className="help-text">Default: Rachel (21m00Tcm4TlvDq8ikWAM)</p>
                    </div>

                    <div className="input-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={localUseAgent}
                                onChange={(e) => setLocalUseAgent(e.target.checked)}
                            />
                            <span>Utiliser l'Agent Conversationnel ElevenLabs</span>
                        </label>
                        <p className="help-text">Active l'agent conversationnel AI au lieu de Mistral + TTS</p>
                    </div>

                    <div className="input-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={localUseDeepgram}
                                onChange={(e) => setLocalUseDeepgram(e.target.checked)}
                            />
                            <span>Utiliser Deepgram pour la reconnaissance vocale</span>
                        </label>
                        <p className="help-text">Plus rapide et précis que le navigateur (nécessite une clé API)</p>
                    </div>

                    <div className="input-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={localUseHume}
                                onChange={(e) => setLocalUseHume(e.target.checked)}
                            />
                            <span>Utiliser Hume AI (EVI 4 mini / Octave 2)</span>
                        </label>
                        <p className="help-text">Remplace ElevenLabs/Mistral par l'IA vocale empathique de Hume</p>
                    </div>

                    <div className="input-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={localShowPoseControls}
                                onChange={(e) => setLocalShowPoseControls(e.target.checked)}
                            />
                            <span>Afficher les contrôles de pose</span>
                        </label>
                        <p className="help-text">Masquer/afficher le panneau latéral des contrôles</p>
                    </div>

                    <div className="input-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={localShowConversation}
                                onChange={(e) => setLocalShowConversation(e.target.checked)}
                            />
                            <span>Afficher les bulles de conversation</span>
                        </label>
                        <p className="help-text">Masquer/afficher les messages à l'écran</p>
                    </div>
                </div>

                <div className="settings-footer">
                    <button onClick={handleSave} className="save-button">
                        <Save size={20} />
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
