import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import type { CaseDocument } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { CreateDraftSheet } from './CreateDraftSheet';

interface CaseStudioViewProps {
  caseId: string;
}

interface GenerateCard {
  key: 'summary' | 'synopsis' | 'draft' | 'translate';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
}

function normalizeStatus(jobStatus?: string | null): 'pending' | 'completed' | 'failed' {
  const s = (jobStatus ?? '').toUpperCase();
  if (s === 'COMPLETED') return 'completed';
  if (s === 'FAILED') return 'failed';
  return 'pending';
}

export function CaseStudioView({ caseId }: CaseStudioViewProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const [summaries, setSummaries] = useState<CaseDocument[]>([]);
  const [synopses, setSynopses] = useState<CaseDocument[]>([]);
  const [drafts, setDrafts] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState<{ summary: boolean; synopsis: boolean }>({ summary: false, synopsis: false });
  const [createDraftVisible, setCreateDraftVisible] = useState(false);
  const streamsRef = useRef<Map<string, AbortController>>(new Map());

  const fetchAll = useCallback(async () => {
    try {
      const [s, sy, d] = await Promise.all([
        workspaceApi.getCaseDocuments(caseId, 'SUMMARY'),
        workspaceApi.getCaseDocuments(caseId, 'SYNOPSIS'),
        workspaceApi.getCaseDocuments(caseId, 'DRAFT'),
      ]);
      setSummaries(s ?? []);
      setSynopses(sy ?? []);
      setDrafts(d ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchAll();
    return () => {
      for (const ctrl of streamsRef.current.values()) ctrl.abort();
      streamsRef.current.clear();
    };
  }, [fetchAll]);

  const startStream = (docId: string) => {
    if (streamsRef.current.has(docId)) return;
    const ctrl = workspaceApi.pollDocumentStatus(docId, {
      onStatus: async (doc) => {
        if (normalizeStatus(doc.jobStatus) !== 'pending') {
          streamsRef.current.get(docId)?.abort();
          streamsRef.current.delete(docId);
          await fetchAll();
        }
      },
      onError: () => { streamsRef.current.delete(docId); },
      onEnd: () => { streamsRef.current.delete(docId); },
    });
    streamsRef.current.set(docId, ctrl);
  };

  const handleGenerate = async (kind: 'summary' | 'synopsis') => {
    setGenerating((g) => ({ ...g, [kind]: true }));
    try {
      const res = await workspaceApi.createDocument(caseId, { document_type: kind });
      await fetchAll();
      if (res.id) startStream(res.id);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : `Failed to generate ${kind}`);
    } finally {
      setGenerating((g) => ({ ...g, [kind]: false }));
    }
  };

  const hasSummary = summaries.length > 0;
  const hasSynopsis = synopses.length > 0;

  const cards: GenerateCard[] = [
    { key: 'summary',  label: 'Summary',     icon: 'document-text',     bg: '#dcfce7', fg: '#15803d' },
    { key: 'synopsis', label: 'Synopsis',    icon: 'book',              bg: '#dbeafe', fg: '#1d4ed8' },
    { key: 'draft',    label: 'Draft',       icon: 'create-outline',    bg: '#ede9fe', fg: '#6d28d9' },
    { key: 'translate', label: 'Translate',  icon: 'globe-outline',     bg: '#ffedd5', fg: '#c2410c' },
  ];

  const handleCardPress = (key: GenerateCard['key']) => {
    if (key === 'summary') {
      if (hasSummary || generating.summary) return;
      handleGenerate('summary');
    } else if (key === 'synopsis') {
      if (hasSynopsis || generating.synopsis) return;
      handleGenerate('synopsis');
    } else if (key === 'draft') {
      setCreateDraftVisible(true);
    } else if (key === 'translate') {
      Alert.alert('Translate', 'Open a document and use the share/tools menu to translate.');
    }
  };

  const cardSubtitle = (key: GenerateCard['key']): string => {
    if (key === 'summary')  return generating.summary  ? 'Generating…' : hasSummary  ? 'Generated' : 'Tap to generate';
    if (key === 'synopsis') return generating.synopsis ? 'Generating…' : hasSynopsis ? 'Generated' : 'Tap to generate';
    if (key === 'draft')    return 'Pick a template';
    return 'Document translation';
  };

  const openDoc = (doc: CaseDocument) => {
    router.push({
      pathname: '/viewer',
      params: {
        docId: doc.id,
        name: doc.name ?? `${doc.type ?? 'Document'}`,
        ...(doc.downloadUrl ? { downloadUrl: doc.downloadUrl } : {}),
        ...(doc.signedUrl ? { signedUrl: doc.signedUrl } : {}),
        ...(doc.fileType ? { fileType: doc.fileType } : {}),
      },
    } as any);
  };

  const recent: { doc: CaseDocument; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    ...summaries.map((d) => ({ doc: d, label: 'Summary', icon: 'document-text' as const })),
    ...synopses.map((d) => ({ doc: d, label: 'Synopsis', icon: 'book' as const })),
    ...drafts.map((d) => ({ doc: d, label: 'Draft', icon: 'create-outline' as const })),
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['2xl'] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.kxPrimary[600]} />}
      >
        <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginBottom: spacing.md }}>
          Generate new
        </Text>

        <View style={{ gap: spacing.sm }}>
          {cards.map((card) => {
            const isBusy = (card.key === 'summary' && generating.summary) || (card.key === 'synopsis' && generating.synopsis);
            const isDone = (card.key === 'summary' && hasSummary) || (card.key === 'synopsis' && hasSynopsis);
            return (
              <Pressable
                key={card.key}
                onPress={() => handleCardPress(card.key)}
                accessibilityRole="button"
                accessibilityLabel={card.label}
                disabled={isBusy}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: spacing.lg, paddingVertical: 14,
                  borderRadius: radius.full,
                  backgroundColor: card.bg,
                  opacity: pressed ? 0.85 : isBusy ? 0.7 : 1,
                  gap: spacing.md,
                })}
              >
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={card.icon} size={20} color={card.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: card.fg }}>
                    {card.label}
                  </Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: card.fg, opacity: 0.75, marginTop: 1 }}>
                    {cardSubtitle(card.key)}
                  </Text>
                </View>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: card.fg + '20',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isBusy
                    ? <ActivityIndicator size="small" color={card.fg} />
                    : isDone
                      ? <Ionicons name="checkmark" size={14} color={card.fg} />
                      : <Ionicons name="chevron-forward" size={14} color={card.fg} />
                  }
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Recent */}
        <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing['2xl'], marginBottom: spacing.sm }}>
          Recent
        </Text>

        {loading ? (
          <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.kxPrimary[600]} />
          </View>
        ) : recent.length === 0 ? (
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, paddingVertical: spacing.md }}>
            Nothing generated yet.
          </Text>
        ) : (
          <View style={{ backgroundColor: colors.kxCardBg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.kxCardBorder, overflow: 'hidden' }}>
            {recent.map((item, i) => {
              const status = normalizeStatus(item.doc.jobStatus);
              return (
                <Pressable
                  key={item.doc.id}
                  onPress={() => status === 'completed' && openDoc(item.doc)}
                  disabled={status !== 'completed'}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
                    backgroundColor: pressed ? colors.ledgerGray[50] : 'transparent',
                    borderBottomWidth: i === recent.length - 1 ? 0 : 1,
                    borderBottomColor: colors.kxCardBorder,
                  })}
                >
                  <Ionicons name={item.icon} size={18} color={colors.kxPrimary[400]} style={{ marginRight: spacing.md }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, fontWeight: typography.fontWeight.medium }} numberOfLines={1}>
                      {item.doc.name ?? item.label}
                    </Text>
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }}>
                      {item.label}
                    </Text>
                  </View>
                  {status === 'pending' && <ActivityIndicator size="small" color={colors.kxAccent[500]} />}
                  {status === 'completed' && <Ionicons name="chevron-forward" size={16} color={colors.ledgerGray[400]} />}
                  {status === 'failed' && <Ionicons name="alert-circle" size={16} color={colors.error} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CreateDraftSheet
        visible={createDraftVisible}
        onClose={() => setCreateDraftVisible(false)}
        caseId={caseId}
        onCreated={() => { setCreateDraftVisible(false); fetchAll(); }}
      />
    </View>
  );
}
