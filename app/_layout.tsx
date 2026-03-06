import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { colors } from '@/constants/theme';
import { AuthProvider, AlertProvider } from '@/template';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];

  return (
    <AlertProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="landing" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="new-journal" options={{ headerShown: true }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: true }} />
        </Stack>
      </AuthProvider>
    </AlertProvider>
  );
}
