import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api';
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api';
import type { Case } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { CasePickerSheet } from '@/components/workspace/CasePickerSheet';
import { CreateDraftSheet } from '@/components/workspace/CreateDraftSheet';

const TEMPLATES = [
  { id: 'notice', name: 'Legal Notice', docType: 'legal_notice', subType: 'demand', icon: 'document-text-outline' },
  { id: 'patent', name: 'Patent', docType: 'patent', icon: 'bulb-outline' },
  { id: 'application-draft', name: 'Application Draft', docType: 'application_draft', icon: 'create-outline' },
  { id: 'interim-application', name: 'Interim Application', docType: 'affidavit', subType: 'interim_application', icon: 'time-outline' },
  { id: 'affidavit', name: 'Affidavit', docType: 'affidavit', subType: 'plaint', icon: 'scale-outline' },
  { id: 'bail-application', name: 'Bail Application', docType: 'bail_application', icon: 'hammer-outline' },
  { id: 'criminal-appeal', name: 'Criminal Appeal', docType: 'criminal_appeal', icon: 'shield-outline' },
  { id: 'plaint', name: 'Plaint', docType: 'application', subType: 'plaint', icon: 'reader-outline' },
  { id: 'written-statement', name: 'Written Statement', docType: 'written_statement', icon: 'clipboard-outline' },
  { id: 'written-arguments', name: 'Written Arguments', docType: 'written_arguments', icon: 'chatbubble-ellipses-outline' },
  { id: 'writ-petition', name: 'Writ Petition', docType: 'petition', subType: 'writ_petition', icon: 'business-outline' },
  { id: 'slp', name: 'SLP', docType: 'slp', icon: 'star-outline' },
  { id: 'quashing-petition', name: 'Quashing Petition', docType: 'quashing_petition', icon: 'close-circle-outline' },
  { id: 'anticipatory-bail', name: 'Anticipatory Bail', docType: 'anticipatory_bail', icon: 'shield-checkmark-outline' },
  { id: 'revision-petition', name: 'Revision Petition', docType: 'revision_petition', icon: 'refresh-outline' },
  { id: 'execution-petition', name: 'Execution Petition', docType: 'execution_petition', icon: 'construct-outline' },
  { id: 'consumer-complaint', name: 'Consumer Complaint', docType: 'consumer_complaint', icon: 'people-outline' },
] as const;

type Mode = 'predefined' | 'custom';

export default function DraftsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const [mode, setMode] = useState<Mode>('predefined');
  const [recentDrafts, setRecentDrafts] = useState<DocumentRecord[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Flow state: template → case picker → create draft sheet
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[number] | null>(null);
  const [casePickerVisible, setCasePickerVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  const fetchRecentDrafts = useCallback(async () => {
    try {
      const res = await listAllDocuments({ page: 0, size: 10, type: 'DRAFT' as string, sort: 'createdAt,desc' });
      setRecentDrafts(res.documents);
    } catch {
      // Show empty
    } finally {
      setLoadingDrafts(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRecentDrafts(); }, [fetchRecentDrafts]);

  const handleTemplateTap = (template: typeof TEMPLATES[number]) => {
    setSelectedTemplate(template);
    setCasePickerVisible(true);
  };

  const handleCaseSelected = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setCasePickerVisible(false);
    setTimeout(() => setCreateSheetVisible(true), 300);
  };

  const handleDraftCreated = () => {
    setCreateSheetVisible(false);
    setSelectedTemplate(null);
    setSelectedCase(null);
    fetchRecentDrafts();
  };

  const getStatusBadge = (status: string | null): 'active' | 'pending' | 'blocked' => {
    const s = (status ?? '').toUpperCase();
    if (s === 'COMPLETED') return 'active';
    if (s === 'FAILED') return 'blocked';
    return 'pending';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.kxSurface }}>
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
            flex: 1, paddingVertical: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4,
            backgroundColor: mode === 'custom' ? colors.kxPrimary[600] : 'transparent',
          }}
        >
          <Text style={{
            fontSize: typography.fontSize.xs, fontWeight: '600',
            color: mode === 'custom' ? colors.onPrimary : colors.kxTextSecondary,
          }}>
            Custom
          </Text>
          <Ionicons name="lock-closed" size={10} color={mode === 'custom' ? colors.onPrimary : colors.ledgerGray[400]} />
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
            {TEMPLATES.map((t) => (
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
                  <Ionicons name={t.icon as any} size={16} color={colors.kxPrimary[600]} />
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
        </ScrollView>
      ) : (
        /* Custom Mode — Locked */
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing['3xl'] }}>
          <View style={{
            width: 64, height: 64, borderRadius: 32, backgroundColor: colors.kxPrimary[50],
            justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl,
          }}>
            <Ionicons name="lock-closed" size={28} color={colors.kxPrimary[600]} />
          </View>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, textAlign: 'center' }}>
            Coming Soon
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 }}>
            Custom draft creation will let you write free-form legal documents with AI assistance. This feature is currently in development.
          </Text>
        </View>
      )}

      {/* Case Picker → Create Draft flow */}
      <CasePickerSheet
        visible={casePickerVisible}
        onClose={() => { setCasePickerVisible(false); setSelectedTemplate(null); }}
        onSelect={handleCaseSelected}
      />

      {selectedCase && selectedTemplate && (
        <CreateDraftSheet
          visible={createSheetVisible}
          onClose={() => { setCreateSheetVisible(false); setSelectedTemplate(null); setSelectedCase(null); }}
          caseId={selectedCase.id}
          onCreated={handleDraftCreated}
        />
      )}
    </SafeAreaView>
  );
}
