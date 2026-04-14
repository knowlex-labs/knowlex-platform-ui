import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { caseApi } from '@knowlex/core/api/case-api';
import { mapBackendCase } from '@knowlex/core/mappers';
import type { Case } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Badge } from '@/components/ui/Badge';
import { ChatTab } from '@/components/workspace/ChatTab';
import { SourcesSheet } from '@/components/workspace/SourcesSheet';
import { StudioSheet } from '@/components/workspace/StudioSheet';
import { NotesTab } from '@/components/workspace/NotesTab';

export default function CaseWorkspaceScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourcesVisible, setSourcesVisible] = useState(false);
  const [studioVisible, setStudioVisible] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [sourceCount, setSourceCount] = useState(0);

  const fetchCase = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const caseRes = await caseApi.getById(caseId);
      if (caseRes.data) setCaseData(mapBackendCase(caseRes.data));
      else setCaseData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  // Track source count from the sources sheet selections
  useEffect(() => {
    setSourceCount(selectedDocIds.size);
  }, [selectedDocIds]);

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.kxSurface }}>
        <ActivityIndicator size="large" color={colors.kxPrimary[600]} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.kxSurface, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.kxTextPrimary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, textAlign: 'center' }}>
          Couldn’t load case
        </Text>
        <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.sm, textAlign: 'center', marginTop: spacing.xs }} numberOfLines={3}>
          {error}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: colors.kxTextSecondary, fontWeight: typography.fontWeight.semibold }}>Go back</Text>
          </Pressable>
          <Pressable onPress={fetchCase}>
            <Text style={{ color: colors.kxPrimary[600], fontWeight: typography.fontWeight.semibold }}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!caseData) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.kxSurface }}>
        <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.base }}>Case not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.kxPrimary[600], fontWeight: typography.fontWeight.semibold }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 2, paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="chevron-back" size={20} color={colors.kxPrimary[600]} />
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm }}>Cases</Text>
          </Pressable>
          <Pressable onPress={() => setNotesVisible(true)} accessibilityLabel="Notes">
            <Ionicons name="create-outline" size={20} color={colors.kxTextSecondary} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }} numberOfLines={1}>
              {caseData.caseTitle || 'Untitled Case'}
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }} numberOfLines={1}>
              {[caseData.caseNumber, caseData.courtName].filter(Boolean).join(' • ')}
            </Text>
          </View>
          <Badge label={caseData.status ?? 'unknown'} status={caseData.status} />
        </View>
      </View>

      {/* Toolbar — Sources & Studio buttons */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
        backgroundColor: colors.kxCardBg, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder,
      }}>
        <Pressable
          onPress={() => setSourcesVisible(true)}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
            borderRadius: radius.md,
            backgroundColor: pressed ? colors.kxPrimary[50] : 'transparent',
            borderWidth: 1, borderColor: colors.kxCardBorder,
          })}
        >
          <Ionicons name="folder-outline" size={16} color={colors.kxPrimary[600]} />
          <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxPrimary[600] }}>
            Sources
          </Text>
          {sourceCount > 0 && (
            <View style={{ backgroundColor: colors.kxPrimary[600], borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: typography.fontWeight.bold, color: colors.onPrimary }}>{sourceCount}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => setStudioVisible(true)}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
            borderRadius: radius.md,
            backgroundColor: pressed ? colors.kxPrimary[50] : 'transparent',
            borderWidth: 1, borderColor: colors.kxCardBorder,
          })}
        >
          <Ionicons name="sparkles-outline" size={16} color={colors.kxPrimary[600]} />
          <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxPrimary[600] }}>
            Studio
          </Text>
        </Pressable>
      </View>

      {/* Chat — the center of the workspace */}
      <View style={{ flex: 1 }}>
        <ChatTab caseId={caseId!} externalSelectedDocIds={selectedDocIds} />
      </View>

      {/* Bottom Sheets */}
      <SourcesSheet
        visible={sourcesVisible}
        onClose={() => setSourcesVisible(false)}
        caseId={caseId!}
        selectedDocIds={selectedDocIds}
        onSelectionChange={setSelectedDocIds}
      />

      <StudioSheet
        visible={studioVisible}
        onClose={() => setStudioVisible(false)}
        caseId={caseId!}
      />

      {/* Notes Modal */}
      {notesVisible && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.kxSurface, zIndex: 100 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
              <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>Notes</Text>
              <Pressable onPress={() => setNotesVisible(false)}>
                <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>Done</Text>
              </Pressable>
            </View>
            <NotesTab caseId={caseId!} />
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}
