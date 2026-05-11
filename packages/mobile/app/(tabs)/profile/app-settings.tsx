import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import type { ThemeMode } from '@/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';

const THEME_OPTIONS: { label: string; value: ThemeMode; icon: string }[] = [
  { label: 'System', value: 'system', icon: '📱' },
  { label: 'Light', value: 'light', icon: '☀️' },
  { label: 'Dark', value: 'dark', icon: '🌙' },
];

export default function AppSettingsScreen() {
  const { colors, typography, spacing, radius, themeMode, setThemeMode } = useTheme();
  const router = useRouter();

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
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 2, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs }}>
          <Ionicons name="chevron-back" size={20} color={colors.kxPrimary[600]} />
          <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm }}>Profile</Text>
        </Pressable>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, marginTop: 2 }}>
          App Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        {sectionHeader('Appearance')}
        <Card style={{ marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {THEME_OPTIONS.map((opt) => {
              const isActive = themeMode === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setThemeMode(opt.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Theme ${opt.label}`}
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

        {sectionHeader('Notifications')}
        <Card style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
          <Ionicons name="notifications-off-outline" size={28} color={colors.ledgerGray[300]} />
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: spacing.sm }}>
            Coming soon
          </Text>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[400], marginTop: spacing.xs, textAlign: 'center' }}>
            Push notification preferences will appear here.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
