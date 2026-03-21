import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    useColorScheme,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '@/hooks/useChatStore';
import { useProfile } from '@/hooks/useProfile';
import { useSessionStore } from '@/hooks/useSessionStore';
import { ChatBubble } from '@/components/ChatBubble';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';

export default function ChatScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const theme = colors[colorScheme ?? 'light'];

    const { messages, sendMessage, isTyping } = useChatStore();
    const { profile } = useProfile();
    const { activeSession } = useSessionStore();

    const [inputText, setInputText] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const context = {
            name: profile?.full_name || 'User',
            streak: 5, // Mock streak
            lastMood: 'great', // Mock mood
            activeSession: activeSession ? { title: activeSession.title, duration: activeSession.duration } : null
        };

        const text = inputText;
        setInputText('');
        await sendMessage(text, context);
    };

    useEffect(() => {
        // Auto-scroll to bottom on new messages
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages, isTyping]);

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: theme.surface }]}>
                <View style={styles.headerTitleContainer}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={{ fontSize: 20 }}>✦</Text>
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Mindi</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Always here to help</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
            >
                {messages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                ))}
                {isTyping && (
                    <View style={styles.botTyping}>
                        <ActivityIndicator size="small" color={theme.textTertiary} />
                        <Text style={[styles.typingText, { color: theme.textSecondary }]}>Mindi is thinking...</Text>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm, backgroundColor: theme.surface }]}>
                <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceSecondary }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Type your message..."
                        placeholderTextColor={theme.textTertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: inputText.trim() ? theme.primary : theme.textTertiary }]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="arrow-up" size={24} color={theme.surface} />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    headerSubtitle: {
        fontSize: typography.fontSize.xs,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    inputContainer: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        fontSize: typography.fontSize.base,
        paddingTop: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    botTyping: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    typingText: {
        fontSize: typography.fontSize.xs,
        fontStyle: 'italic',
    },
});
