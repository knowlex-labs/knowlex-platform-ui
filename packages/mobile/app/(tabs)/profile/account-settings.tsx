import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@knowlex/core/api/auth-api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FieldProps {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  disabled?: boolean;
  hint?: string;
  secureTextEntry?: boolean;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'sentences', disabled, hint, secureTextEntry }: FieldProps) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ledgerGray[400]}
        editable={!disabled}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        style={{
          backgroundColor: disabled ? colors.ledgerGray[50] : colors.kxCardBg,
          borderWidth: 1,
          borderColor: colors.kxCardBorder,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
          fontSize: typography.fontSize.sm,
          color: disabled ? colors.kxTextSecondary : colors.kxTextPrimary,
        }}
      />
      {hint && (
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[400], marginTop: 4 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

export default function AccountSettingsScreen() {
  const { user, updateProfile } = useAuth();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [form, setForm] = useState({
    username: user?.username ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    bench: user?.bench ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwdOpen, setPwdOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username ?? '',
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        bench: user.bench ?? '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await updateProfile({
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        bench: form.bench,
      });
      setSaveMsg({ type: 'success', text: 'Saved.' });
      setTimeout(() => setSaveMsg(null), 2500);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 2, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs }}>
          <Ionicons name="chevron-back" size={20} color={colors.kxPrimary[600]} />
          <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm }}>Profile</Text>
        </Pressable>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, marginTop: 2 }}>
          Account Settings
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={20}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          {/* Personal Information */}
          <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
            Personal Information
          </Text>
          <Card style={{ marginBottom: spacing.lg }}>
            <Field label="Username" value={form.username} onChangeText={(v) => setForm({ ...form, username: v })} autoCapitalize="none" placeholder="Username" />
            <Field label="First Name" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} placeholder="First name" />
            <Field label="Last Name" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} placeholder="Last name" />
            <Field label="Bench" value={form.bench} onChangeText={(v) => setForm({ ...form, bench: v })} placeholder="e.g. Delhi High Court" />
            <Field label="Email" value={user?.email ?? ''} disabled hint="Email cannot be changed here." />
            <Field label="Phone" value={user?.phone ?? ''} disabled keyboardType="phone-pad" hint="Phone is set at signup and cannot be changed here." />
            <Button title={saving ? 'Saving…' : 'Save Changes'} onPress={handleSave} disabled={saving} />
            {saveMsg && (
              <Text style={{
                marginTop: spacing.sm, fontSize: typography.fontSize.xs,
                color: saveMsg.type === 'success' ? colors.success : colors.error,
              }}>
                {saveMsg.text}
              </Text>
            )}
          </Card>

          {/* Password */}
          <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
            Security
          </Text>
          <Pressable
            onPress={() => setPwdOpen(true)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
              borderWidth: 1, borderColor: colors.kxCardBorder, borderRadius: radius.lg,
              padding: spacing.md, flexDirection: 'row', alignItems: 'center',
            })}
          >
            <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.kxPrimary[50], alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.kxPrimary[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
                Change Password
              </Text>
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
                Update your account password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.ledgerGray[400]} />
          </Pressable>

          {/* Member Since */}
          {user?.createdAt && (
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: spacing.xl, textAlign: 'center' }}>
              Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ChangePasswordSheet visible={pwdOpen} onClose={() => setPwdOpen(false)} />
    </SafeAreaView>
  );
}

function ChangePasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { replaceTokens, user } = useAuth();
  const { colors, typography, spacing, radius } = useTheme();
  const [mode, setMode] = useState<'change' | 'reset'>('change');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'sent' | 'sending'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setMode('change');
      setCurrent(''); setNext(''); setConfirm('');
      setResetEmail(''); setStatus('idle'); setError(null);
    }, 300);
  };

  const validate = (): string | null => {
    if (next.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return 'Password must include a letter and a digit.';
    if (next !== confirm) return 'New passwords do not match.';
    if (current === next) return 'New password must differ from your current password.';
    return null;
  };

  const handleChange = async () => {
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setStatus('saving');
    try {
      const tokens = await authApi.changePassword(current, next);
      replaceTokens(tokens.token, tokens.refreshToken);
      setStatus('success');
      setTimeout(handleClose, 1500);
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Password change failed.');
    }
  };

  const handleReset = async () => {
    setStatus('sending');
    try {
      await authApi.forgotPassword(resetEmail);
      setStatus('sent');
    } catch {
      setStatus('idle');
      setError('Could not send reset link.');
    }
  };

  useEffect(() => {
    if (visible && mode === 'reset' && !resetEmail && user?.email) setResetEmail(user.email);
  }, [visible, mode, resetEmail, user?.email]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' }} onPress={handleClose}>
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: colors.kxCardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: spacing['2xl'] }}
        >
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ledgerGray[300] }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md }}>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
              {mode === 'change' ? 'Change Password' : 'Reset Password'}
            </Text>
            <Pressable onPress={handleClose}>
              <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>
                Close
              </Text>
            </Pressable>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl }} keyboardShouldPersistTaps="handled">
              {error && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.error + '15', marginBottom: spacing.md }}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                  <Text style={{ flex: 1, fontSize: typography.fontSize.xs, color: colors.error }}>{error}</Text>
                </View>
              )}

              {mode === 'change' ? (
                <>
                  {status === 'success' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.success + '15' }}>
                      <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                      <Text style={{ fontSize: typography.fontSize.sm, color: colors.success, fontWeight: typography.fontWeight.medium }}>
                        Password updated.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Field label="Current Password" value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" />
                      <Field label="New Password" value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" hint="At least 8 characters with a letter and a digit." />
                      <Field label="Confirm New Password" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />
                      <Button title={status === 'saving' ? 'Updating…' : 'Update Password'} onPress={handleChange} disabled={status === 'saving' || !current || !next || !confirm} />
                      <Pressable onPress={() => { setMode('reset'); setError(null); }} style={{ marginTop: spacing.md, alignItems: 'center' }}>
                        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxPrimary[600] }}>
                          Forgot current password? Reset via email
                        </Text>
                      </Pressable>
                    </>
                  )}
                </>
              ) : (
                <>
                  {status === 'sent' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.success + '15' }}>
                      <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                      <Text style={{ fontSize: typography.fontSize.sm, color: colors.success }}>
                        Reset link sent. Check your inbox.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Field label="Email Address" value={resetEmail} onChangeText={setResetEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
                      <Button title={status === 'sending' ? 'Sending…' : 'Send Reset Link'} onPress={handleReset} disabled={status === 'sending' || !resetEmail} />
                      <Pressable onPress={() => { setMode('change'); setError(null); }} style={{ marginTop: spacing.md, alignItems: 'center' }}>
                        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxPrimary[600] }}>
                          Back to change password
                        </Text>
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
