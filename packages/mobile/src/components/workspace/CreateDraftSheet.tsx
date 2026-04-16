import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import { draftsApi } from '@knowlex/core/api/drafts-api';
import { caseApi } from '@knowlex/core/api/case-api';
import { mapBackendCase } from '@knowlex/core/mappers';
import { buildCreateDraftPayload, TEMPLATE_TO_SUB_TYPE } from '@knowlex/core/api/draft-helpers';
import { DRAFT_TEMPLATES } from '@knowlex/core/types';
import type { DraftTemplate, TemplateField, TemplateFormData, CaseDocument, Case } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/components/ui/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  /**
   * When provided, the case is **locked** to this value (used by the case-workspace
   * entry points). When omitted (Drafts tab entry), the user picks a case inside
   * the form, or leaves it empty for a standalone draft.
   */
  caseId?: string;
  /** When set, skip the template grid and open the form directly. */
  templateId?: string;
  onCreated: () => void;
}

type Step = 'template' | 'details';

export function CreateDraftSheet({ visible, onClose, caseId: lockedCaseId, templateId, onCreated }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const [step, setStep] = useState<Step>(templateId ? 'details' : 'template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templateId ?? null);
  const [formData, setFormData] = useState<TemplateFormData>({});

  // Case selection lives inside the form when no case is locked by the parent.
  const caseLocked = !!lockedCaseId;
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(lockedCaseId ?? null);
  const [cases, setCases] = useState<Case[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [caseSearch, setCaseSearch] = useState('');

  const [sources, setSources] = useState<CaseDocument[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate: DraftTemplate | null = useMemo(
    () => (selectedTemplateId ? DRAFT_TEMPLATES.find((t) => t.id === selectedTemplateId) ?? null : null),
    [selectedTemplateId]
  );

  const selectedCase = useMemo(
    () => (selectedCaseId ? cases.find((c) => c.id === selectedCaseId) ?? null : null),
    [selectedCaseId, cases]
  );

  // Reset when the sheet is opened or the incoming props change.
  useEffect(() => {
    if (!visible) return;
    setStep(templateId ? 'details' : 'template');
    setSelectedTemplateId(templateId ?? null);
    setSelectedCaseId(lockedCaseId ?? null);
    setError(null);
    setGenerating(false);
  }, [visible, templateId, lockedCaseId]);

  // Seed form defaults when a template is selected.
  useEffect(() => {
    if (!selectedTemplate) return;
    setFormData({
      title: selectedTemplate.name,
      language: 'english',
    });
  }, [selectedTemplate]);

  // Fetch cases once when opened (only needed when the user can pick one).
  useEffect(() => {
    if (!visible || caseLocked) return;
    setCasesLoading(true);
    caseApi.getAll({ page: 0, size: 50 })
      .then((res) => {
        const content = res?.data?.content ?? [];
        setCases(content.map(mapBackendCase));
      })
      .catch(() => { /* picker shows empty list; harmless */ })
      .finally(() => setCasesLoading(false));
  }, [visible, caseLocked]);

  // Load indexed source documents for the selected case (locked or picked).
  const fetchSources = useCallback((cid: string) => {
    workspaceApi.getCaseDocumentsPaginated(cid, { page: 1, limit: 100 })
      .then((res) => {
        // Backend returns 'INDEXING_COMPLETED' or 'INDEXED' as strings; the generated
        // type only lists PENDING/RUNNING/FAILED/CANCELLED/undefined, so cast to string.
        const indexed = (res.documents ?? []).filter((d) => {
          const s = d.indexingStatus as unknown as string | undefined;
          return s === 'INDEXING_COMPLETED' || s === 'INDEXED';
        });
        setSources(indexed);
        setSelectedSourceIds(new Set(indexed.map((d) => d.id)));
      })
      .catch(() => { /* selector stays empty; harmless */ });
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (selectedCaseId) {
      fetchSources(selectedCaseId);
    } else {
      setSources([]);
      setSelectedSourceIds(new Set());
    }
  }, [visible, selectedCaseId, fetchSources]);

  const filteredCases = useMemo(() => {
    const q = caseSearch.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) =>
      (c.caseTitle ?? '').toLowerCase().includes(q) ||
      (c.caseNumber ?? '').toLowerCase().includes(q)
    );
  }, [cases, caseSearch]);

  const setField = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setStep(templateId ? 'details' : 'template');
    setSelectedTemplateId(templateId ?? null);
    setSelectedCaseId(lockedCaseId ?? null);
    setFormData({});
    setCaseSearch('');
    setCasePickerOpen(false);
    setError(null);
    onClose();
  };

  const title = (formData.title as string | undefined)?.trim() ?? '';
  const canGenerate = !!selectedTemplate && title.length > 0 && !generating;

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    if (!title) { setError('Please enter a title'); return; }

    setGenerating(true);
    setError(null);
    try {
      // Source IDs only apply when a case is selected — standalone drafts have no case docs.
      const fileIds = selectedCaseId ? Array.from(selectedSourceIds) : [];
      const payload = buildCreateDraftPayload(
        selectedTemplate.id,
        formData,
        fileIds,
        selectedTemplate.name
      );

      if (selectedCaseId) {
        // workspaceApi.createDocument expects a data bag with title/document_type/input_mode
        // as required keys plus arbitrary extras — buildCreateDraftPayload already returns that shape.
        const data = {
          title: payload.title,
          document_type: payload.document_type,
          input_mode: payload.input_mode,
          ...(payload.subtype && { subtype: payload.subtype }),
          ...(payload.freetext_body && { freetext_body: payload.freetext_body }),
          ...(payload.file_ids && { file_ids: payload.file_ids }),
          ...(payload.language && { language: payload.language }),
          ...(payload.config && { config: payload.config }),
        };
        await workspaceApi.createDocument(selectedCaseId, {
          document_type: payload.document_type,
          sub_type: payload.subtype ?? TEMPLATE_TO_SUB_TYPE[selectedTemplate.id],
          data,
        });
      } else {
        // Standalone — no case id. Mirrors web's drafting-page behaviour.
        await draftsApi.createStandalone(payload);
      }
      onCreated();
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Draft generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const value = (formData[field.id] as string | undefined) ?? '';

    if (field.type === 'sources') {
      // Standalone drafts have no case context — skip the sources field entirely.
      if (!selectedCaseId) return null;
      return (
        <View key={field.id} style={{ marginBottom: spacing.lg }}>
          <FieldLabel field={field} colors={colors} typography={typography} spacing={spacing} />
          {sources.length === 0 ? (
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>No indexed documents in this case.</Text>
          ) : (
            sources.map((doc) => {
              const isSelected = selectedSourceIds.has(doc.id);
              return (
                <Pressable
                  key={doc.id}
                  onPress={() => toggleSource(doc.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: spacing.sm }}
                  accessibilityLabel={`Toggle ${doc.name ?? 'document'}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
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
            })
          )}
        </View>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <View key={field.id} style={{ marginBottom: spacing.lg }}>
          <FieldLabel field={field} colors={colors} typography={typography} spacing={spacing} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {field.options.map((opt) => {
              const active = value === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setField(field.id, opt.value)}
                  style={{
                    paddingHorizontal: spacing.md, paddingVertical: 6,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: active ? colors.kxPrimary[600] : colors.kxCardBorder,
                    backgroundColor: active ? colors.kxPrimary[600] : colors.kxCardBg,
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={{
                    fontSize: typography.fontSize.xs, fontWeight: '600',
                    color: active ? colors.onPrimary : colors.kxTextPrimary,
                  }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }

    // text / textarea / client-select — all render as a TextInput with varying multiline behaviour.
    const multiline = field.type === 'textarea' || field.type === 'client-select';
    const minHeight = multiline ? 84 : 40;

    return (
      <View key={field.id} style={{ marginBottom: spacing.lg }}>
        <FieldLabel field={field} colors={colors} typography={typography} spacing={spacing} />
        <TextInput
          value={value}
          onChangeText={(t) => setField(field.id, t)}
          placeholder={field.placeholder}
          placeholderTextColor={colors.ledgerGray[400]}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={{
            backgroundColor: colors.kxCardBg,
            borderWidth: 1,
            borderColor: colors.kxCardBorder,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: multiline ? 10 : 8,
            fontSize: typography.fontSize.sm,
            color: colors.kxTextPrimary,
            minHeight,
          }}
          accessibilityLabel={field.label}
        />
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={reset} presentationStyle="fullScreen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.sm,
          borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder, backgroundColor: colors.kxCardBg,
        }}>
          <Pressable
            onPress={step === 'details' && !templateId ? () => setStep('template') : reset}
            hitSlop={8}
            accessibilityLabel={step === 'details' && !templateId ? 'Back to templates' : 'Cancel'}
          >
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: '600' }}>
              {step === 'details' && !templateId ? '← Back' : 'Cancel'}
            </Text>
          </Pressable>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }} numberOfLines={1}>
            {step === 'template' ? 'Choose Template' : selectedTemplate?.name ?? 'Draft Details'}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {step === 'template' ? (
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['2xl'] }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {DRAFT_TEMPLATES.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => { setSelectedTemplateId(t.id); setStep('details'); }}
                  style={({ pressed }) => ({
                    width: '47%',
                    paddingVertical: spacing.lg, paddingHorizontal: spacing.md,
                    borderRadius: radius.lg,
                    backgroundColor: pressed ? colors.kxPrimary[50] : colors.kxCardBg,
                    borderWidth: 1, borderColor: colors.kxCardBorder,
                  })}
                >
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={2}>
                    {t.name}
                  </Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 4 }} numberOfLines={2}>
                    {t.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : !selectedTemplate ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.kxTextSecondary} />
            <Text style={{ color: colors.kxTextPrimary, fontSize: typography.fontSize.base, marginTop: spacing.sm, textAlign: 'center' }}>
              Unknown template
            </Text>
            <Pressable onPress={reset} style={{ marginTop: spacing.lg }}>
              <Text style={{ color: colors.kxPrimary[600], fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['2xl'] }}
              keyboardShouldPersistTaps="handled"
            >
              {error && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.kxCardBg, borderWidth: 1, borderColor: colors.error, marginBottom: spacing.lg }}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={{ flex: 1, color: colors.kxTextPrimary, fontSize: typography.fontSize.xs }}>{error}</Text>
                </View>
              )}
              <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.xs, marginBottom: spacing.md }}>
                {selectedTemplate.description}
              </Text>

              {/* Link to Case — first row of the form, always visible. Locked when parent passes caseId. */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{ color: colors.kxTextPrimary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, marginBottom: spacing.xs }}>
                  Link to Case{' '}
                  <Text style={{ color: colors.kxTextSecondary, fontWeight: typography.fontWeight.normal }}>(optional)</Text>
                </Text>
                <Pressable
                  onPress={caseLocked ? undefined : () => setCasePickerOpen(true)}
                  disabled={caseLocked}
                  accessibilityLabel="Link to case"
                  accessibilityRole="button"
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: colors.kxCardBg,
                    borderWidth: 1, borderColor: colors.kxCardBorder, borderRadius: radius.md,
                    paddingHorizontal: spacing.md, paddingVertical: 12,
                    opacity: caseLocked ? 0.8 : 1,
                  }}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Ionicons
                      name={selectedCase ? 'briefcase' : 'briefcase-outline'}
                      size={16}
                      color={selectedCase ? colors.kxPrimary[600] : colors.kxTextSecondary}
                    />
                    <Text
                      style={{ flex: 1, fontSize: typography.fontSize.sm, color: selectedCase ? colors.kxTextPrimary : colors.kxTextSecondary }}
                      numberOfLines={1}
                    >
                      {selectedCase ? (selectedCase.caseTitle ?? 'Untitled Case') : 'No case — standalone draft'}
                    </Text>
                  </View>
                  {!caseLocked && <Ionicons name="chevron-down" size={16} color={colors.kxTextSecondary} />}
                </Pressable>
              </View>

              {selectedTemplate.fields.map(renderField)}
            </ScrollView>

            {/* Case picker sub-modal */}
            <Modal visible={casePickerOpen} transparent animationType="fade" onRequestClose={() => setCasePickerOpen(false)}>
              <Pressable
                onPress={() => setCasePickerOpen(false)}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.xl }}
              >
                <Pressable
                  onPress={() => { /* stop propagation */ }}
                  style={{ backgroundColor: colors.kxSurface, borderRadius: radius.lg, maxHeight: '80%', overflow: 'hidden' }}
                >
                  <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
                    <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, marginBottom: spacing.sm }}>
                      Link to Case
                    </Text>
                    <TextInput
                      value={caseSearch}
                      onChangeText={setCaseSearch}
                      placeholder="Search cases..."
                      placeholderTextColor={colors.ledgerGray[400]}
                      style={{
                        backgroundColor: colors.kxCardBg,
                        borderWidth: 1, borderColor: colors.kxCardBorder, borderRadius: radius.md,
                        paddingHorizontal: spacing.md, paddingVertical: 8,
                        fontSize: typography.fontSize.sm, color: colors.kxTextPrimary,
                      }}
                    />
                  </View>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    <Pressable
                      onPress={() => { setSelectedCaseId(null); setCasePickerOpen(false); }}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                        backgroundColor: pressed ? colors.kxPrimary[50] : 'transparent',
                        borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder,
                      })}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={colors.kxTextSecondary} />
                      <Text style={{ flex: 1, fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, fontWeight: typography.fontWeight.medium }}>
                        No case — standalone draft
                      </Text>
                      {selectedCaseId === null && <Ionicons name="checkmark" size={16} color={colors.kxPrimary[600]} />}
                    </Pressable>
                    {casesLoading && (
                      <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={colors.kxPrimary[600]} />
                      </View>
                    )}
                    {!casesLoading && filteredCases.length === 0 && (
                      <Text style={{ padding: spacing.lg, color: colors.kxTextSecondary, fontSize: typography.fontSize.sm }}>
                        {caseSearch ? 'No cases match your search.' : 'No cases yet.'}
                      </Text>
                    )}
                    {filteredCases.map((c) => {
                      const active = c.id === selectedCaseId;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => { setSelectedCaseId(c.id); setCasePickerOpen(false); }}
                          style={({ pressed }) => ({
                            paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                            flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                            backgroundColor: pressed ? colors.kxPrimary[50] : 'transparent',
                            borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder,
                          })}
                        >
                          <Ionicons name="briefcase-outline" size={16} color={colors.kxTextSecondary} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, fontWeight: typography.fontWeight.medium }} numberOfLines={1}>
                              {c.caseTitle ?? 'Untitled Case'}
                            </Text>
                            {c.caseNumber && (
                              <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }} numberOfLines={1}>
                                {c.caseNumber}
                              </Text>
                            )}
                          </View>
                          {active && <Ionicons name="checkmark" size={16} color={colors.kxPrimary[600]} />}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Sticky footer */}
            <View style={{
              paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
              borderTopWidth: 1, borderTopColor: colors.kxCardBorder, backgroundColor: colors.kxCardBg,
            }}>
              <Button
                title={generating ? 'Generating...' : `Generate ${selectedTemplate.name}`}
                onPress={handleGenerate}
                loading={generating}
                disabled={!canGenerate}
              />
              {generating && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 }}>
                  <ActivityIndicator size="small" color={colors.kxPrimary[500]} />
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>This may take a minute…</Text>
                </View>
              )}
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function FieldLabel({
  field, colors, typography, spacing,
}: {
  field: TemplateField;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  return (
    <Text style={{
      color: colors.kxTextPrimary, fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium, marginBottom: spacing.xs,
    }}>
      {field.label}
      {field.required && <Text style={{ color: colors.error }}> *</Text>}
    </Text>
  );
}
