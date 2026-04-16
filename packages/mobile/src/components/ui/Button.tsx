import { Pressable, Text, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style, textStyle, accessibilityLabel }: ButtonProps) {
  const { colors, radius, typography } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const bgColor = isPrimary
    ? colors.kxPrimary[600]
    : isOutline || isGhost
      ? 'transparent'
      : colors.ledgerGray[100];

  const borderColor = isOutline ? colors.kxPrimary[600] : 'transparent';
  const textColor = isPrimary ? colors.onPrimary : isOutline ? colors.kxPrimary[600] : colors.kxTextPrimary;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        {
          backgroundColor: bgColor,
          borderRadius: radius.md,
          paddingVertical: 14,
          paddingHorizontal: 24,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          borderWidth: isOutline ? 1.5 : 0,
          borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          flexDirection: 'row' as const,
          gap: 8,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={textColor} />}
      <Text style={[{ color: textColor, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}
