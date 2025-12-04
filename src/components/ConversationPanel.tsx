import { useAppStore } from '../store/useAppStore';
import '../styles/ConversationPanel.css';

export const ConversationPanel = () => {
    const { userMessage, aiResponse } = useAppStore();

    return (
        <div className="conversation-panel">
            <div className="conversation-header">
                <h2>Conversation</h2>
            </div>
            <div className="conversation-content">
                {userMessage && (
                    <div className="message user-message">
                        <div className="message-label">You</div>
                        <div className="message-content">{userMessage}</div>
                    </div>
                )}
                {aiResponse && (
                    <div className="message ai-message">
                        <div className="message-label">Laura</div>
                        <div className="message-content">{aiResponse}</div>
                    </div>
                )}
                {!userMessage && !aiResponse && (
                    <div className="empty-state">
                        <p>Start talking to begin the conversation!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
