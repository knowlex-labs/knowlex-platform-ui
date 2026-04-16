import { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/useTheme';
import { SplitSheet } from './SplitSheet';
import { CompressSheet } from './CompressSheet';
import { ConvertSheet } from './ConvertSheet';
import { TranslateSheet } from './TranslateSheet';

interface ToolboxSheetProps {
  visible: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  /** If set, skip the picker modal and directly open this tool */
  autoOpenTool?: string;
}

const TOOLS = [
  { key: 'split', icon: '✂️', label: 'Split PDF', desc: 'Extract pages from document' },
  { key: 'compress', icon: '📐', label: 'Compress', desc: 'Reduce file size' },
  { key: 'convert', icon: '🔄', label: 'Convert', desc: 'Change file format' },
  { key: 'translate', icon: '🌐', label: 'Translate', desc: 'Translate to another language' },
] as const;

type ToolKey = typeof TOOLS[number]['key'];

export function ToolboxSheet({ visible, onClose, documentId, documentName, autoOpenTool }: ToolboxSheetProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);

  // Auto-open a specific tool when triggered from the documents page tool bar
  useEffect(() => {
    if (visible && autoOpenTool && TOOLS.some((t) => t.key === autoOpenTool)) {
      setActiveTool(autoOpenTool as ToolKey);
    }
  }, [visible, autoOpenTool]);

  const openTool = (key: ToolKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => setActiveTool(key), 300);
  };

  const handleToolClose = () => {
    setActiveTool(null);
    // If we auto-opened, also close the parent
    if (autoOpenTool) onClose();
  };

  // If auto-opening, skip the picker modal entirely
  if (autoOpenTool && visible) {
    return (
      <>
        <SplitSheet visible={activeTool === 'split'} onClose={handleToolClose} documentId={documentId} documentName={documentName} />
        <CompressSheet visible={activeTool === 'compress'} onClose={handleToolClose} documentId={documentId} documentName={documentName} />
        <ConvertSheet visible={activeTool === 'convert'} onClose={handleToolClose} documentId={documentId} documentName={documentName} />
        <TranslateSheet visible={activeTool === 'translate'} onClose={handleToolClose} documentId={documentId} documentName={documentName} />
      </>
    );
  }

  return (
    <>
      <Modal visible={visible && !autoOpenTool} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={{ flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' }} onPress={onClose}>
          <Pressable style={{ backgroundColor: colors.kxCardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }} onPress={() => {}}>
            <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ledgerGray[300] }} />
            </View>

            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
              Document Tools
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }} numberOfLines={1}>
              {documentName}
            </Text>

            {TOOLS.map((tool) => (
              <Pressable
                key={tool.key}
                onPress={() => openTool(tool.key)}
                accessibilityRole="button"
                accessibilityLabel={tool.label}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.xl,
                  backgroundColor: pressed ? colors.ledgerGray[50] : 'transparent',
                })}
              >
                <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.kxPrimary[50], justifyContent: 'center', alignItems: 'center', marginRight: spacing.lg }}>
                  <Text style={{ fontSize: typography.fontSize.lg }}>{tool.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }}>{tool.label}</Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }}>{tool.desc}</Text>
                </View>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <SplitSheet visible={activeTool === 'split'} onClose={handleToolClose} documentId={documentId} documentName={documentName} />
      <CompressSheet visible={activeTool === 'compress'} onClose={handleToolClose} documentId={documentId} documentName={documentName} />
      <ConvertSheet visible={activeTool === 'convert'} onClose={handleToolClose} documentId={documentId} documentName={documentName} />
      <TranslateSheet visible={activeTool === 'translate'} onClose={handleToolClose} documentId={documentId} documentName={documentName} />
    </>
  );
}
