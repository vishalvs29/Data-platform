import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    Animated, Easing, useColorScheme, Alert, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSupabaseClient } from '@/template';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';

// ── Types ────────────────────────────────────────────────────
type PomodoroMode = '25/5' | '50/10' | 'custom';
type TimerPhase = 'focus' | 'break';

interface PomodoroConfig {
    label: string;
    focusMins: number;
    breakMins: number;
}

const POMODORO_MODES: Record<PomodoroMode, PomodoroConfig> = {
    '25/5': { label: '25 / 5', focusMins: 25, breakMins: 5 },
    '50/10': { label: '50 / 10', focusMins: 50, breakMins: 10 },
    'custom': { label: 'Custom', focusMins: 35, breakMins: 7 },
};

interface MusicTrack {
    key: string;
    label: string;
    url: string;
    icon: string;
}

// Binaural beats via YouTube embeds (WebView)
const MUSIC_TRACKS: MusicTrack[] = [
    { key: 'alpha', label: 'Alpha Waves (8-12 Hz)', icon: '🌊', url: 'https://www.youtube.com/embed/WPni755-Krg?autoplay=1&loop=1&playlist=WPni755-Krg&rel=0' },
    { key: 'beta', label: 'Beta Focus (15-40 Hz)', icon: '⚡', url: 'https://www.youtube.com/embed/mDX8QrcDI_o?autoplay=1&loop=1&playlist=mDX8QrcDI_o&rel=0' },
    { key: 'theta', label: 'Theta Deep Work (4-8 Hz)', icon: '🧘', url: 'https://www.youtube.com/embed/Dq8HsxKUp2A?autoplay=1&loop=1&playlist=Dq8HsxKUp2A&rel=0' },
    { key: 'lofi', label: 'Lo-Fi Hip Hop', icon: '🎵', url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&loop=1&playlist=jfKfPfyJRdk&rel=0' },
    { key: 'nature', label: 'Forest Rain', icon: '🌲', url: 'https://www.youtube.com/embed/q76bMs-NwRk?autoplay=1&loop=1&playlist=q76bMs-NwRk&rel=0' },
    { key: 'silence', label: 'Silence', icon: '🔇', url: '' },
];

// ── Component ────────────────────────────────────────────────
export default function FocusTimerScreen() {
    const colorScheme = useColorScheme();
    const theme = colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const supabase = getSupabaseClient();

    // Mode & config
    const [mode, setMode] = useState<PomodoroMode>('25/5');
    const [phase, setPhase] = useState<TimerPhase>('focus');
    const [taskName, setTaskName] = useState('');
    const [selectedTrack, setSelectedTrack] = useState<MusicTrack>(MUSIC_TRACKS[0]);
    const [showPlayer, setShowPlayer] = useState(false);

    // Timer state
    const [isRunning, setIsRunning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(POMODORO_MODES['25/5'].focusMins * 60);
    const [sessionCount, setSessionCount] = useState(0);
    const [totalFocusSecs, setTotalFocusSecs] = useState(0);

    // Session history
    const [history, setHistory] = useState<{ task: string; mins: number; date: string }[]>([]);
    const [saving, setSaving] = useState(false);

    // Animations
    const ringProgress = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef<any>(null);
    const sessionStartRef = useRef<Date | null>(null);

    const config = POMODORO_MODES[mode];
    const totalSecs = phase === 'focus' ? config.focusMins * 60 : config.breakMins * 60;
    const progressPct = 1 - secondsLeft / totalSecs;
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const phaseColor = phase === 'focus' ? theme.primary : '#48BB78';

    // ── Pulse animation when running
    useEffect(() => {
        if (isRunning) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRunning]);

    // ── Ring animation
    useEffect(() => {
        Animated.timing(ringProgress, {
            toValue: progressPct,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [progressPct]);

    // ── Save completed focus session
    const saveSession = useCallback(async (durationSecs: number) => {
        if (durationSecs < 60) return; // Skip very short sessions
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('focus_sessions').upsert({
                user_id: user.id,
                date: today,
                duration_minutes: Math.round(durationSecs / 60),
                activity: taskName || 'Focus session',
                notes: `Mode: ${mode} · Track: ${selectedTrack.label}`,
            }, { onConflict: 'user_id,date' });

            setHistory(prev => [{
                task: taskName || 'Focus session',
                mins: Math.round(durationSecs / 60),
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }, ...prev.slice(0, 9)]);
        } catch (e) {
            console.error('FocusTimer: save error', e);
        } finally {
            setSaving(false);
        }
    }, [taskName, mode, selectedTrack]);

    // ── Phase transition
    const switchPhase = useCallback(() => {
        const nextPhase: TimerPhase = phase === 'focus' ? 'break' : 'focus';

        if (phase === 'focus') {
            const elapsed = config.focusMins * 60 - secondsLeft;
            setTotalFocusSecs(t => t + elapsed);
            setSessionCount(c => c + 1);
            saveSession(elapsed);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('🎉 Focus Session Done!', `Time for a ${config.breakMins}-minute break. Great work!`);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert('⚡ Break Over', 'Ready to focus again?');
        }

        setPhase(nextPhase);
        setSecondsLeft((nextPhase === 'focus' ? config.focusMins : config.breakMins) * 60);
        setIsRunning(false);
    }, [phase, config, secondsLeft, saveSession]);

    // ── Timer tick
    useEffect(() => {
        if (!isRunning) { clearInterval(timerRef.current); return; }
        timerRef.current = setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) {
                    clearInterval(timerRef.current);
                    switchPhase();
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [isRunning, switchPhase]);

    const handleToggle = () => {
        if (!isRunning) sessionStartRef.current = new Date();
        else {
            // Manually stopping — save what was done
            if (phase === 'focus' && sessionStartRef.current) {
                const elapsed = Math.round((Date.now() - sessionStartRef.current.getTime()) / 1000);
                if (elapsed >= 60) saveSession(elapsed);
            }
        }
        setIsRunning(r => !r);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleReset = () => {
        clearInterval(timerRef.current);
        setIsRunning(false);
        setPhase('focus');
        setSecondsLeft(config.focusMins * 60);
        ringProgress.setValue(0);
    };

    const handleModeChange = (m: PomodoroMode) => {
        if (isRunning) return;
        setMode(m);
        setPhase('focus');
        setSecondsLeft(POMODORO_MODES[m].focusMins * 60);
        ringProgress.setValue(0);
    };

    const strokeColor = phaseColor;
    const totalFocusMins = Math.round(totalFocusSecs / 60);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Mode Selector */}
            <View style={styles.modeRow}>
                {(Object.keys(POMODORO_MODES) as PomodoroMode[]).map(m => (
                    <TouchableOpacity
                        key={m}
                        style={[
                            styles.modeBtn,
                            {
                                backgroundColor: mode === m ? theme.primary : theme.surface,
                                borderColor: mode === m ? theme.primary : theme.border
                            },
                        ]}
                        onPress={() => handleModeChange(m)}
                        disabled={isRunning}
                        accessibilityRole="radio"
                        accessibilityLabel={`${POMODORO_MODES[m].label} mode`}
                        accessibilityState={{ selected: mode === m, disabled: isRunning }}
                    >
                        <Text style={[styles.modeBtnText, { color: mode === m ? '#fff' : theme.textSecondary }]}>
                            {POMODORO_MODES[m].label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Phase label */}
            <View style={styles.phaseRow}>
                <View style={[styles.phasePill, { backgroundColor: phaseColor + '22' }]}>
                    <Text style={[styles.phaseText, { color: phaseColor }]}>
                        {phase === 'focus' ? '🎯 Focus Time' : '☕ Break Time'}
                    </Text>
                </View>
                {sessionCount > 0 && (
                    <View style={[styles.phasePill, { backgroundColor: theme.surfaceSecondary }]}>
                        <Text style={[styles.phaseText, { color: theme.textSecondary }]}>
                            Session {sessionCount + 1}
                        </Text>
                    </View>
                )}
            </View>

            {/* ── Ring Timer */}
            <Animated.View style={[styles.ringWrapper, { transform: [{ scale: pulseAnim }] }]}>
                {/* Background ring */}
                <View style={[styles.ringBg, { borderColor: theme.border }]} />

                {/* Filled arc approximation - single coloured ring overlay */}
                <View style={[styles.ringColor, { borderColor: strokeColor }]} />

                {/* Center */}
                <View style={styles.ringCenter}>
                    <Text style={[styles.timerText, { color: theme.text }]}>{timeStr}</Text>
                    <Text style={[styles.timerPhaseSmall, { color: theme.textSecondary }]}>
                        {phase === 'focus' ? 'Focus' : 'Break'}
                    </Text>
                    <Text style={[styles.timerProgress, { color: phaseColor }]}>
                        {Math.round(progressPct * 100)}%
                    </Text>
                </View>
            </Animated.View>

            {/* ── Controls */}
            <View style={styles.controlsRow}>
                <TouchableOpacity
                    style={[styles.resetBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={handleReset}
                    accessibilityRole="button"
                    accessibilityLabel="Reset timer"
                >
                    <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>↺</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.mainBtn, { backgroundColor: phaseColor }]}
                    onPress={handleToggle}
                    accessibilityRole="button"
                    accessibilityLabel={isRunning ? 'Pause timer' : 'Start timer'}
                >
                    <Text style={styles.mainBtnText}>{isRunning ? '⏸ Pause' : '▶ Start'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.resetBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => setShowPlayer(p => !p)}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle music player"
                >
                    <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>🎵</Text>
                </TouchableOpacity>
            </View>

            {/* ── Task Input */}
            <View style={[styles.taskCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.taskLabel, { color: theme.textSecondary }]}>What are you working on?</Text>
                <TextInput
                    style={[styles.taskInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g., Review quarterly report..."
                    placeholderTextColor={theme.textTertiary}
                    value={taskName}
                    onChangeText={setTaskName}
                    accessibilityLabel="Current task name"
                />
                {totalFocusMins > 0 && (
                    <Text style={[styles.totalFocus, { color: theme.primary }]}>
                        ⚡ {totalFocusMins} focus minutes this session
                    </Text>
                )}
            </View>

            {/* ── Music Player */}
            {showPlayer && (
                <View style={[styles.playerCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.playerTitle, { color: theme.text }]}>Focus Music</Text>
                    <View style={styles.trackList}>
                        {MUSIC_TRACKS.map(track => (
                            <TouchableOpacity
                                key={track.key}
                                style={[
                                    styles.trackBtn,
                                    {
                                        backgroundColor: selectedTrack.key === track.key ? theme.primary + '22' : theme.surfaceSecondary,
                                        borderColor: selectedTrack.key === track.key ? theme.primary : 'transparent'
                                    },
                                ]}
                                onPress={() => setSelectedTrack(track)}
                                accessibilityRole="radio"
                                accessibilityLabel={track.label}
                                accessibilityState={{ selected: selectedTrack.key === track.key }}
                            >
                                <Text>{track.icon}</Text>
                                <Text style={[styles.trackLabel, {
                                    color: selectedTrack.key === track.key ? theme.primary : theme.textSecondary,
                                    fontWeight: selectedTrack.key === track.key ? '600' : '400',
                                }]}>
                                    {track.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {selectedTrack.url ? (
                        <View style={styles.webviewWrapper}>
                            <WebView
                                source={{ uri: selectedTrack.url }}
                                style={styles.webview}
                                allowsInlineMediaPlayback
                                mediaPlaybackRequiresUserAction={false}
                                accessibilityLabel={`Playing ${selectedTrack.label}`}
                            />
                        </View>
                    ) : (
                        <Text style={[styles.silenceNote, { color: theme.textTertiary }]}>
                            🔇 Silence mode — no audio playing.
                        </Text>
                    )}
                </View>
            )}

            {/* ── Session History */}
            {history.length > 0 && (
                <View style={[styles.historyCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.historyTitle, { color: theme.text }]}>Today's Sessions</Text>
                    {history.map((h, i) => (
                        <View key={i} style={[styles.historyItem, { borderBottomColor: theme.border }]}>
                            <View>
                                <Text style={[styles.historyTask, { color: theme.text }]}>{h.task}</Text>
                                <Text style={[styles.historyTime, { color: theme.textTertiary }]}>{h.date}</Text>
                            </View>
                            <Text style={[styles.historyMins, { color: theme.primary }]}>{h.mins}m</Text>
                        </View>
                    ))}
                    {saving && <ActivityIndicator color={theme.primary} size="small" style={{ marginTop: spacing.sm }} />}
                </View>
            )}
        </ScrollView>
    );
}

// ── Styles ────────────────────────────────────────────────────
const RING_SIZE = 240;

const styles = StyleSheet.create({
    container: { flex: 1 },
    modeRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, justifyContent: 'center' },
    modeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1.5 },
    modeBtnText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
    phaseRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md },
    phasePill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
    phaseText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
    ringWrapper: { alignSelf: 'center', width: RING_SIZE, height: RING_SIZE, marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center' },
    ringBg: { position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: 12, borderColor: 'transparent' },
    ringColor: { position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: 12 },
    ringCenter: { alignItems: 'center', justifyContent: 'center' },
    timerText: { fontSize: 52, fontWeight: typography.fontWeight.bold, fontVariant: ['tabular-nums'] },
    timerPhaseSmall: { fontSize: typography.fontSize.sm, marginTop: 2 },
    timerProgress: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginTop: 4 },
    controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.xl },
    resetBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
    resetBtnText: { fontSize: 22 },
    mainBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
    mainBtnText: { color: '#fff', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
    taskCard: { margin: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
    taskLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
    taskInput: { fontSize: typography.fontSize.base, padding: spacing.sm, borderWidth: 1, borderRadius: borderRadius.sm },
    totalFocus: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginTop: spacing.sm },
    playerCard: { margin: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
    playerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.md },
    trackList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    trackBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: 1.5 },
    trackLabel: { fontSize: typography.fontSize.xs },
    webviewWrapper: { height: 60, borderRadius: borderRadius.sm, overflow: 'hidden', opacity: 0 }, // Hidden but audio plays
    webview: { flex: 1, backgroundColor: 'transparent' },
    silenceNote: { fontSize: typography.fontSize.sm, textAlign: 'center', padding: spacing.sm },
    historyCard: { margin: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
    historyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.md },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
    historyTask: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
    historyTime: { fontSize: typography.fontSize.xs },
    historyMins: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
});
