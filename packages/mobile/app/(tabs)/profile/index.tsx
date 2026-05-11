import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/components/ui/Button';

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
  last?: boolean;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const Row = ({ icon, label, hint, onPress, last }: RowProps) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.kxCardBorder,
        backgroundColor: pressed ? colors.ledgerGray[50] : 'transparent',
      })}
    >
      <View style={{
        width: 36, height: 36, borderRadius: radius.md,
        backgroundColor: colors.kxPrimary[50],
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md,
      }}>
        <Ionicons name={icon} size={18} color={colors.kxPrimary[600]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
          {label}
        </Text>
        {hint && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
            {hint}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.ledgerGray[400]} />
    </Pressable>
  );

  const Section = ({ children }: { children: React.ReactNode }) => (
    <View style={{
      backgroundColor: colors.kxCardBg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.kxCardBorder,
      marginBottom: spacing.lg,
      overflow: 'hidden',
    }}>
      {children}
    </View>
  );

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'User';
  const initial = (user?.firstName?.[0] ?? user?.username?.[0] ?? '?').toUpperCase();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing['2xl'] }}>
        {/* Avatar + name centered */}
        <View style={{ alignItems: 'center', marginBottom: spacing['2xl'] }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: colors.kxPrimary[100],
            justifyContent: 'center', alignItems: 'center',
            marginBottom: spacing.md,
          }}>
            <Text style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.kxPrimary[600] }}>
              {initial}
            </Text>
          </View>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }} numberOfLines={1}>
            {fullName}
          </Text>
          {user?.email && (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: 2 }} numberOfLines={1}>
              {user.email}
            </Text>
          )}
        </View>

        {/* Library */}
        <Section>
          <Row icon="people-outline" label="My Clients" hint="View and manage clients" onPress={() => router.push('/clients' as any)} />
          <Row icon="folder-open-outline" label="All Documents" hint="Uploads, drafts, summaries" onPress={() => router.push('/documents' as any)} last />
        </Section>

        {/* Settings */}
        <Section>
          <Row icon="person-circle-outline" label="Account Settings" hint="Profile details, password" onPress={() => router.push('/profile/account-settings' as any)} />
          <Row icon="card-outline" label="Billing" hint="Plan & usage" onPress={() => router.push('/profile/billing' as any)} />
          <Row icon="wallet-outline" label="Wallet" hint="Balance & top-ups" onPress={() => router.push('/profile/wallet' as any)} />
          <Row icon="options-outline" label="App Settings" hint="Appearance, notifications" onPress={() => router.push('/profile/app-settings' as any)} last />
        </Section>

        {/* About */}
        <Section>
          <Row icon="information-circle-outline" label="About Knowlex" onPress={() => router.push('/profile/about' as any)} last />
        </Section>

        <Button title="Sign Out" onPress={logout} variant="outline" />
      </ScrollView>
    </SafeAreaView>
  );
}
