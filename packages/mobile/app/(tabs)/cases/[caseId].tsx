import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { caseApi } from '@knowlex/core/api/case-api';
import { mapBackendCase } from '@knowlex/core/mappers';
import type { Case } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SourcesTab } from '@/components/workspace/SourcesTab';
import { ToolsTab } from '@/components/workspace/ToolsTab';
import { ChatTab } from '@/components/workspace/ChatTab';
import { NotesTab } from '@/components/workspace/NotesTab';

interface CaseOverview {
  documentCount: number;
  judgmentCount: number;
  draftCount: number;
  summaryCount: number;
}

const SEGMENTS = [
  { key: 'docs', label: 'Docs' },
  { key: 'tools', label: 'Tools' },
  { key: 'chat', label: 'Chat' },
  { key: 'notes', label: 'Notes' },
];

export default function CaseWorkspaceScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('docs');

  useEffect(() => {
    if (!caseId) return;
    const fetchCase = async () => {
      try {
        const [caseRes, overviewRes] = await Promise.all([
          caseApi.getById(caseId),
          caseApi.getOverviewSummary(caseId),
        ]);
        if (caseRes.data) setCaseData(mapBackendCase(caseRes.data));
        if (overviewRes.data) setOverview(overviewRes.data);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.kxSurface }}>
        <ActivityIndicator size="large" color={colors.kxPrimary[600]} />
      </SafeAreaView>
    );
  }

  if (!caseData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.kxSurface }}>
        <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.base }}>Case not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.kxPrimary[600], fontWeight: typography.fontWeight.semibold }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header — compact */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 2, paddingBottom: 6 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 2 }}>
          <Text style={{ color: colors.kxPrimary[600], fontSize: 13 }}>← Cases</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }} numberOfLines={1}>
              {caseData.caseTitle || 'Untitled Case'}
            </Text>
            <Text style={{ fontSize: 11, color: colors.kxTextSecondary, marginTop: 1 }} numberOfLines={1}>
              {[caseData.caseNumber, caseData.courtName].filter(Boolean).join(' • ')}
            </Text>
          </View>
          <Badge label={caseData.status ?? 'unknown'} status={caseData.status as any} />
        </View>
      </View>

      {/* Segmented Control */}
      <SegmentedControl segments={SEGMENTS} activeKey={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'docs' && <SourcesTab caseId={caseId!} />}
        {activeTab === 'tools' && <ToolsTab caseId={caseId!} overview={overview} />}
        {activeTab === 'chat' && <ChatTab caseId={caseId!} />}
        {activeTab === 'notes' && <NotesTab caseId={caseId!} />}
      </View>
    </SafeAreaView>
  );
}
