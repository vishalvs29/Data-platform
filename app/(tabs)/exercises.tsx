import React from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exerciseService } from '@/services/exerciseService';
import { ExerciseCard } from '@/components/ExerciseCard';
import { colors, spacing, typography } from '@/constants/theme';
import { useAlert } from '@/template';

export default function ExercisesScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const exercises = exerciseService.getExercises();

  const handleExercisePress = (title: string, description: string) => {
    showAlert(
      title,
      `${description}\n\nGuided exercise sessions coming soon!`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Mindfulness Exercises
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Take a moment for yourself
          </Text>
        </View>

        <View style={styles.exerciseList}>
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onPress={() => handleExercisePress(exercise.title, exercise.description)}
            />
          ))}
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
  exerciseList: {
    gap: spacing.md,
  },
});
