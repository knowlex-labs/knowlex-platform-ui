import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import type { CaseDocument } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { FAB } from '@/components/ui/FAB';
import { CreateDraftSheet } from './CreateDraftSheet';

interface DraftsTabProps {
  caseId: string;
}

function getDraftStatus(doc: CaseDocument): 'pending' | 'completed' | 'failed' {
  const js = (doc.jobStatus ?? '').toUpperCase();
  if (js === 'COMPLETED') return 'completed';
  if (js === 'FAILED') return 'failed';
  return 'pending';
}

export function DraftsTab({ caseId }: DraftsTabProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [drafts, setDrafts] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [draftContent, setDraftContent] = useState<Record<string, string>>({});
  const [loadingContent, setLoadingContent] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await workspaceApi.getCaseDocuments(caseId, 'DRAFT');
      setDrafts(res ?? []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [caseId]);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const handleDraftPress = async (draft: CaseDocument) => {
    if (getDraftStatus(draft) !== 'completed') return;

    if (expandedId === draft.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(draft.id);

    if (draftContent[draft.id]) return;

    setLoadingContent(draft.id);
    try {
      const content = await workspaceApi.fetchDocumentContent({
        id: draft.id,
        downloadUrl: draft.downloadUrl,
        signedUrl: draft.signedUrl,
      });
      setDraftContent((prev) => ({ ...prev, [draft.id]: content }));
    } catch {
      setDraftContent((prev) => ({ ...prev, [draft.id]: 'Failed to load draft content.' }));
    } finally {
      setLoadingContent(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          {[1, 2, 3].map((i) => <SkeletonLoader key={i} height={64} borderRadius={radius.lg} />)}
        </View>
      ) : drafts.length === 0 ? (
        <EmptyState
          title="No drafts yet"
          message="Generate AI-powered legal documents from templates"
          action={<Button title="Create Draft" onPress={() => setCreateVisible(true)} />}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDrafts(); }} tintColor={colors.kxPrimary[600]} />}
        >
          {drafts.map((draft) => {
            const status = getDraftStatus(draft);
            const isExpanded = expandedId === draft.id;

            return (
              <Pressable key={draft.id} onPress={() => handleDraftPress(draft)}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: spacing.md }}>
                      <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={2}>
                        {draft.name ?? 'Untitled Draft'}
                      </Text>
                      {draft.subType && (
                        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2, textTransform: 'capitalize' }}>
                          {draft.subType.replace(/_/g, ' ')}
                        </Text>
                      )}
                    </View>
                    {status === 'pending' && <ActivityIndicator size="small" color={colors.kxAccent[500]} />}
                    {status === 'completed' && <Text style={{ fontSize: typography.fontSize.sm, color: colors.ledgerGray[400] }}>{isExpanded ? '▲' : '▼'}</Text>}
                    {status === 'failed' && <Badge label="Failed" status="blocked" />}
                  </View>

                  {isExpanded && (
                    <View style={{ marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.kxCardBorder, paddingTop: spacing.md }}>
                      {loadingContent === draft.id ? (
                        <ActivityIndicator size="small" color={colors.kxPrimary[600]} />
                      ) : (
                        <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, lineHeight: 22 }}>
                          {(draftContent[draft.id] ?? '').slice(0, 1000)}
                          {(draftContent[draft.id] ?? '').length > 1000 ? '...' : ''}
                        </Text>
                      )}
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {drafts.length > 0 && <FAB icon="+" onPress={() => setCreateVisible(true)} accessibilityLabel="Create draft" />}

      <CreateDraftSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        caseId={caseId}
        onCreated={() => { setCreateVisible(false); fetchDrafts(); }}
      />
    </View>
  );
}
