import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import type { CaseDocument } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ToolsTabProps {
  caseId: string;
  overview: { documentCount: number; draftCount: number; judgmentCount: number; summaryCount: number } | null;
}

interface GeneratedDoc {
  id: string;
  name: string;
  type: string;
  subType?: string;
  status: 'pending' | 'completed' | 'failed';
  content?: string;
  createdAt?: string;
  downloadUrl?: string | null;
  signedUrl?: string | null;
}

export function ToolsTab({ caseId, overview }: ToolsTabProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingSynopsis, setGeneratingSynopsis] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [docContents, setDocContents] = useState<Record<string, string>>({});
  const [loadingContent, setLoadingContent] = useState<string | null>(null);
  const streamsRef = useRef<Map<string, AbortController>>(new Map());

  const fetchGenerated = useCallback(async () => {
    try {
      const [summaries, synopses] = await Promise.all([
        workspaceApi.getCaseDocuments(caseId, 'SUMMARY'),
        workspaceApi.getCaseDocuments(caseId, 'SYNOPSIS'),
      ]);

      const all: GeneratedDoc[] = [...(summaries ?? []), ...(synopses ?? [])].map((d: CaseDocument) => ({
        id: d.id,
        name: d.name ?? d.type ?? 'Document',
        type: d.type ?? '',
        subType: d.subType,
        status: normalizeStatus(d.jobStatus),
        createdAt: d.createdAt as string,
        downloadUrl: d.downloadUrl,
        signedUrl: d.signedUrl,
      }));

      setGeneratedDocs(all);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchGenerated();
    return () => {
      for (const ctrl of streamsRef.current.values()) ctrl.abort();
      streamsRef.current.clear();
    };
  }, [fetchGenerated]);

  function normalizeStatus(jobStatus?: string | null): 'pending' | 'completed' | 'failed' {
    const s = (jobStatus ?? '').toUpperCase();
    if (s === 'COMPLETED') return 'completed';
    if (s === 'FAILED') return 'failed';
    return 'pending';
  }

  const startStream = (docId: string) => {
    if (streamsRef.current.has(docId)) return;
    const ctrl = workspaceApi.streamDocumentStatus(docId, {
      onStatus: async (doc) => {
        if (normalizeStatus(doc.jobStatus) !== 'pending') {
          streamsRef.current.get(docId)?.abort();
          streamsRef.current.delete(docId);
          await fetchGenerated();
        }
      },
      onError: () => { streamsRef.current.delete(docId); },
      onEnd: () => { streamsRef.current.delete(docId); },
    });
    streamsRef.current.set(docId, ctrl);
  };

  const handleGenerate = async (docType: 'SUMMARY' | 'SYNOPSIS') => {
    const setter = docType === 'SUMMARY' ? setGeneratingSummary : setGeneratingSynopsis;
    setter(true);
    try {
      const res = await workspaceApi.createDocument(caseId, {
        document_type: docType.toLowerCase(),
      });
      await fetchGenerated();
      if (res.id) startStream(res.id);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : `Failed to generate ${docType.toLowerCase()}`);
    } finally {
      setter(false);
    }
  };

  const handleDelete = async (docId: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await workspaceApi.deleteDocuments([docId]);
            setGeneratedDocs((prev) => prev.filter((d) => d.id !== docId));
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  const handleExpand = async (doc: GeneratedDoc) => {
    if (doc.status !== 'completed') return;
    if (expandedId === doc.id) { setExpandedId(null); return; }
    setExpandedId(doc.id);
    if (docContents[doc.id]) return;

    setLoadingContent(doc.id);
    try {
      const content = await workspaceApi.fetchDocumentContent({
        id: doc.id,
        downloadUrl: doc.downloadUrl,
        signedUrl: doc.signedUrl,
      });
      setDocContents((prev) => ({ ...prev, [doc.id]: content }));
    } catch {
      setDocContents((prev) => ({ ...prev, [doc.id]: 'Failed to load content.' }));
    } finally {
      setLoadingContent(null);
    }
  };

  const hasSummary = generatedDocs.some((d) => d.type === 'SUMMARY');
  const hasSynopsis = generatedDocs.some((d) => d.type === 'SYNOPSIS');

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.xl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGenerated(); }} tintColor={colors.kxPrimary[600]} />}
    >
      {/* Overview Stats */}
      {overview && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing['2xl'] }}>
          <MiniStat label="Docs" value={overview.documentCount} colors={colors} typography={typography} />
          <MiniStat label="Drafts" value={overview.draftCount} colors={colors} typography={typography} />
          <MiniStat label="Judgments" value={overview.judgmentCount} colors={colors} typography={typography} />
          <MiniStat label="Summaries" value={overview.summaryCount} colors={colors} typography={typography} />
        </View>
      )}

      {/* AI Tools */}
      <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        AI Tools
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing['2xl'] }}>
        <ToolCard
          icon="📋"
          title="Summary"
          subtitle={hasSummary ? 'Generated' : 'Generate case summary'}
          onPress={() => handleGenerate('SUMMARY')}
          loading={generatingSummary}
          disabled={hasSummary}
          accentColor={colors.toolAccent.summary}
          colors={colors}
          typography={typography}
          spacing={spacing}
          radius={radius}
        />
        <ToolCard
          icon="📖"
          title="Synopsis"
          subtitle={hasSynopsis ? 'Generated' : 'Generate case synopsis'}
          onPress={() => handleGenerate('SYNOPSIS')}
          loading={generatingSynopsis}
          disabled={hasSynopsis}
          accentColor={colors.toolAccent.synopsis}
          colors={colors}
          typography={typography}
          spacing={spacing}
          radius={radius}
        />
      </View>

      {/* Generated Documents */}
      {generatedDocs.length > 0 && (
        <>
          <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Generated Documents
          </Text>
          <View style={{ gap: spacing.md }}>
            {generatedDocs.map((doc) => {
              const isExpanded = expandedId === doc.id;
              return (
                <Pressable key={doc.id} onPress={() => handleExpand(doc)} onLongPress={() => handleDelete(doc.id)}>
                  <Card>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, marginRight: spacing.sm }}>
                        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
                          {doc.type === 'SUMMARY' ? '📋 Summary' : '📖 Synopsis'}
                        </Text>
                        {doc.createdAt && (
                          <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
                            {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                      </View>
                      {doc.status === 'pending' && <ActivityIndicator size="small" color={colors.kxAccent[500]} />}
                      {doc.status === 'completed' && <Text style={{ color: colors.ledgerGray[400] }}>{isExpanded ? '▲' : '▼'}</Text>}
                      {doc.status === 'failed' && <Badge label="Failed" status="blocked" />}
                    </View>

                    {isExpanded && (
                      <View style={{ marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.kxCardBorder, paddingTop: spacing.md }}>
                        {loadingContent === doc.id ? (
                          <ActivityIndicator size="small" color={colors.kxPrimary[600]} />
                        ) : (
                          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, lineHeight: 22 }}>
                            {(docContents[doc.id] ?? '').slice(0, 2000)}
                            {(docContents[doc.id] ?? '').length > 2000 ? '\n\n...(truncated)' : ''}
                          </Text>
                        )}
                      </View>
                    )}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {loading && (
        <View style={{ paddingVertical: spacing['2xl'], alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.kxPrimary[600]} />
        </View>
      )}
    </ScrollView>
  );
}

function MiniStat({ label, value, colors, typography }: { label: string; value: number; colors: typeof import('@/theme/tokens').lightColors; typography: typeof import('@/theme/tokens').typography }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.sm, backgroundColor: colors.kxCardBg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.kxCardBorder }}>
      <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxPrimary[600] }}>{value}</Text>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>{label}</Text>
    </View>
  );
}

interface ToolCardProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  accentColor: string;
  colors: typeof import('@/theme/tokens').lightColors;
  typography: typeof import('@/theme/tokens').typography;
  spacing: typeof import('@/theme/tokens').spacing;
  radius: typeof import('@/theme/tokens').radius;
}

function ToolCard({ icon, title, subtitle, onPress, loading, disabled, accentColor, colors, typography, spacing, radius }: ToolCardProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: colors.kxCardBg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.kxCardBorder,
        padding: spacing.lg,
        opacity: pressed && !disabled ? 0.85 : 1,
      })}
    >
      <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: accentColor + '15', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text style={{ fontSize: typography.fontSize.lg }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
        {title}
      </Text>
      <Text style={{ fontSize: typography.fontSize.xs, color: disabled ? accentColor : colors.kxTextSecondary, marginTop: 2 }}>
        {loading ? 'Generating...' : subtitle}
      </Text>
      {loading && <ActivityIndicator size="small" color={accentColor} style={{ marginTop: spacing.sm }} />}
    </Pressable>
  );
}
