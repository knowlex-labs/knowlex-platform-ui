import { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { docProcessingApi, downloadDocument } from '@knowlex/core/api/doc-processing-api';
import type { ProcessedDocumentInfo } from '@knowlex/core/api/doc-processing-api';
import { useTheme } from '@/theme/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Props {
  visible: boolean;
  onClose: () => void;
  documentIds: string[];
  documentNames: string[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MergeSheet({ visible, onClose, documentIds, documentNames }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const [mergedTitle, setMergedTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedDocumentInfo | null>(null);

  const handleMerge = async () => {
    if (documentIds.length < 2) {
      Alert.alert('Error', 'Select at least 2 documents to merge');
      return;
    }
    setProcessing(true);
    try {
      const res = await docProcessingApi.merge({
        documentIds,
        mergedTitle: mergedTitle.trim() || undefined,
      });
      setResult(res.data.document);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Merge failed');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setMergedTitle('');
    setResult(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={reset}>
      <View style={{ flex: 1, backgroundColor: colors.kxSurface, paddingTop: 60, paddingHorizontal: spacing.xl }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing['2xl'] }}>
          <Pressable onPress={reset}>
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.base }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
            Merge PDFs
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {!result ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Document list */}
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginBottom: spacing.md }}>
              Documents to merge ({documentIds.length})
            </Text>
            {documentNames.map((name, i) => (
              <View
                key={documentIds[i]}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                  paddingVertical: spacing.md,
                  borderBottomWidth: i < documentNames.length - 1 ? 1 : 0,
                  borderBottomColor: colors.kxCardBorder,
                }}
              >
                <View style={{
                  width: 24, height: 24, borderRadius: radius.full,
                  backgroundColor: colors.kxPrimary[50], justifyContent: 'center', alignItems: 'center',
                }}>
                  <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.kxPrimary[600] }}>
                    {i + 1}
                  </Text>
                </View>
                <Ionicons name="document-text-outline" size={18} color={colors.kxPrimary[400]} />
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, flex: 1 }} numberOfLines={1}>
                  {name}
                </Text>
              </View>
            ))}

            {/* Title input */}
            <View style={{ marginTop: spacing.xl }}>
              <Input
                label="Output filename (optional)"
                placeholder="Merged document"
                value={mergedTitle}
                onChangeText={setMergedTitle}
              />
            </View>

            <Button
              title={processing ? 'Merging...' : 'Merge Documents'}
              onPress={handleMerge}
              loading={processing}
              disabled={processing || documentIds.length < 2}
              style={{ marginTop: spacing.xl }}
            />
          </ScrollView>
        ) : (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.success }}>
                Merged successfully
              </Text>
            </View>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary }}>{result.fileName}</Text>
            {result.pageCount != null && (
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: spacing.xs }}>
                {result.pageCount} pages • {formatSize(result.fileSize)}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
              <Button
                title="Save"
                onPress={() => downloadDocument(result.downloadUrl ?? result.id, result.fileName).catch(() => Alert.alert('Error', 'Download failed'))}
                style={{ flex: 1 }}
              />
              <Button title="Done" onPress={reset} variant="outline" style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      </View>
    </Modal>
  );
}
