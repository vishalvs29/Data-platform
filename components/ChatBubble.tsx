import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ChatMessage } from '@/hooks/useChatStore';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';

/**
 * ChatBubble: Renders an individual chat message with support for typing indicators,
 * actionable suggestion cards, and error states.
 */
export const ChatBubble = ({ message }: { message: ChatMessage }) => {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = colors[colorScheme ?? 'light'];
    const isBot = message.role === 'assistant';

    if (message.status === 'typing') {
        return (
            <View style={[styles.bubble, styles.botBubble, { backgroundColor: theme.surfaceSecondary }]}>
                <View style={styles.typingContainer}>
                    <Text style={[styles.messageText, { color: theme.textSecondary }]}>•••</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, isBot ? styles.botContainer : styles.userContainer]}>
            <View
                style={[
                    styles.bubble,
                    isBot ? styles.botBubble : styles.userBubble,
                    { backgroundColor: isBot ? theme.surfaceSecondary : theme.primary },
                    message.status === 'error' && { backgroundColor: theme.error + '15', borderWidth: 1, borderColor: theme.error }
                ]}
            >
                <Text style={[styles.messageText, { color: isBot ? theme.text : theme.surface }]}>
                    {message.text}
                </Text>

                {message.status === 'error' && (
                    <Ionicons name="alert-circle" size={16} color={theme.error} style={styles.errorIcon} />
                )}
            </View>

            {/* Actionable Solution Cards (SM-001 / CB-001) */}
            {isBot && message.actions && message.actions.length > 0 && (
                <View style={styles.actionsContainer}>
                    {message.actions.map((action, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.actionCard, shadows.sm, { backgroundColor: theme.surface }]}
                            onPress={() => {
                                if (action.type === 'start_session' && action.payload.sessionId) {
                                    // In a real app, this navigates to the session player
                                    console.log(`✦ Chat: Starting session ${action.payload.sessionId}`);
                                    // router.push(`/session/${action.payload.sessionId}`);
                                }
                            }}
                        >
                            <Ionicons name="play-circle" size={20} color={theme.primary} />
                            <Text style={[styles.actionText, { color: theme.text }]}>
                                {action.payload.text || 'Start Recommended Session'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
        maxWidth: '85%',
    },
    userContainer: {
        alignSelf: 'flex-end',
    },
    botContainer: {
        alignSelf: 'flex-start',
    },
    bubble: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        position: 'relative',
    },
    userBubble: {
        borderBottomRightRadius: spacing.xs,
    },
    botBubble: {
        borderBottomLeftRadius: spacing.xs,
    },
    messageText: {
        fontSize: typography.fontSize.base,
        lineHeight: 22,
    },
    typingContainer: {
        height: 22,
        justifyContent: 'center',
    },
    actionsContainer: {
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    actionText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
    },
    errorIcon: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
    },
});
