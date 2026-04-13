import { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import type { CaseDocument } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  caseId: string;
  onCreated: () => void;
}

const TEMPLATES = [
  { id: 'notice', name: 'Legal Notice', docType: 'legal_notice', subType: 'demand', icon: '📋' },
  { id: 'affidavit', name: 'Affidavit', docType: 'affidavit', subType: 'plaint', icon: '📜' },
  { id: 'bail-application', name: 'Bail Application', docType: 'bail_application', icon: '⚖️' },
  { id: 'plaint', name: 'Plaint', docType: 'application', subType: 'plaint', icon: '📝' },
  { id: 'written-statement', name: 'Written Statement', docType: 'written_statement', icon: '✍️' },
  { id: 'writ-petition', name: 'Writ Petition', docType: 'petition', subType: 'writ_petition', icon: '📑' },
  { id: 'criminal-appeal', name: 'Criminal Appeal', docType: 'criminal_appeal', icon: '🏛️' },
  { id: 'anticipatory-bail', name: 'Anticipatory Bail', docType: 'anticipatory_bail', icon: '🛡️' },
  { id: 'written-arguments', name: 'Written Arguments', docType: 'written_arguments', icon: '💬' },
  { id: 'slp', name: 'SLP', docType: 'slp', icon: '📄' },
  { id: 'consumer-complaint', name: 'Consumer Complaint', docType: 'consumer_complaint', icon: '🛒' },
  { id: 'revision-petition', name: 'Revision Petition', docType: 'revision_petition', icon: '🔄' },
];

type Step = 'template' | 'details';

export function CreateDraftSheet({ visible, onClose, caseId, onCreated }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [title, setTitle] = useState('');
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

  const handleGenerate = async () => {
    if (!selectedTemplate || !title.trim()) {
      Alert.alert('Missing Info', 'Please enter a title');
      return;
    }

    setGenerating(true);
    try {
      const fileIds = Array.from(selectedSourceIds);
      await workspaceApi.createDocument(caseId, {
        document_type: selectedTemplate.docType,
        sub_type: selectedTemplate.subType,
        data: {
          title: title.trim(),
          document_type: selectedTemplate.docType,
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

  const reset = () => {
    setStep('template');
    setSelectedTemplate(null);
    setTitle('');
    onClose();
  };

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={reset}>
      <View style={{ flex: 1, backgroundColor: colors.kxSurface, paddingTop: 56 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
          <Pressable onPress={step === 'details' ? () => setStep('template') : reset}>
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.base }}>
              {step === 'details' ? '← Back' : 'Cancel'}
            </Text>
          </Pressable>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
            {step === 'template' ? 'Choose Template' : 'Draft Details'}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {step === 'template' ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {TEMPLATES.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => { setSelectedTemplate(t); setTitle(t.name); setStep('details'); }}
                  style={({ pressed }) => ({
                    width: '47%',
                    paddingVertical: spacing.lg,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.lg,
                    backgroundColor: pressed ? colors.kxPrimary[50] : colors.kxCardBg,
                    borderWidth: 1,
                    borderColor: colors.kxCardBorder,
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing.sm }}>{t.icon}</Text>
                  <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary, textAlign: 'center' }} numberOfLines={2}>
                    {t.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] }}>
            <Input label="Draft Title" placeholder="Enter a title" value={title} onChangeText={setTitle} />

            {sources.length > 0 && (
              <>
                <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginBottom: spacing.sm }}>
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
              title={generating ? 'Generating...' : `Generate ${selectedTemplate?.name ?? 'Draft'}`}
              onPress={handleGenerate}
              loading={generating}
              disabled={generating || !title.trim()}
              style={{ marginTop: spacing.xl }}
            />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
