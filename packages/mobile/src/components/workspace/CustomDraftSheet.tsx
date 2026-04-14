import { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import type { CaseDocument } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle?: string;
  onCreated: () => void;
}

export function CustomDraftSheet({ visible, onClose, caseId, caseTitle, onCreated }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('');
  const [instructions, setInstructions] = useState('');
  const [sources, setSources] = useState<CaseDocument[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!visible || !caseId) return;
    workspaceApi.getCaseDocumentsPaginated(caseId, { page: 1, limit: 100 }).then((res) => {
      const indexed = (res.documents ?? []).filter((d) =>
        d.indexingStatus === 'INDEXING_COMPLETED' || d.indexingStatus === 'INDEXED'
      );
      setSources(indexed);
      setSelectedSourceIds(new Set(indexed.map((d) => d.id)));
    }).catch(() => {});
  }, [visible, caseId]);

  const reset = () => {
    setTitle('');
    setDocType('');
    setInstructions('');
    onClose();
  };

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!title.trim() || !docType.trim() || !instructions.trim()) {
      Alert.alert('Missing Info', 'Please fill in title, type, and instructions.');
      return;
    }
    setGenerating(true);
    try {
      const fileIds = Array.from(selectedSourceIds);
      await workspaceApi.createDocument(caseId, {
        document_type: 'custom',
        data: {
          title: title.trim(),
          document_type: docType.trim(),
          instructions: instructions.trim(),
          input_mode: fileIds.length > 0 ? 'file' : 'freetext',
          file_ids: fileIds,
        } as Record<string, unknown>,
      });
      onCreated();
      reset();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Draft generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={reset}>
      <View style={{ flex: 1, backgroundColor: colors.kxSurface, paddingTop: 56 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
          <Pressable onPress={reset}>
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.base }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
            Custom Draft
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing['2xl'] }}>
          {/* Case (read-only) */}
          {caseTitle && (
            <View style={{
              backgroundColor: colors.kxCardBg, borderWidth: 1, borderColor: colors.kxCardBorder,
              borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
              marginBottom: spacing.lg,
            }}>
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>Case</Text>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, fontWeight: typography.fontWeight.medium, marginTop: 2 }} numberOfLines={1}>
                {caseTitle}
              </Text>
            </View>
          )}

          <Input label="Title" placeholder="e.g., Reply to opposing counsel" value={title} onChangeText={setTitle} />
          <Input label="Document Type" placeholder="e.g., Memorandum, Brief, Letter" value={docType} onChangeText={setDocType} />
          <Input
            label="Instructions"
            placeholder="Describe what you want the AI to draft..."
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={{ minHeight: 120, paddingTop: 12 }}
          />

          {sources.length > 0 && (
            <>
              <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                Source Documents ({selectedSourceIds.size} selected)
              </Text>
              {sources.map((doc) => {
                const isSelected = selectedSourceIds.has(doc.id);
                return (
                  <Pressable
                    key={doc.id}
                    onPress={() => toggleSource(doc.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: spacing.sm }}
                  >
                    <View style={{
                      width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
                      borderColor: isSelected ? colors.kxPrimary[600] : colors.ledgerGray[300],
                      backgroundColor: isSelected ? colors.kxPrimary[600] : 'transparent',
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      {isSelected && <Text style={{ color: colors.onPrimary, fontSize: typography.fontSize.xs, fontWeight: '700' }}>✓</Text>}
                    </View>
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextPrimary, flex: 1 }} numberOfLines={1}>
                      {doc.name ?? doc.originalFilename ?? 'Document'}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}

          <Button
            title={generating ? 'Generating...' : 'Generate Draft'}
            onPress={handleGenerate}
            loading={generating}
            disabled={generating || !title.trim() || !docType.trim() || !instructions.trim()}
            style={{ marginTop: spacing.xl }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
