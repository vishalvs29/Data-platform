import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MoodType, SleepQuality } from '@/types';
import { useAuth, useAlert } from '@/template';
import { useMood } from '@/hooks/useMood';
import { useProfile } from '@/hooks/useProfile';
import { useSleep } from '@/hooks/useSleep';
import { useFocus } from '@/hooks/useFocus';
import { useAudio } from '@/hooks/useAudio';
import { moodService } from '@/services/moodService';
import { sleepService } from '@/services/sleepService';
import { focusService } from '@/services/focusService';
import { profileService } from '@/services/profileService';
import { MoodSelector } from '@/components/MoodSelector';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { todayMood, saveMood } = useMood();
  const { profile, loading: profileLoading } = useProfile();
  const { todaySleep, recentSleep, saveSleep } = useSleep();
  const { todayFocus, addSession } = useFocus();
  const { speak, isSpeaking } = useAudio();

  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>(todayMood?.mood);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sleep tracking state
  const [showSleepInput, setShowSleepInput] = useState(false);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>('good');

  // Focus tracking state
  const [showFocusInput, setShowFocusInput] = useState(false);
  const [focusDuration, setFocusDuration] = useState('');
  const [focusActivity, setFocusActivity] = useState('');

  const handleSaveMood = async () => {
    if (!selectedMood) {
      showAlert('Please select a mood', 'Choose how you are feeling today');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveMood(selectedMood, note);
      showAlert('Mood saved!', 'Thank you for checking in today');
      setNote('');
    } catch (error) {
      showAlert('Error', 'Failed to save your mood. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSleep = async () => {
    const hours = parseFloat(sleepHours);
    if (!hours || hours <= 0 || hours > 24) {
      showAlert('Invalid Hours', 'Please enter valid sleep hours (0-24)');
      return;
    }

    const { error } = await saveSleep(hours, sleepQuality);
    if (error) {
      showAlert('Error', error);
    } else {
      showAlert('Sleep Logged', 'Your sleep data has been saved');
      setShowSleepInput(false);
      setSleepHours('');
    }
  };

  const handleSaveFocus = async () => {
    const duration = parseInt(focusDuration);
    if (!duration || duration <= 0) {
      showAlert('Invalid Duration', 'Please enter valid minutes');
      return;
    }

    const { error } = await addSession(duration, focusActivity || undefined);
    if (error) {
      showAlert('Error', error);
    } else {
      showAlert('Focus Logged', 'Your focus session has been saved');
      setShowFocusInput(false);
      setFocusDuration('');
      setFocusActivity('');
    }
  };

  const handleLogout = async () => {
    showAlert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const { error } = await logout();
          if (error) showAlert('Error', error);
        },
      },
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFocusTotal = focusService.getTotalMinutes(todayFocus);
  const avgSleepHours = sleepService.getAverageHours(recentSleep);

  const handleAIDemo = () => {
    const greeting = getGreeting();
    const name = profile?.full_name || 'there';
    speak(`${greeting}, ${name}. I am your high-quality AI wellness assistant. How can I help you today?`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Profile */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: theme.text }]}>
              {profile?.full_name || profile?.username || user?.email || 'Welcome'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* AI Voice Demo Button */}
        <TouchableOpacity
          style={[styles.aiDemoButton, shadows.md, { backgroundColor: theme.primary }]}
          onPress={handleAIDemo}
          disabled={isSpeaking}
        >
          <Ionicons name={isSpeaking ? "volume-high" : "mic-outline"} size={22} color={theme.surface} />
          <Text style={[styles.aiDemoButtonText, { color: theme.surface }]}>
            {isSpeaking ? 'AI is speaking...' : 'Hear AI Voice Demo'}
          </Text>
        </TouchableOpacity>

        {/* Profile Dashboard */}
        <TouchableOpacity
          style={[styles.dashboardCard, shadows.lg, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/edit-profile')}
          activeOpacity={0.7}
        >
          <View style={styles.dashboardHeader}>
            <View style={[styles.profileIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="person" size={32} color={theme.primary} />
            </View>
            <View style={styles.dashboardInfo}>
              <Text style={[styles.dashboardTitle, { color: theme.text }]}>Profile</Text>
              {profileLoading ? (
                <ActivityIndicator size="small" color={theme.textTertiary} />
              ) : (
                <Text style={[styles.dashboardSubtitle, { color: theme.textSecondary }]}>
                  {profile?.full_name ? 'Tap to update' : 'Complete your profile'}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </View>

          {profile && (profile.birthdate || profile.weight_kg || profile.height_cm) && (
            <View style={styles.profileStats}>
              {profile.birthdate && (
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Age</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {profileService.calculateAge(profile.birthdate)} yrs
                  </Text>
                </View>
              )}
              {profile.weight_kg && (
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Weight</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {profile.weight_kg} kg
                  </Text>
                </View>
              )}
              {profile.height_cm && (
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Height</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {profile.height_cm} cm
                  </Text>
                </View>
              )}
              {profile.weight_kg && profile.height_cm && (
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: theme.textTertiary }]}>BMI</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {profileService.calculateBMI(profile.weight_kg, profile.height_cm).toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Sleep & Focus Tracking */}
        <View style={styles.trackingRow}>
          {/* Sleep Card */}
          <View style={[styles.trackingCard, shadows.md, { backgroundColor: theme.surface }]}>
            <View style={styles.trackingHeader}>
              <Ionicons name="moon" size={24} color={theme.secondary} />
              <Text style={[styles.trackingTitle, { color: theme.text }]}>Sleep</Text>
            </View>
            {todaySleep ? (
              <View style={styles.trackingContent}>
                <Text style={[styles.trackingValue, { color: theme.text }]}>
                  {todaySleep.hours}h
                </Text>
                <Text style={[styles.trackingLabel, { color: theme.textSecondary }]}>
                  {sleepService.getSleepQualityEmoji(todaySleep.quality)} {todaySleep.quality}
                </Text>
              </View>
            ) : (
              <>
                {!showSleepInput ? (
                  <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => setShowSleepInput(true)}
                  >
                    <Text style={[styles.trackButtonText, { color: theme.primary }]}>
                      Log Sleep
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.inputSection}>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
                      placeholder="Hours"
                      placeholderTextColor={theme.textTertiary}
                      value={sleepHours}
                      onChangeText={setSleepHours}
                      keyboardType="decimal-pad"
                    />
                    <View style={styles.qualitySelector}>
                      {(['poor', 'fair', 'good', 'excellent'] as SleepQuality[]).map((q) => (
                        <TouchableOpacity
                          key={q}
                          onPress={() => setSleepQuality(q)}
                          style={[
                            styles.qualityOption,
                            sleepQuality === q && { backgroundColor: theme.primary + '15' },
                          ]}
                        >
                          <Text style={[styles.qualityText, { color: sleepQuality === q ? theme.primary : theme.textSecondary }]}>
                            {sleepService.getSleepQualityEmoji(q)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: theme.surfaceSecondary }]}
                        onPress={() => setShowSleepInput(false)}
                      >
                        <Text style={[styles.miniButtonText, { color: theme.textSecondary }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: theme.primary }]}
                        onPress={handleSaveSleep}
                      >
                        <Text style={[styles.miniButtonText, { color: theme.surface }]}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
            {avgSleepHours > 0 && (
              <Text style={[styles.avgText, { color: theme.textTertiary }]}>
                7d avg: {avgSleepHours}h
              </Text>
            )}
          </View>

          {/* Focus Card */}
          <View style={[styles.trackingCard, shadows.md, { backgroundColor: theme.surface }]}>
            <View style={styles.trackingHeader}>
              <Ionicons name="timer" size={24} color={theme.accent} />
              <Text style={[styles.trackingTitle, { color: theme.text }]}>Focus</Text>
            </View>
            {todayFocusTotal > 0 ? (
              <View style={styles.trackingContent}>
                <Text style={[styles.trackingValue, { color: theme.text }]}>
                  {focusService.formatDuration(todayFocusTotal)}
                </Text>
                <Text style={[styles.trackingLabel, { color: theme.textSecondary }]}>
                  {todayFocus.length} {todayFocus.length === 1 ? 'session' : 'sessions'}
                </Text>
              </View>
            ) : (
              <>
                {!showFocusInput ? (
                  <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => setShowFocusInput(true)}
                  >
                    <Text style={[styles.trackButtonText, { color: theme.primary }]}>
                      Log Focus
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.inputSection}>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
                      placeholder="Minutes"
                      placeholderTextColor={theme.textTertiary}
                      value={focusDuration}
                      onChangeText={setFocusDuration}
                      keyboardType="number-pad"
                    />
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
                      placeholder="Activity (optional)"
                      placeholderTextColor={theme.textTertiary}
                      value={focusActivity}
                      onChangeText={setFocusActivity}
                    />
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: theme.surfaceSecondary }]}
                        onPress={() => setShowFocusInput(false)}
                      >
                        <Text style={[styles.miniButtonText, { color: theme.textSecondary }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: theme.primary }]}
                        onPress={handleSaveFocus}
                      >
                        <Text style={[styles.miniButtonText, { color: theme.surface }]}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
            {todayFocusTotal > 0 && (
              <TouchableOpacity onPress={() => setShowFocusInput(true)}>
                <Text style={[styles.addMoreText, { color: theme.primary }]}>+ Add session</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mood Check-in */}
        <View
          style={[
            styles.checkInCard,
            shadows.lg,
            { backgroundColor: theme.surface },
          ]}
        >
          {todayMood ? (
            <View style={styles.completedCheckIn}>
              <Text style={styles.completedEmoji}>
                {moodService.getMoodEmoji(todayMood.mood)}
              </Text>
              <Text style={[styles.completedTitle, { color: theme.text }]}>
                You checked in today!
              </Text>
              <Text style={[styles.completedMessage, { color: theme.textSecondary }]}>
                {moodService.getMoodDescription(todayMood.mood)}
              </Text>
              {todayMood.note && (
                <View style={[styles.noteBox, { backgroundColor: theme.surfaceSecondary }]}>
                  <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                    {todayMood.note}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: theme.surfaceSecondary }]}
                onPress={() => setSelectedMood(todayMood.mood)}
              >
                <Text style={[styles.updateButtonText, { color: theme.primary }]}>
                  Update Check-in
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Daily Mood Check-in
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                How are you feeling today?
              </Text>

              <MoodSelector
                selectedMood={selectedMood}
                onSelectMood={setSelectedMood}
              />

              <TextInput
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Add a note (optional)"
                placeholderTextColor={theme.textTertiary}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: selectedMood ? theme.primary : theme.border },
                ]}
                onPress={handleSaveMood}
                disabled={!selectedMood || isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={[styles.saveButtonText, { color: theme.surface }]}>
                  {isSubmitting ? 'Saving...' : 'Save Check-in'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Tips
          </Text>

          <View
            style={[
              styles.tipCard,
              shadows.md,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={styles.tipEmoji}>💙</Text>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Remember: It is okay to not be okay. Every feeling is valid.
            </Text>
          </View>

          <View
            style={[
              styles.tipCard,
              shadows.md,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={styles.tipEmoji}>🌱</Text>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Take small steps. Progress is progress, no matter how small.
            </Text>
          </View>

          <View
            style={[
              styles.tipCard,
              shadows.md,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={styles.tipEmoji}>🤗</Text>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              You are not alone. Reach out to friends, family, or a counselor.
            </Text>
          </View>
        </View>
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
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  logoutButton: {
    padding: spacing.sm,
  },
  dashboardCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  dashboardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  dashboardSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  trackingRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  trackingCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trackingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  trackingContent: {
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  trackingValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  trackingLabel: {
    fontSize: typography.fontSize.xs,
  },
  trackButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  trackButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  inputSection: {
    gap: spacing.xs,
  },
  smallInput: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSize.sm,
  },
  qualitySelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  qualityOption: {
    flex: 1,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  qualityText: {
    fontSize: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  miniButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  miniButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  avgText: {
    fontSize: typography.fontSize.xs,
  },
  addMoreText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  checkInCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },
  noteInput: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    minHeight: 80,
    borderWidth: 1,
  },
  saveButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  completedCheckIn: {
    alignItems: 'center',
    gap: spacing.md,
  },
  completedEmoji: {
    fontSize: 64,
  },
  completedTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  completedMessage: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  noteBox: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  updateButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  updateButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  tipsSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  tipCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
    alignItems: 'center',
  },
  tipEmoji: {
    fontSize: 28,
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  aiDemoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  aiDemoButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
