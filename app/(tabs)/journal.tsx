import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useJournal } from '@/hooks/useJournal';
import { JournalEntryCard } from '@/components/JournalEntryCard';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAlert } from '@/template';

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { entries, deleteEntry } = useJournal();
  const { showAlert } = useAlert();

  const handleEntryPress = (id: string, title: string, content: string) => {
    showAlert(
      title,
      content,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Delete Entry',
              'Are you sure you want to delete this journal entry?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteEntry(id),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleNewEntry = () => {
    router.push('/new-journal');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>My Journal</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.newButton, { backgroundColor: theme.primary }]}
            onPress={handleNewEntry}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color={theme.surface} />
          </TouchableOpacity>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Start Your Journal
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Writing helps you process your thoughts and feelings. Tap the + button to create your first entry.
            </Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {entries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onPress={() => handleEntryPress(entry.id, entry.title, entry.content)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.xs,
  },
  newButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  entriesList: {
    gap: spacing.md,
  },
});
