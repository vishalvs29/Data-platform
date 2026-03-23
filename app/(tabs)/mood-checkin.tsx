import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Alert,
    ActivityIndicator,
    useColorScheme,
    AccessibilityInfo,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getSupabaseClient } from '@/template';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';

// ── Types ────────────────────────────────────────────────────
type UserType = 'student' | 'employee' | 'officer' | 'govt_employee' | 'military';

type MoodEmoji = { key: string; emoji: string; label: string; score: number };

const MOOD_OPTIONS: MoodEmoji[] = [
    { key: 'great', emoji: '😄', label: 'Great', score: 5 },
    { key: 'good', emoji: '🙂', label: 'Good', score: 4 },
    { key: 'okay', emoji: '😐', label: 'Okay', score: 3 },
    { key: 'sad', emoji: '😔', label: 'Low', score: 2 },
    { key: 'stressed', emoji: '😰', label: 'Stressed', score: 1 },
];

// PHQ-9 questions with user-type-aware variants
const getPHQ9Questions = (userType: UserType): string[] => {
    const base = [
        'Little interest or pleasure in doing things',
        'Feeling down, depressed, or hopeless',
        'Trouble falling or staying asleep, or sleeping too much',
        'Feeling tired or having little energy',
        'Poor appetite or overeating',
        'Feeling bad about yourself — or that you are a failure',
        'Trouble concentrating on things, such as reading or work/study',
        'Moving or speaking so slowly others could notice — or being fidgety/restless',
        'Thoughts that you would be better off dead, or thoughts of hurting yourself',
    ];
    if (userType === 'student') {
        base[6] = 'Trouble concentrating on lectures, studying, or assignments';
    } else if (userType === 'military' || userType === 'officer') {
        base[1] = 'Feeling numb, distant, or unable to feel emotions you used to feel';
        base[8] = 'Thoughts of harming yourself or others, or that it would be easier not to be here';
    }
    return base;
};

// GAD-7 questions
const getGAD7Questions = (userType: UserType): string[] => {
    const base = [
        'Feeling nervous, anxious, or on edge',
        'Not being able to stop or control worrying',
        'Worrying too much about different things',
        'Trouble relaxing',
        'Being so restless that it\'s hard to sit still',
        'Becoming easily annoyed or irritable',
        'Feeling afraid, as if something awful might happen',
    ];
    if (userType === 'military' || userType === 'officer') {
        base[0] = 'Feeling hypervigilant, on guard, or unable to relax even when safe';
        base[6] = 'Feeling like you need to be constantly alert or something bad will happen';
    }
    return base;
};

const FREQUENCY_OPTIONS = [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half', value: 2 },
    { label: 'Nearly every day', value: 3 },
];

// Severity thresholds
const getPHQ9Severity = (score: number) => {
    if (score <= 4) return { label: 'Minimal', color: '#48BB78', emoji: '✨' };
    if (score <= 9) return { label: 'Mild', color: '#ECC94B', emoji: '🌤' };
    if (score <= 14) return { label: 'Moderate', color: '#F6AD55', emoji: '⛅' };
    if (score <= 19) return { label: 'Moderately Severe', color: '#F56565', emoji: '🌧' };
    return { label: 'Severe', color: '#C53030', emoji: '⚡' };
};

const getGAD7Severity = (score: number) => {
    if (score <= 4) return { label: 'Minimal', color: '#48BB78' };
    if (score <= 9) return { label: 'Mild', color: '#ECC94B' };
    if (score <= 14) return { label: 'Moderate', color: '#F6AD55' };
    return { label: 'Severe', color: '#C53030' };
};

// ── Component ─────────────────────────────────────────────────
export default function MoodCheckInScreen() {
    const colorScheme = useColorScheme();
    const theme = colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const supabase = getSupabaseClient();

    // Step management: 0=mood, 1=energy, 2=phq9, 3=gad7, 4=result
    const [step, setStep] = useState(0);
    const [selectedMood, setSelectedMood] = useState<MoodEmoji | null>(null);
    const [energyLevel, setEnergyLevel] = useState(5);
    const [phq9Answers, setPHQ9Answers] = useState<number[]>(Array(9).fill(-1));
    const [gad7Answers, setGAD7Answers] = useState<number[]>(Array(7).fill(-1));
    const [saving, setSaving] = useState(false);
    const [userType, setUserType] = useState<UserType>('student');
    const [notes, setNotes] = useState('');

    // Animation
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Fetch user_type from Supabase
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('user_type')
                    .eq('id', user.id)
                    .single();
                if (data?.user_type) setUserType(data.user_type as UserType);
            }
        })();
    }, []);

    const animateTransition = (callback: () => void) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            callback();
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
    };

    const phq9Score = phq9Answers.reduce((s, v) => s + (v >= 0 ? v : 0), 0);
    const gad7Score = gad7Answers.reduce((s, v) => s + (v >= 0 ? v : 0), 0);
    const phq9Severity = getPHQ9Severity(phq9Score);
    const gad7Severity = getGAD7Severity(gad7Score);

    const handleSave = useCallback(async () => {
        if (!selectedMood) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            await supabase.from('mood_logs').upsert({
                user_id: user.id,
                date: new Date().toISOString().split('T')[0],
                mood_score: selectedMood.score * 2,   // map 1-5 → 2-10
                energy_level: Math.round(energyLevel),
                anxiety_level: Math.round((gad7Score / 21) * 10), // normalise to 1-10
                notes: notes || null,
                phq9_score: phq9Score,
                gad7_score: gad7Score,
            }, { onConflict: 'user_id,date' });

            // Crisis escalation
            if (phq9Score > 15 || gad7Score > 15 || phq9Answers[8] > 0) {
                await supabase.from('crisis_events').insert({
                    user_id: user.id,
                    severity: phq9Score > 20 || phq9Answers[8] >= 2 ? '4' : '3',
                    trigger_source: 'phq9',
                    counselor_notified: false,
                }).then(async ({ error }) => {
                    // This insert will be handled by service_role Edge Function in production
                    // For now, show crisis alert
                });

                const msg = userType === 'military' || userType === 'officer'
                    ? 'Your responses suggest you may be struggling. At many bases and departments, seeking support shows strength. Would you like to connect with your peer support specialist?'
                    : 'Your responses suggest you could benefit from extra support right now. Would you like to speak with a counselor or explore crisis resources?';

                Alert.alert('We\'re Here for You', msg, [
                    { text: 'See Resources', onPress: () => router.push('/(tabs)/resources') },
                    { text: 'Continue', style: 'cancel' },
                ]);
            }

            animateTransition(() => setStep(4));
        } catch (err) {
            Alert.alert('Error', 'Could not save your check-in. Please try again.');
            console.error('MoodCheckIn save error:', err);
        } finally {
            setSaving(false);
        }
    }, [selectedMood, energyLevel, phq9Score, gad7Score, phq9Answers, notes, userType]);

    const phq9Questions = getPHQ9Questions(userType);
    const gad7Questions = getGAD7Questions(userType);
    const steps = ['Mood', 'Energy', 'Depression Screen', 'Anxiety Screen', 'Results'];
    const progressWidth = ((step + 1) / steps.length) * 100;

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]} accessibilityRole="header">
                    Daily Check-In
                </Text>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                    Step {step + 1} of {steps.length} — {steps[step]}
                </Text>
                {/* Progress bar */}
                <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                    <Animated.View
                        style={[styles.progressFill, { width: `${progressWidth}%`, backgroundColor: theme.primary }]}
                        accessibilityLabel={`${Math.round(progressWidth)}% complete`}
                    />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>

                    {/* ── STEP 0: Mood Emoji ─────────────────────────── */}
                    {step === 0 && (
                        <View>
                            <Text style={[styles.question, { color: theme.text }]}>
                                How are you feeling right now?
                            </Text>
                            <View style={styles.moodRow}>
                                {MOOD_OPTIONS.map(mood => (
                                    <TouchableOpacity
                                        key={mood.key}
                                        style={[
                                            styles.moodBtn,
                                            { backgroundColor: theme.surface, borderColor: theme.border },
                                            selectedMood?.key === mood.key && { borderColor: theme.primary, backgroundColor: theme.surfaceSecondary },
                                        ]}
                                        onPress={() => {
                                            Animated.spring(scaleAnim, { toValue: 1.1, useNativeDriver: true }).start(() =>
                                                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
                                            );
                                            setSelectedMood(mood);
                                        }}
                                        accessibilityLabel={mood.label}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: selectedMood?.key === mood.key }}
                                    >
                                        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                        <Text style={[styles.moodLabel, { color: theme.textSecondary }]}>{mood.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Btn
                                label="Next →"
                                disabled={!selectedMood}
                                onPress={() => animateTransition(() => setStep(1))}
                                color={theme.primary}
                            />
                        </View>
                    )}

                    {/* ── STEP 1: Energy Slider ──────────────────────── */}
                    {step === 1 && (
                        <View>
                            <Text style={[styles.question, { color: theme.text }]}>
                                What's your energy level today?
                            </Text>
                            <View style={styles.sliderCard}>
                                <Text style={[styles.sliderValue, { color: theme.primary }]}>{Math.round(energyLevel)}</Text>
                                <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>out of 10</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={1}
                                    maximumValue={10}
                                    step={1}
                                    value={energyLevel}
                                    onValueChange={setEnergyLevel}
                                    minimumTrackTintColor={theme.primary}
                                    maximumTrackTintColor={theme.border}
                                    thumbTintColor={theme.primary}
                                    accessibilityLabel="Energy level slider"
                                />
                                <View style={styles.sliderLabels}>
                                    <Text style={{ color: theme.textTertiary }}>Exhausted</Text>
                                    <Text style={{ color: theme.textTertiary }}>Energised</Text>
                                </View>
                            </View>
                            <Btn label="Next →" onPress={() => animateTransition(() => setStep(2))} color={theme.primary} />
                            <BackBtn onPress={() => animateTransition(() => setStep(0))} color={theme.textSecondary} />
                        </View>
                    )}

                    {/* ── STEP 2: PHQ-9 ─────────────────────────────── */}
                    {step === 2 && (
                        <View>
                            <Text style={[styles.question, { color: theme.text }]}>
                                Over the last 2 weeks, how often have you been bothered by...
                            </Text>
                            <Text style={[styles.questionNote, { color: theme.textSecondary }]}>
                                These questions help us understand your wellbeing and tailor support for you.
                            </Text>
                            {phq9Questions.map((q, i) => (
                                <QuestionCard
                                    key={i}
                                    index={i}
                                    question={q}
                                    selected={phq9Answers[i]}
                                    onSelect={(v) => {
                                        const next = [...phq9Answers];
                                        next[i] = v;
                                        setPHQ9Answers(next);
                                    }}
                                    theme={theme}
                                    isCritical={i === 8} // Q9: self-harm
                                />
                            ))}
                            <Btn
                                label="Next →"
                                disabled={phq9Answers.some(a => a < 0)}
                                onPress={() => animateTransition(() => setStep(3))}
                                color={theme.primary}
                            />
                            <BackBtn onPress={() => animateTransition(() => setStep(1))} color={theme.textSecondary} />
                        </View>
                    )}

                    {/* ── STEP 3: GAD-7 ─────────────────────────────── */}
                    {step === 3 && (
                        <View>
                            <Text style={[styles.question, { color: theme.text }]}>
                                Over the last 2 weeks, how often have you been bothered by...
                            </Text>
                            {gad7Questions.map((q, i) => (
                                <QuestionCard
                                    key={i}
                                    index={i}
                                    question={q}
                                    selected={gad7Answers[i]}
                                    onSelect={(v) => {
                                        const next = [...gad7Answers];
                                        next[i] = v;
                                        setGAD7Answers(next);
                                    }}
                                    theme={theme}
                                    isCritical={false}
                                />
                            ))}
                            {saving ? (
                                <ActivityIndicator color={theme.primary} style={{ marginTop: spacing.lg }} />
                            ) : (
                                <Btn
                                    label="Save Check-In ✓"
                                    disabled={gad7Answers.some(a => a < 0)}
                                    onPress={handleSave}
                                    color={theme.primary}
                                />
                            )}
                            <BackBtn onPress={() => animateTransition(() => setStep(2))} color={theme.textSecondary} />
                        </View>
                    )}

                    {/* ── STEP 4: Results ────────────────────────────── */}
                    {step === 4 && (
                        <View style={styles.resultsContainer}>
                            <Text style={styles.resultEmoji}>{phq9Severity.emoji}</Text>
                            <Text style={[styles.resultTitle, { color: theme.text }]}>Check-In Saved!</Text>
                            <Text style={[styles.resultSub, { color: theme.textSecondary }]}>
                                Here's a summary of how you're doing today.
                            </Text>

                            <ScoreCard
                                label="Depression Screening (PHQ-9)"
                                score={phq9Score}
                                max={27}
                                severity={phq9Severity.label}
                                color={phq9Severity.color}
                                theme={theme}
                            />
                            <ScoreCard
                                label="Anxiety Screening (GAD-7)"
                                score={gad7Score}
                                max={21}
                                severity={gad7Severity.label}
                                color={gad7Severity.color}
                                theme={theme}
                            />
                            <ScoreCard
                                label="Energy Level"
                                score={Math.round(energyLevel)}
                                max={10}
                                severity={energyLevel >= 7 ? 'High' : energyLevel >= 4 ? 'Moderate' : 'Low'}
                                color={energyLevel >= 7 ? '#48BB78' : energyLevel >= 4 ? '#ECC94B' : '#F56565'}
                                theme={theme}
                            />

                            <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>
                                These screens are not a clinical diagnosis. Please speak with a mental health professional
                                if you have concerns about your wellbeing.
                            </Text>

                            <Btn
                                label="Return Home"
                                onPress={() => router.back()}
                                color={theme.primary}
                            />
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

// ── Sub-components ─────────────────────────────────────────────

function QuestionCard({ index, question, selected, onSelect, theme, isCritical }: {
    index: number; question: string; selected: number;
    onSelect: (v: number) => void; theme: any; isCritical: boolean;
}) {
    return (
        <View style={[styles.qCard, { backgroundColor: theme.surface, borderColor: isCritical ? '#FEB2B2' : theme.border }]}>
            <Text style={[styles.qText, { color: theme.text }]}>
                {index + 1}. {question}
            </Text>
            {isCritical && (
                <Text style={[styles.qNote, { color: '#F56565' }]}>
                    ⚠️ If you are in crisis, please call 988 (US) or your local crisis line immediately.
                </Text>
            )}
            <View style={styles.freqRow}>
                {FREQUENCY_OPTIONS.map(opt => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[
                            styles.freqBtn,
                            { borderColor: theme.border },
                            selected === opt.value && { backgroundColor: theme.primary, borderColor: theme.primary },
                        ]}
                        onPress={() => onSelect(opt.value)}
                        accessibilityLabel={opt.label}
                        accessibilityRole="button"
                        accessibilityState={{ selected: selected === opt.value }}
                    >
                        <Text style={[
                            styles.freqLabel,
                            { color: selected === opt.value ? '#fff' : theme.textSecondary },
                        ]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

function ScoreCard({ label, score, max, severity, color, theme }: {
    label: string; score: number; max: number; severity: string; color: string; theme: any;
}) {
    const pct = (score / max) * 100;
    return (
        <View style={[styles.scoreCard, { backgroundColor: theme.surface }]}>
            <View style={styles.scoreHeader}>
                <Text style={[styles.scoreLabel, { color: theme.text }]}>{label}</Text>
                <Text style={[styles.scoreBadge, { backgroundColor: color + '22', color }]}>{severity}</Text>
            </View>
            <Text style={[styles.scoreValue, { color }]}>{score} / {max}</Text>
            <View style={[styles.scoreTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.scoreFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
}

function Btn({ label, onPress, disabled, color }: { label: string; onPress: () => void; disabled?: boolean; color: string }) {
    return (
        <TouchableOpacity
            style={[styles.btn, { backgroundColor: disabled ? '#ccc' : color }]}
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
        >
            <Text style={styles.btnText}>{label}</Text>
        </TouchableOpacity>
    );
}

function BackBtn({ onPress, color }: { onPress: () => void; color: string }) {
    return (
        <TouchableOpacity style={styles.backBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={[styles.backBtnText, { color }]}>← Back</Text>
        </TouchableOpacity>
    );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1 },
    headerTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: 2 },
    headerSub: { fontSize: typography.fontSize.sm, marginBottom: spacing.sm },
    progressTrack: { height: 4, borderRadius: borderRadius.full, overflow: 'hidden', marginTop: spacing.xs },
    progressFill: { height: '100%', borderRadius: borderRadius.full },
    body: { padding: spacing.md },
    question: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.sm },
    questionNote: { fontSize: typography.fontSize.sm, marginBottom: spacing.md, lineHeight: 20 },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl, flexWrap: 'wrap', gap: spacing.sm },
    moodBtn: { alignItems: 'center', padding: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 2, flex: 1, minWidth: 60 },
    moodEmoji: { fontSize: 36, marginBottom: 4 },
    moodLabel: { fontSize: typography.fontSize.xs },
    sliderCard: { alignItems: 'center', padding: spacing.lg, ...shadows.md, marginBottom: spacing.xl },
    sliderValue: { fontSize: 56, fontWeight: typography.fontWeight.bold },
    sliderLabel: { fontSize: typography.fontSize.sm, marginBottom: spacing.md },
    slider: { width: '100%', height: 40 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    qCard: { borderRadius: borderRadius.md, borderWidth: 1.5, padding: spacing.md, marginBottom: spacing.md },
    qText: { fontSize: typography.fontSize.base, marginBottom: spacing.sm, lineHeight: 22 },
    qNote: { fontSize: typography.fontSize.xs, marginBottom: spacing.sm },
    freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    freqBtn: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: 1 },
    freqLabel: { fontSize: typography.fontSize.xs },
    btn: { borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
    btnText: { color: '#fff', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold },
    backBtn: { alignItems: 'center', marginTop: spacing.sm, padding: spacing.sm },
    backBtnText: { fontSize: typography.fontSize.sm },
    resultsContainer: { alignItems: 'center', paddingTop: spacing.xl },
    resultEmoji: { fontSize: 72, marginBottom: spacing.md },
    resultTitle: { fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing.sm },
    resultSub: { fontSize: typography.fontSize.base, textAlign: 'center', marginBottom: spacing.xl },
    scoreCard: { width: '100%', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
    scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    scoreLabel: { fontSize: typography.fontSize.sm, flex: 1, fontWeight: typography.fontWeight.medium },
    scoreBadge: { fontSize: typography.fontSize.xs, paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full, fontWeight: typography.fontWeight.semibold },
    scoreValue: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing.xs },
    scoreTrack: { height: 6, borderRadius: borderRadius.full, overflow: 'hidden' },
    scoreFill: { height: '100%', borderRadius: borderRadius.full },
    disclaimer: { fontSize: typography.fontSize.xs, textAlign: 'center', lineHeight: 18, marginVertical: spacing.lg, paddingHorizontal: spacing.md },
});
