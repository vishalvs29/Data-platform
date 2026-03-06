import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useAlert } from '@/template';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

type AuthMode = 'login' | 'register' | 'otp';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { sendOTP, verifyOTPAndLogin, signInWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Missing Information', 'Please enter your email and password');
      return;
    }

    const { error } = await signInWithPassword(email, password);
    if (error) {
      showAlert('Login Failed', error);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters');
      return;
    }

    const { error } = await sendOTP(email);
    if (error) {
      showAlert('Registration Failed', error);
    } else {
      setMode('otp');
      showAlert('Verification Sent', 'Check your email for the verification code');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showAlert('Missing Code', 'Please enter the verification code');
      return;
    }

    const { error } = await verifyOTPAndLogin(email, otp, { password });
    if (error) {
      showAlert('Verification Failed', error);
    }
  };

  const renderLoginForm = () => (
    <>
      <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Sign in to continue your wellness journey
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
            placeholder="your.email@example.com"
            placeholderTextColor={theme.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                { backgroundColor: theme.surfaceSecondary, color: theme.text },
              ]}
              placeholder="Enter your password"
              placeholderTextColor={theme.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={theme.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleLogin}
          disabled={operationLoading}
          activeOpacity={0.8}
        >
          {operationLoading ? (
            <ActivityIndicator color={theme.surface} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.surface }]}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode('register')}>
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Do not have an account? Register
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderRegisterForm = () => (
    <>
      <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Start your mental wellness journey today
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
            placeholder="your.email@example.com"
            placeholderTextColor={theme.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                { backgroundColor: theme.surfaceSecondary, color: theme.text },
              ]}
              placeholder="At least 6 characters"
              placeholderTextColor={theme.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={theme.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text }]}
            placeholder="Re-enter your password"
            placeholderTextColor={theme.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleRegister}
          disabled={operationLoading}
          activeOpacity={0.8}
        >
          {operationLoading ? (
            <ActivityIndicator color={theme.surface} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.surface }]}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode('login')}>
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderOTPForm = () => (
    <>
      <Text style={[styles.title, { color: theme.text }]}>Verify Email</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Enter the 4-digit code sent to {email}
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Verification Code</Text>
          <TextInput
            style={[
              styles.input,
              styles.otpInput,
              { backgroundColor: theme.surfaceSecondary, color: theme.text },
            ]}
            placeholder="0000"
            placeholderTextColor={theme.textTertiary}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleVerifyOTP}
          disabled={operationLoading}
          activeOpacity={0.8}
        >
          {operationLoading ? (
            <ActivityIndicator color={theme.surface} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.surface }]}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setMode('register');
            setOtp('');
          }}
        >
          <Text style={[styles.linkText, { color: theme.primary }]}>Back to Registration</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logoEmoji}>🧠✨</Text>
            <Text style={[styles.logoText, { color: theme.primary }]}>MindfulYouth</Text>
          </View>

          {mode === 'login' && renderLoginForm()}
          {mode === 'register' && renderRegisterForm()}
          {mode === 'otp' && renderOTPForm()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  logoText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: spacing['2xl'] + spacing.md,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    padding: spacing.xs,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: typography.fontSize['2xl'],
    letterSpacing: 8,
  },
  primaryButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  linkText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
});
