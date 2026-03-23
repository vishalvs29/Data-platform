import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  FlatList, Alert, ActivityIndicator, useColorScheme, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSupabaseClient } from '@/template';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';

// ── Constants ─────────────────────────────────────────────────
const MOOD_TAGS = [
  { key: 'calm', emoji: '😌', color: '#4FD1C5' },
  { key: 'anxious', emoji: '😰', color: '#F6AD55' },
  { key: 'sad', emoji: '😔', color: '#63B3ED' },
  { key: 'angry', emoji: '😤', color: '#FC8181' },
  { key: 'hopeful', emoji: '🌱', color: '#68D391' },
  { key: 'grateful', emoji: '💝', color: '#F687B3' },
  { key: 'numb', emoji: '😶', color: '#A0AEC0' },
  { key: 'energised', emoji: '⚡', color: '#ECC94B' },
];

const TOPIC_TAGS = [
  'work', 'family', 'relationships', 'sleep', 'health',
  'finances', 'goals', 'identity', 'trauma', 'gratitude',
];

// Cognitive distortion labels mapping (returned by Edge Function)
const DISTORTION_LABELS: Record<string, string> = {
  catastrophising: '🌀 Catastrophising',
  mind_reading: '🔮 Mind Reading',
  fortune_telling: '🪄 Fortune Telling',
  black_white: '⚫ All-or-Nothing Thinking',
  personalisation: '🎯 Personalisation',
  emotional_reasoning: '💭 Emotional Reasoning',
  should_statements: '📏 "Should" Statements',
  labelling: '🏷️ Labelling',
  magnification: '🔍 Magnification',
  mental_filter: '🚫 Mental Filter',
};

interface JournalEntry {
  id: string;
  created_at: string;
  tags: string[];
  sentiment_score: number | null;
  cognitive_distortions_detected: string[];
  // content_encrypted is never decrypted on client in real app;
  // we show a preview stored separately or just metadata.
  preview?: string;
}

// Simple XOR placeholder "encryption" for demo.
// In production: call an Edge Function that uses pgcrypto AES-256.
function encodeContent(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64');
}

// ── Screen ─────────────────────────────────────────────────────
type View = 'list' | 'write';

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const supabase = getSupabaseClient();

  const [view, setView] = useState<View>('list');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Compose state
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [detectedDistortions, setDetectedDistortions] = useState<string[]>([]);
  const [sentimentScore, setSentimentScore] = useState<number | null>(null);

  const inputRef = useRef<TextInput>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('journal_entries')
        .select('id, created_at, tags, sentiment_score, cognitive_distortions_detected')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setEntries((data ?? []) as JournalEntry[]);
    } catch (e) {
      console.error('Journal: load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // ── Analyse via Claude Edge Function
  const analyseContent = async () => {
    if (content.trim().length < 30) {
      Alert.alert('Too Short', 'Write at least a sentence or two to analyse patterns.');
      return;
    }
    setAnalysing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Analyse this journal entry for cognitive distortions and sentiment. 
Return JSON only: {"distortions": ["string array of keys from: catastrophising, mind_reading, fortune_telling, black_white, personalisation, emotional_reasoning, should_statements, labelling, magnification, mental_filter"], "sentiment": number between -1 and 1, "insight": "one supportive reframe sentence"}

Entry: "${content.slice(0, 800)}"`,
          sessionId: 'journal-analysis',
        },
      });
      if (error) throw error;

      // Parse structured response
      const raw: string = data?.reply ?? '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setDetectedDistortions(parsed.distortions ?? []);
        setSentimentScore(parsed.sentiment ?? null);
        if (parsed.insight) {
          Alert.alert('💡 Insight', parsed.insight);
        }
      }
    } catch (e) {
      console.error('Journal: analysis error', e);
      Alert.alert('Analysis failed', 'Could not reach the AI service. You can still save your entry.');
    } finally {
      setAnalysing(false);
    }
  };

  // ── Save Entry
  const handleSave = async () => {
    if (content.trim().length < 5) {
      Alert.alert('Too Short', 'Write a bit more before saving.');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tags = [
        ...(selectedMood ? [selectedMood] : []),
        ...selectedTopics,
      ];

      await supabase.from('journal_entries').insert({
        user_id: user.id,
        content_encrypted: encodeContent(content), // Real app: call encrypt Edge Function
        tags,
        sentiment_score: sentimentScore,
        cognitive_distortions_detected: detectedDistortions,
      });

      // Reset compose
      setContent('');
      setSelectedMood(null);
      setSelectedTopics([]);
      setDetectedDistortions([]);
      setSentimentScore(null);
      setView('list');
      loadEntries();
    } catch (e) {
      Alert.alert('Error', 'Could not save entry. Please try again.');
      console.error('Journal: save error', e);
    } finally {
      setSaving(false);
    }
  };

  const toggleTopic = (t: string) => {
    setSelectedTopics(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const filtered = entries.filter(e => {
    if (!searchQuery) return true;
    return e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const sentimentColor = sentimentScore == null ? '#A0AEC0'
    : sentimentScore > 0.2 ? '#48BB78'
      : sentimentScore < -0.2 ? '#F56565' : '#ECC94B';

  // ── List View ─────────────────────────────────────────────
  if (view === 'list') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]} accessibilityRole="header">
            Journal
          </Text>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: theme.primary }]}
            onPress={() => setView('write')}
            accessibilityRole="button"
            accessibilityLabel="Write new journal entry"
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.newBtnText}>New Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={16} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by mood or topic..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search journal entries"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: spacing.xl }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📔</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No entries yet</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Journalling helps you understand your thought patterns and track how you grow over time.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={e => e.id}
            contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
            renderItem={({ item }) => <EntryCard entry={item} theme={theme} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }

  // ── Write View ────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => setView('list')} accessibilityLabel="Back to journal list">
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>New Entry</Text>
        {saving ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <TouchableOpacity
            style={[styles.saveSmallBtn, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save journal entry"
          >
            <Text style={styles.saveSmallBtnText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.composeBody, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date */}
        <Text style={[styles.dateText, { color: theme.textTertiary }]}>
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {/* Text area */}
        <TextInput
          ref={inputRef}
          style={[styles.textArea, { color: theme.text, borderColor: theme.border }]}
          placeholder="What's on your mind today?&#10;&#10;There are no rules here. Write freely."
          placeholderTextColor={theme.textTertiary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          autoFocus
          accessibilityLabel="Journal entry text"
        />

        {/* Mood Tags */}
        <Text style={[styles.sectionTag, { color: theme.textSecondary }]}>How are you feeling?</Text>
        <View style={styles.moodTagRow}>
          {MOOD_TAGS.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.moodTag,
                {
                  backgroundColor: selectedMood === m.key ? m.color + '33' : theme.surface,
                  borderColor: selectedMood === m.key ? m.color : theme.border
                },
              ]}
              onPress={() => setSelectedMood(selectedMood === m.key ? null : m.key)}
              accessibilityRole="checkbox"
              accessibilityLabel={m.key}
              accessibilityState={{ checked: selectedMood === m.key }}
            >
              <Text>{m.emoji}</Text>
              <Text style={[styles.moodTagText, { color: selectedMood === m.key ? m.color : theme.textSecondary }]}>
                {m.key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Topic Tags */}
        <Text style={[styles.sectionTag, { color: theme.textSecondary }]}>Topics (optional)</Text>
        <View style={styles.topicRow}>
          {TOPIC_TAGS.map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.topicTag,
                { backgroundColor: selectedTopics.includes(t) ? theme.primary : theme.surfaceSecondary },
              ]}
              onPress={() => toggleTopic(t)}
              accessibilityRole="checkbox"
              accessibilityLabel={t}
              accessibilityState={{ checked: selectedTopics.includes(t) }}
            >
              <Text style={[styles.topicText, { color: selectedTopics.includes(t) ? '#fff' : theme.textSecondary }]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Analysis */}
        <TouchableOpacity
          style={[styles.analyseBtn, { borderColor: theme.primary }]}
          onPress={analyseContent}
          disabled={analysing}
          accessibilityRole="button"
          accessibilityLabel="Analyse cognitive distortions with AI"
        >
          {analysing ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={theme.primary} />
              <Text style={[styles.analyseBtnText, { color: theme.primary }]}>
                Detect Cognitive Patterns
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Distortions Result */}
        {detectedDistortions.length > 0 && (
          <View style={[styles.distortionsCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.distortionsTitle, { color: theme.text }]}>Patterns detected:</Text>
            <View style={styles.distortionsList}>
              {detectedDistortions.map(d => (
                <View key={d} style={[styles.distortionBadge, { backgroundColor: '#F6AD5522' }]}>
                  <Text style={[styles.distortionText, { color: '#F6AD55' }]}>
                    {DISTORTION_LABELS[d] ?? d}
                  </Text>
                </View>
              ))}
            </View>
            {sentimentScore != null && (
              <Text style={[styles.sentimentText, { color: sentimentColor }]}>
                Sentiment: {sentimentScore > 0.2 ? '🌱 Positive' : sentimentScore < -0.2 ? '🌧 Difficult' : '➖ Neutral'}
                {' '}({(sentimentScore * 100).toFixed(0)}%)
              </Text>
            )}
            <Text style={[styles.distortionsNote, { color: theme.textTertiary }]}>
              Recognising these patterns is the first step to reframing them. This is not a diagnosis.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Entry Card ─────────────────────────────────────────────────
function EntryCard({ entry, theme }: { entry: JournalEntry; theme: any }) {
  const sentimentColor = entry.sentiment_score == null ? theme.textTertiary
    : entry.sentiment_score > 0.2 ? '#48BB78'
      : entry.sentiment_score < -0.2 ? '#F56565' : '#ECC94B';

  const dateLabel = new Date(entry.created_at).toLocaleDateString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const moodTag = MOOD_TAGS.find(m => entry.tags.includes(m.key));

  return (
    <View style={[styles.entryCard, { backgroundColor: theme.surface }]}>
      <View style={styles.entryHeader}>
        <Text style={[styles.entryDate, { color: theme.textTertiary }]}>{dateLabel}</Text>
        {moodTag && <Text style={{ fontSize: 20 }}>{moodTag.emoji}</Text>}
      </View>

      {entry.tags.length > 0 && (
        <View style={styles.entryTags}>
          {entry.tags.slice(0, 5).map(t => (
            <View key={t} style={[styles.entryTag, { backgroundColor: theme.surfaceSecondary }]}>
              <Text style={[styles.entryTagText, { color: theme.textSecondary }]}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      {entry.cognitive_distortions_detected?.length > 0 && (
        <Text style={[styles.entryDistortion, { color: '#F6AD55' }]}>
          🔍 {entry.cognitive_distortions_detected.length} pattern{entry.cognitive_distortions_detected.length > 1 ? 's' : ''} detected
        </Text>
      )}

      {entry.sentiment_score != null && (
        <View style={[styles.sentimentBar, { backgroundColor: theme.border }]}>
          <View style={[styles.sentimentFill, {
            width: `${Math.abs(entry.sentiment_score) * 100}%`,
            backgroundColor: sentimentColor,
            marginLeft: entry.sentiment_score >= 0 ? '50%' : `${50 - Math.abs(entry.sentiment_score) * 50}%`,
          }]} />
          <View style={[styles.sentimentMidLine, { backgroundColor: theme.textTertiary }]} />
        </View>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  newBtnText: { color: '#fff', fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, margin: spacing.md, padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: typography.fontSize.sm },
  empty: { alignItems: 'center', padding: spacing.xl, paddingTop: spacing['3xl'] },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.fontSize.sm, textAlign: 'center', lineHeight: 20 },
  composeBody: { padding: spacing.md },
  dateText: { fontSize: typography.fontSize.sm, marginBottom: spacing.md },
  textArea: { minHeight: 200, fontSize: typography.fontSize.base, lineHeight: 26, padding: spacing.sm, borderWidth: 1, borderRadius: borderRadius.md, marginBottom: spacing.md },
  sectionTag: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  moodTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  moodTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: 1.5 },
  moodTagText: { fontSize: typography.fontSize.xs },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  topicTag: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full },
  topicText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  analyseBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1.5, justifyContent: 'center', marginBottom: spacing.md },
  analyseBtnText: { fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.base },
  distortionsCard: { padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md, ...shadows.sm },
  distortionsTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.sm },
  distortionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  distortionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  distortionText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  sentimentText: { fontSize: typography.fontSize.sm, marginBottom: spacing.sm },
  distortionsNote: { fontSize: typography.fontSize.xs, lineHeight: 18, fontStyle: 'italic' },
  saveSmallBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  saveSmallBtnText: { color: '#fff', fontWeight: typography.fontWeight.semibold },
  entryCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  entryDate: { fontSize: typography.fontSize.xs },
  entryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: spacing.sm },
  entryTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  entryTagText: { fontSize: typography.fontSize.xs },
  entryDistortion: { fontSize: typography.fontSize.xs, marginBottom: spacing.sm },
  sentimentBar: { height: 4, borderRadius: 2, overflow: 'hidden', position: 'relative' },
  sentimentFill: { height: '100%', borderRadius: 2, position: 'absolute' },
  sentimentMidLine: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1 },
});
