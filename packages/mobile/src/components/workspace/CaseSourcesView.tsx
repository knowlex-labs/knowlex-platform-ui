import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import type { CaseDocument } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';

interface CaseSourcesViewProps {
  caseId: string;
  selectedDocIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function CaseSourcesView({ caseId, selectedDocIds, onSelectionChange }: CaseSourcesViewProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [sources, setSources] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const res = await workspaceApi.getCaseDocumentsPaginated(caseId, { page: 1, limit: 100 });
      const docs = res.documents ?? [];
      setSources(docs);
      if (selectedDocIds.size === 0) {
        const indexed = docs.filter((d) => d.indexingStatus === 'INDEXING_COMPLETED' || d.indexingStatus === 'INDEXED');
        onSelectionChange(new Set(indexed.map((d) => d.id)));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [caseId]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const toggleDoc = (id: string) => {
    const next = new Set(selectedDocIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange(next);
  };

  const getStatusInfo = (status?: string | null) => {
    switch (status) {
      case 'INDEXING_COMPLETED':
      case 'INDEXED':
        return { label: 'Indexed', color: colors.success, icon: 'checkmark-circle' as const };
      case 'INDEXING_RUNNING':
      case 'INDEXING':
        return { label: 'Indexing…', color: colors.warning, icon: 'time' as const };
      case 'INDEXING_FAILED':
        return { label: 'Failed', color: colors.error, icon: 'alert-circle' as const };
      default:
        return { label: 'Pending', color: colors.ledgerGray[400], icon: 'ellipse' as const };
    }
  };

  const fileIcon = (doc: CaseDocument): keyof typeof Ionicons.glyphMap => {
    const ext = (doc.fileType ?? doc.originalFilename?.split('.').pop() ?? '').toUpperCase();
    if (ext === 'PDF') return 'document-text';
    if (['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(ext)) return 'image-outline';
    return 'document-outline';
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/*'],
        multiple: true,
      });
      if (result.canceled || !result.assets?.length) return;
      setUploading(true);
      for (const asset of result.assets) {
        await workspaceApi.uploadDocument(caseId, {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? 'application/octet-stream',
        });
      }
      await fetchSources();
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Could not upload file');
    } finally {
      setUploading(false);
    }
  };

  const indexedCount = sources.filter((d) => d.indexingStatus === 'INDEXING_COMPLETED' || d.indexingStatus === 'INDEXED').length;

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
        <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
          Sources
        </Text>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>
          {selectedDocIds.size} of {indexedCount} indexed selected
        </Text>
      </View>

      {loading ? (
        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.kxPrimary[600]} />
        </View>
      ) : sources.length === 0 ? (
        <View style={{ padding: spacing['2xl'], alignItems: 'center' }}>
          <Ionicons name="folder-open-outline" size={32} color={colors.ledgerGray[300]} />
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
            No documents yet.{'\n'}Tap "Add a source" to upload.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSources(); }} tintColor={colors.kxPrimary[600]} />}
        >
          {sources.map((doc) => {
            const isSelected = selectedDocIds.has(doc.id);
            const status = getStatusInfo(doc.indexingStatus);
            const isIndexed = doc.indexingStatus === 'INDEXING_COMPLETED' || doc.indexingStatus === 'INDEXED';
            return (
              <Pressable
                key={doc.id}
                onPress={() => toggleDoc(doc.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
                  backgroundColor: pressed ? colors.ledgerGray[50] : 'transparent',
                  borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder,
                })}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 4, marginRight: spacing.md,
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.kxPrimary[600] : colors.ledgerGray[300],
                  backgroundColor: isSelected ? colors.kxPrimary[600] : 'transparent',
                  justifyContent: 'center', alignItems: 'center',
                  opacity: isIndexed ? 1 : 0.4,
                }}>
                  {isSelected && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
                </View>
                <Ionicons name={fileIcon(doc)} size={18} color={colors.kxPrimary[600]} style={{ marginRight: spacing.sm }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                    {doc.name ?? doc.originalFilename ?? 'Document'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name={status.icon} size={12} color={status.color} />
                  <Text style={{ fontSize: typography.fontSize.xs, color: status.color }}>{status.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Add Source button */}
      <Pressable
        onPress={handleUpload}
        disabled={uploading}
        accessibilityRole="button"
        accessibilityLabel="Add a source"
        style={({ pressed }) => ({
          position: 'absolute', bottom: spacing.lg, right: spacing.lg,
          flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingVertical: 12, paddingHorizontal: spacing.lg,
          borderRadius: radius.full,
          backgroundColor: pressed ? colors.kxPrimary[700] : colors.kxPrimary[600],
          opacity: uploading ? 0.7 : 1,
          shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        })}
      >
        {uploading
          ? <ActivityIndicator size="small" color={colors.onPrimary} />
          : <Ionicons name="add" size={18} color={colors.onPrimary} />
        }
        <Text style={{ color: colors.onPrimary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>
          {uploading ? 'Uploading…' : 'Add a source'}
        </Text>
      </Pressable>
    </View>
  );
}
