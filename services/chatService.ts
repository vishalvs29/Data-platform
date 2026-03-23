import { getSupabaseClient } from '@/template';

export interface UserChatContext {
    name: string;
    streak: number;
    lastMood?: string;
    activeSession?: { title: string; duration: number } | null;
}

export interface ChatAction {
    type: 'start_session' | 'open_screen' | 'show_tip';
    payload: { sessionId?: string; screen?: string; text?: string };
}

export interface AIChatResponse {
    reply: string;
    actions: ChatAction[];
}

/**
 * parseChatActions — extracts [ACTION: {...}] tags from the AI reply,
 * strips them from the visible text, and returns structured action objects.
 */
export const parseChatActions = (text: string): { cleanText: string; actions: ChatAction[] } => {
    const actions: ChatAction[] = [];
    const actionRegex = /\[ACTION:\s*({.*?})\]/g;

    const cleanText = text.replace(actionRegex, (_match, jsonStr) => {
        try {
            actions.push(JSON.parse(jsonStr));
            return '';
        } catch {
            return ''; // Always strip, even if malformed
        }
    });

    return { cleanText: cleanText.trim(), actions };
};

/**
 * sendMessageToAI — calls the /api/ai-chat Supabase Edge Function.
 *
 * Security properties:
 *  ✦ Claude API key lives ONLY on the server (Edge Function env var).
 *  ✦ The Supabase JWT is forwarded so the Edge Function validates the caller.
 *  ✦ No API key is ever included in the client bundle.
 */
export const sendMessageToAI = async (
    message: string,
    sessionId?: string
): Promise<AIChatResponse> => {
    const supabase = getSupabaseClient();

    // The Supabase client automatically attaches the user's JWT as
    // Authorization: Bearer <token> when calling Edge Functions.
    const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message, sessionId },
    });

    if (error) {
        console.error('✦ chatService: Edge Function error:', error);
        throw new Error(error.message ?? 'AI service unavailable');
    }

    const rawReply: string = data?.reply ?? "I'm here for you. Could you tell me a bit more?";
    const { cleanText, actions } = parseChatActions(rawReply);

    return { reply: cleanText, actions };
};
