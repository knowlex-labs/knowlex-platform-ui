import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupScreen() {
  const { signup } = useAuth();
  const { colors, typography, spacing, radius } = useTheme();

  const [form, setForm] = useState({
    firstName: '', lastName: '', username: '', email: '', password: '', mobileNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): string | null => {
    if (!form.username.trim()) return 'Username is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.email.includes('@')) return 'Please enter a valid email';
    if (!form.password) return 'Password is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSignup = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError(null);
    setLoading(true);
    try {
      await signup({ ...form, username: form.username.trim(), email: form.email.trim() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing['2xl'], paddingTop: spacing['3xl'] }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
            Create your account
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: spacing.xs, marginBottom: spacing['3xl'] }}>
            Join Knowlex to supercharge your legal practice
          </Text>

          {error && (
            <View style={{ backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg }}>
              <Text style={{ color: colors.error, fontSize: typography.fontSize.sm }}>{error}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Input label="First Name" placeholder="John" value={form.firstName} onChangeText={(v) => updateField('firstName', v)} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Last Name" placeholder="Doe" value={form.lastName} onChangeText={(v) => updateField('lastName', v)} />
            </View>
          </View>

          <Input label="Username" placeholder="johndoe" value={form.username} onChangeText={(v) => updateField('username', v)} autoCapitalize="none" />
          <Input label="Email" placeholder="john@example.com" value={form.email} onChangeText={(v) => updateField('email', v)} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Password" placeholder="Min. 6 characters" value={form.password} onChangeText={(v) => updateField('password', v)} secureTextEntry />
          <Input label="Mobile Number" placeholder="+91 9876543210" value={form.mobileNumber} onChangeText={(v) => updateField('mobileNumber', v)} keyboardType="phone-pad" />

          <Button title="Create Account" onPress={handleSignup} loading={loading} style={{ marginTop: spacing.sm }} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing['2xl'], marginBottom: spacing['3xl'] }}>
            <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.sm }}>Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>Sign in</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
