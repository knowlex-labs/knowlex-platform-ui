import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import type { CaseDocument } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Badge } from '@/components/ui/Badge';
import { CreateDraftSheet } from './CreateDraftSheet';

interface StudioSheetProps {
  visible: boolean;
  onClose: () => void;
  caseId: string;
  onStartDraft?: () => void;
  onStartTranslation?: () => void;
}

interface GeneratedDoc {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt?: string;
}


function normalizeStatus(jobStatus?: string | null): 'pending' | 'completed' | 'failed' {
  const s = (jobStatus ?? '').toUpperCase();
  if (s === 'COMPLETED') return 'completed';
  if (s === 'FAILED') return 'failed';
  return 'pending';
}

export function StudioSheet({ visible, onClose, caseId, onStartDraft, onStartTranslation }: StudioSheetProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [drafts, setDrafts] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingSynopsis, setGeneratingSynopsis] = useState(false);
  const [createDraftVisible, setCreateDraftVisible] = useState(false);
  const streamsRef = useRef<Map<string, AbortController>>(new Map());

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [summaries, synopses, draftRes] = await Promise.all([
        workspaceApi.getCaseDocuments(caseId, 'SUMMARY'),
        workspaceApi.getCaseDocuments(caseId, 'SYNOPSIS'),
        workspaceApi.getCaseDocuments(caseId, 'DRAFT'),
      ]);

      const gen: GeneratedDoc[] = [...(summaries ?? []), ...(synopses ?? [])].map((d: CaseDocument) => ({
        id: d.id,
        name: d.name ?? d.type ?? 'Document',
        type: d.type ?? '',
        status: normalizeStatus(d.jobStatus),
        createdAt: d.createdAt as string,
      }));
      setGeneratedDocs(gen);
      setDrafts(draftRes ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (visible) fetchAll();
    return () => {
      for (const ctrl of streamsRef.current.values()) ctrl.abort();
      streamsRef.current.clear();
    };
  }, [visible, fetchAll]);

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

  const handleGenerate = async (docType: 'SUMMARY' | 'SYNOPSIS') => {
    const setter = docType === 'SUMMARY' ? setGeneratingSummary : setGeneratingSynopsis;
    setter(true);
    try {
      const res = await workspaceApi.createDocument(caseId, { document_type: docType.toLowerCase() });
      await fetchAll();
      if (res.id) startStream(res.id);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : `Failed to generate ${docType.toLowerCase()}`);
    } finally {
      setter(false);
    }
  };

  const hasSummary = generatedDocs.some((d) => d.type === 'SUMMARY');
  const hasSynopsis = generatedDocs.some((d) => d.type === 'SYNOPSIS');

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={{ flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' }} onPress={onClose}>
          <Pressable
            style={{
              backgroundColor: colors.kxCardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
              maxHeight: '80%', paddingBottom: spacing.lg,
            }}
            onPress={() => {}}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ledgerGray[300] }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
              <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
                Case Studio
              </Text>
              <Pressable onPress={onClose}>
                <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>Done</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              {error && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.kxSurface, borderWidth: 1, borderColor: colors.kxCardBorder, marginBottom: spacing.md }}>
                  <Text style={{ flex: 1, fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }} numberOfLines={2}>
                    Couldn’t load: {error}
                  </Text>
                  <Pressable onPress={() => { setLoading(true); fetchAll(); }} hitSlop={8}>
                    <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, marginLeft: spacing.sm }}>Retry</Text>
                  </Pressable>
                </View>
              )}
              {/* AI Tools */}
              <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
                AI Tools
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
                {/* Summary */}
                <Pressable
                  onPress={hasSummary ? undefined : () => handleGenerate('SUMMARY')}
                  style={({ pressed }) => ({
                    flex: 1, padding: spacing.lg, borderRadius: radius.lg,
                    backgroundColor: colors.kxSurface, borderWidth: 1, borderColor: colors.kxCardBorder,
                    opacity: pressed && !hasSummary ? 0.85 : 1,
                  })}
                >
                  <View style={{ width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.toolAccent.summary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm }}>
                    <Ionicons name="document-text" size={16} color={colors.toolAccent.summary} />
                  </View>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>Summary</Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: hasSummary ? colors.success : colors.kxTextSecondary, marginTop: 2 }}>
                    {generatingSummary ? 'Generating...' : hasSummary ? 'Generated' : 'Generate summary'}
                  </Text>
                  {generatingSummary && <ActivityIndicator size="small" color={colors.toolAccent.summary} style={{ marginTop: spacing.sm }} />}
                </Pressable>

                {/* Synopsis */}
                <Pressable
                  onPress={hasSynopsis ? undefined : () => handleGenerate('SYNOPSIS')}
                  style={({ pressed }) => ({
                    flex: 1, padding: spacing.lg, borderRadius: radius.lg,
                    backgroundColor: colors.kxSurface, borderWidth: 1, borderColor: colors.kxCardBorder,
                    opacity: pressed && !hasSynopsis ? 0.85 : 1,
                  })}
                >
                  <View style={{ width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.toolAccent.synopsis + '15', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm }}>
                    <Ionicons name="book" size={16} color={colors.toolAccent.synopsis} />
                  </View>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>Synopsis</Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: hasSynopsis ? colors.success : colors.kxTextSecondary, marginTop: 2 }}>
                    {generatingSynopsis ? 'Generating...' : hasSynopsis ? 'Generated' : 'Generate synopsis'}
                  </Text>
                  {generatingSynopsis && <ActivityIndicator size="small" color={colors.toolAccent.synopsis} style={{ marginTop: spacing.sm }} />}
                </Pressable>
              </View>

              {/* Drafting + Translate */}
              <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
                <Pressable
                  onPress={() => { onClose(); setTimeout(() => onStartDraft?.(), 300); }}
                  style={({ pressed }) => ({
                    flex: 1, padding: spacing.lg, borderRadius: radius.lg,
                    backgroundColor: colors.kxSurface, borderWidth: 1, borderColor: colors.kxCardBorder,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ width: 32, height: 32, borderRadius: radius.md, backgroundColor: '#6366f115', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm }}>
                    <Ionicons name="create-outline" size={16} color="#6366f1" />
                  </View>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>Drafting</Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>Quick draft</Text>
                </Pressable>

                <Pressable
                  onPress={() => { onClose(); setTimeout(() => onStartTranslation?.(), 300); }}
                  style={({ pressed }) => ({
                    flex: 1, padding: spacing.lg, borderRadius: radius.lg,
                    backgroundColor: colors.kxSurface, borderWidth: 1, borderColor: colors.kxCardBorder,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ width: 32, height: 32, borderRadius: radius.md, backgroundColor: '#f59e0b15', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm }}>
                    <Ionicons name="globe-outline" size={16} color="#f59e0b" />
                  </View>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>Translate</Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>Case documents</Text>
                </Pressable>
              </View>

              {/* Drafts */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Drafts ({drafts.length})
                </Text>
                <Pressable onPress={() => { onClose(); setTimeout(() => setCreateDraftVisible(true), 300); }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="add" size={16} color={colors.kxPrimary[600]} />
                    <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxPrimary[600] }}>New</Text>
                  </View>
                </Pressable>
              </View>
              {drafts.length === 0 ? (
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, paddingVertical: spacing.md }}>No drafts yet</Text>
              ) : (
                drafts.map((draft) => {
                  const status = normalizeStatus(draft.jobStatus);
                  return (
                    <View key={draft.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
                      <Ionicons name="document" size={16} color={colors.kxPrimary[400]} style={{ marginRight: spacing.md }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary }} numberOfLines={1}>
                          {draft.name ?? 'Untitled Draft'}
                        </Text>
                      </View>
                      {status === 'pending' && <ActivityIndicator size="small" color={colors.kxAccent[500]} />}
                      {status === 'completed' && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
                      {status === 'failed' && <Badge label="Failed" status="blocked" size="sm" />}
                    </View>
                  );
                })
              )}

              {/* Generated Documents */}
              {generatedDocs.length > 0 && (
                <>
                  <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: spacing.sm }}>
                    Generated ({generatedDocs.length})
                  </Text>
                  {generatedDocs.map((doc) => (
                    <View key={doc.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
                      <Ionicons name={doc.type === 'SUMMARY' ? 'document-text' : 'book'} size={16} color={colors.kxPrimary[400]} style={{ marginRight: spacing.md }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary }} numberOfLines={1}>
                          {doc.type === 'SUMMARY' ? 'Summary' : 'Synopsis'}
                        </Text>
                        {doc.createdAt && (
                          <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }}>
                            {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </Text>
                        )}
                      </View>
                      {doc.status === 'pending' && <ActivityIndicator size="small" color={colors.kxAccent[500]} />}
                      {doc.status === 'completed' && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
                      {doc.status === 'failed' && <Badge label="Failed" status="blocked" size="sm" />}
                    </View>
                  ))}
                </>
              )}

              {loading && (
                <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.kxPrimary[600]} />
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <CreateDraftSheet
        visible={createDraftVisible}
        onClose={() => setCreateDraftVisible(false)}
        caseId={caseId}
        onCreated={() => { setCreateDraftVisible(false); fetchAll(); }}
      />
    </>
  );
}
