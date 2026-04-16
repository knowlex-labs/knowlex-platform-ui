import { useState } from 'react';
import { View, Text, Modal, Pressable, Alert } from 'react-native';
import { docProcessingApi, downloadDocument } from '@knowlex/core/api/doc-processing-api';
import type { ProcessedDocumentInfo } from '@knowlex/core/api/doc-processing-api';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Quality = 'low' | 'medium' | 'high';
interface Props { visible: boolean; onClose: () => void; documentId: string; documentName: string; }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CompressSheet({ visible, onClose, documentId, documentName }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const [quality, setQuality] = useState<Quality>('medium');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedDocumentInfo | null>(null);

  const handleCompress = async () => {
    setProcessing(true);
    try {
      const res = await docProcessingApi.compress({ documentId, quality });
      setResult(res.data.document);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Compression failed');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setResult(null); setQuality('medium'); onClose(); };

  const qualities: { key: Quality; label: string; desc: string }[] = [
    { key: 'high', label: 'High', desc: 'Best quality, larger file' },
    { key: 'medium', label: 'Medium', desc: 'Balanced quality and size' },
    { key: 'low', label: 'Low', desc: 'Smallest file, lower quality' },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={reset}>
      <View style={{ flex: 1, backgroundColor: colors.kxSurface, paddingTop: 60, paddingHorizontal: spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing['2xl'] }}>
          <Pressable onPress={reset}><Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.base }}>Cancel</Text></Pressable>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>Compress</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginBottom: spacing.xl }} numberOfLines={1}>{documentName}</Text>

        {!result ? (
          <>
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginBottom: spacing.md }}>Quality</Text>
            {qualities.map((q) => (
              <Pressable
                key={q.key}
                onPress={() => setQuality(q.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
                  borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder,
                }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                  borderColor: quality === q.key ? colors.kxPrimary[600] : colors.ledgerGray[300],
                  justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
                }}>
                  {quality === q.key && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.kxPrimary[600] }} />}
                </View>
                <View>
                  <Text style={{ fontSize: typography.fontSize.base, color: colors.kxTextPrimary, fontWeight: typography.fontWeight.medium }}>{q.label}</Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>{q.desc}</Text>
                </View>
              </Pressable>
            ))}
            <Button title={processing ? 'Compressing...' : 'Compress'} onPress={handleCompress} loading={processing} disabled={processing} style={{ marginTop: spacing['2xl'] }} />
          </>
        ) : (
          <Card>
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.success, marginBottom: spacing.sm }}>Compressed successfully</Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary }}>{result.fileName}</Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 4 }}>{formatSize(result.fileSize)}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
              <Button title="Save" onPress={() => downloadDocument(result.downloadUrl ?? result.id, result.fileName).catch(() => Alert.alert('Error', 'Download failed'))} style={{ flex: 1 }} />
              <Button title="Done" onPress={reset} variant="outline" style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      </View>
    </Modal>
  );
}
