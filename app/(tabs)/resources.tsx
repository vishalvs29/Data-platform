import React from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resourceService } from '@/services/resourceService';
import { ResourceCard } from '@/components/ResourceCard';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useAlert } from '@/template';

export default function ResourcesScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const crisisResources = resourceService.getCrisisResources();
  const otherResources = resourceService.getResources().filter(r => r.category !== 'crisis');

  const handleResourcePress = (title: string, description: string, phone?: string) => {
    const message = phone
      ? `${description}\n\nContact: ${phone}`
      : `${description}\n\nThis resource is currently informational only.`;
    
    showAlert(title, message);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Resources</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Help is always available
          </Text>
        </View>

        {/* Crisis Banner */}
        <View
          style={[
            styles.crisisBanner,
            shadows.lg,
            { backgroundColor: theme.error + '15', borderColor: theme.error },
          ]}
        >
          <Text style={styles.crisisEmoji}>🆘</Text>
          <View style={styles.crisisContent}>
            <Text style={[styles.crisisTitle, { color: theme.error }]}>
              Need Immediate Help?
            </Text>
            <Text style={[styles.crisisText, { color: theme.text }]}>
              If you are in crisis, please reach out to the resources below or call 988 (Suicide & Crisis Lifeline)
            </Text>
          </View>
        </View>

        {/* Crisis Resources */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Crisis Support
          </Text>
          <View style={styles.resourceList}>
            {crisisResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onPress={() => handleResourcePress(resource.title, resource.description, resource.phone)}
              />
            ))}
          </View>
        </View>

        {/* Other Resources */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Learning & Support
          </Text>
          <View style={styles.resourceList}>
            {otherResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onPress={() => handleResourcePress(resource.title, resource.description)}
              />
            ))}
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
  },
  crisisBanner: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  crisisEmoji: {
    fontSize: 32,
  },
  crisisContent: {
    flex: 1,
    gap: spacing.xs,
  },
  crisisTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  crisisText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  resourceList: {
    gap: spacing.md,
  },
});
