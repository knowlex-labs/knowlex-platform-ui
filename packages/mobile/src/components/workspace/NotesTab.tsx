import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FAB } from '@/components/ui/FAB';
import { EmptyState } from '@/components/ui/EmptyState';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesTabProps {
  caseId: string;
}

const STORAGE_KEY = (caseId: string) => `knowlex_notes_${caseId}`;

export function NotesTab({ caseId }: NotesTabProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const loadNotes = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY(caseId));
      if (raw) setNotes(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [caseId]);

  const saveNotes = async (updated: Note[]) => {
    setNotes(updated);
    await AsyncStorage.setItem(STORAGE_KEY(caseId), JSON.stringify(updated));
  };

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const openEditor = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content);
    } else {
      setEditingNote(null);
      setTitle('');
      setContent('');
    }
    setEditorVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();

    if (editingNote) {
      const updated = notes.map((n) =>
        n.id === editingNote.id ? { ...n, title: title.trim(), content: content.trim(), updatedAt: now } : n
      );
      await saveNotes(updated);
    } else {
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: title.trim(),
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
      };
      await saveNotes([newNote, ...notes]);
    }
    setEditorVisible(false);
  };

  const handleDelete = (noteId: string) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveNotes(notes.filter((n) => n.id !== noteId)) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          message="Add notes to keep track of important case details"
          action={<Button title="Add Note" onPress={() => openEditor()} />}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
          {notes.map((note) => (
            <Pressable key={note.id} onPress={() => openEditor(note)} onLongPress={() => handleDelete(note.id)}>
              <Card>
                <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={1}>
                  {note.title}
                </Text>
                {note.content && (
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 4 }} numberOfLines={3}>
                    {note.content}
                  </Text>
                )}
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[400], marginTop: spacing.sm }}>
                  {new Date(note.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {notes.length > 0 && <FAB icon="+" onPress={() => openEditor()} />}

      {/* Note Editor Modal */}
      <Modal visible={editorVisible} animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <View style={{ flex: 1, backgroundColor: colors.kxSurface, paddingTop: 60 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
            <Pressable onPress={() => setEditorVisible(false)}>
              <Text style={{ fontSize: typography.fontSize.base, color: colors.kxPrimary[600] }}>Cancel</Text>
            </Pressable>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
              {editingNote ? 'Edit Note' : 'New Note'}
            </Text>
            <Pressable onPress={handleSave}>
              <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxPrimary[600] }}>Save</Text>
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: spacing.xl }}>
            <TextInput
              placeholder="Title"
              placeholderTextColor={colors.ledgerGray[400]}
              value={title}
              onChangeText={setTitle}
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.kxTextPrimary,
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.kxCardBorder,
              }}
            />
            <TextInput
              placeholder="Write your note..."
              placeholderTextColor={colors.ledgerGray[400]}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              style={{
                fontSize: typography.fontSize.base,
                color: colors.kxTextPrimary,
                paddingVertical: spacing.lg,
                minHeight: 200,
                lineHeight: 24,
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
