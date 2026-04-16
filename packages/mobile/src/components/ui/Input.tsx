import { useState } from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors, typography, radius, spacing } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.kxPrimary[500]
      : colors.kxCardBorder;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label && (
        <Text
          style={{
            color: colors.kxTextPrimary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            marginBottom: spacing.xs,
          }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.ledgerGray[400]}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        accessibilityLabel={label}
        style={[
          {
            backgroundColor: colors.kxCardBg,
            borderWidth: 1.5,
            borderColor,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: 14,
            fontSize: typography.fontSize.base,
            color: colors.kxTextPrimary,
          },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text style={{ color: colors.error, fontSize: typography.fontSize.xs, marginTop: spacing.xs }}>
          {error}
        </Text>
      )}
    </View>
  );
}
