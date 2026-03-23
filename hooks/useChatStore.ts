import { create } from 'zustand';
import { sendMessageToAI, ChatAction } from '../services/chatService';

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
    sessionId: string; // Unique per conversation, sent to Edge Function for chat history

    // Actions
    sendMessage: (text: string) => Promise<void>;
    retryLastMessage: () => Promise<void>;
    clearHistory: () => void;
}

/**
 * useChatStore: Manages conversation state and AI interactions.
 *
 * Security: AI calls now go through the Supabase Edge Function (see services/chatService.ts).
 * Claude API key is server-side only — never in the client bundle.
 */
export const useChatStore = create<ChatState>((set, get) => ({
    messages: [
        {
            id: 'welcome',
            role: 'assistant',
            text: "Hello! I'm Mindi, your mental wellness companion. How are you feeling today?",
            timestamp: new Date(),
            status: 'sent'
        }
    ],
    isTyping: false,
    sessionId: `session-${Date.now()}`, // Unique ID for this chat session

    sendMessage: async (text) => {
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: new Date(),
            status: 'sent'
        };

        // 1. Optimistically append user message and show typing indicator
        set(state => ({
            messages: [...state.messages, userMsg],
            isTyping: true
        }));

        try {
            // 2. Call Edge Function — secure, server-side Claude call
            const { reply, actions } = await sendMessageToAI(text, get().sessionId);

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: reply,
                timestamp: new Date(),
                status: 'sent',
                actions
            };

            set(state => ({
                messages: [...state.messages, aiMsg],
                isTyping: false
            }));

        } catch (error) {
            console.error('✦ useChatStore: sendMessage error:', error);

            // Empathetic error state — never show empty bubbles
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

    retryLastMessage: async () => {
        const { messages } = get();
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg) {
            // Remove the last error bubble before retrying
            set(state => ({
                messages: state.messages.filter(m => m.status !== 'error')
            }));
            await get().sendMessage(lastUserMsg.text);
        }
    },

    clearHistory: () => set({
        messages: [],
        sessionId: `session-${Date.now()}` // Fresh session ID on clear
    })
}));
