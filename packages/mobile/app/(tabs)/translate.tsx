import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api';
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api';
import { DocumentType } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { DocumentPickerSheet } from '@/components/toolbox/DocumentPickerSheet';
import { TranslateSheet } from '@/components/toolbox/TranslateSheet';
import { SplitSheet } from '@/components/toolbox/SplitSheet';
import { CompressSheet } from '@/components/toolbox/CompressSheet';
import { ConvertSheet } from '@/components/toolbox/ConvertSheet';
import { MergeSheet } from '@/components/toolbox/MergeSheet';
import { TRANSLATE_BG, TRANSLATE_BG_PRESSED, TRANSLATE_ICON_BG } from '@/lib/translate-colors';

type ToolKey = 'translate' | 'split' | 'merge' | 'compress' | 'convert';

const SECONDARY_TOOLS: { key: Exclude<ToolKey, 'translate'>; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { key: 'split',    label: 'Split',    icon: 'cut-outline',              description: 'Pick pages to extract' },
  { key: 'merge',    label: 'Merge',    icon: 'layers-outline',           description: 'Combine multiple docs' },
  { key: 'compress', label: 'Compress', icon: 'resize-outline',           description: 'Reduce file size' },
  { key: 'convert',  label: 'Convert',  icon: 'swap-horizontal-outline',  description: 'Change file format' },
];

export default function TranslateScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const { new: openNew } = useLocalSearchParams<{ new?: string }>();

  const [recent, setRecent] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickedDocId, setPickedDocId] = useState('');
  const [pickedDocName, setPickedDocName] = useState('');
  const [toolSheetVisible, setToolSheetVisible] = useState(false);

  // Merge multi-doc state
  const [mergeVisible, setMergeVisible] = useState(false);
  const [mergeDocIds, setMergeDocIds] = useState<string[]>([]);
  const [mergeDocNames, setMergeDocNames] = useState<string[]>([]);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await listAllDocuments({ page: 0, size: 10, type: DocumentType.TRANSLATION, sort: 'createdAt,desc' });
      setRecent(res.documents);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);
  useFocusEffect(useCallback(() => { fetchRecent(); }, [fetchRecent]));

  const handleToolTap = (tool: ToolKey) => {
    setActiveTool(tool);
    setPickerVisible(true);
  };

  // Home tile passes ?new=1 to jump straight into the document picker.
  useEffect(() => {
    if (openNew === '1') {
      handleToolTap('translate');
      router.setParams({ new: undefined } as any);
    }
  }, [openNew, router]);

  const handleDocSelected = (doc: DocumentRecord) => {
    setPickedDocId(doc.id);
    setPickedDocName(doc.name ?? doc.originalFilename ?? 'Document');
    setPickerVisible(false);
    setTimeout(() => setToolSheetVisible(true), 200);
  };

  const handleDocsSelectedForMerge = (docs: DocumentRecord[]) => {
    setMergeDocIds(docs.map((d) => d.id));
    setMergeDocNames(docs.map((d) => d.name ?? d.originalFilename ?? 'Document'));
    setPickerVisible(false);
    setTimeout(() => setMergeVisible(true), 200);
  };

  const closeToolSheet = () => {
    setToolSheetVisible(false);
    setActiveTool(null);
    fetchRecent();
  };

  const openTranslation = (doc: DocumentRecord) => {
    const params: Record<string, string> = {
      docId: doc.id,
      name: doc.name ?? 'Translation',
    };
    if (doc.downloadUrl) params.downloadUrl = doc.downloadUrl;
    if (doc.signedUrl) params.signedUrl = doc.signedUrl;
    if (doc.fileType) params.fileType = doc.fileType;
    if (doc.type) params.type = doc.type;
    router.push({ pathname: '/viewer', params } as any);
  };

  const docStatus = (status: string | null | undefined): 'active' | 'pending' | 'blocked' => {
    const s = (status ?? '').toUpperCase();
    if (s === 'COMPLETED') return 'active';
    if (s === 'FAILED' || s === 'CANCELLED') return 'blocked';
    return 'pending';
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, fontFamily: typography.fontFamily.serif }}>
          Translate
        </Text>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
          Document translation and other tools.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing['3xl'] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecent(); }} tintColor={colors.kxPrimary[600]} />}
      >
        {/* Hero CTA */}
        <Pressable
          onPress={() => handleToolTap('translate')}
          accessibilityRole="button"
          accessibilityLabel="Translate a document"
          style={({ pressed }) => ({
            backgroundColor: pressed ? TRANSLATE_BG_PRESSED : TRANSLATE_BG,
            borderRadius: radius.lg,
            padding: spacing.lg,
            flexDirection: 'row', alignItems: 'center', gap: spacing.md,
            marginBottom: spacing.lg,
          })}
        >
          <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: TRANSLATE_ICON_BG, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="globe-outline" size={22} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.onPrimary }}>
              Translate a Document
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.onPrimary, opacity: 0.85, marginTop: 2 }}>
              Pick a doc and translate to 12 Indian languages
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.onPrimary} />
        </Pressable>

        {/* More tools — collapsible */}
        <Pressable
          onPress={() => setMoreToolsOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={moreToolsOpen ? 'Hide more tools' : 'Show more tools'}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
            borderWidth: 1, borderColor: colors.kxCardBorder,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
            flexDirection: 'row', alignItems: 'center', gap: spacing.md,
            marginBottom: moreToolsOpen ? spacing.sm : spacing['2xl'],
          })}
        >
          <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.kxPrimary[50], alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="construct-outline" size={18} color={colors.kxPrimary[600]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
              More Tools
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }}>
              Split, merge, compress & convert documents
            </Text>
          </View>
          <Ionicons name={moreToolsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.ledgerGray[400]} />
        </Pressable>

        {moreToolsOpen && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing['2xl'] }}>
            {SECONDARY_TOOLS.map((tool) => (
              <Pressable
                key={tool.key}
                onPress={() => handleToolTap(tool.key)}
                accessibilityRole="button"
                accessibilityLabel={tool.label}
                style={({ pressed }) => ({
                  width: '48%',
                  backgroundColor: pressed ? colors.toolAccent[tool.key] + '20' : colors.kxCardBg,
                  borderWidth: 1, borderColor: colors.toolAccent[tool.key] + '40',
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  gap: spacing.xs,
                })}
              >
                <View style={{ width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.toolAccent[tool.key] + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={tool.icon} size={16} color={colors.toolAccent[tool.key]} />
                </View>
                <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
                  {tool.label}
                </Text>
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>
                  {tool.description}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Recent translations */}
        <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
          Recent Translations
        </Text>
        {loading ? (
          <View style={{ gap: spacing.sm }}>
            {[1, 2, 3].map((i) => <SkeletonLoader key={i} height={62} borderRadius={radius.md} />)}
          </View>
        ) : recent.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
            <Ionicons name="globe-outline" size={28} color={colors.ledgerGray[300]} />
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: spacing.sm }}>
              No translations yet
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 4, textAlign: 'center' }}>
              Tap "Translate a Document" to start.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {recent.map((doc) => {
              const status = docStatus(doc.jobStatus);
              return (
                <Pressable
                  key={doc.id}
                  onPress={() => status === 'active' && openTranslation(doc)}
                  disabled={status !== 'active'}
                  accessibilityRole="button"
                  accessibilityLabel={doc.name ?? 'Translation'}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
                    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.kxCardBorder,
                    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
                    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                  })}
                >
                  <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: TRANSLATE_ICON_BG + '25', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="globe-outline" size={18} color={TRANSLATE_BG} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                      {doc.name ?? 'Translation'}
                    </Text>
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
                      {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Badge
                    label={status === 'active' ? 'Done' : status === 'blocked' ? 'Failed' : 'Processing'}
                    status={status}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Document picker (single or multi for merge) */}
      {/* Don't clear activeTool here — the picker fires onSelect immediately
          followed by onClose, so resetting activeTool would race the deferred
          setToolSheetVisible(true) and hide the tool sheet. closeToolSheet
          handles the cleanup once the tool sheet itself closes. */}
      <DocumentPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title={activeTool === 'merge' ? 'Select documents to merge' : `Select document to ${activeTool ?? 'process'}`}
        multiSelect={activeTool === 'merge'}
        onSelect={handleDocSelected}
        onSelectMultiple={handleDocsSelectedForMerge}
      />

      {/* Direct tool sheets — no ToolboxSheet wrapper */}
      <TranslateSheet
        visible={toolSheetVisible && activeTool === 'translate'}
        onClose={closeToolSheet}
        onSubmitted={closeToolSheet}
        documentId={pickedDocId}
        documentName={pickedDocName}
      />
      <SplitSheet
        visible={toolSheetVisible && activeTool === 'split'}
        onClose={closeToolSheet}
        documentId={pickedDocId}
        documentName={pickedDocName}
      />
      <CompressSheet
        visible={toolSheetVisible && activeTool === 'compress'}
        onClose={closeToolSheet}
        documentId={pickedDocId}
        documentName={pickedDocName}
      />
      <ConvertSheet
        visible={toolSheetVisible && activeTool === 'convert'}
        onClose={closeToolSheet}
        documentId={pickedDocId}
        documentName={pickedDocName}
      />
      <MergeSheet
        visible={mergeVisible}
        onClose={() => { setMergeVisible(false); setMergeDocIds([]); setMergeDocNames([]); fetchRecent(); }}
        documentIds={mergeDocIds}
        documentNames={mergeDocNames}
      />
    </SafeAreaView>
  );
}
