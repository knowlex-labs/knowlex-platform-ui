import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';

interface LinkRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  url: string;
  last?: boolean;
}

export default function AboutScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const LinkRow = ({ icon, label, url, last }: LinkRowProps) => (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.kxCardBorder,
        backgroundColor: pressed ? colors.ledgerGray[50] : 'transparent',
      })}
    >
      <Ionicons name={icon} size={18} color={colors.kxTextSecondary} style={{ marginRight: spacing.md }} />
      <Text style={{ flex: 1, fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, fontWeight: typography.fontWeight.medium }}>
        {label}
      </Text>
      <Ionicons name="open-outline" size={16} color={colors.ledgerGray[400]} />
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 2, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs }}>
          <Ionicons name="chevron-back" size={20} color={colors.kxPrimary[600]} />
          <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm }}>Profile</Text>
        </Pressable>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, marginTop: 2 }}>
          About Knowlex
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Card style={{ alignItems: 'center', paddingVertical: spacing['2xl'], marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.kxPrimary[600], fontFamily: typography.fontFamily.serif }}>
            Knowlex
          </Text>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: spacing.xs }}>
            Version 0.1.0
          </Text>
          <Text style={{
            fontSize: typography.fontSize.sm, color: colors.kxTextSecondary,
            textAlign: 'center', marginTop: spacing.lg,
            lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
          }}>
            Legal tech platform for case management{'\n'}and AI-powered legal drafting.
          </Text>
        </Card>

        <Card>
          <LinkRow icon="globe-outline" label="Website" url="https://knowlex.ai" />
          <LinkRow icon="help-circle-outline" label="Support" url="mailto:support@knowlex.ai" />
          <LinkRow icon="document-text-outline" label="Terms of Service" url="https://knowlex.ai/terms" />
          <LinkRow icon="shield-checkmark-outline" label="Privacy Policy" url="https://knowlex.ai/privacy" last />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
