import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api';
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api';
import { DRAFT_TEMPLATES, DocumentType } from '@knowlex/core/types';
import type { DraftTemplate } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { CreateDraftSheet } from '@/components/workspace/CreateDraftSheet';
import { TEMPLATE_ICONS, DEFAULT_TEMPLATE_ICON } from '@/lib/template-icons';

type Mode = 'predefined' | 'custom';

export default function DraftsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const [mode, setMode] = useState<Mode>('predefined');
  const [recentDrafts, setRecentDrafts] = useState<DocumentRecord[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [draftsError, setDraftsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Flow state: tap template → form opens directly. Case selection lives inside the form.
  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(null);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  const fetchRecentDrafts = useCallback(async () => {
    setDraftsError(null);
    try {
      const res = await listAllDocuments({ page: 0, size: 10, type: DocumentType.DRAFT, sort: 'createdAt,desc' });
      setRecentDrafts(res.documents);
    } catch (err: unknown) {
      setDraftsError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoadingDrafts(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRecentDrafts(); }, [fetchRecentDrafts]);

  const handleTemplateTap = (template: DraftTemplate) => {
    setSelectedTemplate(template);
    setCreateSheetVisible(true);
  };

  const handleDraftCreated = () => {
    setCreateSheetVisible(false);
    setSelectedTemplate(null);
    fetchRecentDrafts();
  };

  const getStatusBadge = (status: string | null): 'active' | 'pending' | 'blocked' => {
    const s = (status ?? '').toUpperCase();
    if (s === 'COMPLETED') return 'active';
    if (s === 'FAILED') return 'blocked';
    return 'pending';
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, marginBottom: spacing.sm }}>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
          Drafts
        </Text>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
          AI-powered legal documents
        </Text>
      </View>

      {/* Mode Toggle */}
      <View style={{
        flexDirection: 'row', marginHorizontal: spacing.xl, marginBottom: spacing.md,
        backgroundColor: colors.kxCardBg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.kxCardBorder,
        overflow: 'hidden',
      }}>
        <Pressable
          onPress={() => setMode('predefined')}
          style={{
            flex: 1, paddingVertical: 8, alignItems: 'center',
            backgroundColor: mode === 'predefined' ? colors.kxPrimary[600] : 'transparent',
          }}
        >
          <Text style={{
            fontSize: typography.fontSize.xs, fontWeight: '600',
            color: mode === 'predefined' ? colors.onPrimary : colors.kxTextSecondary,
          }}>
            Predefined
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('custom')}
          style={{
            flex: 1, paddingVertical: 8, alignItems: 'center',
            backgroundColor: mode === 'custom' ? colors.kxPrimary[600] : 'transparent',
          }}
        >
          <Text style={{
            fontSize: typography.fontSize.xs, fontWeight: '600',
            color: mode === 'custom' ? colors.onPrimary : colors.kxTextSecondary,
          }}>
            Custom
          </Text>
        </Pressable>
      </View>

      {mode === 'predefined' ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecentDrafts(); }} tintColor={colors.kxPrimary[600]} />}
        >
          {/* Template Grid */}
          <Text style={{ fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
            Templates
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {DRAFT_TEMPLATES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => handleTemplateTap(t)}
                style={({ pressed }) => ({
                  width: '48%',
                  flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                  paddingVertical: spacing.md, paddingHorizontal: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: pressed ? colors.kxPrimary[50] : colors.kxCardBg,
                  borderWidth: 1, borderColor: colors.kxCardBorder,
                })}
              >
                <View style={{
                  width: 32, height: 32, borderRadius: radius.md,
                  backgroundColor: colors.kxPrimary[50], justifyContent: 'center', alignItems: 'center',
                }}>
                  <Ionicons name={TEMPLATE_ICONS[t.id] ?? DEFAULT_TEMPLATE_ICON} size={16} color={colors.kxPrimary[600]} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '500', color: colors.kxTextPrimary, flex: 1 }} numberOfLines={2}>
                  {t.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Recent Drafts */}
          {recentDrafts.length > 0 && (
            <>
              <Text style={{ fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing['2xl'], marginBottom: spacing.sm }}>
                Recent Drafts
              </Text>
              {recentDrafts.map((draft) => (
                <Card key={draft.id} style={{ marginBottom: spacing.sm, paddingVertical: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: spacing.md }}>
                      <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                        {draft.name ?? 'Untitled Draft'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: spacing.sm }}>
                        {draft.caseTitle && (
                          <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }} numberOfLines={1}>{draft.caseTitle}</Text>
                        )}
                        <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[400] }}>
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
            </>
          )}

          {loadingDrafts && recentDrafts.length === 0 && (
            <View style={{ marginTop: spacing['2xl'], gap: spacing.sm }}>
              {[1, 2, 3].map((i) => <SkeletonLoader key={i} height={56} borderRadius={radius.md} />)}
            </View>
          )}

          {draftsError && !loadingDrafts && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.kxCardBg, borderWidth: 1, borderColor: colors.kxCardBorder }}>
              <Text style={{ flex: 1, fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }} numberOfLines={2}>
                Couldn’t load drafts: {draftsError}
              </Text>
              <Pressable onPress={() => { setLoadingDrafts(true); fetchRecentDrafts(); }} hitSlop={8}>
                <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.xs, fontWeight: '600', marginLeft: spacing.sm }}>Retry</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Custom Mode — placeholder until the freeform flow ships. */
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <View style={{
            backgroundColor: colors.kxCardBg, borderRadius: radius.lg,
            borderWidth: 1, borderColor: colors.kxCardBorder,
            padding: spacing['2xl'], alignItems: 'center', marginTop: spacing.lg,
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28, backgroundColor: colors.kxPrimary[50],
              justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
            }}>
              <Ionicons name="hourglass-outline" size={26} color={colors.kxPrimary[600]} />
            </View>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, textAlign: 'center' }}>
              Custom drafts — coming soon
            </Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 18 }}>
              We’re building a freeform draft mode.{'\n'}For now, pick a template under Predefined.
            </Text>
          </View>
        </ScrollView>
      )}

      <CreateDraftSheet
        visible={createSheetVisible}
        onClose={() => { setCreateSheetVisible(false); setSelectedTemplate(null); }}
        templateId={selectedTemplate?.id}
        onCreated={handleDraftCreated}
      />
    </SafeAreaView>
  );
}
