import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJournal } from '@/hooks/useJournal';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAlert } from '@/template';

export default function NewJournalScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addEntry } = useJournal();
  const { showAlert } = useAlert();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert('Title required', 'Please enter a title for your journal entry');
      return;
    }

    if (!content.trim()) {
      showAlert('Content required', 'Please write something in your journal');
      return;
    }

    setIsSaving(true);
    try {
      await addEntry(title.trim(), content.trim());
      showAlert('Entry saved!', 'Your journal entry has been saved');
      router.back();
    } catch (error) {
      showAlert('Error', 'Failed to save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'New Journal Entry',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={styles.headerButton}
            >
              <Text style={[styles.saveText, { color: theme.primary }]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={[styles.titleInput, { color: theme.text }]}
            placeholder="Entry title"
            placeholderTextColor={theme.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus
          />

          <TextInput
            style={[styles.contentInput, { color: theme.text }]}
            placeholder="What is on your mind?"
            placeholderTextColor={theme.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.prompts}>
            <Text style={[styles.promptsTitle, { color: theme.textSecondary }]}>
              Writing prompts:
            </Text>
            <Text style={[styles.promptText, { color: theme.textTertiary }]}>
              • What made you smile today?
            </Text>
            <Text style={[styles.promptText, { color: theme.textTertiary }]}>
              • What challenged you today?
            </Text>
            <Text style={[styles.promptText, { color: theme.textTertiary }]}>
              • What are you grateful for?
            </Text>
            <Text style={[styles.promptText, { color: theme.textTertiary }]}>
              • What is something you learned?
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  headerButton: {
    paddingHorizontal: spacing.md,
  },
  saveText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  titleInput: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
    padding: 0,
  },
  contentInput: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    minHeight: 300,
    padding: 0,
  },
  prompts: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  promptsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  promptText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});
