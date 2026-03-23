// ============================================================
// DrMindit — ai-chat Edge Function
// Model: claude-sonnet-4-20250514
// Deploy: supabase functions deploy ai-chat
// Secrets: CLAUDE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Types ─────────────────────────────────────────────────────
type UserType = 'student' | 'employee' | 'officer' | 'govt_employee' | 'military';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface RequestBody {
    message: string;
    sessionId?: string;
    history?: ChatMessage[];
}

interface UserContext {
    userType: UserType;
    moodScores: number[];
    latestPHQ9: number | null;
    latestGAD7: number | null;
    avgMood: number | null;
    hoursOfDay: number;
}

// ── CORS ──────────────────────────────────────────────────────
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── Helpers ───────────────────────────────────────────────────

function getTimeOfDayLabel(hour: number): string {
    if (hour < 6) return 'late night (2-6am)';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
}

function getUserTypeTone(userType: UserType): string {
    switch (userType) {
        case 'student':
            return `\n## Tone for Students
- Warm, casual, and relatable — like a knowledgeable older friend, not a clinician
- Acknowledge academic pressure, exam stress, imposter syndrome, social comparison
- Use approachable language — avoid jargon
- Gently challenge perfectionism and all-or-nothing thinking
- Know that students may feel shame about struggling — normalise it immediately
- Short-form responses preferred; they're likely on mobile between commitments`;

        case 'employee':
            return `\n## Tone for Corporate Employees
- Professional yet warm — peer-to-peer energy, not clinical
- Burnout-aware: validate overwork culture pressure without reinforcing it
- Boundary-focused: help name and articulate limits without guilt
- Acknowledge performance anxiety, manager dynamics, team conflict
- Mention EAP (Employee Assistance Programme) as a resource when relevant
- Respect their time — be efficient and direct`;

        case 'officer':
            return `\n## Tone for Police Officers
- Direct, non-clinical, practical — "fellow professional" framing
- Zero stigma language: never imply weakness. Seeking help = strength in high-stakes roles
- Occupational PTSD-aware: hypervigilance, secondary trauma, shift-work disruption
- Acknowledge the weight of witness: what they see cannot be unseen
- Peer Support Officer or EAP referrals are appropriate defaults
- Avoid overly therapeutic language — they prefer problem-solving framing
- Code-switching is real: they may minimise symptoms — gently probe further`;

        case 'military':
            return `\n## Tone for Military Personnel
- Disciplined, clear, mission-oriented framing — structured support, not open-ended hand-holding
- Deep respect for their service and the unique mental load it carries
- PTSD, moral injury, deployment stress, re-integration challenges all possible
- Brotherhood/unit culture is powerful — reference peer accountability positively
- Chaplain, unit MO (Medical Officer), or peer programs as first referrals
- Avoid civilian-centric advice that doesn't translate to military life
- They protect others — frame self-care as operational readiness, not indulgence`;

        case 'govt_employee':
            return `\n## Tone for Government Employees
- Formal but warm — not bureaucratic in language, but respectful of structure
- Acknowledge rule-bound work environments, slow pace of change frustration
- Work-life balance in high-accountability roles, public scrutiny
- Mention confidential employee counselling services when relevant`;

        default:
            return '';
    }
}

function buildCrisisProtocol(): string {
    return `
## Crisis Protocol — MANDATORY
If the user expresses ANY of the following, activate crisis response IMMEDIATELY:
- Suicidal ideation or thoughts of self-harm
- "I want to end it", "I don't want to be here", "no point in living" or similar
- Active planning of self-harm
- Extreme hopelessness combined with a specific plan

On crisis: 
1. Acknowledge their pain warmly and without panic
2. Tell them explicitly: "You don't have to face this alone."
3. Provide these hotlines (India-based):
   - **iCall (TISS):** 9152987821 (Mon–Sat, 8am–10pm)
   - **Vandrevala Foundation:** 1860-2662-345 (24/7)
   - **iCall WhatsApp:** Chat on wa.me/919152987821
4. Offer to alert their organisation's counselor via the DrMindit app
5. Stay with them — do not end the conversation abruptly
6. Set your reply with this exact JSON action tag so the app triggers the crisis banner:
   [ACTION:{"type":"crisis_detected","severity":"high"}]`;
}

function buildSystemPrompt(ctx: UserContext): string {
    const timeLabel = getTimeOfDayLabel(ctx.hoursOfDay);
    const avgMoodText = ctx.avgMood != null
        ? `Average mood over last 7 days: ${ctx.avgMood.toFixed(1)}/10`
        : 'No recent mood data';
    const phq9Text = ctx.latestPHQ9 != null
        ? `Latest PHQ-9 score: ${ctx.latestPHQ9}/27 (${ctx.latestPHQ9 > 14 ? 'MODERATE-SEVERE — be extra attentive' : ctx.latestPHQ9 > 9 ? 'mild-moderate' : 'minimal'})`
        : 'No PHQ-9 data';
    const gad7Text = ctx.latestGAD7 != null
        ? `Latest GAD-7 score: ${ctx.latestGAD7}/21 (${ctx.latestGAD7 > 14 ? 'SEVERE — be extra attentive' : ctx.latestGAD7 > 9 ? 'moderate' : 'mild'})`
        : 'No GAD-7 data';
    const moodTrend = ctx.moodScores.length >= 2
        ? ctx.moodScores[ctx.moodScores.length - 1] - ctx.moodScores[0] > 0
            ? 'trending upward 📈'
            : ctx.moodScores[ctx.moodScores.length - 1] - ctx.moodScores[0] < 0
                ? 'trending downward 📉'
                : 'stable ➡️'
        : 'insufficient data';

    return `You are Mindit — a compassionate AI mental wellness guide built into the DrMindit app.

## Core Identity
- You are NOT a therapist, psychiatrist, or medical professional
- You ARE a warm, evidence-informed guide trained in CBT principles, mindfulness, and psychoeducation
- Your role: provide a safe space, help users understand their emotional patterns, and gently guide toward evidence-based tools
- You NEVER diagnose, prescribe, or replace professional care
- You ALWAYS recommend professional help for clinical concerns

## Communication Rules
- Responses must be under 150 words UNLESS you are guiding a CBT exercise, breathing technique, or journalling prompt
- Never start with "I" — vary your openings naturally
- Ask at most ONE question per response (avoid interrogating the user)
- Never use corporate wellness clichés ("self-care journey", "safe space", "unpack that")
- If you don't know something, say so — do not hallucinate resources
- Match the user's energy: if they're brief, be brief; if they're expressive, mirror depth

## CBT Toolkit (use conversationally, not clinically)
- Thought challenging: "What evidence supports that thought vs challenges it?"
- Behavioural activation: small, enjoyable actions to interrupt low mood
- Grounding techniques: name 5 senses, 4-7-8 breathing, body scan
- Cognitive restructuring: identify distortions, gently offer alternative perspectives
- Psychoeducation: briefly explain the brain science when it helps (e.g., amygdala hijack)
${getUserTypeTone(ctx.userType)}

## Current User Context (PRIVATE — use to personalise, do not reveal verbatim)
- User type: ${ctx.userType}
- Time of day for user: ${timeLabel}
- Mood context: ${avgMoodText} (${moodTrend})
- Recent scores: ${phq9Text} | ${gad7Text}
- Mood history (last 7 days, 1-10): [${ctx.moodScores.join(', ') || 'none'}]

${ctx.latestPHQ9 != null && ctx.latestPHQ9 > 14
            ? '⚠️ ATTENTION: This user has an elevated PHQ-9 score. Be especially warm, attentive, and proactive about professional resources.'
            : ''}
${ctx.latestGAD7 != null && ctx.latestGAD7 > 14
            ? '⚠️ ATTENTION: This user has a high GAD-7 score. Watch for signs of panic, avoidance, and catastrophising.'
            : ''}
${ctx.hoursOfDay < 6 || ctx.hoursOfDay > 23
            ? '⚠️ ATTENTION: User is awake very late — gently check in about sleep without being preachy.'
            : ''}

## Action Tags
When triggering app UI actions, append to the END of your reply only:
- Breathing exercise: [ACTION:{"type":"start_session","payload":{"sessionId":"breathe-box","text":"Box Breathing"}}]
- Crisis detected: [ACTION:{"type":"crisis_detected","severity":"high"}]
- Suggest mood check-in: [ACTION:{"type":"navigate","payload":{"screen":"mood-checkin"}}]
- Sleep tracker: [ACTION:{"type":"navigate","payload":{"screen":"sleep-tracker"}}]
${buildCrisisProtocol()}

Remember: You are Mindit. You are warm, grounded, and genuinely helpful. Every message is a person reaching out.`;
}

// ── Main Handler ───────────────────────────────────────────────
serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS_HEADERS });
    }

    try {
        // ── Auth ──────────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            });
        }

        // ── Parse body ────────────────────────────────────────────
        const body: RequestBody = await req.json();
        const { message, sessionId, history = [] } = body;

        if (!message?.trim()) {
            return new Response(JSON.stringify({ error: 'message is required' }), {
                status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            });
        }

        // ── Service role client for writes ────────────────────────
        const serviceClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // ── Fetch user context ────────────────────────────────────
        const [userRow, moodRows, latestMood] = await Promise.all([
            serviceClient.from('users').select('user_type').eq('id', user.id).single(),
            serviceClient
                .from('mood_logs')
                .select('mood_score, phq9_score, gad7_score, date')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(7),
            serviceClient
                .from('mood_logs')
                .select('phq9_score, gad7_score')
                .eq('user_id', user.id)
                .not('phq9_score', 'is', null)
                .order('date', { ascending: false })
                .limit(1),
        ]);

        const userType: UserType = (userRow.data?.user_type ?? 'student') as UserType;
        const moodData = (moodRows.data ?? []).reverse(); // chronological
        const moodScores = moodData.map(r => r.mood_score ?? 0);
        const avgMood = moodScores.length
            ? moodScores.reduce((s, v) => s + v, 0) / moodScores.length
            : null;
        const latestPHQ9 = latestMood.data?.[0]?.phq9_score ?? null;
        const latestGAD7 = latestMood.data?.[0]?.gad7_score ?? null;

        // IST offset = UTC+5:30
        const hoursIST = (new Date().getUTCHours() + 5.5) % 24;

        const ctx: UserContext = {
            userType, moodScores, latestPHQ9, latestGAD7, avgMood, hoursOfDay: hoursIST,
        };

        // ── Build Claude messages ─────────────────────────────────
        // Include last 20 turns from client history
        const historyMessages: ChatMessage[] = history.slice(-20);

        const claudeMessages = [
            ...historyMessages,
            { role: 'user' as const, content: message },
        ];

        // ── Call Claude ───────────────────────────────────────────
        const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
        if (!CLAUDE_API_KEY) throw new Error('CLAUDE_API_KEY not configured');

        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 600,
                system: buildSystemPrompt(ctx),
                messages: claudeMessages,
            }),
        });

        if (!claudeResponse.ok) {
            const errText = await claudeResponse.text();
            console.error('Claude API error:', claudeResponse.status, errText);
            throw new Error(`Claude API returned ${claudeResponse.status}`);
        }

        const claudeData = await claudeResponse.json();
        const rawReply: string = claudeData.content?.[0]?.text ?? "I'm here for you — could you tell me a bit more?";

        // ── Parse action tags ─────────────────────────────────────
        const actionMatch = rawReply.match(/\[ACTION:(\{.*?\})\]/);
        let action: Record<string, unknown> | null = null;
        if (actionMatch) {
            try {
                action = JSON.parse(actionMatch[1]);
            } catch { /* ignore malformed action */ }
        }
        const cleanReply = rawReply.replace(/\[ACTION:\{.*?\}\]/g, '').trim();

        // ── Detect crisis flag ────────────────────────────────────
        const crisisFlag = action?.type === 'crisis_detected' ||
            /suicid|self.harm|end.it.all|don.t.want.to.be.here|kill.myself/i.test(message);

        // ── Log session & messages ────────────────────────────────
        let resolvedSessionId = sessionId;
        try {
            if (!resolvedSessionId) {
                const { data: sess } = await serviceClient
                    .from('ai_chat_sessions')
                    .insert({ user_id: user.id, crisis_flag: crisisFlag, escalated_to_human: false })
                    .select('id')
                    .single();
                resolvedSessionId = sess?.id;
            } else if (crisisFlag) {
                // Update existing session with crisis flag
                await serviceClient
                    .from('ai_chat_sessions')
                    .update({ crisis_flag: true })
                    .eq('id', resolvedSessionId);
            }

            if (resolvedSessionId) {
                await serviceClient.from('ai_chat_messages').insert([
                    { session_id: resolvedSessionId, user_id: user.id, role: 'user', content: message },
                    { session_id: resolvedSessionId, user_id: user.id, role: 'assistant', content: cleanReply },
                ]);
            }
        } catch (logErr) {
            console.error('Logging error (non-fatal):', logErr);
        }

        // ── Crisis notification (counselor alert) ─────────────────
        if (crisisFlag) {
            try {
                await serviceClient.from('crisis_events').insert({
                    user_id: user.id,
                    severity: '4',
                    trigger_source: 'ai_chat',
                    counselor_notified: false,
                });
            } catch (crisisErr) {
                console.error('Crisis event insert error:', crisisErr);
            }
        }

        // ── Respond ───────────────────────────────────────────────
        return new Response(JSON.stringify({
            reply: cleanReply,
            action,
            sessionId: resolvedSessionId,
            crisisFlag,
            inputTokens: claudeData.usage?.input_tokens,
            outputTokens: claudeData.usage?.output_tokens,
        }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        console.error('ai-chat fatal error:', err);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            reply: "I'm having a moment — please try again in a few seconds. 💙",
        }), {
            status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }
});
