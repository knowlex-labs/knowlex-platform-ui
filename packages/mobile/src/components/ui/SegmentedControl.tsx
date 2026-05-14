import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/useTheme';

interface Segment {
  key: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function SegmentedControl({ segments, activeKey, onChange }: SegmentedControlProps) {
  const { colors, typography, spacing, radius, isDark } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: isDark ? colors.ledgerGray[100] : colors.ledgerGray[200],
        borderRadius: radius.full,
        padding: 4,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
      }}
    >
      {segments.map((seg) => {
        const isActive = seg.key === activeKey;
        return (
          <Pressable
            key={seg.key}
            onPress={() => {
              if (!isActive) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(seg.key);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={seg.label}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: radius.full,
              backgroundColor: isActive ? colors.kxPrimary[600] : 'transparent',
              alignItems: 'center',
              shadowColor: isActive && !isDark ? colors.kxPrimary[600] : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isActive && !isDark ? 0.18 : 0,
              shadowRadius: 4,
              elevation: isActive && !isDark ? 3 : 0,
            }}
          >
            <Text
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: isActive ? colors.onPrimary : colors.kxTextSecondary,
              }}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
