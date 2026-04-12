import { View, Text, Pressable } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface SourceItemProps {
  name: string;
  indexingStatus?: string | null;
  fileType?: string | null;
  onPress?: () => void;
  onLongPress?: () => void;
}

function getFileIcon(fileType?: string | null): string {
  const ft = (fileType ?? '').toUpperCase();
  if (ft === 'PDF') return '📕';
  if (ft === 'DOCX' || ft === 'DOC') return '📘';
  if (ft === 'XLSX' || ft === 'XLS' || ft === 'CSV') return '📗';
  if (['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(ft)) return '🖼️';
  return '📄';
}

export function SourceItem({ name, indexingStatus, fileType, onPress, onLongPress }: SourceItemProps) {
  const { colors, typography, spacing } = useTheme();

  const statusMap: Record<string, { label: string; color: string }> = {
    INDEXING_COMPLETED: { label: 'Indexed', color: colors.success },
    INDEXED: { label: 'Indexed', color: colors.success },
    INDEXING_RUNNING: { label: 'Indexing...', color: colors.warning },
    INDEXING: { label: 'Indexing...', color: colors.warning },
    INDEXING_FAILED: { label: 'Failed', color: colors.error },
    INDEXING_PENDING: { label: 'Pending', color: colors.ledgerGray[400] },
  };

  const status = statusMap[indexingStatus ?? ''] ?? { label: 'Pending', color: colors.ledgerGray[400] };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Document ${name}, status ${status.label}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
        borderBottomWidth: 1,
        borderBottomColor: colors.kxCardBorder,
      })}
    >
      <Text style={{ fontSize: 24, marginRight: spacing.md }}>{getFileIcon(fileType)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
          {name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: status.color }} />
          <Text style={{ fontSize: 11, color: status.color }}>{status.label}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 18, color: colors.ledgerGray[400], paddingLeft: spacing.sm }}>⋯</Text>
    </Pressable>
  );
}
