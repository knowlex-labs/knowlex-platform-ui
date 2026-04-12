import { View, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface BadgeProps {
  label: string;
  status?: 'active' | 'pending' | 'closed' | 'on-hold' | 'appealed' | 'blocked';
  size?: 'sm' | 'md';
}

export function Badge({ label, status, size = 'sm' }: BadgeProps) {
  const { colors, typography, radius, spacing } = useTheme();

  const statusColors = status ? colors.status : null;
  const bgColor = statusColors ? statusColors[`${status}Bg` as keyof typeof statusColors] : colors.ledgerGray[100];
  const textColor = statusColors ? statusColors[status as keyof typeof statusColors] : colors.kxTextSecondary;

  const paddingV = size === 'sm' ? 2 : 4;
  const paddingH = size === 'sm' ? spacing.sm : spacing.md;
  const fontSize = size === 'sm' ? typography.fontSize.xs : typography.fontSize.sm;

  return (
    <View
      style={{
        backgroundColor: bgColor as string,
        borderRadius: radius.full,
        paddingVertical: paddingV,
        paddingHorizontal: paddingH,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: textColor as string,
          fontSize,
          fontWeight: typography.fontWeight.medium,
          fontFamily: typography.fontFamily.sans,
          textTransform: 'capitalize',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
