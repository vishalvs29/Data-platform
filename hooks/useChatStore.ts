import { create } from 'zustand';
import { buildSystemPrompt, parseChatActions, ChatAction } from '../services/chatService';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
    status?: 'typing' | 'error' | 'sent';
    actions?: ChatAction[];
}

interface ChatState {
    messages: ChatMessage[];
    isTyping: boolean;

    // Actions
    sendMessage: (text: string, context: any) => Promise<void>;
    retryLastMessage: (context: any) => Promise<void>;
    clearHistory: () => void;
}

/**
 * useChatStore: Manages the conversation state and AI interactions.
 * Implements typing indicators and empathetic error handling.
 */
export const useChatStore = create<ChatState>((set, get) => ({
    messages: [
        {
            id: 'welcome',
            role: 'assistant',
            text: "Hello! I'm Mindi. How are you feeling today?",
            timestamp: new Date(),
            status: 'sent'
        }
    ],
    isTyping: false,

    sendMessage: async (text, context) => {
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: new Date(),
            status: 'sent'
        };

        // 1. Append user message and set typing
        set(state => ({
            messages: [...state.messages, userMsg],
            isTyping: true
        }));

        try {
            // 2. Build Prompt
            const systemPrompt = buildSystemPrompt(context);

            // 3. Mock API Call (In production, this calls a real LLM)
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const rawAiResponse = "I understand you're feeling a bit stressed. Would you like to try a quick breathing exercise? [ACTION: {\"type\": \"start_session\", \"payload\": {\"sessionId\": \"breathe-1\"}}]";

            // 4. Parse Actions
            const { cleanText, actions } = parseChatActions(rawAiResponse);

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: cleanText,
                timestamp: new Date(),
                status: 'sent',
                actions
            };

            set(state => ({
                messages: [...state.messages, aiMsg],
                isTyping: false
            }));
        } catch (error) {
            console.error('Chat API Error:', error);

            // 5. Empathetic Error Handling (No empty bubbles!)
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: "I'm having a moment — try again in a few seconds 💙",
                timestamp: new Date(),
                status: 'error'
            };

            set(state => ({
                messages: [...state.messages, errorMsg],
                isTyping: false
            }));
        }
    },

    retryLastMessage: async (context) => {
        const { messages } = get();
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg) {
            await get().sendMessage(lastUserMsg.text, context);
        }
    },

    clearHistory: () => set({ messages: [] })
}));
