import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { caseApi } from '@knowlex/core/api/case-api';
import { draftChatApi } from '@knowlex/core/api/draft-chat-api';
import { mapBackendCase } from '@knowlex/core/mappers';
import type { Case } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Badge } from '@/components/ui/Badge';
import { ActionMenu } from '@/components/ui/ActionMenu';
import type { ActionMenuItem } from '@/components/ui/ActionMenu';
import { ChatTab } from '@/components/workspace/ChatTab';
import { CaseSourcesView } from '@/components/workspace/CaseSourcesView';
import { CaseStudioView } from '@/components/workspace/CaseStudioView';

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
}

export default function CaseWorkspaceScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourcesVisible, setSourcesVisible] = useState(false);
  const [studioVisible, setStudioVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const fetchCase = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const caseRes = await caseApi.getById(caseId);
      setCaseData(caseRes.data ? mapBackendCase(caseRes.data) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetchCase(); }, [fetchCase]);

  const refreshSessions = useCallback(async () => {
    if (!caseId) return;
    try {
      const list = await draftChatApi.listSessions(caseId);
      setSessions(list);
    } catch {
      // non-fatal
    }
  }, [caseId]);

  useEffect(() => { refreshSessions(); }, [refreshSessions]);

  const onSessionInitialized = useCallback((id: string) => {
    setSessionId(id);
    refreshSessions();
  }, [refreshSessions]);

  const startNewChat = useCallback(async () => {
    if (!caseId) return;
    try {
      const created = await draftChatApi.createSession(caseId);
      setSessionId(created.id);
      refreshSessions();
    } catch (err) {
      Alert.alert('Couldn’t start a new chat', err instanceof Error ? err.message : 'Try again');
    }
  }, [caseId, refreshSessions]);

  const deleteSession = useCallback(async (id: string) => {
    if (!caseId) return;
    try {
      await draftChatApi.deleteSession(caseId, id);
      if (sessionId === id) setSessionId(null);
      refreshSessions();
    } catch (err) {
      Alert.alert('Delete failed', err instanceof Error ? err.message : 'Try again');
    }
  }, [caseId, sessionId, refreshSessions]);

  const menuItems = useMemo<ActionMenuItem[]>(() => {
    const items: ActionMenuItem[] = [
      { label: 'New Chat', icon: '✨', onPress: startNewChat },
    ];
    for (const s of sessions.slice(0, 8)) {
      const isCurrent = s.id === sessionId;
      items.push({
        label: `${isCurrent ? '• ' : ''}${s.title || 'Untitled chat'}`,
        icon: '💬',
        onPress: () => setSessionId(s.id),
      });
    }
    if (sessionId) {
      items.push({
        label: 'Delete current chat',
        icon: '🗑',
        destructive: true,
        onPress: () => deleteSession(sessionId),
      });
    }
    return items;
  }, [sessions, sessionId, startNewChat, deleteSession]);

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
          <Pressable onPress={() => setMenuVisible(true)} accessibilityLabel="Chat menu" hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.kxTextSecondary} />
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

      {/* Sources / Studio pills */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder, backgroundColor: colors.kxCardBg }}>
        <Pressable
          onPress={() => setSourcesVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Sources"
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: spacing.md, paddingVertical: 6,
            borderRadius: radius.full,
            backgroundColor: pressed ? colors.kxPrimary[50] : colors.kxSurface,
            borderWidth: 1, borderColor: colors.kxCardBorder,
          })}
        >
          <Ionicons name="folder-outline" size={14} color={colors.kxPrimary[600]} />
          <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxPrimary[600] }}>
            Sources
          </Text>
          {selectedDocIds.size > 0 && (
            <View style={{ backgroundColor: colors.kxPrimary[600], borderRadius: radius.full, minWidth: 18, height: 18, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: typography.fontWeight.bold, color: colors.onPrimary }}>{selectedDocIds.size}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => setStudioVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Studio"
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: spacing.md, paddingVertical: 6,
            borderRadius: radius.full,
            backgroundColor: pressed ? colors.kxPrimary[50] : colors.kxSurface,
            borderWidth: 1, borderColor: colors.kxCardBorder,
          })}
        >
          <Ionicons name="sparkles-outline" size={14} color={colors.kxPrimary[600]} />
          <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxPrimary[600] }}>
            Studio
          </Text>
        </Pressable>
      </View>

      {/* Chat — main view */}
      <View style={{ flex: 1 }}>
        <ChatTab
          caseId={caseId!}
          selectedDocIds={selectedDocIds}
          currentSessionId={sessionId}
          onSessionInitialized={onSessionInitialized}
        />
      </View>

      {/* Sources modal */}
      <Modal visible={sourcesVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSourcesVisible(false)}>
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>Sources</Text>
            <Pressable onPress={() => setSourcesVisible(false)}>
              <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>Done</Text>
            </Pressable>
          </View>
          <CaseSourcesView caseId={caseId!} selectedDocIds={selectedDocIds} onSelectionChange={setSelectedDocIds} />
        </SafeAreaView>
      </Modal>

      {/* Studio modal */}
      <Modal visible={studioVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setStudioVisible(false)}>
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>Studio</Text>
            <Pressable onPress={() => setStudioVisible(false)}>
              <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>Done</Text>
            </Pressable>
          </View>
          <CaseStudioView caseId={caseId!} />
        </SafeAreaView>
      </Modal>

      <ActionMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title="Chat sessions"
        items={menuItems}
      />
    </SafeAreaView>
  );
}
