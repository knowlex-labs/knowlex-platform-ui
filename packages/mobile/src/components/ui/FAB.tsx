import { Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/useTheme';

interface FABProps {
  icon?: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function FAB({ icon = '+', onPress, accessibilityLabel = 'Add' }: FABProps) {
  const { colors, radius, typography } = useTheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: radius.full,
        backgroundColor: colors.kxPrimary[600],
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.ledgerBlack,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
    >
      <Text style={{ color: colors.onPrimary, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.normal, marginTop: -2 }}>{icon}</Text>
    </Pressable>
  );
}
