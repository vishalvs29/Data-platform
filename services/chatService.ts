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

/**
 * buildSystemPrompt: Constructs a rich, contextual system prompt for the AI.
 * Resolves CB-001 by providing the model with user and app state.
 */
export const buildSystemPrompt = (context: UserChatContext): string => {
    const { name, streak, lastMood, activeSession } = context;
    const time = new Date().toLocaleTimeString();

    return `You are Mindit, a compassionate mental wellness companion for the DrMindit app.
User: ${name}, streak: ${streak} days.
Active session: ${activeSession?.title ?? 'None'} (${activeSession?.duration ?? 0}min).
Recent mood: ${lastMood ?? 'unknown'}.
Time: ${time}.

INSTRUCTIONS:
1. Be warm, brief, and supportive. Use a soothing tone.
2. If appropriate, suggest a session or tool (Breathing, Focus, Sleep).
3. OPTIONAL: If suggesting an action, include a structured tag at the end of your response like:
   [ACTION: {"type": "start_session", "payload": {"sessionId": "breathe-1"}}]
4. Never render empty responses. Always provide empathetic value.`;
};

/**
 * parseChatActions: Extracts structured actions from the AI's raw text.
 */
export const parseChatActions = (text: string): { cleanText: string; actions: ChatAction[] } => {
    const actions: ChatAction[] = [];
    const actionRegex = /\[ACTION:\s*({.*?})\]/g;

    let cleanText = text.replace(actionRegex, (match, jsonStr) => {
        try {
            const action = JSON.parse(jsonStr);
            actions.push(action);
            return ''; // Remove tag from visible text
        } catch (e) {
            console.error('Failed to parse chat action:', e);
            return match;
        }
    });

    return { cleanText: cleanText.trim(), actions };
};
