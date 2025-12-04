// ElevenLabs Conversational AI Agent integration
const AGENT_ID = 'agent_2401k3rt47vef09a31p4nz0rhea9';

export const getElevenLabsAgentResponse = async (userMessage: string, apiKey: string): Promise<{ text: string; audioUrl?: string; audioData?: ArrayBuffer }> => {
    return new Promise((resolve, reject) => {
        // WebSocket endpoint for Conversational AI
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}&xi-api-key=${apiKey}`;
        const ws = new WebSocket(wsUrl);

        let audioChunks: Uint8Array[] = [];
        let fullText = "";
        let isResolved = false;

        ws.onopen = () => {
            console.log("Connected to ElevenLabs Agent");
            // Send the user's text message
            // Try simplified format first
            const message = {
                text: userMessage
            };
            console.log("Sending to Agent:", message);
            ws.send(JSON.stringify(message));
        };

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);

                // Handle Audio Response
                if (data.audio_event?.audio_base64) {
                    const binaryString = window.atob(data.audio_event.audio_base64);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    audioChunks.push(bytes);
                }

                // Handle Text Response (captions/transcript)
                if (data.agent_response_event?.agent_response) {
                    fullText += data.agent_response_event.agent_response + " ";
                }

            } catch (e) {
                console.error("Error parsing WebSocket message:", e);
            }
        };

        ws.onerror = (error) => {
            console.error("ElevenLabs WebSocket Error:", error);
            if (!isResolved) {
                reject(error);
                isResolved = true;
            }
        };

        ws.onclose = (event) => {
            console.log("ElevenLabs WebSocket Closed", event.code, event.reason);
            if (!isResolved) {
                // Combine audio chunks
                if (audioChunks.length > 0) {
                    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
                    const combinedAudio = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const chunk of audioChunks) {
                        combinedAudio.set(chunk, offset);
                        offset += chunk.length;
                    }

                    resolve({
                        text: fullText.trim() || "Réponse audio reçue",
                        audioData: combinedAudio.buffer
                    });
                } else {
                    resolve({ text: fullText.trim() || "Pas de réponse" });
                }
                isResolved = true;
            }
        };

        // Safety timeout - close after 10 seconds if no completion
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }, 10000);
    });
};
