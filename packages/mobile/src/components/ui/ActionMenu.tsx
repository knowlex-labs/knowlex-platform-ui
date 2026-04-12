import { View, Text, Pressable, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/useTheme';

export interface ActionMenuItem {
  label: string;
  icon?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: ActionMenuItem[];
}

export function ActionMenu({ visible, onClose, title, items }: ActionMenuProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close menu"
      >
        <Pressable
          style={{
            backgroundColor: colors.kxCardBg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 32,
          }}
          onPress={() => {}}
        >
          {/* Handle bar */}
          <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ledgerGray[300] }} />
          </View>

          {title && (
            <Text
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.kxTextPrimary,
                paddingHorizontal: spacing.xl,
                paddingTop: spacing.lg,
                paddingBottom: spacing.sm,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}

          <View style={{ paddingTop: spacing.sm }}>
            {items.map((item, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                  item.onPress();
                }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: spacing.xl,
                  backgroundColor: pressed ? colors.ledgerGray[50] : 'transparent',
                })}
              >
                {item.icon && (
                  <Text style={{ fontSize: 18, marginRight: spacing.md }}>{item.icon}</Text>
                )}
                <Text
                  style={{
                    fontSize: typography.fontSize.base,
                    color: item.destructive ? colors.error : colors.kxTextPrimary,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
