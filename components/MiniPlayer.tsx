import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '@/hooks/useSessionStore';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';

/**
 * MiniPlayer: A persistent UI component that reflects the active session state.
 * Resolves SM-001 by deriving visibility and data from the single source of truth (useSessionStore).
 */
export const MiniPlayer = () => {
    const { activeSession, status, togglePlayback, stopSession, elapsedTime, duration } = useSessionStore();
    const colorScheme = useColorScheme();
    const theme = colors[colorScheme ?? 'light'];

    // Deriving visibility from session status (High-ROI Fix)
    if (!activeSession || (status !== 'playing' && status !== 'paused')) {
        return null;
    }

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (elapsedTime / duration) * 100 : 0;

    return (
        <View style={[styles.container, shadows.lg, { backgroundColor: theme.surface }]}>
            {/* Progress Bar */}
            <View style={[styles.progressContainer, { backgroundColor: theme.border }]}>
                <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: theme.primary }]} />
            </View>

            <View style={styles.content}>
                <View style={styles.info}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                        {activeSession.title || 'Meditation Session'}
                    </Text>
                    <Text style={[styles.time, { color: theme.textSecondary }]}>
                        {formatTime(elapsedTime)} / {formatTime(duration)} • {status === 'playing' ? 'Playing' : 'Paused'}
                    </Text>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity onPress={togglePlayback} style={styles.controlBtn}>
                        <Ionicons
                            name={status === 'playing' ? 'pause' : 'play'}
                            size={28}
                            color={theme.primary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => stopSession(true)} style={styles.controlBtn}>
                        <Ionicons name="close" size={24} color={theme.textTertiary} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90, // Above bottom tabs
        left: spacing.md,
        right: spacing.md,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        zIndex: 1000,
    },
    progressContainer: {
        height: 3,
        width: '100%',
    },
    progressBar: {
        height: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    info: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
    },
    time: {
        fontSize: typography.fontSize.xs,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    controlBtn: {
        padding: spacing.xs,
    },
});
