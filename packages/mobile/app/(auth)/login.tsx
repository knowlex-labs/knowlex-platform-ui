import { useState, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginScreen() {
  const { login, googleLogin } = useAuth();
  const { colors, typography, spacing, radius } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleIdToken = useCallback(async (idToken: string) => {
    setError(null);
    setGoogleLoading(true);
    try {
      await googleLogin(idToken);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLogin]);

  const { signIn: googleSignIn, isReady: googleReady } = useGoogleAuth(handleGoogleIdToken);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={{
            backgroundColor: colors.kxPrimary[600],
            paddingTop: 60,
            paddingBottom: 40,
            alignItems: 'center',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}>
            <Text style={{ fontSize: 36, fontWeight: '700', color: colors.onPrimary, letterSpacing: -0.5 }}>
              Knowlex
            </Text>
            <Text style={{ fontSize: 14, color: colors.kxPrimary[200], marginTop: 4 }}>
              AI-Powered Legal Platform
            </Text>
          </View>

          {/* Form */}
          <View style={{ flex: 1, paddingTop: 32, paddingHorizontal: spacing['2xl'] }}>
            <Text style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
              Welcome back
            </Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: spacing.xs, marginBottom: spacing['3xl'] }}>
              Sign in to your account
            </Text>

            {error && (
              <View style={{ backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg }}>
                <Text style={{ color: colors.error, fontSize: typography.fontSize.sm }}>{error}</Text>
              </View>
            )}

            <Input
              label="Username or Email"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              accessibilityLabel="Username or email input"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Password input"
            />

            <Button title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.sm }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing['2xl'] }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.kxCardBorder }} />
              <Text style={{ paddingHorizontal: spacing.md, fontSize: 13, color: colors.kxTextSecondary }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.kxCardBorder }} />
            </View>

            <Button title={googleLoading ? 'Signing in...' : 'Continue with Google'} onPress={googleSignIn} variant="outline" loading={googleLoading} disabled={!googleReady || googleLoading} style={{ marginBottom: spacing['2xl'] }} />

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.sm }}>
                Don't have an account?{' '}
              </Text>
              <Link href="/(auth)/signup">
                <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>
                  Sign up
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
