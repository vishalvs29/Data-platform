import { Resource } from '@/types';

export const resourceService = {
  getResources: (): Resource[] => {
    return [
      {
        id: '1',
        title: 'Crisis Text Line',
        description: 'Text HOME to 741741 for free 24/7 crisis support',
        category: 'crisis',
        phone: '741741',
      },
      {
        id: '2',
        title: 'National Suicide Prevention Lifeline',
        description: '24/7 free and confidential support',
        category: 'crisis',
        phone: '988',
      },
      {
        id: '3',
        title: 'Understanding Anxiety',
        description: 'Learn about anxiety and how to manage it',
        category: 'article',
      },
      {
        id: '4',
        title: 'Dealing with Stress',
        description: 'Healthy ways to cope with stress at school',
        category: 'article',
      },
      {
        id: '5',
        title: 'Teen Mental Health',
        description: 'Resources specifically for teenagers',
        category: 'support',
      },
      {
        id: '6',
        title: 'Meditation for Beginners',
        description: 'Start your meditation journey',
        category: 'video',
      },
      {
        id: '7',
        title: 'School Counselor Resources',
        description: 'How to talk to your school counselor',
        category: 'support',
      },
      {
        id: '8',
        title: 'Sleep and Mental Health',
        description: 'Why sleep matters for your wellbeing',
        category: 'article',
      },
    ];
  },

  getCrisisResources: (): Resource[] => {
    return resourceService.getResources().filter(r => r.category === 'crisis');
  },

  getResourcesByCategory: (category: Resource['category']): Resource[] => {
    return resourceService.getResources().filter(r => r.category === category);
  },
};
