import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api';
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DraftsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const [drafts, setDrafts] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await listAllDocuments({ page: 0, size: 50, type: 'DRAFT' as any, sort: 'createdAt,desc' });
      setDrafts(res.documents);
    } catch {
      // Will show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const getStatusBadge = (status: string | null): 'active' | 'pending' | 'blocked' => {
    const s = (status ?? '').toUpperCase();
    if (s === 'COMPLETED') return 'active';
    if (s === 'FAILED') return 'blocked';
    return 'pending';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, marginBottom: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
          Drafts
        </Text>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
          AI-generated legal documents
        </Text>
      </View>

      {loading ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          {[1, 2, 3, 4].map((i) => <SkeletonLoader key={i} height={72} borderRadius={radius.lg} />)}
        </View>
      ) : drafts.length === 0 ? (
        <EmptyState
          title="No drafts yet"
          message="Generate drafts from within a case workspace using the Tools tab"
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDrafts(); }} tintColor={colors.kxPrimary[600]} />}
        >
          {drafts.map((draft) => (
            <Card key={draft.id} style={{ paddingVertical: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: spacing.md }}>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={1}>
                    {draft.name ?? 'Untitled Draft'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: spacing.sm }}>
                    {draft.caseTitle && (
                      <Text style={{ fontSize: 11, color: colors.kxTextSecondary }} numberOfLines={1}>{draft.caseTitle}</Text>
                    )}
                    <Text style={{ fontSize: 10, color: colors.ledgerGray[400] }}>
                      {new Date(draft.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>
                {draft.jobStatus && (
                  <Badge
                    label={draft.jobStatus === 'COMPLETED' ? 'Done' : draft.jobStatus === 'FAILED' ? 'Failed' : 'Pending'}
                    status={getStatusBadge(draft.jobStatus)}
                  />
                )}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
