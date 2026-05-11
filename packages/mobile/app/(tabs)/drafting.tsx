import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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

type Mode = 'home' | 'templates';

export default function DraftingScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const { new: openNew } = useLocalSearchParams<{ new?: string }>();

  const [mode, setMode] = useState<Mode>('home');

  // Home tile passes ?new=1 to jump straight into template selection.
  useEffect(() => {
    if (openNew === '1') {
      setMode('templates');
      router.setParams({ new: undefined } as any);
    }
  }, [openNew, router]);
  const [recent, setRecent] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(null);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await listAllDocuments({ page: 0, size: 10, type: DocumentType.DRAFT, sort: 'createdAt,desc' });
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

  const openTemplate = (template: DraftTemplate) => {
    setSelectedTemplate(template);
    setCreateSheetVisible(true);
  };

  const openDraft = (draft: DocumentRecord) => {
    const params: Record<string, string> = {
      docId: draft.id,
      name: draft.name ?? 'Draft',
    };
    if (draft.downloadUrl) params.downloadUrl = draft.downloadUrl;
    if (draft.signedUrl) params.signedUrl = draft.signedUrl;
    if (draft.fileType) params.fileType = draft.fileType;
    if (draft.type) params.type = draft.type;
    router.push({ pathname: '/viewer', params } as any);
  };

  const filteredTemplates = search.trim()
    ? DRAFT_TEMPLATES.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : DRAFT_TEMPLATES;

  const draftStatus = (status: string | null | undefined): 'active' | 'pending' | 'blocked' => {
    const s = (status ?? '').toUpperCase();
    if (s === 'COMPLETED') return 'active';
    if (s === 'FAILED') return 'blocked';
    return 'pending';
  };

  if (mode === 'templates') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: 2, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
          <Pressable onPress={() => setMode('home')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs }}>
            <Ionicons name="chevron-back" size={20} color={colors.kxPrimary[600]} />
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm }}>Drafting</Text>
          </Pressable>
          <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, marginTop: 2 }}>
            Pick a Template
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <TextInput
            placeholder="Search templates..."
            placeholderTextColor={colors.ledgerGray[400]}
            value={search}
            onChangeText={setSearch}
            style={{
              backgroundColor: colors.kxCardBg,
              borderWidth: 1, borderColor: colors.kxCardBorder, borderRadius: radius.md,
              paddingHorizontal: spacing.md, paddingVertical: 8,
              fontSize: typography.fontSize.sm, color: colors.kxTextPrimary,
            }}
          />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing['2xl'] }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {filteredTemplates.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => openTemplate(t)}
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
        </ScrollView>

        <CreateDraftSheet
          visible={createSheetVisible}
          onClose={() => { setCreateSheetVisible(false); setSelectedTemplate(null); }}
          templateId={selectedTemplate?.id}
          onCreated={() => {
            setCreateSheetVisible(false);
            setSelectedTemplate(null);
            setMode('home');
            fetchRecent();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, fontFamily: typography.fontFamily.serif }}>
          Drafts
        </Text>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
          Generate legal documents with AI.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing['3xl'] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecent(); }} tintColor={colors.kxPrimary[600]} />}
      >
        {/* Create New Draft hero card */}
        <Pressable
          onPress={() => setMode('templates')}
          accessibilityRole="button"
          accessibilityLabel="Create a new draft"
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.kxPrimary[700] : colors.kxPrimary[600],
            borderRadius: radius.lg,
            padding: spacing.lg,
            flexDirection: 'row', alignItems: 'center', gap: spacing.md,
            marginBottom: spacing.lg,
          })}
        >
          <View style={{
            width: 44, height: 44, borderRadius: radius.md,
            backgroundColor: colors.kxPrimary[500],
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="sparkles" size={22} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.onPrimary }}>
              Create New Draft
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.onPrimary, opacity: 0.85, marginTop: 2 }}>
              Pick from {DRAFT_TEMPLATES.length}+ legal templates
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.onPrimary} />
        </Pressable>

        {/* Custom drafts placeholder — matches web "Coming Soon" */}
        <View
          style={{
            backgroundColor: colors.kxCardBg,
            borderRadius: radius.lg, borderWidth: 1, borderColor: colors.kxCardBorder,
            padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
            marginBottom: spacing['2xl'], opacity: 0.7,
          }}
        >
          <View style={{
            width: 44, height: 44, borderRadius: radius.md,
            backgroundColor: colors.ledgerGray[100],
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="document-text-outline" size={22} color={colors.ledgerGray[400]} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
                Custom Templates
              </Text>
              <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm, backgroundColor: colors.ledgerGray[100] }}>
                <Text style={{ fontSize: 10, fontWeight: typography.fontWeight.medium, color: colors.kxTextSecondary }}>Coming Soon</Text>
              </View>
            </View>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
              Create and save your own templates.
            </Text>
          </View>
        </View>

        {/* Recent Drafts */}
        <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
          Recent Drafts
        </Text>
        {loading ? (
          <View style={{ gap: spacing.sm }}>
            {[1, 2, 3].map((i) => <SkeletonLoader key={i} height={62} borderRadius={radius.md} />)}
          </View>
        ) : recent.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
            <Ionicons name="document-text-outline" size={28} color={colors.ledgerGray[300]} />
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: spacing.sm }}>
              No drafts yet
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 4, textAlign: 'center' }}>
              Tap "Create New Draft" to get started.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {recent.map((draft) => (
              <Pressable
                key={draft.id}
                onPress={() => openDraft(draft)}
                accessibilityRole="button"
                accessibilityLabel={draft.name ?? 'Draft'}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
                  borderRadius: radius.lg, borderWidth: 1, borderColor: colors.kxCardBorder,
                  paddingVertical: spacing.md, paddingHorizontal: spacing.md,
                  flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                })}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: radius.md,
                  backgroundColor: colors.kxPrimary[50],
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="document-text" size={18} color={colors.kxPrimary[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                    {draft.name ?? 'Untitled Draft'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: spacing.sm }}>
                    {draft.caseTitle && (
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }} numberOfLines={1}>
                        {draft.caseTitle}
                      </Text>
                    )}
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[400] }}>
                      {new Date(draft.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>
                {draft.jobStatus && (
                  <Badge
                    label={draft.jobStatus === 'COMPLETED' ? 'Done' : draft.jobStatus === 'FAILED' ? 'Failed' : 'Pending'}
                    status={draftStatus(draft.jobStatus)}
                  />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <CreateDraftSheet
        visible={createSheetVisible}
        onClose={() => { setCreateSheetVisible(false); setSelectedTemplate(null); }}
        templateId={selectedTemplate?.id}
        onCreated={() => {
          setCreateSheetVisible(false);
          setSelectedTemplate(null);
          fetchRecent();
        }}
      />
    </SafeAreaView>
  );
}
