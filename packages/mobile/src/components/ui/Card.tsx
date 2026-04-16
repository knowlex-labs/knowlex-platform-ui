import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const { colors, radius, spacing, isDark } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.kxCardBg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.kxCardBorder,
          padding: spacing.lg,
          shadowColor: isDark ? 'transparent' : colors.ledgerBlack,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0 : 0.06,
          shadowRadius: 3,
          elevation: isDark ? 0 : 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
