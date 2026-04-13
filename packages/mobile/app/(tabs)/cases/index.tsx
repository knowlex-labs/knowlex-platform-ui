import { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { caseApi } from '@knowlex/core/api/case-api';
import { mapBackendCase } from '@knowlex/core/mappers';
import type { Case } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChipBar } from '@/components/ui/FilterChipBar';

const STATUS_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'On Hold', value: 'ON_HOLD' },
] as const;

export default function CaseListScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);

  const fetchCases = useCallback(async () => {
    try {
      const res = await caseApi.getAll({ page: 0, size: 50, status: activeFilter as string | undefined });
      const content = res?.data?.content ?? [];
      setCases(content.map(mapBackendCase));
    } catch (err) {
      console.log('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => { setLoading(true); fetchCases(); }, [fetchCases]);

  const filtered = search.trim()
    ? cases.filter((c) =>
        (c.caseTitle ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.caseNumber ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : cases;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header + Search */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs }}>
        <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
          Cases
        </Text>
        <TextInput
          placeholder="Search cases..."
          placeholderTextColor={colors.ledgerGray[400]}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search cases"
          style={{
            backgroundColor: colors.kxCardBg,
            borderWidth: 1, borderColor: colors.kxCardBorder,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md, paddingVertical: 8,
            fontSize: typography.fontSize.sm, color: colors.kxTextPrimary,
            marginTop: spacing.sm,
          }}
        />
      </View>

      {/* Filters */}
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
        <FilterChipBar filters={STATUS_FILTERS} activeValue={activeFilter} onChange={setActiveFilter} />
      </View>

      {/* List */}
      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLoader key={i} height={64} borderRadius={radius.lg} />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState title="No cases found" message={search ? 'Try a different search term' : 'Create your first case to get started'} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCases(); }} tintColor={colors.kxPrimary[600]} />}
        >
          {filtered.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/cases/${item.id}` as any)}
              accessibilityRole="button"
              accessibilityLabel={item.caseTitle ?? 'Case'}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
                borderRadius: radius.lg, borderWidth: 1, borderColor: colors.kxCardBorder,
                paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={1}>
                    {item.caseTitle || 'Untitled Case'}
                  </Text>
                  {item.caseNumber && (
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }}>{item.caseNumber}</Text>
                  )}
                </View>
                <Badge label={item.status ?? 'unknown'} status={item.status as any} />
                <Ionicons name="chevron-forward" size={16} color={colors.ledgerGray[400]} style={{ marginLeft: spacing.sm }} />
              </View>
              {(item.courtName || item.nextHearingDate) && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
                  {item.courtName && <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }} numberOfLines={1}>{item.courtName}</Text>}
                  {item.nextHearingDate && (
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxAccent[600] }}>
                      {new Date(item.nextHearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
