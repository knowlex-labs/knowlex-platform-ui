import { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import type { CaseDocument } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/components/ui/Button';

interface SourcesSheetProps {
  visible: boolean;
  onClose: () => void;
  caseId: string;
  selectedDocIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function SourcesSheet({ visible, onClose, caseId, selectedDocIds, onSelectionChange }: SourcesSheetProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [sources, setSources] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const res = await workspaceApi.getCaseDocumentsPaginated(caseId, { page: 1, limit: 100 });
      const docs = res.documents ?? [];
      setSources(docs);
      // Auto-select indexed docs if nothing selected yet
      if (selectedDocIds.size === 0) {
        const indexed = docs.filter((d) =>
          d.indexingStatus === 'INDEXING_COMPLETED' || d.indexingStatus === 'INDEXED'
        );
        onSelectionChange(new Set(indexed.map((d) => d.id)));
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (visible) fetchSources();
  }, [visible, fetchSources]);

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
        return { label: 'Indexing...', color: colors.warning, icon: 'time' as const };
      case 'INDEXING_FAILED':
        return { label: 'Failed', color: colors.error, icon: 'alert-circle' as const };
      default:
        return { label: 'Pending', color: colors.ledgerGray[400], icon: 'ellipse' as const };
    }
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
        const file = { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' } as unknown as Blob;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('caseId', caseId);
        const { env } = (await import('@knowlex/core/api/runtime')).getAdapters();
        const { getAuthHeaders } = await import('@knowlex/core/api/auth-headers');
        await fetch(`${env.apiBaseUrl}/api/v1/documents/upload`, {
          method: 'POST', headers: getAuthHeaders(), body: formData,
        });
      }
      await fetchSources();
    } catch (err: unknown) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Could not upload file');
    } finally {
      setUploading(false);
    }
  };

  const indexedCount = sources.filter((d) =>
    d.indexingStatus === 'INDEXING_COMPLETED' || d.indexingStatus === 'INDEXED'
  ).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: colors.kxCardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
            maxHeight: '75%', paddingBottom: 40,
          }}
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ledgerGray[300] }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
            <View>
              <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
                Sources
              </Text>
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }}>
                {selectedDocIds.size} of {indexedCount} indexed selected
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>Done</Text>
            </Pressable>
          </View>

          {/* Upload Button */}
          <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
            <Button
              title={uploading ? 'Uploading...' : '+ Upload Document'}
              onPress={handleUpload}
              loading={uploading}
              variant="outline"
            />
          </View>

          {/* Source List */}
          {loading ? (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.kxPrimary[600]} />
            </View>
          ) : sources.length === 0 ? (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary }}>No documents yet</Text>
            </View>
          ) : (
            <ScrollView>
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
                      paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
                      backgroundColor: pressed ? colors.ledgerGray[50] : 'transparent',
                      borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder,
                    })}
                  >
                    {/* Checkbox */}
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

                    {/* Doc info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                        {doc.name ?? doc.originalFilename ?? 'Document'}
                      </Text>
                    </View>

                    {/* Status */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name={status.icon} size={12} color={status.color} />
                      <Text style={{ fontSize: typography.fontSize.xs, color: status.color }}>{status.label}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
