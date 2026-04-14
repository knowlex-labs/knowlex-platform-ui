import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { draftChatApi } from '@knowlex/core/api/draft-chat-api';
import { workspaceApi } from '@knowlex/core/api/workspace-api';
import type { DraftChatSSECallbacks } from '@knowlex/core/api/draft-chat-api';
import type { CaseDocument } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { MessageMarkdown } from './MessageMarkdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface ChatTabProps {
  caseId: string;
  /** When provided, uses these doc IDs for context instead of the built-in selector */
  externalSelectedDocIds?: Set<string>;
}

export function ChatTab({ caseId, externalSelectedDocIds }: ChatTabProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Document context (internal — used when no externalSelectedDocIds)
  const [indexedDocs, setIndexedDocs] = useState<CaseDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [docsError, setDocsError] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Use external doc IDs if provided
  const effectiveDocIds = externalSelectedDocIds ?? selectedDocIds;
  const showBuiltInSelector = !externalSelectedDocIds;

  const scrollViewRef = useRef<ScrollView>(null);
  const abortRef = useRef<AbortController | null>(null);
  const contentRef = useRef('');

  // Fetch indexed documents
  const fetchIndexedDocs = useCallback(async () => {
    setDocsError(false);
    try {
      const res = await workspaceApi.getCaseDocumentsPaginated(caseId, { page: 1, limit: 100 });
      const indexed = (res.documents ?? []).filter(
        (d) => d.indexingStatus === 'INDEXING_COMPLETED' || d.indexingStatus === 'INDEXED'
      );
      setIndexedDocs(indexed);
      setSelectedDocIds(new Set(indexed.map((d) => d.id)));
    } catch {
      setDocsError(true);
    }
  }, [caseId]);

  useEffect(() => { fetchIndexedDocs(); }, [fetchIndexedDocs]);

  // Initialize chat session
  const initSession = useCallback(async () => {
    setInitError(null);
    setIsLoading(true);
    try {
      const sessions = await draftChatApi.listSessions(caseId);
      let sid: string;
      if (sessions.length > 0) {
        sid = sessions[0].id;
      } else {
        const newSession = await draftChatApi.createSession(caseId);
        sid = newSession.id;
      }
      setSessionId(sid);

      const history = await draftChatApi.getHistory(caseId, sid);
      setMessages(history.map((msg, i) => ({
        id: `hist-${i}`,
        role: msg.role,
        content: msg.content,
      })));
    } catch (err: unknown) {
      setInitError(err instanceof Error ? err.message : 'Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    initSession();
    return () => { abortRef.current?.abort(); };
  }, [initSession]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !sessionId || isStreaming) return;

    setInput('');
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: text };
    const assistantMsg: ChatMessage = { id: `assistant-${Date.now()}`, role: 'assistant', content: '', isStreaming: true };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    contentRef.current = '';

    const callbacks: DraftChatSSECallbacks = {
      onAnswer: (token) => {
        const unescaped = token.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        contentRef.current += unescaped;
        const currentContent = contentRef.current;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') return [...prev.slice(0, -1), { ...last, content: currentContent }];
          return prev;
        });
      },
      onToolCall: () => {},
      onToolResult: () => {},
      onEnd: () => {
        setIsStreaming(false);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') return [...prev.slice(0, -1), { ...last, isStreaming: false }];
          return prev;
        });
      },
      onError: (error) => {
        setIsStreaming(false);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') return [...prev.slice(0, -1), { ...last, content: `Error: ${error}`, isStreaming: false }];
          return prev;
        });
      },
    };

    abortRef.current = draftChatApi.sendMessage(
      caseId,
      sessionId,
      {
        message: text,
        tone: 'formal',
        style: 'balanced',
        file_ids: Array.from(effectiveDocIds),
        model: 'openai',
      },
      callbacks
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.kxPrimary[600]} />
        <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.sm, marginTop: spacing.md }}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={140}
    >
      {/* Init error banner */}
      {initError && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.kxCardBg, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
          <Text style={{ flex: 1, fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }} numberOfLines={2}>
            Couldn’t start chat: {initError}
          </Text>
          <Pressable onPress={initSession} hitSlop={8} accessibilityLabel="Retry chat init">
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, marginLeft: spacing.sm }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Docs error banner */}
      {showBuiltInSelector && docsError && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, backgroundColor: colors.kxCardBg, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
          <Text style={{ flex: 1, fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>Could not load documents</Text>
          <Pressable onPress={fetchIndexedDocs} hitSlop={8} accessibilityLabel="Retry loading documents">
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Document Context Selector (only when not controlled externally) */}
      {showBuiltInSelector && indexedDocs.length > 0 && (
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
          <Pressable
            onPress={() => setDocsExpanded(!docsExpanded)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={{ fontSize: typography.fontSize.sm }}>📄</Text>
              <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }}>
                {selectedDocIds.size} of {indexedDocs.length} documents selected
              </Text>
            </View>
            <Text style={{ color: colors.ledgerGray[400], fontSize: typography.fontSize.xs }}>{docsExpanded ? '▲' : '▼'}</Text>
          </Pressable>

          {docsExpanded && (
            <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
              {indexedDocs.map((doc) => {
                const isSelected = selectedDocIds.has(doc.id);
                return (
                  <Pressable
                    key={doc.id}
                    onPress={() => toggleDoc(doc.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: spacing.sm }}
                  >
                    <View style={{
                      width: 18, height: 18, borderRadius: 4,
                      borderWidth: 1.5,
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
            </View>
          )}
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: spacing['4xl'] }}>
            <Text style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing.lg }}>💬</Text>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, textAlign: 'center' }}>
              Case AI Assistant
            </Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, textAlign: 'center', marginTop: spacing.xs }}>
              Ask questions about your case documents,{'\n'}get legal insights, and draft content.
            </Text>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              marginBottom: spacing.md,
            }}
          >
            <View
              style={{
                backgroundColor: msg.role === 'user' ? colors.kxPrimary[600] : colors.kxCardBg,
                borderRadius: radius.lg,
                borderWidth: msg.role === 'assistant' ? 1 : 0,
                borderColor: colors.kxCardBorder,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderBottomRightRadius: msg.role === 'user' ? 4 : radius.lg,
                borderBottomLeftRadius: msg.role === 'assistant' ? 4 : radius.lg,
              }}
            >
              {msg.role === 'user' ? (
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.onPrimary, lineHeight: 20 }}>
                  {msg.content}
                </Text>
              ) : msg.content ? (
                <MessageMarkdown content={msg.content} color={colors.kxTextPrimary} />
              ) : msg.isStreaming ? (
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, lineHeight: 20 }}>...</Text>
              ) : null}
              {msg.isStreaming && msg.content.length > 0 && (
                <ActivityIndicator size="small" color={colors.kxPrimary[400]} style={{ marginTop: 4, alignSelf: 'flex-start' }} />
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.kxCardBorder,
        backgroundColor: colors.kxCardBg,
        gap: spacing.sm,
      }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your case..."
          placeholderTextColor={colors.ledgerGray[400]}
          multiline
          maxLength={2000}
          style={{
            flex: 1,
            backgroundColor: colors.kxSurface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.kxCardBorder,
            paddingHorizontal: spacing.lg,
            paddingVertical: 10,
            fontSize: typography.fontSize.sm,
            color: colors.kxTextPrimary,
            maxHeight: 100,
          }}
          editable={!isStreaming}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!input.trim() || isStreaming}
          accessibilityLabel="Send message"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: input.trim() && !isStreaming ? colors.kxPrimary[600] : colors.ledgerGray[200],
            justifyContent: 'center', alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
            marginBottom: 2,
          })}
        >
          <Text style={{ color: colors.onPrimary, fontSize: typography.fontSize.lg }}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
