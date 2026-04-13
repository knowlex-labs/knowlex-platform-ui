import { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { caseApi } from '@knowlex/core/api/case-api';
import { mapBackendCase } from '@knowlex/core/mappers';
import type { Case } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface CasePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (caseItem: Case) => void;
}

export function CasePickerSheet({ visible, onClose, onSelect }: CasePickerSheetProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await caseApi.getAll({ page: 0, size: 50 });
      const content = res?.data?.content ?? [];
      setCases(content.map(mapBackendCase));
    } catch {
      // Show empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) fetchCases();
  }, [visible, fetchCases]);

  const filtered = search.trim()
    ? cases.filter((c) =>
        (c.caseTitle ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.caseNumber ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : cases;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.kxSurface, paddingTop: 56 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: spacing.xl, marginBottom: spacing.lg,
        }}>
          <Pressable onPress={onClose}>
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.base }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
            Select Case
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
          <TextInput
            placeholder="Search cases..."
            placeholderTextColor={colors.ledgerGray[400]}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            style={{
              backgroundColor: colors.kxCardBg, borderWidth: 1, borderColor: colors.kxCardBorder,
              borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 10,
              fontSize: typography.fontSize.sm, color: colors.kxTextPrimary,
            }}
          />
        </View>

        {/* Case List */}
        {loading ? (
          <View style={{ padding: spacing.xl, gap: spacing.sm }}>
            {[1, 2, 3, 4, 5].map((i) => <SkeletonLoader key={i} height={56} borderRadius={radius.md} />)}
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing['3xl'] }}>
            <Ionicons name="briefcase-outline" size={48} color={colors.ledgerGray[300]} />
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginTop: spacing.lg }}>
              No cases found
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: spacing['3xl'] }}>
            {filtered.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => { onSelect(item); onClose(); }}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
                  backgroundColor: pressed ? colors.ledgerGray[50] : 'transparent',
                  borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder,
                })}
              >
                <Ionicons name="briefcase-outline" size={18} color={colors.kxPrimary[400]} style={{ marginRight: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                    {item.caseTitle || 'Untitled Case'}
                  </Text>
                  {item.caseNumber && (
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }}>{item.caseNumber}</Text>
                  )}
                </View>
                <Badge label={item.status ?? 'unknown'} status={item.status as any} size="sm" />
                <Ionicons name="chevron-forward" size={16} color={colors.ledgerGray[400]} style={{ marginLeft: spacing.sm }} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
