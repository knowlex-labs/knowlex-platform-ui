import { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { caseApi } from '@knowlex/core/api/case-api';
import { mapBackendCase } from '@knowlex/core/mappers';
import type { Case } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';

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
      const res = await caseApi.getAll({ page: 0, size: 50, status: activeFilter as any });
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

  const navigateToCase = (id: string) => {
    router.push(`/cases/${id}` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, marginBottom: spacing.sm }}>
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
            borderWidth: 1,
            borderColor: colors.kxCardBorder,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: 10,
            fontSize: typography.fontSize.sm,
            color: colors.kxTextPrimary,
          }}
        />
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xs }}
      >
        {STATUS_FILTERS.map((f, i) => {
          const isActive = activeFilter === f.value;
          return (
            <Pressable
              key={f.label}
              onPress={() => setActiveFilter(f.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 4,
                borderRadius: radius.xl,
                backgroundColor: isActive ? colors.kxPrimary[600] : colors.kxCardBg,
                borderWidth: 1,
                borderColor: isActive ? colors.kxPrimary[600] : colors.kxCardBorder,
                marginRight: i < STATUS_FILTERS.length - 1 ? 8 : 0,
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.xs,
                fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
                color: isActive ? colors.onPrimary : colors.kxTextSecondary,
              }}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Case List */}
      {loading ? (
        <View style={{ padding: spacing.xl, gap: spacing.sm }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLoader key={i} height={68} borderRadius={radius.lg} />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState title="No cases found" message={search ? 'Try a different search term' : 'Create your first case to get started'} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCases(); }} tintColor={colors.kxPrimary[600]} />}
        >
          {filtered.map((item) => (
            <Pressable key={item.id} onPress={() => navigateToCase(item.id)} accessibilityRole="button" accessibilityLabel={item.caseTitle ?? 'Case'}>
              <Card style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={1}>
                      {item.caseTitle || 'Untitled Case'}
                    </Text>
                    {item.caseNumber && (
                      <Text style={{ fontSize: 11, color: colors.kxTextSecondary, marginTop: 1 }}>{item.caseNumber}</Text>
                    )}
                  </View>
                  <Badge label={item.status ?? 'unknown'} status={item.status as any} />
                </View>
                {(item.courtName || item.nextHearingDate) && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
                    {item.courtName && <Text style={{ fontSize: 11, color: colors.kxTextSecondary }} numberOfLines={1}>{item.courtName}</Text>}
                    {item.nextHearingDate && (
                      <Text style={{ fontSize: 11, color: colors.kxAccent[600] }}>
                        {new Date(item.nextHearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    )}
                  </View>
                )}
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
