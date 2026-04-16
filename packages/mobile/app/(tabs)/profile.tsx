import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/useTheme';
import type { ThemeMode } from '@/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const THEME_OPTIONS: { label: string; value: ThemeMode; icon: string }[] = [
  { label: 'System', value: 'system', icon: '📱' },
  { label: 'Light', value: 'light', icon: '☀️' },
  { label: 'Dark', value: 'dark', icon: '🌙' },
];

function InfoRow({ icon, label, value, onPress, last, colors, typography, spacing }: {
  icon: string; label: string; value: string | undefined; onPress?: () => void;
  last?: boolean; colors: any; typography: any; spacing: any;
}) {
  const content = (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.kxCardBorder,
    }}>
      <Ionicons name={icon as any} size={18} color={colors.kxTextSecondary} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>{label}</Text>
        <Text style={{ fontSize: typography.fontSize.sm, color: value ? colors.kxTextPrimary : colors.ledgerGray[400], fontWeight: typography.fontWeight.medium, marginTop: 2 }}>
          {value || 'Not set'}
        </Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.ledgerGray[400]} />}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, typography, spacing, radius, themeMode, setThemeMode } = useTheme();

  const sectionHeader = (label: string) => (
    <Text style={{
      fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold,
      color: colors.kxTextSecondary, marginBottom: spacing.sm,
      textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      {label}
    </Text>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xl }}>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, marginBottom: spacing['2xl'] }}>
          Settings
        </Text>

        {/* Profile Card */}
        <Card style={{ marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: colors.kxPrimary[100],
              justifyContent: 'center', alignItems: 'center', marginRight: spacing.lg,
            }}>
              <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxPrimary[600] }}>
                {(user?.firstName?.[0] ?? user?.username?.[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary }}>
                {user?.email}
              </Text>
            </View>
          </View>
        </Card>

        {/* Appearance */}
        {sectionHeader('Appearance')}
        <Card style={{ marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {THEME_OPTIONS.map((opt) => {
              const isActive = themeMode === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setThemeMode(opt.value)}
                  style={{
                    flex: 1, paddingVertical: spacing.md, borderRadius: radius.md,
                    backgroundColor: isActive ? colors.kxPrimary[600] : 'transparent',
                    borderWidth: isActive ? 0 : 1, borderColor: colors.kxCardBorder,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: typography.fontSize.xl, marginBottom: spacing.xs }}>{opt.icon}</Text>
                  <Text style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
                    color: isActive ? colors.onPrimary : colors.kxTextSecondary,
                  }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Profile Details */}
        {sectionHeader('Profile Details')}
        <Card style={{ marginBottom: spacing.xl }}>
          <InfoRow icon="person-outline" label="Username" value={user?.username} colors={colors} typography={typography} spacing={spacing} />
          <InfoRow icon="mail-outline" label="Email" value={user?.email} colors={colors} typography={typography} spacing={spacing} />
          <InfoRow icon="text-outline" label="First Name" value={user?.firstName} colors={colors} typography={typography} spacing={spacing} />
          <InfoRow icon="text-outline" label="Last Name" value={user?.lastName} colors={colors} typography={typography} spacing={spacing} />
          <InfoRow icon="call-outline" label="Phone" value={user?.phone} colors={colors} typography={typography} spacing={spacing} />
          <InfoRow icon="business-outline" label="Bench" value={user?.bench} colors={colors} typography={typography} spacing={spacing} />
          <InfoRow
            icon="calendar-outline" label="Member Since"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined}
            colors={colors} typography={typography} spacing={spacing} last
          />
        </Card>

        {/* Notifications */}
        {sectionHeader('Notifications')}
        <Card style={{ marginBottom: spacing.xl, alignItems: 'center', paddingVertical: spacing['2xl'] }}>
          <Ionicons name="notifications-off-outline" size={28} color={colors.ledgerGray[300]} />
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: spacing.sm }}>
            Coming soon
          </Text>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[400], marginTop: spacing.xs, textAlign: 'center' }}>
            Push notification preferences will appear here.
          </Text>
        </Card>

        {/* About Knowlex */}
        {sectionHeader('About Knowlex')}
        <Card style={{ marginBottom: spacing['2xl'] }}>
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxPrimary[600] }}>
              Knowlex
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: spacing.xs }}>
              Version 0.1.0
            </Text>
          </View>
          <Text style={{
            fontSize: typography.fontSize.sm, color: colors.kxTextSecondary,
            textAlign: 'center', lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
            marginBottom: spacing.lg,
          }}>
            Legal tech platform for case management{'\n'}and AI-powered legal drafting.
          </Text>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.kxCardBorder, paddingTop: spacing.md }}>
            <InfoRow icon="globe-outline" label="Website" value="knowlex.ai" onPress={() => Linking.openURL('https://knowlex.ai')} colors={colors} typography={typography} spacing={spacing} />
            <InfoRow icon="help-circle-outline" label="Support" value="support@knowlex.ai" onPress={() => Linking.openURL('mailto:support@knowlex.ai')} colors={colors} typography={typography} spacing={spacing} />
            <InfoRow icon="document-text-outline" label="Terms of Service" value="knowlex.ai/terms" onPress={() => Linking.openURL('https://knowlex.ai/terms')} colors={colors} typography={typography} spacing={spacing} last />
          </View>
        </Card>

        <Button title="Sign Out" onPress={logout} variant="outline" />
      </ScrollView>
    </SafeAreaView>
  );
}
