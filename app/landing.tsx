import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

export default function LandingScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🧠✨</Text>
          <Text style={[styles.heroTitle, { color: theme.surface }]}>
            MindfulYouth
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.surface + 'CC' }]}>
            Your mental wellness companion for students and young minds
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="heart" size={28} color={theme.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Mood Tracking
            </Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Daily check-ins to understand your emotional patterns
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.featureIcon, { backgroundColor: theme.secondary + '15' }]}>
              <Ionicons name="moon" size={28} color={theme.secondary} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Sleep Insights
            </Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Track and improve your sleep quality
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.featureIcon, { backgroundColor: theme.accent + '15' }]}>
              <Ionicons name="timer" size={28} color={theme.accent} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Focus Sessions
            </Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Monitor study time and productivity
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="book" size={28} color={theme.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Private Journal
            </Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Express yourself in a safe space
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.surface }]}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: theme.primary }]}>
              Get Started
            </Text>
          </TouchableOpacity>

          <Text style={[styles.footerText, { color: theme.surface + 'CC' }]}>
            Free, private, and built for you
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  heroEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
    maxWidth: 320,
  },
  features: {
    gap: spacing.md,
    marginBottom: spacing['3xl'],
  },
  featureCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  featureTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  ctaSection: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
  },
});
