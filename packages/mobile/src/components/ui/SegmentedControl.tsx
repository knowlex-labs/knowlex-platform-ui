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
        borderRadius: radius.lg,
        padding: 3,
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
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: isActive ? colors.kxCardBg : 'transparent',
              alignItems: 'center',
              shadowColor: isActive && !isDark ? colors.ledgerBlack : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isActive && !isDark ? 0.08 : 0,
              shadowRadius: 2,
              elevation: isActive && !isDark ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
                color: isActive ? colors.kxPrimary[600] : colors.kxTextSecondary,
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
