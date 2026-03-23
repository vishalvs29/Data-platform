import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Easing, useColorScheme, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSupabaseClient } from '@/template';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';

type Technique = 'box' | '478' | 'coherence';

interface TechniqueConfig {
    key: Technique;
    name: string;
    description: string;
    phases: { label: string; duration: number; expand: boolean }[];
    color: string;
    science: string;
}

const TECHNIQUES: TechniqueConfig[] = [
    {
        key: 'box', name: 'Box Breathing',
        description: 'Used by Navy SEALs and first responders to rapidly calm the nervous system.',
        color: '#7B68EE',
        science: 'Activates the parasympathetic nervous system via slow rhythmic breathing.',
        phases: [
            { label: 'Inhale', duration: 4, expand: true },
            { label: 'Hold', duration: 4, expand: true },
            { label: 'Exhale', duration: 4, expand: false },
            { label: 'Hold', duration: 4, expand: false },
        ],
    },
    {
        key: '478', name: '4-7-8 Breathing',
        description: 'Dr. Andrew Weil\'s technique for anxiety relief and sleep onset.',
        color: '#4FD1C5',
        science: 'Extended exhalation ratio shifts the autonomic nervous system.',
        phases: [
            { label: 'Inhale', duration: 4, expand: true },
            { label: 'Hold', duration: 7, expand: true },
            { label: 'Exhale', duration: 8, expand: false },
        ],
    },
    {
        key: 'coherence', name: 'Coherence Breathing',
        description: 'Resonance frequency breathing at 5-5 for HRV biofeedback training.',
        color: '#F6AD55',
        science: 'Synchronises heart rate variability at 0.1 Hz resonance frequency.',
        phases: [
            { label: 'Inhale', duration: 5, expand: true },
            { label: 'Exhale', duration: 5, expand: false },
        ],
    },
];

const CIRCLE_MIN = 100;
const CIRCLE_MAX = 220;
const SESSION_TARGET = 300; // 5 minutes

export default function BreathingExerciseScreen() {
    const colorScheme = useColorScheme();
    const theme = colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const supabase = getSupabaseClient();

    const [technique, setTechnique] = useState<TechniqueConfig>(TECHNIQUES[0]);
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [phaseIdx, setPhaseIdx] = useState(0);
    const [phaseCountdown, setPhaseCountdown] = useState(0);
    const [sessionSecs, setSessionSecs] = useState(0);
    const [cycles, setCycles] = useState(0);

    const circleSize = useRef(new Animated.Value(CIRCLE_MIN)).current;
    const circleOpacity = useRef(new Animated.Value(0.7)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<any>(null);
    const phaseRef = useRef<any>(null);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    const animatePhase = useCallback((phase: TechniqueConfig['phases'][0]) => {
        Animated.parallel([
            Animated.timing(circleSize, {
                toValue: phase.expand ? CIRCLE_MAX : CIRCLE_MIN,
                duration: phase.duration * 1000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false,
            }),
            Animated.timing(circleOpacity, {
                toValue: phase.expand ? 1 : 0.5,
                duration: phase.duration * 1000,
                useNativeDriver: false,
            }),
        ]).start();
    }, [circleSize, circleOpacity]);

    const stopSession = useCallback((completed = false) => {
        clearInterval(timerRef.current);
        clearInterval(phaseRef.current);
        setIsRunning(false);
        circleSize.setValue(CIRCLE_MIN);
        circleOpacity.setValue(0.7);
        if (completed) setIsComplete(true);
    }, [circleSize, circleOpacity]);

    const startSession = useCallback(() => {
        setIsRunning(true);
        setIsComplete(false);
        setSessionSecs(0);
        setCycles(0);
        setPhaseIdx(0);
        setPhaseCountdown(technique.phases[0].duration);
        animatePhase(technique.phases[0]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        timerRef.current = setInterval(() => {
            setSessionSecs(s => {
                if (s + 1 >= SESSION_TARGET) { stopSession(true); return s + 1; }
                return s + 1;
            });
        }, 1000);
    }, [technique, animatePhase, stopSession]);

    useEffect(() => {
        if (!isRunning) return;
        clearInterval(phaseRef.current);
        let cd = technique.phases[phaseIdx].duration;
        setPhaseCountdown(cd);
        phaseRef.current = setInterval(() => {
            cd -= 1;
            setPhaseCountdown(cd);
            if (cd <= 0) {
                clearInterval(phaseRef.current);
                const next = (phaseIdx + 1) % technique.phases.length;
                if (next === 0) setCycles(c => c + 1);
                setPhaseIdx(next);
                animatePhase(technique.phases[next]);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }, 1000);
        return () => clearInterval(phaseRef.current);
    }, [phaseIdx, isRunning, technique]);

    useEffect(() => {
        if (!isComplete || sessionSecs < 10) return;
        (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await supabase.from('breathing_sessions').insert({
                    user_id: user.id,
                    technique: technique.key,
                    duration_seconds: sessionSecs,
                    completed_at: new Date().toISOString(),
                });
            } catch (e) { console.error('Breathing save error', e); }
        })();
    }, [isComplete]);

    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const currentPhase = technique.phases[phaseIdx];
    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [`${technique.color}33`, `${technique.color}88`],
    });

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }}
        >
            {/* Technique Selector */}
            {!isRunning && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]} accessibilityRole="header">
                        Choose Technique
                    </Text>
                    {TECHNIQUES.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            style={[
                                styles.techniqueCard,
                                { backgroundColor: theme.surface, borderColor: theme.border },
                                technique.key === t.key && { borderColor: t.color, borderWidth: 2 },
                            ]}
                            onPress={() => setTechnique(t)}
                            accessibilityRole="radio"
                            accessibilityLabel={t.name}
                            accessibilityState={{ selected: technique.key === t.key }}
                        >
                            <View style={[styles.dot, { backgroundColor: t.color }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.tName, { color: theme.text }]}>{t.name}</Text>
                                <Text style={[styles.tDesc, { color: theme.textSecondary }]}>{t.description}</Text>
                                <Text style={[styles.tScience, { color: t.color }]}>{t.science}</Text>
                                <View style={styles.chips}>
                                    {t.phases.map((p, i) => (
                                        <View key={i} style={[styles.chip, { backgroundColor: t.color + '22' }]}>
                                            <Text style={[styles.chipText, { color: t.color }]}>{p.label} {p.duration}s</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Circle */}
            <View style={styles.circleSection}>
                {isRunning && (
                    <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                        <Text style={[styles.timer, { color: theme.text }]}>{fmt(sessionSecs)}</Text>
                        <Text style={[styles.cycleText, { color: theme.textSecondary }]}>Cycle {cycles + 1}</Text>
                    </View>
                )}

                <View style={styles.circleWrapper}>
                    <Animated.View style={[styles.glow, {
                        backgroundColor: glowColor, width: CIRCLE_MAX + 60, height: CIRCLE_MAX + 60,
                        borderRadius: (CIRCLE_MAX + 60) / 2,
                    }]} />
                    <Animated.View style={[styles.circle, {
                        width: circleSize,
                        height: circleSize,
                        backgroundColor: circleOpacity.interpolate({
                            inputRange: [0.5, 1],
                            outputRange: [`${technique.color}66`, technique.color],
                        }),
                    }]}>
                        {isRunning ? (
                            <>
                                <Text style={styles.phaseLabel}>{currentPhase.label}</Text>
                                <Text style={styles.phaseCount}>{phaseCountdown}</Text>
                            </>
                        ) : isComplete ? (
                            <Text style={styles.phaseLabel}>✓</Text>
                        ) : (
                            <Text style={styles.phaseLabel}>Ready</Text>
                        )}
                    </Animated.View>
                </View>

                {!isRunning ? (
                    <TouchableOpacity
                        style={[styles.startBtn, { backgroundColor: technique.color }]}
                        onPress={startSession}
                        accessibilityRole="button"
                        accessibilityLabel={isComplete ? 'Restart breathing session' : 'Begin breathing session'}
                    >
                        <Text style={styles.startBtnText}>{isComplete ? 'Restart' : 'Begin Session'}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.stopBtn, { borderColor: theme.border }]}
                        onPress={() => stopSession(false)}
                        accessibilityRole="button"
                        accessibilityLabel="End session"
                    >
                        <Text style={[styles.stopBtnText, { color: theme.textSecondary }]}>End Session</Text>
                    </TouchableOpacity>
                )}

                {isComplete && (
                    <View style={[styles.completeCard, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.completeTitle, { color: '#48BB78' }]}>🎉 Session Complete!</Text>
                        <Text style={[styles.completeDetail, { color: theme.textSecondary }]}>
                            {technique.name} · {fmt(sessionSecs)} · {cycles} cycles · Saved ✓
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    section: { padding: spacing.md },
    sectionTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing.md },
    techniqueCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.md, ...shadows.sm },
    dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
    tName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: 2 },
    tDesc: { fontSize: typography.fontSize.sm, marginBottom: 4, lineHeight: 20 },
    tScience: { fontSize: typography.fontSize.xs, fontStyle: 'italic', marginBottom: spacing.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
    chipText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
    circleSection: { alignItems: 'center', paddingVertical: spacing.xl },
    timer: { fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold },
    cycleText: { fontSize: typography.fontSize.sm },
    circleWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
    glow: { position: 'absolute', alignSelf: 'center' },
    circle: { alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
    phaseLabel: { color: '#fff', fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
    phaseCount: { color: 'rgba(255,255,255,0.85)', fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold },
    startBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
    startBtnText: { color: '#fff', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold },
    stopBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full, borderWidth: 1 },
    stopBtnText: { fontSize: typography.fontSize.lg },
    completeCard: { margin: spacing.md, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', ...shadows.md },
    completeTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing.xs },
    completeDetail: { fontSize: typography.fontSize.sm, marginTop: 2, textAlign: 'center' },
});
