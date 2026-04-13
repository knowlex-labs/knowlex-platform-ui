import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import type { CaseDocument } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { SourceItem } from './SourceItem';
import { FAB } from '@/components/ui/FAB';
import { ActionMenu, type ActionMenuItem } from '@/components/ui/ActionMenu';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

interface SourcesTabProps {
  caseId: string;
}

export function SourcesTab({ caseId }: SourcesTabProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const [sources, setSources] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<CaseDocument | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const res = await workspaceApi.getCaseDocumentsPaginated(caseId, { page: 1, limit: 100 });
      setSources(res.documents ?? []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [caseId]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/*'],
        multiple: true,
      });

      if (result.canceled || !result.assets?.length) return;

      setUploading(true);
      for (const asset of result.assets) {
        const file = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? 'application/octet-stream',
        } as unknown as Blob;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('caseId', caseId);

        const { env } = (await import('@knowlex/core/api/runtime')).getAdapters();
        const { getAuthHeaders } = await import('@knowlex/core/api/auth-headers');
        const response = await fetch(`${env.apiBaseUrl}/api/v1/documents/upload`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({} as Record<string, unknown>));
          throw new Error((errBody as Record<string, unknown>)?.message as string ?? `Upload failed: ${response.status}`);
        }
      }
      await fetchSources();
    } catch (err: unknown) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Could not upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await workspaceApi.deleteDocuments([docId]);
            setSources((prev) => prev.filter((s) => s.id !== docId));
          } catch {
            Alert.alert('Error', 'Failed to delete document');
          }
        },
      },
    ]);
  };

  const handleReindex = async (docId: string) => {
    try {
      await workspaceApi.triggerIndexing(caseId, docId);
      await fetchSources();
    } catch {
      Alert.alert('Error', 'Failed to trigger reindexing');
    }
  };

  const menuItems: ActionMenuItem[] = selectedSource
    ? [
        {
          label: 'View', icon: '👁️', onPress: () => {
            router.push({
              pathname: '/viewer',
              params: {
                docId: selectedSource.id,
                name: selectedSource.name ?? 'Document',
                downloadUrl: selectedSource.downloadUrl ?? '',
                signedUrl: selectedSource.signedUrl ?? '',
                fileType: selectedSource.fileType ?? '',
              },
            } as any);
          },
        },
        ...(selectedSource.indexingStatus === 'INDEXING_FAILED'
          ? [{ label: 'Reindex', icon: '🔄', onPress: () => handleReindex(selectedSource.id) }]
          : []),
        { label: 'Delete', icon: '🗑️', destructive: true, onPress: () => handleDelete(selectedSource.id) },
      ]
    : [];

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          {[1, 2, 3, 4].map((i) => <SkeletonLoader key={i} height={56} borderRadius={radius.md} />)}
        </View>
      ) : sources.length === 0 ? (
        <EmptyState
          title="No documents yet"
          message="Upload documents to start building your case"
          action={<Button title={uploading ? 'Uploading...' : 'Upload Document'} onPress={handleUpload} loading={uploading} />}
        />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSources(); }} tintColor={colors.kxPrimary[600]} />}
        >
          {uploading && (
            <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.kxPrimary[50] }}>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxPrimary[600], textAlign: 'center' }}>Uploading document...</Text>
            </View>
          )}
          {sources.map((source) => (
            <SourceItem
              key={source.id}
              name={source.name ?? source.originalFilename ?? 'Unnamed'}
              indexingStatus={source.indexingStatus}
              fileType={source.fileType}
              onLongPress={() => { setSelectedSource(source); setMenuVisible(true); }}
              onPress={() => {
                router.push({
                  pathname: '/viewer',
                  params: {
                    docId: source.id,
                    name: source.name ?? source.originalFilename ?? 'Document',
                    downloadUrl: source.downloadUrl ?? '',
                    signedUrl: source.signedUrl ?? '',
                    fileType: source.fileType ?? '',
                  },
                } as any);
              }}
            />
          ))}
        </ScrollView>
      )}

      {sources.length > 0 && <FAB icon="+" onPress={handleUpload} />}

      <ActionMenu
        visible={menuVisible}
        onClose={() => { setMenuVisible(false); setSelectedSource(null); }}
        title={selectedSource?.name ?? ''}
        items={menuItems}
      />
    </View>
  );
}
