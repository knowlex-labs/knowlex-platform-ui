import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, typography, spacing, radius, themeMode, setThemeMode } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, marginBottom: spacing['2xl'] }}>
          Settings
        </Text>

        {/* Profile Card */}
        <Card style={{ marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.kxPrimary[100],
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: spacing.lg,
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

        {/* Theme Switcher */}
        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Appearance
        </Text>
        <Card style={{ marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {THEME_OPTIONS.map((opt) => {
              const isActive = themeMode === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setThemeMode(opt.value)}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: isActive ? colors.kxPrimary[600] : 'transparent',
                    borderWidth: isActive ? 0 : 1,
                    borderColor: colors.kxCardBorder,
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

        {/* Menu Items */}
        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Account
        </Text>
        <Card style={{ marginBottom: spacing['2xl'] }}>
          <MenuItem label="Profile Settings" colors={colors} typography={typography} spacing={spacing} />
          <MenuItem label="Notifications" colors={colors} typography={typography} spacing={spacing} />
          <MenuItem label="About Knowlex" colors={colors} typography={typography} spacing={spacing} last />
        </Card>

        <Button title="Sign Out" onPress={logout} variant="outline" />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ label, colors, typography, spacing, last }: { label: string; colors: typeof import('@/theme/tokens').lightColors; typography: typeof import('@/theme/tokens').typography; spacing: typeof import('@/theme/tokens').spacing; last?: boolean }) {
  return (
    <Pressable style={{
      paddingVertical: spacing.md,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.kxCardBorder,
    }}>
      <Text style={{ fontSize: typography.fontSize.base, color: colors.kxTextPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}
