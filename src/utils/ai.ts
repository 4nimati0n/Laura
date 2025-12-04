import { useAppStore } from '../store/useAppStore';

const LAURA_SYSTEM_PROMPT = `Tu es Laura, une compagne IA serviable, gentille et enjouée. Tu es un personnage d'anime.
Tu te souviens de toute la conversation et tu fais référence aux échanges précédents quand c'est pertinent.
Tu réponds de manière naturelle et conversationnelle, en maintenant la continuité de la discussion.
Garde tes réponses concises mais complètes.`;

export const getMistralResponse = async (userMessage: string): Promise<string> => {
    const { mistralKey, addToConversationHistory } = useAppStore.getState();

    if (!mistralKey) {
        throw new Error("Mistral API Key is missing. Please add it in Settings.");
    }

    // Add user message to history
    addToConversationHistory('user', userMessage);

    // Build messages array with system prompt + full conversation history
    const messages = [
        { role: "system", content: LAURA_SYSTEM_PROMPT },
        ...useAppStore.getState().conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }))
    ];

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mistralKey}`
            },
            body: JSON.stringify({
                model: "mistral-small-latest",
                messages,
                max_tokens: 500 // Increased to prevent truncation
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Mistral API Error:", response.status, errorText);
            throw new Error(`Failed to fetch from Mistral: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Add AI response to history
        addToConversationHistory('assistant', aiResponse);

        return aiResponse;
    } catch (error: any) {
        console.error("Mistral Error:", error);
        throw error;
    }
};

export const getOpenAIResponse = async (userMessage: string): Promise<string> => {
    const { openAiKey } = useAppStore.getState();

    if (!openAiKey) {
        throw new Error("OpenAI API Key is missing. Please add it in Settings.");
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Fast and cheap
                messages: [
                    { role: "system", content: "You are Laura, a helpful, kind, and slightly playful AI companion. Keep your responses concise and conversational." },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to fetch from OpenAI");
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error: any) {
        console.error("OpenAI Error:", error);
        throw error;
    }
};

export const getElevenLabsAudio = async (text: string): Promise<ArrayBuffer> => {
    const { elevenLabsKey, voiceId } = useAppStore.getState();

    if (!elevenLabsKey) {
        throw new Error("ElevenLabs API Key is missing. Please add it in Settings.");
    }

    const actualVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default to Rachel if not set

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsKey
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2", // Better model for multilingual support
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8,
                    style: 0.0,
                    use_speaker_boost: true
                },
                language_code: "fr" // French language
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs API Error:", response.status, errorText);
            throw new Error(`Invalid API key or voice ID: ${response.status}`);
        }

        return await response.arrayBuffer();
    } catch (error: any) {
        console.error("ElevenLabs Error:", error);
        throw error;
    }
};
