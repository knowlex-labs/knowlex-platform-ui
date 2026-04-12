import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api';
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';

const TYPE_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Uploaded', value: 'USER_UPLOADED' },
  { label: 'Drafts', value: 'DRAFT' },
  { label: 'Summaries', value: 'SUMMARY' },
  { label: 'Judgments', value: 'JUDGMENT' },
] as const;

function getTypeColor(type: string): string {
  switch (type) {
    case 'USER_UPLOADED': return '#2563eb';
    case 'DRAFT': return '#7A2E2E';
    case 'SUMMARY': return '#16a34a';
    case 'JUDGMENT': return '#d97706';
    case 'SYNOPSIS': return '#8b5cf6';
    default: return '#6b7280';
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'USER_UPLOADED': return 'Uploaded';
    case 'DRAFT': return 'Draft';
    case 'SUMMARY': return 'Summary';
    case 'JUDGMENT': return 'Judgment';
    case 'SYNOPSIS': return 'Synopsis';
    default: return type;
  }
}

export default function DocumentsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchDocs = useCallback(async (pageNum: number, refresh = false) => {
    setError(null);
    try {
      const res = await listAllDocuments({
        page: pageNum,
        size: 20,
        type: typeFilter as any,
        search: search.trim() || undefined,
        sort: 'createdAt,desc',
      });
      if (refresh || pageNum === 0) {
        setDocuments(res.documents);
      } else {
        setDocuments((prev) => [...prev, ...res.documents]);
      }
      setTotal(res.total);
      setHasMore(res.documents.length >= 20);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    fetchDocs(0, true);
  }, [typeFilter, fetchDocs]);

  const handleSearch = () => {
    setLoading(true);
    setPage(0);
    fetchDocs(0, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    fetchDocs(next);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
            Documents
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary }}>
            {total} total
          </Text>
        </View>
        <TextInput
          placeholder="Search documents..."
          placeholderTextColor={colors.ledgerGray[400]}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          style={{
            backgroundColor: colors.kxCardBg,
            borderWidth: 1,
            borderColor: colors.kxCardBorder,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: 12,
            fontSize: typography.fontSize.base,
            color: colors.kxTextPrimary,
          }}
        />
      </View>

      {/* Type Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xs }}
      >
        {TYPE_FILTERS.map((f, i) => {
          const isActive = typeFilter === f.value;
          return (
            <Pressable
              key={f.label}
              onPress={() => setTypeFilter(f.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 4,
                borderRadius: radius.xl,
                backgroundColor: isActive ? colors.kxPrimary[600] : colors.kxCardBg,
                borderWidth: 1,
                borderColor: isActive ? colors.kxPrimary[600] : colors.kxCardBorder,
                marginRight: i < TYPE_FILTERS.length - 1 ? 8 : 0,
              }}
            >
              <Text numberOfLines={1} style={{
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

      {/* Document List */}
      {error ? (
        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: spacing.md }}>⚠️</Text>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>Failed to load documents</Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, textAlign: 'center', marginTop: spacing.xs }}>{error}</Text>
          <Pressable onPress={() => { setLoading(true); fetchDocs(0, true); }} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.kxPrimary[600], borderRadius: radius.md }}>
            <Text style={{ color: colors.onPrimary, fontWeight: typography.fontWeight.semibold }}>Retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonLoader key={i} height={72} borderRadius={radius.lg} />)}
        </View>
      ) : documents.length === 0 ? (
        <EmptyState title="No documents found" message={search ? 'Try a different search term' : 'Upload documents to get started'} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setPage(0); fetchDocs(0, true); }} tintColor={colors.kxPrimary[600]} />}
        >
          {documents.map((doc) => (
            <Pressable key={doc.id} onPress={() => router.push({
              pathname: '/viewer',
              params: { docId: doc.id, name: doc.name ?? doc.originalFilename ?? 'Document', downloadUrl: doc.downloadUrl ?? '', signedUrl: doc.signedUrl ?? '', fileType: doc.fileType ?? '' },
            } as any)}>
            <Card style={{ paddingVertical: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                    {doc.name ?? doc.originalFilename ?? 'Unnamed'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: spacing.sm }}>
                    <View style={{ backgroundColor: getTypeColor(doc.type) + '18', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: typography.fontWeight.medium, color: getTypeColor(doc.type) }}>
                        {getTypeLabel(doc.type)}
                      </Text>
                    </View>
                    {doc.caseTitle && (
                      <Text style={{ fontSize: 11, color: colors.kxTextSecondary }} numberOfLines={1}>
                        {doc.caseTitle}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={{ fontSize: 10, color: colors.ledgerGray[400] }}>
                  {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </Card>
            </Pressable>
          ))}

          {hasMore && (
            <Pressable onPress={handleLoadMore} style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
              <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>Load more</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
