import { useState } from 'react';
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
}

const TOOLS = [
  { key: 'split', icon: '✂️', label: 'Split PDF', desc: 'Extract pages from document' },
  { key: 'compress', icon: '📐', label: 'Compress', desc: 'Reduce file size' },
  { key: 'convert', icon: '🔄', label: 'Convert', desc: 'Change file format' },
  { key: 'translate', icon: '🌐', label: 'Translate', desc: 'Translate to another language' },
] as const;

type ToolKey = typeof TOOLS[number]['key'];

export function ToolboxSheet({ visible, onClose, documentId, documentName }: ToolboxSheetProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);

  const openTool = (key: ToolKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => setActiveTool(key), 300);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
                  paddingVertical: 14,
                  paddingHorizontal: spacing.xl,
                  backgroundColor: pressed ? colors.ledgerGray[50] : 'transparent',
                })}
              >
                <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.kxPrimary[50], justifyContent: 'center', alignItems: 'center', marginRight: spacing.lg }}>
                  <Text style={{ fontSize: 18 }}>{tool.icon}</Text>
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

      <SplitSheet visible={activeTool === 'split'} onClose={() => setActiveTool(null)} documentId={documentId} documentName={documentName} />
      <CompressSheet visible={activeTool === 'compress'} onClose={() => setActiveTool(null)} documentId={documentId} documentName={documentName} />
      <ConvertSheet visible={activeTool === 'convert'} onClose={() => setActiveTool(null)} documentId={documentId} documentName={documentName} />
      <TranslateSheet visible={activeTool === 'translate'} onClose={() => setActiveTool(null)} documentId={documentId} documentName={documentName} />
    </>
  );
}
