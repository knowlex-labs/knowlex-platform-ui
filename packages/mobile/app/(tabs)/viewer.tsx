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

function getFileCategory(name: string, fileType?: string, docType?: string): FileCategory {
  // Doc-type wins when present — translations are always rendered as PDF (WeasyPrint
  // output), drafts/summaries/synopses are always HTML/markdown text. fileType from
  // the backend can be null/stale for generated docs, so it's the second source.
  const dt = (docType ?? '').toUpperCase();
  if (dt === 'TRANSLATION') return 'pdf';
  if (dt === 'DRAFT' || dt === 'SUMMARY' || dt === 'SYNOPSIS') return 'text';

  const ext = (name ?? '').split('.').pop()?.toLowerCase() ?? '';
  const ft = (fileType ?? ext).toUpperCase();
  if (ft === 'PDF') return 'pdf';
  if (['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'BMP'].includes(ft)) return 'image';
  if (['HTML', 'HTM', 'TXT', 'MD', 'CSV', 'TEXT', 'MARKDOWN'].includes(ft)) return 'text';
  if (!ft) return 'text';
  return 'other';
}

function looksLikeHtml(content: string): boolean {
  // Markdown HTML comments + tag-heavy content → render as HTML.
  return /<\/?(p|div|h[1-6]|table|tbody|tr|td|th|ul|ol|li|strong|em|u|br|span|hr|blockquote|pre|code|a)\b/i.test(content);
}

function buildHtmlDoc(content: string, isHtml: boolean): string {
  const body = isHtml
    ? content
    : `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin:0;">${escapeHtml(content)}</pre>`;
  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 15px; line-height: 1.55; color: #0f172a; padding: 16px 18px 32px; margin: 0; background: #fff; }
  h1, h2, h3, h4 { font-family: Georgia, "Times New Roman", serif; line-height: 1.3; }
  p { margin: 0.5em 0; }
  table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
  td, th { padding: 4px 6px; vertical-align: top; }
  strong { font-weight: 700; }
  u { text-decoration: underline; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 1em 0; }
  /* Strip markdown HTML comments leaked into the doc. */
</style>
</head><body>${body}</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function ViewerScreen() {
  const params = useLocalSearchParams<{
    docId: string;
    name: string;
    downloadUrl?: string;
    signedUrl?: string;
    fileType?: string;
    type?: string;
  }>();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [toolboxVisible, setToolboxVisible] = useState(false);

  const category = getFileCategory(params.name ?? '', params.fileType, params.type);

  useEffect(() => {
    if (!params.docId) return;
    loadDocument();
  }, [params.docId]);

  // Fallback: download the doc via authenticated API endpoint into local cache,
  // returns a file:// URI that WebView/Image can load without auth.
  const downloadToCache = async (): Promise<string> => {
    // Use the legacy entrypoint — expo-file-system v19 deprecated the top-level downloadAsync.
    const FileSystem = await import('expo-file-system/legacy');
    const { env } = (await import('@knowlex/core/api/runtime')).getAdapters();
    const { getAuthHeaders } = await import('@knowlex/core/api/auth-headers');
    const path = params.downloadUrl || `/api/v1/documents/${params.docId}/download`;
    const fullUrl = path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`;
    const rawName = params.name ?? `document_${params.docId}`;
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
    // iOS WebView refuses to render file:// URIs without a recognized extension.
    // Force the right one based on the doc category — translations are PDFs even
    // when the display name lacks `.pdf`.
    const extByCategory: Record<FileCategory, string> = { pdf: '.pdf', image: '.png', text: '.txt', other: '' };
    const wantedExt = extByCategory[category];
    const hasWanted = wantedExt && safeName.toLowerCase().endsWith(wantedExt);
    const finalName = hasWanted ? safeName : `${safeName}${wantedExt}`;
    const cacheUri = (FileSystem.cacheDirectory ?? '') + finalName;
    const result = await FileSystem.downloadAsync(fullUrl, cacheUri, { headers: getAuthHeaders() });
    if (result.status >= 400) throw new Error(`Download failed: ${result.status}`);
    return result.uri;
  };

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
        // PDF/images: WebView/Image need a self-authenticating URL.
        // 1) Trust signedUrl only if it is an absolute http(s) URL (already public S3)
        // 2) Otherwise download via the authenticated /download endpoint — this is the
        //    only path that runs server-side decryption, so it's required for generated
        //    docs (translations, encrypted user uploads). Presigned-S3 URLs return raw
        //    ciphertext and yield a blank/garbled WebView.
        const isAbsolute = params.signedUrl?.startsWith('http');
        if (isAbsolute) {
          setViewUrl(params.signedUrl!);
        } else {
          const url = await downloadToCache();
          setViewUrl(url);
        }
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

      const FileSystem = await import('expo-file-system/legacy');
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
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
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
        looksLikeHtml(textContent) ? (
          <WebView
            originWhitelist={['*']}
            source={{ html: buildHtmlDoc(textContent, true) }}
            style={{ flex: 1, backgroundColor: '#fff' }}
            scalesPageToFit
          />
        ) : (
          <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary, lineHeight: 22 }}>
              {textContent}
            </Text>
          </ScrollView>
        )
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
