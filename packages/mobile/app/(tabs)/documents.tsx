import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api';
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api';
import { useTheme } from '@/theme/useTheme';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChipBar } from '@/components/ui/FilterChipBar';
import { DocumentPickerSheet } from '@/components/toolbox/DocumentPickerSheet';
import { ToolboxSheet } from '@/components/toolbox/ToolboxSheet';
import { MergeSheet } from '@/components/toolbox/MergeSheet';
import * as Haptics from 'expo-haptics';

const TYPE_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Uploaded', value: 'USER_UPLOADED' },
  { label: 'Drafts', value: 'DRAFT' },
  { label: 'Summaries', value: 'SUMMARY' },
  { label: 'Judgments', value: 'JUDGMENT' },
] as const;

type ToolKey = 'split' | 'merge' | 'compress' | 'convert' | 'translate';

const TOOLS: { key: ToolKey; label: string; ionicon: string }[] = [
  { key: 'translate', label: 'Translate', ionicon: 'globe-outline' },
  { key: 'split', label: 'Split', ionicon: 'cut-outline' },
  { key: 'merge', label: 'Merge', ionicon: 'layers-outline' },
  { key: 'convert', label: 'Convert', ionicon: 'swap-horizontal-outline' },
  { key: 'compress', label: 'Compress', ionicon: 'resize-outline' },
];

function getTypeColorKey(type: string): 'uploaded' | 'draft' | 'summary' | 'judgment' | 'synopsis' | 'other' {
  switch (type) {
    case 'USER_UPLOADED': return 'uploaded';
    case 'DRAFT': return 'draft';
    case 'SUMMARY': return 'summary';
    case 'JUDGMENT': return 'judgment';
    case 'SYNOPSIS': return 'synopsis';
    default: return 'other';
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

  // Tool flow state
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [toolboxDocId, setToolboxDocId] = useState('');
  const [toolboxDocName, setToolboxDocName] = useState('');
  const [toolboxVisible, setToolboxVisible] = useState(false);
  const [mergeVisible, setMergeVisible] = useState(false);
  const [mergeDocIds, setMergeDocIds] = useState<string[]>([]);
  const [mergeDocNames, setMergeDocNames] = useState<string[]>([]);

  // Tools visibility
  const [toolsVisible, setToolsVisible] = useState(true);

  // Selection mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const handleSearch = () => { setLoading(true); setPage(0); fetchDocs(0, true); };
  const handleLoadMore = () => { if (!hasMore || loading) return; const n = page + 1; setPage(n); fetchDocs(n); };

  const handleToolTap = (tool: ToolKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTool(tool);
    setPickerVisible(true);
  };

  const handleDocSelected = (doc: DocumentRecord) => {
    setToolboxDocId(doc.id);
    setToolboxDocName(doc.name ?? doc.originalFilename ?? 'Document');
    setPickerVisible(false);
    setTimeout(() => setToolboxVisible(true), 200);
  };

  const handleDocsSelectedForMerge = (docs: DocumentRecord[]) => {
    setMergeDocIds(docs.map((d) => d.id));
    setMergeDocNames(docs.map((d) => d.name ?? d.originalFilename ?? 'Document'));
    setPickerVisible(false);
    setTimeout(() => setMergeVisible(true), 200);
  };

  const enterSelectMode = (docId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectMode(true);
    setSelectedIds(new Set([docId]));
  };

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const applyToolToSelected = (tool: ToolKey) => {
    if (selectedIds.size === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (tool === 'merge') {
      const docs = documents.filter((d) => selectedIds.has(d.id));
      setMergeDocIds(docs.map((d) => d.id));
      setMergeDocNames(docs.map((d) => d.name ?? d.originalFilename ?? 'Document'));
      exitSelectMode();
      setTimeout(() => setMergeVisible(true), 200);
      return;
    }

    const firstId = Array.from(selectedIds)[0];
    const doc = documents.find((d) => d.id === firstId);
    if (!doc) return;
    setToolboxDocId(doc.id);
    setToolboxDocName(doc.name ?? doc.originalFilename ?? 'Document');
    setActiveTool(tool);
    exitSelectMode();
    setTimeout(() => setToolboxVisible(true), 200);
  };

  const handleDocPress = (doc: DocumentRecord) => {
    if (selectMode) {
      toggleSelect(doc.id);
    } else {
      router.push({
        pathname: '/viewer',
        params: { docId: doc.id, name: doc.name ?? doc.originalFilename ?? 'Document', downloadUrl: doc.downloadUrl ?? '', signedUrl: doc.signedUrl ?? '', fileType: doc.fileType ?? '' },
      } as any);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs }}>
        {selectMode ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable onPress={exitSelectMode}>
              <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>Cancel</Text>
            </Pressable>
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
              {selectedIds.size} selected
            </Text>
            <Pressable onPress={() => setSelectedIds(new Set(documents.map((d) => d.id)))}>
              <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.xs }}>Select All</Text>
            </Pressable>
          </View>
        ) : (
          <>
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
          </>
        )}
      </View>

      {/* Filters */}
      {!selectMode && (
        <View style={{ marginTop: spacing.xs }}>
          <FilterChipBar filters={TYPE_FILTERS} activeValue={typeFilter} onChange={setTypeFilter} />
        </View>
      )}

      {/* Tools Row — below filters, collapsible */}
      {(toolsVisible || selectMode) && (
        <View style={{
          backgroundColor: colors.kxCardBg,
          borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder,
          paddingVertical: 4, paddingHorizontal: spacing.md,
        }}>
          {selectMode && selectedIds.size > 0 && (
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginBottom: spacing.xs, marginLeft: 4 }}>
              {selectedIds.size} selected — choose a tool:
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center', flexGrow: 1 }}>
              {!selectMode && <Ionicons name="build-outline" size={13} color={colors.kxTextSecondary} style={{ marginRight: 2 }} />}
              {TOOLS.map((tool) => (
                <Pressable
                  key={tool.key}
                  onPress={() => selectMode ? applyToolToSelected(tool.key) : handleToolTap(tool.key)}
                  accessibilityRole="button"
                  accessibilityLabel={tool.label}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: 10, paddingVertical: 5,
                    borderRadius: 12,
                    backgroundColor: pressed ? colors.toolAccent[tool.key] + '20' : colors.kxSurface,
                    borderWidth: 1, borderColor: colors.toolAccent[tool.key] + '40',
                  })}
                >
                  <Ionicons name={tool.ionicon as any} size={13} color={colors.toolAccent[tool.key]} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.toolAccent[tool.key] }}>{tool.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {!selectMode && (
              <Pressable onPress={() => setToolsVisible(false)} hitSlop={8} style={{ paddingLeft: spacing.sm }}>
                <Ionicons name="close-circle-outline" size={18} color={colors.kxTextSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Show tools pill when hidden */}
      {!toolsVisible && !selectMode && (
        <Pressable
          onPress={() => setToolsVisible(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
            marginLeft: spacing.lg, marginVertical: spacing.xs,
            paddingHorizontal: spacing.md, paddingVertical: 4,
            backgroundColor: colors.kxCardBg, borderRadius: radius.full,
            borderWidth: 1, borderColor: colors.kxCardBorder, gap: 4,
          }}
        >
          <Ionicons name="build-outline" size={12} color={colors.kxTextSecondary} />
          <Text style={{ fontSize: 11, color: colors.kxTextSecondary, fontWeight: '500' }}>Tools</Text>
        </Pressable>
      )}

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
              const isSelected = selectedIds.has(doc.id);
              const typeKey = getTypeColorKey(doc.type);
              return (
                <Pressable
                  key={doc.id}
                  onPress={() => handleDocPress(doc)}
                  onLongPress={() => { if (!selectMode) enterSelectMode(doc.id); }}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
                    borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? colors.kxPrimary[500] : colors.kxCardBorder,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {selectMode && (
                      <View style={{
                        width: 20, height: 20, borderRadius: 4, marginRight: spacing.md,
                        borderWidth: 1.5, borderColor: isSelected ? colors.kxPrimary[600] : colors.ledgerGray[300],
                        backgroundColor: isSelected ? colors.kxPrimary[600] : 'transparent',
                        justifyContent: 'center', alignItems: 'center',
                      }}>
                        {isSelected && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
                      </View>
                    )}
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
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[400] }}>
                      {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
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

      {/* Sheets */}
      <DocumentPickerSheet
        visible={pickerVisible}
        onClose={() => { setPickerVisible(false); setActiveTool(null); }}
        title={activeTool === 'merge' ? 'Select documents to merge' : `Select document to ${activeTool ?? 'process'}`}
        multiSelect={activeTool === 'merge'}
        onSelect={handleDocSelected}
        onSelectMultiple={handleDocsSelectedForMerge}
      />
      <ToolboxSheet
        visible={toolboxVisible}
        onClose={() => { setToolboxVisible(false); exitSelectMode(); }}
        documentId={toolboxDocId}
        documentName={toolboxDocName}
        autoOpenTool={activeTool !== 'merge' ? activeTool ?? undefined : undefined}
      />
      <MergeSheet
        visible={mergeVisible}
        onClose={() => { setMergeVisible(false); setMergeDocIds([]); setMergeDocNames([]); }}
        documentIds={mergeDocIds}
        documentNames={mergeDocNames}
      />
    </SafeAreaView>
  );
}
