import { useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { docProcessingApi } from '@knowlex/core/api/doc-processing-api';
import { downloadDocument } from '@knowlex/core/api/doc-processing-api';
import type { ProcessedDocumentInfo } from '@knowlex/core/api/doc-processing-api';
import { useTheme } from '@/theme/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Props { visible: boolean; onClose: () => void; documentId: string; documentName: string; }

export function SplitSheet({ visible, onClose, documentId, documentName }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const [pageRanges, setPageRanges] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedDocumentInfo[] | null>(null);

  const handleSplit = async () => {
    setProcessing(true);
    try {
      const res = await docProcessingApi.split({ documentId, pageRanges: pageRanges.trim() || undefined });
      setResults(res.data.documents);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Split failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (doc: ProcessedDocumentInfo) => {
    try {
      await downloadDocument(doc.downloadUrl ?? doc.id, doc.fileName);
    } catch {
      Alert.alert('Error', 'Download failed');
    }
  };

  const reset = () => { setPageRanges(''); setResults(null); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={reset}>
      <View style={{ flex: 1, backgroundColor: colors.kxSurface, paddingTop: 60, paddingHorizontal: spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing['2xl'] }}>
          <Pressable onPress={reset}><Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.base }}>Cancel</Text></Pressable>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>Split PDF</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginBottom: spacing.lg }} numberOfLines={1}>{documentName}</Text>

        {!results ? (
          <>
            <Input
              label="Page Ranges"
              placeholder="e.g. 1-3, 5, 7-9 (leave blank for all)"
              value={pageRanges}
              onChangeText={setPageRanges}
              keyboardType="default"
            />
            <Button title={processing ? 'Splitting...' : 'Split Document'} onPress={handleSplit} loading={processing} disabled={processing} />
          </>
        ) : (
          <>
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginBottom: spacing.md }}>
              {results.length} file{results.length !== 1 ? 's' : ''} created
            </Text>
            {results.map((doc, i) => (
              <Card key={doc.id} style={{ marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary }} numberOfLines={1}>{doc.fileName}</Text>
                  <Text style={{ fontSize: 11, color: colors.kxTextSecondary }}>{doc.pageCount} pages</Text>
                </View>
                <Pressable onPress={() => handleDownload(doc)}>
                  <Text style={{ color: colors.kxPrimary[600], fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm }}>Save</Text>
                </Pressable>
              </Card>
            ))}
            <Button title="Done" onPress={reset} variant="outline" style={{ marginTop: spacing.xl }} />
          </>
        )}
      </View>
    </Modal>
  );
}
