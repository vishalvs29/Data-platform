import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, Alert, useColorScheme, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSupabaseClient } from '@/template';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';

// CBT-I sleep hygiene rules
const CBTI_TIPS = [
    { icon: '⏰', title: 'Fixed Wake Time', tip: 'Wake at the same time every day — even weekends. This anchors your circadian rhythm.' },
    { icon: '☀️', title: 'Morning Light', tip: 'Get 10-30 minutes of bright light within 30 minutes of waking to calibrate your body clock.' },
    { icon: '🚫', title: 'Stimulus Control', tip: 'Use your bed only for sleep. Avoid screens, eating, or work in bed.' },
    { icon: '😴', title: 'Sleep Restriction', tip: 'Only go to bed when sleepy, not at a fixed time. Build sleep pressure through the day.' },
    { icon: '🧘', title: 'Wind-Down Routine', tip: '45-60 minutes of calm activity before bed: reading, stretching, or journaling.' },
    { icon: '🌡️', title: 'Cool Environment', tip: 'Keep your bedroom at 65-68°F (18-20°C). Core body temperature must drop for sleep onset.' },
    { icon: '☕', title: 'Caffeine Cutoff', tip: 'No caffeine after 1 PM. Its half-life is 5-7 hours — it still affects sleep quality at night.' },
    { icon: '🍷', title: 'Avoid Alcohol', tip: 'Alcohol fragments REM sleep and reduces overall sleep quality, even if it helps you fall asleep.' },
];

interface SleepLog {
    id: string;
    date: string;
    bedtime: string | null;
    wake_time: string | null;
    quality_score: number;
    cbti_protocol_followed: boolean;
    sleep_efficiency: number | null;
}

export default function SleepTrackerScreen() {
    const colorScheme = useColorScheme();
    const theme = colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const supabase = getSupabaseClient();

    // Form state
    const [bedtime, setBedtime] = useState<Date>(() => {
        const d = new Date(); d.setHours(22, 30, 0, 0); return d;
    });
    const [wakeTime, setWakeTime] = useState<Date>(() => {
        const d = new Date(); d.setHours(6, 30, 0, 0); return d;
    });
    const [qualityScore, setQualityScore] = useState(7);
    const [cbtiFollowed, setCbtiFollowed] = useState(false);
    const [showBedPicker, setShowBedPicker] = useState(false);
    const [showWakePicker, setShowWakePicker] = useState(false);

    // History & UI
    const [logs, setLogs] = useState<SleepLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tipIdx, setTipIdx] = useState(0);

    // Computed values
    const diffMs = wakeTime.getTime() - bedtime.getTime();
    const totalHours = diffMs > 0 ? diffMs / 3_600_000 : diffMs / 3_600_000 + 24;
    const efficiency = Math.min(100, Math.max(0, ((totalHours - 0.5) / totalHours) * 100));
    const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const loadLogs = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('sleep_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(14);
            setLogs(data ?? []);
        } catch (e) {
            console.error('SleepTracker load error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const today = new Date().toISOString().split('T')[0];
            await supabase.from('sleep_logs').upsert({
                user_id: user.id,
                date: today,
                bedtime: bedtime.toISOString(),
                wake_time: wakeTime.toISOString(),
                quality_score: Math.round(qualityScore),
                cbti_protocol_followed: cbtiFollowed,
                sleep_efficiency: Math.round(efficiency * 10) / 10,
            }, { onConflict: 'user_id,date' });

            Alert.alert('Saved ✓', 'Your sleep log has been recorded.');
            loadLogs();
        } catch (e) {
            Alert.alert('Error', 'Could not save sleep log. Please try again.');
            console.error('SleepTracker save error:', e);
        } finally {
            setSaving(false);
        }
    };

    const avgQuality = logs.length
        ? logs.reduce((s, l) => s + (l.quality_score ?? 0), 0) / logs.length
        : 0;
    const avgEfficiency = logs.filter(l => l.sleep_efficiency != null).length
        ? logs.filter(l => l.sleep_efficiency != null)
            .reduce((s, l) => s + (l.sleep_efficiency ?? 0), 0)
        / logs.filter(l => l.sleep_efficiency != null).length
        : 0;

    const qualityColor = qualityScore >= 7 ? '#48BB78' : qualityScore >= 5 ? '#ECC94B' : '#F56565';

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Header Stats */}
            <View style={styles.headerSection}>
                <Text style={[styles.screenTitle, { color: theme.text }]} accessibilityRole="header">
                    Sleep Tracker
                </Text>
                <View style={styles.statsRow}>
                    <StatBubble label="Avg Quality" value={`${avgQuality.toFixed(1)}/10`} color="#7B68EE" theme={theme} />
                    <StatBubble label="Avg Efficiency" value={`${avgEfficiency.toFixed(0)}%`} color="#4FD1C5" theme={theme} />
                    <StatBubble label="Nights Logged" value={String(logs.length)} color="#F6AD55" theme={theme} />
                </View>
            </View>

            {/* ── Log Tonight Section */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Log Last Night</Text>

                {/* Time pickers */}
                <View style={styles.timeRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Bedtime</Text>
                        <TouchableOpacity
                            style={[styles.timePill, { backgroundColor: theme.surfaceSecondary }]}
                            onPress={() => setShowBedPicker(true)}
                            accessibilityRole="button"
                            accessibilityLabel={`Bedtime: ${fmtTime(bedtime)}`}
                        >
                            <Text style={[styles.timeValue, { color: theme.text }]}>🌙 {fmtTime(bedtime)}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.arrow, { color: theme.textTertiary }]}>→</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Wake Time</Text>
                        <TouchableOpacity
                            style={[styles.timePill, { backgroundColor: theme.surfaceSecondary }]}
                            onPress={() => setShowWakePicker(true)}
                            accessibilityRole="button"
                            accessibilityLabel={`Wake time: ${fmtTime(wakeTime)}`}
                        >
                            <Text style={[styles.timeValue, { color: theme.text }]}>☀️ {fmtTime(wakeTime)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showBedPicker && (
                    <DateTimePicker mode="time" value={bedtime} display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, d) => { setShowBedPicker(false); if (d) setBedtime(d); }} />
                )}
                {showWakePicker && (
                    <DateTimePicker mode="time" value={wakeTime} display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, d) => { setShowWakePicker(false); if (d) setWakeTime(d); }} />
                )}

                {/* Summary */}
                <View style={[styles.summaryRow, { backgroundColor: theme.surfaceSecondary }]}>
                    <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                        Total sleep: <Text style={{ color: theme.primary, fontWeight: '600' }}>
                            {totalHours.toFixed(1)}h
                        </Text>
                    </Text>
                    <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                        Efficiency: <Text style={{ color: theme.primary, fontWeight: '600' }}>
                            {efficiency.toFixed(0)}%
                        </Text>
                    </Text>
                </View>

                {/* Quality Slider */}
                <Text style={[styles.sliderHead, { color: theme.text }]}>
                    Sleep Quality: <Text style={{ color: qualityColor }}>{Math.round(qualityScore)}/10</Text>
                </Text>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={1} maximumValue={10} step={1}
                    value={qualityScore} onValueChange={setQualityScore}
                    minimumTrackTintColor={qualityColor}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={qualityColor}
                    accessibilityLabel="Sleep quality rating"
                />
                <View style={styles.sliderLabels}>
                    <Text style={{ color: theme.textTertiary, fontSize: 11 }}>Poor</Text>
                    <Text style={{ color: theme.textTertiary, fontSize: 11 }}>Excellent</Text>
                </View>

                {/* CBT-I toggle */}
                <TouchableOpacity
                    style={[styles.cbtiToggle, {
                        backgroundColor: cbtiFollowed ? theme.primary + '22' : theme.surfaceSecondary,
                        borderColor: cbtiFollowed ? theme.primary : theme.border,
                    }]}
                    onPress={() => setCbtiFollowed(!cbtiFollowed)}
                    accessibilityRole="checkbox"
                    accessibilityLabel="I followed the sleep hygiene protocol"
                    accessibilityState={{ checked: cbtiFollowed }}
                >
                    <Text style={{ fontSize: 20 }}>{cbtiFollowed ? '✅' : '⬜'}</Text>
                    <Text style={[styles.cbtiText, { color: theme.text }]}>I followed my CBT-I sleep protocol</Text>
                </TouchableOpacity>

                {saving ? (
                    <ActivityIndicator color={theme.primary} style={{ marginTop: spacing.md }} />
                ) : (
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                        onPress={handleSave}
                        accessibilityRole="button"
                        accessibilityLabel="Save sleep log"
                    >
                        <Text style={styles.saveBtnText}>Save Sleep Log</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Weekly Bar Chart (manual, no external lib dependency) */}
            {logs.length > 0 && (
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Last 7 Nights</Text>
                    <View style={styles.barChart}>
                        {logs.slice(0, 7).reverse().map((log, i) => {
                            const hrs = log.bedtime && log.wake_time
                                ? Math.abs(new Date(log.wake_time).getTime() - new Date(log.bedtime).getTime()) / 3_600_000
                                : 0;
                            const pct = Math.min(100, (hrs / 9) * 100);
                            const barColor = hrs >= 7 ? '#48BB78' : hrs >= 6 ? '#ECC94B' : '#F56565';
                            return (
                                <View key={log.id} style={styles.barCol}>
                                    <Text style={[styles.barHrs, { color: theme.textSecondary }]}>{hrs.toFixed(1)}</Text>
                                    <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                                        <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: barColor }]} />
                                    </View>
                                    <Text style={[styles.barDay, { color: theme.textTertiary }]}>
                                        {new Date(log.date).toLocaleDateString([], { weekday: 'narrow' })}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#48BB78' }]} />
                            <Text style={{ color: theme.textTertiary, fontSize: 11 }}>≥7h (ideal)</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#ECC94B' }]} />
                            <Text style={{ color: theme.textTertiary, fontSize: 11 }}>6-7h</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#F56565' }]} />
                            <Text style={{ color: theme.textTertiary, fontSize: 11 }}>{'<6h'}</Text>
                        </View>
                    </View>
                </View>
            )}

            {loading && <ActivityIndicator color={theme.primary} style={{ margin: spacing.xl }} />}

            {/* ── CBT-I Tips Carousel */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.tipsHeader}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Sleep Hygiene Tips</Text>
                    <Text style={[styles.tipCounter, { color: theme.textTertiary }]}>
                        {tipIdx + 1} / {CBTI_TIPS.length}
                    </Text>
                </View>
                <View style={[styles.tipCard, { backgroundColor: theme.surfaceSecondary }]}>
                    <Text style={styles.tipIcon}>{CBTI_TIPS[tipIdx].icon}</Text>
                    <Text style={[styles.tipTitle, { color: theme.text }]}>{CBTI_TIPS[tipIdx].title}</Text>
                    <Text style={[styles.tipText, { color: theme.textSecondary }]}>{CBTI_TIPS[tipIdx].tip}</Text>
                </View>
                <View style={styles.tipNav}>
                    <TouchableOpacity
                        onPress={() => setTipIdx(i => (i - 1 + CBTI_TIPS.length) % CBTI_TIPS.length)}
                        style={[styles.navBtn, { backgroundColor: theme.surfaceSecondary }]}
                        accessibilityLabel="Previous tip"
                    >
                        <Text style={{ color: theme.text }}>←</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setTipIdx(i => (i + 1) % CBTI_TIPS.length)}
                        style={[styles.navBtn, { backgroundColor: theme.primary }]}
                        accessibilityLabel="Next tip"
                    >
                        <Text style={{ color: '#fff' }}>→</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

function StatBubble({ label, value, color, theme }: { label: string; value: string; color: string; theme: any }) {
    return (
        <View style={[styles.statBubble, { backgroundColor: color + '18' }]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerSection: { padding: spacing.md, paddingBottom: 0 },
    screenTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing.md },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    statBubble: { flex: 1, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center' },
    statValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
    statLabel: { fontSize: typography.fontSize.xs, marginTop: 2 },
    card: { margin: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.md },
    cardTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.md },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    timeLabel: { fontSize: typography.fontSize.xs, marginBottom: 4 },
    timePill: { padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
    timeValue: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium },
    arrow: { fontSize: 20, paddingTop: spacing.lg },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.md },
    summaryText: { fontSize: typography.fontSize.sm },
    sliderHead: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, marginBottom: 4 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    cbtiToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: spacing.md },
    cbtiText: { fontSize: typography.fontSize.sm, flex: 1 },
    saveBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold },
    barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120, marginBottom: spacing.sm },
    barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
    barHrs: { fontSize: 9, marginBottom: 2 },
    barTrack: { width: '80%', flex: 1, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
    barFill: { width: '100%', borderRadius: 4 },
    barDay: { fontSize: 10, marginTop: 2 },
    legendRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginTop: spacing.sm },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    tipsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    tipCounter: { fontSize: typography.fontSize.xs },
    tipCard: { padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginBottom: spacing.md },
    tipIcon: { fontSize: 40, marginBottom: spacing.sm },
    tipTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.xs },
    tipText: { fontSize: typography.fontSize.sm, textAlign: 'center', lineHeight: 20 },
    tipNav: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
    navBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
