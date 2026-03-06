import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Resource } from '@/types';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';

interface ResourceCardProps {
  resource: Resource;
  onPress: () => void;
}

const categoryIcons: Record<Resource['category'], string> = {
  crisis: '🆘',
  support: '🤝',
  article: '📖',
  video: '🎥',
};

const categoryColors: Record<Resource['category'], string> = {
  crisis: '#FC8181',
  support: '#4FD1C5',
  article: '#7B68EE',
  video: '#F6AD55',
};

export function ResourceCard({ resource, onPress }: ResourceCardProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        shadows.md,
        { 
          backgroundColor: theme.surface,
          borderColor: resource.category === 'crisis' ? categoryColors.crisis : theme.border,
          borderWidth: resource.category === 'crisis' ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: categoryColors[resource.category] + '20' },
        ]}
      >
        <Text style={styles.icon}>{categoryIcons[resource.category]}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{resource.title}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {resource.description}
        </Text>
        {resource.phone && (
          <Text style={[styles.phone, { color: theme.primary }]}>
            {resource.phone}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  phone: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
});
