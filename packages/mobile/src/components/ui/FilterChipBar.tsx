import { ScrollView, Pressable, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface FilterOption {
  readonly label: string;
  readonly value: string | undefined;
}

interface FilterChipBarProps {
  filters: readonly FilterOption[];
  activeValue: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function FilterChipBar({ filters, activeValue, onChange }: FilterChipBarProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingRight: spacing['2xl'],
        paddingTop: 4,
        paddingBottom: 4,
        alignItems: 'center',
      }}
    >
      {filters.map((f) => {
        const isActive = activeValue === f.value;
        return (
          <Pressable
            key={f.label}
            onPress={() => onChange(f.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Filter: ${f.label}`}
            style={{
              height: 28,
              paddingHorizontal: 14,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 14,
              backgroundColor: isActive ? colors.kxPrimary[600] : colors.kxCardBg,
              borderWidth: 1,
              borderColor: isActive ? colors.kxPrimary[600] : colors.kxCardBorder,
              marginRight: 8,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                lineHeight: 14,
                fontWeight: isActive ? '600' : '400',
                color: isActive ? colors.onPrimary : colors.kxTextSecondary,
              }}
            >
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
