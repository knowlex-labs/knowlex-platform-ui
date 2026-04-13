import { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api';
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api';
import { useTheme } from '@/theme/useTheme';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface DocumentPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (doc: DocumentRecord) => void;
  onSelectMultiple?: (docs: DocumentRecord[]) => void;
  multiSelect?: boolean;
  title?: string;
}

export function DocumentPickerSheet({
  visible,
  onClose,
  onSelect,
  onSelectMultiple,
  multiSelect = false,
  title = 'Select Document',
}: DocumentPickerSheetProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAllDocuments({
        page: 0,
        size: 100,
        search: search.trim() || undefined,
        sort: 'createdAt,desc',
      });
      setDocuments(res.documents);
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set());
      fetchDocs();
    }
  }, [visible, fetchDocs]);

  const handleSearch = () => {
    fetchDocs();
  };

  const handleTap = (doc: DocumentRecord) => {
    if (multiSelect) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(doc.id)) next.delete(doc.id);
        else next.add(doc.id);
        return next;
      });
    } else {
      onSelect?.(doc);
      onClose();
    }
  };

  const handleContinue = () => {
    if (selectedIds.size === 0) return;
    const selected = documents.filter((d) => selectedIds.has(d.id));
    onSelectMultiple?.(selected);
    onClose();
  };

  const getFileIcon = (fileType?: string): string => {
    const ft = (fileType ?? '').toUpperCase();
    if (ft === 'PDF') return 'document-text';
    if (ft === 'DOCX' || ft === 'DOC') return 'document';
    if (['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(ft)) return 'image';
    return 'document-outline';
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.kxSurface, paddingTop: 56 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: spacing.xl, marginBottom: spacing.lg,
        }}>
          <Pressable onPress={onClose}>
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.base }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
            {title}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
          <TextInput
            placeholder="Search documents..."
            placeholderTextColor={colors.ledgerGray[400]}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            style={{
              backgroundColor: colors.kxCardBg,
              borderWidth: 1,
              borderColor: colors.kxCardBorder,
              borderRadius: radius.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: 10,
              fontSize: typography.fontSize.sm,
              color: colors.kxTextPrimary,
            }}
          />
        </View>

        {/* Document List */}
        {loading ? (
          <View style={{ padding: spacing.xl, gap: spacing.sm }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonLoader key={i} height={52} borderRadius={radius.md} />
            ))}
          </View>
        ) : documents.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing['3xl'] }}>
            <Ionicons name="document-outline" size={48} color={colors.ledgerGray[300]} />
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginTop: spacing.lg }}>
              No documents found
            </Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, textAlign: 'center', marginTop: spacing.xs }}>
              {search ? 'Try a different search term' : 'Upload documents to get started'}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: multiSelect ? 80 : spacing['3xl'] }}>
            {documents.map((doc) => {
              const isSelected = selectedIds.has(doc.id);
              return (
                <Pressable
                  key={doc.id}
                  onPress={() => handleTap(doc)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.xl,
                    backgroundColor: pressed ? colors.ledgerGray[50] : isSelected ? colors.kxPrimary[50] : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.kxCardBorder,
                  })}
                >
                  {multiSelect && (
                    <View style={{
                      width: 20, height: 20, borderRadius: 4, marginRight: spacing.md,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.kxPrimary[600] : colors.ledgerGray[300],
                      backgroundColor: isSelected ? colors.kxPrimary[600] : 'transparent',
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      {isSelected && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
                    </View>
                  )}
                  <Ionicons
                    name={getFileIcon(doc.fileType) as any}
                    size={20}
                    color={colors.kxPrimary[400]}
                    style={{ marginRight: spacing.md }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                      {doc.name ?? doc.originalFilename ?? 'Unnamed'}
                    </Text>
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }}>
                      {doc.fileType?.toUpperCase() ?? 'File'} • {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  {!multiSelect && (
                    <Ionicons name="chevron-forward" size={16} color={colors.ledgerGray[400]} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Multi-select footer */}
        {multiSelect && selectedIds.size > 0 && (
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            paddingVertical: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing['2xl'],
            backgroundColor: colors.kxCardBg, borderTopWidth: 1, borderTopColor: colors.kxCardBorder,
          }}>
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
                paddingVertical: spacing.md, borderRadius: radius.md,
                backgroundColor: pressed ? colors.kxPrimary[700] : colors.kxPrimary[600],
              })}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm }}>
                Continue with {selectedIds.size} document{selectedIds.size !== 1 ? 's' : ''}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}
