import { Exercise } from '@/types';

export const exerciseService = {
  getExercises: (): Exercise[] => {
    return [
      {
        id: '1',
        title: 'Deep Breathing',
        description: 'Calm your mind with simple breathing exercises',
        duration: 5,
        type: 'breathing',
        icon: '🫁',
      },
      {
        id: '2',
        title: 'Body Scan',
        description: 'Release tension by focusing on your body',
        duration: 10,
        type: 'meditation',
        icon: '🧘',
      },
      {
        id: '3',
        title: 'Gratitude Practice',
        description: 'Reflect on things you are grateful for',
        duration: 5,
        type: 'mindfulness',
        icon: '💝',
      },
      {
        id: '4',
        title: 'Quick Stretch',
        description: 'Energize your body with gentle stretches',
        duration: 7,
        type: 'physical',
        icon: '🤸',
      },
      {
        id: '5',
        title: 'Mindful Walking',
        description: 'Connect with the present moment while walking',
        duration: 15,
        type: 'mindfulness',
        icon: '🚶',
      },
      {
        id: '6',
        title: '4-7-8 Breathing',
        description: 'A powerful technique to reduce anxiety',
        duration: 5,
        type: 'breathing',
        icon: '💨',
      },
    ];
  },

  getExercisesByType: (type: Exercise['type']): Exercise[] => {
    return exerciseService.getExercises().filter(ex => ex.type === type);
  },
};
