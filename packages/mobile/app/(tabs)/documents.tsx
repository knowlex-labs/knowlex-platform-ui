import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api';
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api';
import { useTheme } from '@/theme/useTheme';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { FilterChipBar } from '@/components/ui/FilterChipBar';
import { getTypeColorKey, getTypeLabel } from '@/lib/document-types';

const TYPE_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Uploaded', value: 'USER_UPLOADED' },
  { label: 'Drafts', value: 'DRAFT' },
  { label: 'Summaries', value: 'SUMMARY' },
  { label: 'Translations', value: 'TRANSLATION' },
  { label: 'Judgments', value: 'JUDGMENT' },
] as const;

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
        page: pageNum, size: 20,
        type: typeFilter as string | undefined,
        search: search.trim() || undefined,
        sort: 'createdAt,desc',
      });
      if (refresh || pageNum === 0) setDocuments(res.documents);
      else setDocuments((prev) => [...prev, ...res.documents]);
      setTotal(res.total);
      setHasMore(res.documents.length >= 20);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter, search]);

  useEffect(() => { setLoading(true); setPage(0); fetchDocs(0, true); }, [typeFilter, fetchDocs]);

  useFocusEffect(
    useCallback(() => {
      setPage(0);
      fetchDocs(0, true);
    }, [fetchDocs])
  );

  const handleSearch = () => { setLoading(true); setPage(0); fetchDocs(0, true); };
  const handleLoadMore = () => { if (!hasMore || loading) return; const n = page + 1; setPage(n); fetchDocs(n); };

  const openDocument = (doc: DocumentRecord) => {
    const params: Record<string, string> = {
      docId: doc.id,
      name: doc.name ?? doc.originalFilename ?? 'Document',
    };
    if (doc.downloadUrl) params.downloadUrl = doc.downloadUrl;
    if (doc.signedUrl) params.signedUrl = doc.signedUrl;
    if (doc.fileType) params.fileType = doc.fileType;
    if (doc.type) params.type = doc.type;
    router.push({ pathname: '/viewer', params } as any);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 2 }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/profile' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.kxPrimary[600]} />
          <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm }}>Profile</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>Documents</Text>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>{total} total</Text>
        </View>
        <TextInput
          placeholder="Search documents..."
          placeholderTextColor={colors.ledgerGray[400]}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          style={{
            backgroundColor: colors.kxCardBg, borderWidth: 1, borderColor: colors.kxCardBorder,
            borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8,
            fontSize: typography.fontSize.sm, color: colors.kxTextPrimary,
            marginTop: spacing.sm,
          }}
        />
      </View>

      {/* Filters */}
      <View style={{ marginTop: spacing.xs }}>
        <FilterChipBar filters={TYPE_FILTERS} activeValue={typeFilter} onChange={setTypeFilter} />
      </View>

      {/* Document List */}
      <View style={{ flex: 1 }}>
        {error ? (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>Failed to load</Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: spacing.xs }}>{error}</Text>
            <Pressable onPress={() => { setLoading(true); fetchDocs(0, true); }} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.kxPrimary[600], borderRadius: radius.md }}>
              <Text style={{ color: colors.onPrimary, fontWeight: typography.fontWeight.semibold }}>Retry</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingTop: spacing.xs }}>
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonLoader key={i} height={52} borderRadius={radius.md} />)}
          </View>
        ) : documents.length === 0 ? (
          <EmptyState title="No documents found" message={search ? 'Try a different search term' : 'Upload documents to get started'} />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.sm }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setPage(0); fetchDocs(0, true); }} tintColor={colors.kxPrimary[600]} />}
          >
            {documents.map((doc) => {
              const typeKey = getTypeColorKey(doc.type);
              return (
                <Pressable
                  key={doc.id}
                  onPress={() => openDocument(doc)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
                    borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
                    borderWidth: 1, borderColor: colors.kxCardBorder,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                        {doc.name ?? doc.originalFilename ?? 'Unnamed'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: spacing.sm }}>
                        <View style={{ backgroundColor: colors.docType[typeKey] + '18', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                          <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, color: colors.docType[typeKey] }}>{getTypeLabel(doc.type)}</Text>
                        </View>
                        {doc.caseTitle && <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }} numberOfLines={1}>{doc.caseTitle}</Text>}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[400] }}>
                        {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                      {doc.type === 'DRAFT' && doc.jobStatus && (
                        <Badge
                          label={doc.jobStatus === 'COMPLETED' ? 'Done' : doc.jobStatus === 'FAILED' ? 'Failed' : 'Pending'}
                          status={doc.jobStatus === 'COMPLETED' ? 'active' : doc.jobStatus === 'FAILED' ? 'blocked' : 'pending' as any}
                        />
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {hasMore && (
              <Pressable onPress={handleLoadMore} style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>Load more</Text>
              </Pressable>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
