import { View, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing['3xl'], paddingVertical: spacing['4xl'] }}>
      <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, fontFamily: typography.fontFamily.sans, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, fontFamily: typography.fontFamily.sans, textAlign: 'center', marginTop: spacing.sm }}>
        {message}
      </Text>
      {action && <View style={{ marginTop: spacing.xl }}>{action}</View>}
    </View>
  );
}
