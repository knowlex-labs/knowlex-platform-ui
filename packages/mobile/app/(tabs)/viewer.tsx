import { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import { useTheme } from '@/theme/useTheme';
import { ActionMenu, type ActionMenuItem } from '@/components/ui/ActionMenu';
import { ToolboxSheet } from '@/components/toolbox/ToolboxSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FileCategory = 'pdf' | 'image' | 'text' | 'other';

function getFileCategory(name: string, fileType?: string): FileCategory {
  const ext = (name ?? '').split('.').pop()?.toLowerCase() ?? '';
  const ft = (fileType ?? ext).toUpperCase();
  if (ft === 'PDF') return 'pdf';
  if (['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'BMP'].includes(ft)) return 'image';
  if (['TXT', 'MD', 'CSV', 'TEXT'].includes(ft)) return 'text';
  return 'other';
}

export default function ViewerScreen() {
  const params = useLocalSearchParams<{
    docId: string;
    name: string;
    downloadUrl?: string;
    signedUrl?: string;
    fileType?: string;
  }>();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [toolboxVisible, setToolboxVisible] = useState(false);

  const category = getFileCategory(params.name ?? '', params.fileType);

  useEffect(() => {
    if (!params.docId) return;
    loadDocument();
  }, [params.docId]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      if (category === 'text') {
        // Text files: fetch content as string
        const content = await workspaceApi.fetchDocumentContent({
          id: params.docId!,
          downloadUrl: params.downloadUrl || null,
          signedUrl: params.signedUrl || null,
        });
        setTextContent(content);
      } else {
        // PDF/images: get an HTTP URL (not file://)
        // Priority: signedUrl (already HTTP) > getDownloadUrl (presigned S3)
        let url: string;
        if (params.signedUrl) {
          url = params.signedUrl;
        } else {
          // Get a presigned download URL from the API
          url = await workspaceApi.getDownloadUrl(params.docId!);
        }
        setViewUrl(url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load document';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = viewUrl ?? (params.signedUrl || '');
      if (!url) { Alert.alert('No URL available'); return; }

      const FileSystem = await import('expo-file-system');
      const Sharing = await import('expo-sharing');
      const fileName = params.name ?? `document_${params.docId}`;
      const cacheUri = (FileSystem.cacheDirectory ?? '') + fileName;
      const result = await FileSystem.downloadAsync(url, cacheUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(result.uri);
    } catch {
      Alert.alert('Error', 'Could not share file');
    }
  };

  const menuItems: ActionMenuItem[] = [
    { label: 'Share', icon: '📤', onPress: handleShare },
    { label: 'Document Tools', icon: '🛠️', onPress: () => setToolboxVisible(true) },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
        borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder, backgroundColor: colors.kxCardBg,
      }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" style={{ paddingRight: spacing.md }}>
          <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.lg }}>←</Text>
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
          <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={1}>
            {params.name ?? 'Document'}
          </Text>
        </View>
        <Pressable onPress={() => setMenuVisible(true)} accessibilityLabel="More options" style={{ paddingLeft: spacing.md }}>
          <Text style={{ fontSize: typography.fontSize.xl, color: colors.kxTextSecondary }}>⋯</Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.kxPrimary[600]} />
          <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.sm, marginTop: spacing.md }}>Loading document...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing['3xl'] }}>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, textAlign: 'center' }}>
            Failed to load document
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, textAlign: 'center', marginTop: spacing.sm }}>{error}</Text>
          <Pressable onPress={loadDocument} style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.kxPrimary[600], borderRadius: radius.md }}>
            <Text style={{ color: colors.onPrimary, fontWeight: typography.fontWeight.semibold }}>Retry</Text>
          </Pressable>
        </View>
      ) : category === 'pdf' && viewUrl ? (
        <WebView
          source={{ uri: viewUrl }}
          style={{ flex: 1, backgroundColor: colors.kxSurface }}
          startInLoadingState
          renderLoading={() => (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.kxSurface }}>
              <ActivityIndicator size="large" color={colors.kxPrimary[600]} />
            </View>
          )}
        />
      ) : category === 'image' && viewUrl ? (
        <ScrollView
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          maximumZoomScale={5}
          minimumZoomScale={1}
          bouncesZoom
        >
          <Image source={{ uri: viewUrl }} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.4 }} resizeMode="contain" />
        </ScrollView>
      ) : category === 'text' && textContent !== null ? (
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, lineHeight: 22 }}>
            {textContent}
          </Text>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing['3xl'] }}>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>Preview not available</Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, textAlign: 'center', marginTop: spacing.xs }}>
            This file type can't be previewed.{'\n'}Tap Share to open in another app.
          </Text>
          <Pressable onPress={handleShare} style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.kxPrimary[600], borderRadius: radius.md }}>
            <Text style={{ color: colors.onPrimary, fontWeight: typography.fontWeight.semibold }}>Share File</Text>
          </Pressable>
        </View>
      )}

      <ActionMenu visible={menuVisible} onClose={() => setMenuVisible(false)} title={params.name} items={menuItems} />
      <ToolboxSheet visible={toolboxVisible} onClose={() => setToolboxVisible(false)} documentId={params.docId!} documentName={params.name ?? 'Document'} />
    </SafeAreaView>
  );
}
