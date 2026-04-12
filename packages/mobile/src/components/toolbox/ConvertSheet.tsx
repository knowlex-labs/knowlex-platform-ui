import { useState } from 'react';
import { View, Text, Modal, Pressable, Alert } from 'react-native';
import { docProcessingApi, downloadDocument } from '@knowlex/core/api/doc-processing-api';
import type { ProcessedDocumentInfo, ConvertTargetFormat } from '@knowlex/core/api/doc-processing-api';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Props { visible: boolean; onClose: () => void; documentId: string; documentName: string; }

const FORMATS: { key: ConvertTargetFormat; label: string; icon: string }[] = [
  { key: 'PDF', label: 'PDF', icon: '📕' },
  { key: 'PNG', label: 'PNG Image', icon: '🖼️' },
  { key: 'JPEG', label: 'JPEG Image', icon: '🖼️' },
  { key: 'TEXT', label: 'Plain Text', icon: '📝' },
];

export function ConvertSheet({ visible, onClose, documentId, documentName }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const [format, setFormat] = useState<ConvertTargetFormat>('PDF');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedDocumentInfo[] | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const handleConvert = async () => {
    setProcessing(true);
    try {
      const res = await docProcessingApi.convert({ documentId, targetFormat: format });
      setResults(res.data.documents);
      if (res.data.textContent) setTextContent(res.data.textContent);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setResults(null); setTextContent(null); setFormat('PDF'); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={reset}>
      <View style={{ flex: 1, backgroundColor: colors.kxSurface, paddingTop: 60, paddingHorizontal: spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing['2xl'] }}>
          <Pressable onPress={reset}><Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.base }}>Cancel</Text></Pressable>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>Convert</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginBottom: spacing.xl }} numberOfLines={1}>{documentName}</Text>

        {!results ? (
          <>
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginBottom: spacing.md }}>Target Format</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing['2xl'] }}>
              {FORMATS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFormat(f.key)}
                  style={{
                    flex: 1, minWidth: '40%', paddingVertical: spacing.lg, paddingHorizontal: spacing.md,
                    borderRadius: radius.lg, borderWidth: 2, alignItems: 'center',
                    borderColor: format === f.key ? colors.kxPrimary[600] : colors.kxCardBorder,
                    backgroundColor: format === f.key ? colors.kxPrimary[50] : colors.kxCardBg,
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>{f.icon}</Text>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
            <Button title={processing ? 'Converting...' : 'Convert'} onPress={handleConvert} loading={processing} disabled={processing} />
          </>
        ) : (
          <>
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.success, marginBottom: spacing.md }}>Conversion complete</Text>
            {results.map((doc) => (
              <Card key={doc.id} style={{ marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, flex: 1 }} numberOfLines={1}>{doc.fileName}</Text>
                <Pressable onPress={() => downloadDocument(doc.downloadUrl ?? doc.id, doc.fileName).catch(() => Alert.alert('Error', 'Download failed'))}>
                  <Text style={{ color: colors.kxPrimary[600], fontWeight: typography.fontWeight.semibold }}>Save</Text>
                </Pressable>
              </Card>
            ))}
            {textContent && (
              <Card style={{ marginTop: spacing.md, maxHeight: 200 }}>
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextPrimary, fontFamily: 'monospace' }} numberOfLines={20}>{textContent}</Text>
              </Card>
            )}
            <Button title="Done" onPress={reset} variant="outline" style={{ marginTop: spacing.xl }} />
          </>
        )}
      </View>
    </Modal>
  );
}
