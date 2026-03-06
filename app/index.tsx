import { AuthRouter } from '@/template';
import { Redirect } from 'expo-router';

export default function RootScreen() {
  return (
    <AuthRouter loginRoute="/landing" excludeRoutes={['/landing']}>
      <Redirect href="/(tabs)" />
    </AuthRouter>
  );
}
