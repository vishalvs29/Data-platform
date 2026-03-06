import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { MoodType } from '@/types';
import { moodService } from '@/services/moodService';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface MoodSelectorProps {
  selectedMood?: MoodType;
  onSelectMood: (mood: MoodType) => void;
}

const moods: MoodType[] = ['great', 'good', 'okay', 'sad', 'stressed'];

export function MoodSelector({ selectedMood, onSelectMood }: MoodSelectorProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {moods.map((mood) => {
        const isSelected = selectedMood === mood;
        return (
          <TouchableOpacity
            key={mood}
            style={[
              styles.moodButton,
              { 
                backgroundColor: isSelected ? theme.mood[mood] : theme.surface,
                borderColor: theme.mood[mood],
              },
            ]}
            onPress={() => onSelectMood(mood)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{moodService.getMoodEmoji(mood)}</Text>
            <Text
              style={[
                styles.label,
                { color: isSelected ? theme.surface : theme.text },
              ]}
            >
              {moodService.getMoodLabel(mood)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  moodButton: {
    width: 70,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emoji: {
    fontSize: typography.fontSize['2xl'],
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
