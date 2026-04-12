import { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { submitTranslation, getDocument, downloadDocument } from '@knowlex/core/api/doc-processing-api';
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/components/ui/Button';

interface Props { visible: boolean; onClose: () => void; documentId: string; documentName: string; }

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali',
  'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Odia',
];

export function TranslateSheet({ visible, onClose, documentId, documentName }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const [targetLang, setTargetLang] = useState('Hindi');
  const [processing, setProcessing] = useState(false);
  const [polling, setPolling] = useState(false);
  const [result, setResult] = useState<DocumentRecord | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleTranslate = async () => {
    setProcessing(true);
    try {
      const doc = await submitTranslation(documentId, targetLang);
      setProcessing(false);
      setPolling(true);

      // Poll for completion
      let count = 0;
      pollRef.current = setInterval(async () => {
        count++;
        if (count > 60) { clearInterval(pollRef.current!); setPolling(false); Alert.alert('Timeout', 'Translation is taking too long. Check back later.'); return; }
        try {
          const updated = await getDocument(doc.id);
          const status = (updated.jobStatus ?? '').toUpperCase();
          if (status === 'COMPLETED') {
            clearInterval(pollRef.current!);
            setPolling(false);
            setResult(updated);
          } else if (status === 'FAILED') {
            clearInterval(pollRef.current!);
            setPolling(false);
            Alert.alert('Failed', 'Translation failed. Please try again.');
          }
        } catch { /* continue polling */ }
      }, 4000);
    } catch (err: unknown) {
      setProcessing(false);
      Alert.alert('Error', err instanceof Error ? err.message : 'Translation failed');
    }
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setResult(null); setPolling(false); setProcessing(false); setTargetLang('Hindi'); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={reset}>
      <View style={{ flex: 1, backgroundColor: colors.kxSurface, paddingTop: 60, paddingHorizontal: spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing['2xl'] }}>
          <Pressable onPress={reset}><Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.base }}>Cancel</Text></Pressable>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>Translate</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginBottom: spacing.xl }} numberOfLines={1}>{documentName}</Text>

        {polling ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing['4xl'] }}>
            <ActivityIndicator size="large" color={colors.kxPrimary[600]} />
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginTop: spacing.xl }}>
              Translating to {targetLang}...
            </Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
              This may take a few minutes.{'\n'}You can close this and check back.
            </Text>
          </View>
        ) : result ? (
          <View>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.success, marginBottom: spacing.lg }}>Translation complete</Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, marginBottom: spacing.sm }}>{result.name}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
              <Button title="Save" onPress={() => downloadDocument(result.downloadUrl ?? result.id, result.name).catch(() => Alert.alert('Error', 'Download failed'))} style={{ flex: 1 }} />
              <Button title="Done" onPress={reset} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginBottom: spacing.md }}>Target Language</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => setTargetLang(lang)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
                    borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder,
                  }}
                >
                  <View style={{
                    width: 20, height: 20, borderRadius: 10, borderWidth: 2, marginRight: spacing.md,
                    borderColor: targetLang === lang ? colors.kxPrimary[600] : colors.ledgerGray[300],
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    {targetLang === lang && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.kxPrimary[600] }} />}
                  </View>
                  <Text style={{ fontSize: typography.fontSize.base, color: colors.kxTextPrimary }}>{lang}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button title={processing ? 'Starting...' : 'Translate'} onPress={handleTranslate} loading={processing} disabled={processing} style={{ marginTop: spacing.xl }} />
          </>
        )}
      </View>
    </Modal>
  );
}
