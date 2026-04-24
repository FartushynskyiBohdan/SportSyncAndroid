import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  clearConversation,
  deleteMessage,
  editMessage,
  getConversations,
  getThread,
  sendMessage,
} from '../../api/appApi';
import { RemoteImage } from '../../components/RemoteImage';
import { ChatMessage, ConversationItem, MessageThread } from '../../types/app';
import { useAuth } from '../../context/AuthContext';
import { palette } from '../../theme/palette';

export function MessagesScreen({ initialMatchId }: { initialMatchId?: number }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMatchId, setActiveMatchId] = useState<number | null>(initialMatchId ?? null);
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [messageActionId, setMessageActionId] = useState<number | null>(null);
  const threadRef = useRef<FlatList>(null);

  async function loadConversations() {
    setLoading(true);
    setError('');
    try {
      const data = await getConversations();
      setConversations(data);
      if (!activeMatchId && data.length > 0) {
        setActiveMatchId(data[0].matchId);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (initialMatchId) {
      setActiveMatchId(initialMatchId);
    }
  }, [initialMatchId]);

  useEffect(() => {
    if (!activeMatchId) {
      setThread(null);
      return;
    }
    setDraft('');
    setEditingMessageId(null);
    (async () => {
      try {
        const data = await getThread(activeMatchId);
        setThread(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load messages.');
      }
    })();
  }, [activeMatchId]);

  async function onSubmitDraft() {
    if (!activeMatchId || !draft.trim() || sending) return;
    setSending(true);
    try {
      if (editingMessageId) {
        const updated = await editMessage(activeMatchId, editingMessageId, draft.trim());
        setThread((prev) => (
          prev
            ? { ...prev, messages: prev.messages.map((message) => (message.id === updated.id ? updated : message)) }
            : prev
        ));
        setEditingMessageId(null);
        setDraft('');
        await loadConversations();
        return;
      }

      const message = await sendMessage(activeMatchId, draft.trim());
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
      setDraft('');
      await loadConversations();
    } catch (err: any) {
      setError(getMessageActionError(err, 'Failed to save message.'));
    } finally {
      setSending(false);
    }
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setDraft('');
  }

  function beginEditMessage(message: ChatMessage) {
    setEditingMessageId(message.id);
    setDraft(message.text);
  }

  function confirmDeleteMessage(messageId: number) {
    if (!activeMatchId) return;

    Alert.alert('Delete message?', 'This removes your message from the conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setMessageActionId(messageId);
          try {
            await deleteMessage(activeMatchId, messageId);
            setThread((prev) => (
              prev ? { ...prev, messages: prev.messages.filter((message) => message.id !== messageId) } : prev
            ));
            if (editingMessageId === messageId) {
              cancelEdit();
            }
            await loadConversations();
          } catch (err: any) {
            Alert.alert('Error', getMessageActionError(err, 'Failed to delete message.'));
          } finally {
            setMessageActionId(null);
          }
        },
      },
    ]);
  }

  function openMessageMenu(message: ChatMessage) {
    if (message.senderId !== user?.id) {
      return;
    }

    Alert.alert('Message options', 'Choose what to do with this message.', [
      { text: 'Edit', onPress: () => beginEditMessage(message) },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteMessage(message.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function confirmClearChat() {
    if (!activeMatchId) return;

    Alert.alert('Clear chat?', 'This removes the message history for this match.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setSending(true);
          try {
            await clearConversation(activeMatchId);
            setThread((prev) => (prev ? { ...prev, messages: [] } : prev));
            cancelEdit();
            await loadConversations();
          } catch (err: any) {
            Alert.alert('Error', getMessageActionError(err, 'Failed to clear chat.'));
          } finally {
            setSending(false);
          }
        },
      },
    ]);
  }

  function openChatMenu() {
    if (!activeConversation) return;

    Alert.alert(activeConversation.user.name, 'Chat options', [
      { text: 'Clear Chat', style: 'destructive', onPress: confirmClearChat },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function getMessageActionError(err: any, fallback: string) {
    const status = err?.response?.status;
    const serverError = err?.response?.data?.error;
    const htmlError = typeof err?.response?.data === 'string' ? err.response.data : '';

    if (status === 404 && htmlError.includes('Cannot PUT')) {
      return 'Message editing needs the updated backend deployed to the live API.';
    }
    if (status === 404 && htmlError.includes('Cannot DELETE')) {
      return 'Message delete/clear needs the updated backend deployed to the live API.';
    }

    return serverError || fallback;
  }

  const activeConversation = useMemo(
    () => conversations.find((item) => item.matchId === activeMatchId) || null,
    [conversations, activeMatchId]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.accent} size="large" />
      </View>
    );
  }

  // ── No conversations ──────────────────────────────────────────────────────
  if (conversations.length === 0) {
    return (
      <View style={styles.emptyRoot}>
        <Text style={styles.emptyEmoji}>💬</Text>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptyCopy}>Match with someone to start chatting.</Text>
      </View>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeConversation ? activeConversation.user.name : 'Messages'}
        </Text>
        <View style={styles.headerActions}>
          {activeConversation && (
            <View style={styles.headerStatus}>
              <View style={[styles.statusDot, activeConversation.user.isOnline ? styles.online : styles.offline]} />
              <Text style={styles.statusText}>{activeConversation.user.isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          )}
          {activeConversation ? (
            <Pressable style={styles.chatMenuButton} onPress={openChatMenu}>
              <Text style={styles.chatMenuButtonText}>...</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.body}>
        {/* ── Sidebar: contact list ── */}
        <View style={styles.sidebar}>
          <FlatList
            data={conversations}
            keyExtractor={(item) => String(item.matchId)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const active = item.matchId === activeMatchId;
              const initials = item.user.name.slice(0, 2).toUpperCase();
              return (
                <Pressable
                  style={[styles.contact, active && styles.contactActive]}
                  onPress={() => setActiveMatchId(item.matchId)}
                  android_ripple={{ color: '#1f3068' }}
                >
                  <View style={styles.avatarWrap}>
                    <RemoteImage
                      uri={item.user.image}
                      style={styles.avatar}
                      fallbackStyle={styles.avatarFallback}
                      fallbackLabel={initials}
                    />
                    {item.user.isOnline && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, active && styles.contactNameActive]} numberOfLines={1}>
                      {item.user.name}
                    </Text>
                    <Text style={styles.contactSnippet} numberOfLines={1}>
                      {item.lastMessage || 'Say hi 👋'}
                    </Text>
                  </View>
                  {active && <View style={styles.activeBar} />}
                </Pressable>
              );
            }}
          />
        </View>

        {/* ── Thread panel ── */}
        <View style={styles.thread}>
          {!activeConversation || !thread ? (
            <View style={styles.threadEmpty}>
              <Text style={styles.threadEmptyEmoji}>💬</Text>
              <Text style={styles.threadEmptyText}>Select a conversation</Text>
            </View>
          ) : (
            <>
              <FlatList
                ref={threadRef}
                data={thread.messages}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.messages}
                onContentSizeChange={() => threadRef.current?.scrollToEnd({ animated: true })}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.noMessagesBox}>
                    <Text style={styles.noMessagesTitle}>No messages here yet</Text>
                    <Text style={styles.noMessagesCopy}>Send the first message or pick another match.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const mine = item.senderId === user?.id;
                  return (
                    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
                      {!mine ? (
                        <RemoteImage
                          uri={activeConversation.user.image}
                          style={styles.bubbleAvatar}
                          fallbackStyle={styles.avatarFallback}
                          fallbackLabel={activeConversation.user.name}
                        />
                      ) : null}
                      <Pressable
                        style={[
                          styles.bubble,
                          mine ? styles.mine : styles.theirs,
                          messageActionId === item.id && styles.bubbleBusy,
                        ]}
                        onLongPress={() => openMessageMenu(item)}
                        delayLongPress={260}
                      >
                        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
                      </Pressable>
                    </View>
                  );
                }}
              />

              {editingMessageId ? (
                <View style={styles.editingBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.editingTitle}>Editing message</Text>
                    <Text style={styles.editingCopy}>Long-press your messages to edit or delete them.</Text>
                  </View>
                  <Pressable style={styles.cancelEditButton} onPress={cancelEdit}>
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.composeRow}>
                <TextInput
                  style={styles.input}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={editingMessageId ? 'Update message...' : 'Message...'}
                  placeholderTextColor={palette.textMuted}
                  multiline
                  maxLength={1000}
                  returnKeyType="send"
                  onSubmitEditing={onSubmitDraft}
                  blurOnSubmit={false}
                />
                <Pressable
                  style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
                  onPress={onSubmitDraft}
                  disabled={sending || !draft.trim()}
                >
                  <Text style={styles.sendText}>{sending ? '...' : editingMessageId ? 'Save' : 'Send'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const SIDEBAR_W = 80;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },

  // ── empty state ──
  emptyRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: palette.background,
  },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { color: palette.text, fontSize: 20, fontWeight: '800' },
  emptyCopy: { color: palette.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

  // ── header ──
  header: {
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#1d2b54',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  online: { backgroundColor: '#22c55e' },
  offline: { backgroundColor: '#4b5563' },
  statusText: {
    color: palette.textMuted,
    fontSize: 12,
  },
  chatMenuButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#304372',
    backgroundColor: '#101a39',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatMenuButtonText: {
    color: '#d9e5ff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 16,
  },
  error: {
    color: palette.danger,
    paddingHorizontal: 16,
    paddingVertical: 4,
    fontSize: 12,
  },

  // ── body ──
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // ── sidebar ──
  sidebar: {
    width: SIDEBAR_W,
    borderRightWidth: 1,
    borderColor: '#1a2850',
    paddingVertical: 8,
  },
  contact: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    position: 'relative',
  },
  contactActive: {
    backgroundColor: '#0f1d3e',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: '#15254c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: palette.text,
    fontWeight: '700',
    fontSize: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: palette.background,
  },
  contactInfo: {
    marginTop: 5,
    alignItems: 'center',
    width: '100%',
  },
  contactName: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  contactNameActive: {
    color: palette.text,
  },
  contactSnippet: {
    display: 'none',
  },
  activeBar: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    borderRadius: 2,
    backgroundColor: palette.accent,
  },

  // ── thread ──
  thread: {
    flex: 1,
    flexDirection: 'column',
  },
  threadEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  threadEmptyEmoji: { fontSize: 36 },
  threadEmptyText: { color: palette.textMuted, fontSize: 14 },

  messages: {
    padding: 12,
    gap: 6,
    paddingBottom: 4,
    flexGrow: 1,
  },
  noMessagesBox: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  noMessagesTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  noMessagesCopy: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginVertical: 2,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowTheirs: {
    justifyContent: 'flex-start',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  bubbleAvatarInitials: {
    color: palette.text,
    fontWeight: '700',
    fontSize: 11,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleBusy: {
    opacity: 0.5,
  },
  mine: {
    backgroundColor: palette.accent,
    borderBottomRightRadius: 4,
  },
  theirs: {
    backgroundColor: '#1a2a53',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: '#c8d5ff',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  editingBanner: {
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3c5189',
    backgroundColor: '#101a39',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editingTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '900',
  },
  editingCopy: {
    color: palette.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  cancelEditButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#7f2534',
    backgroundColor: '#3a1220',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cancelEditText: {
    color: '#fecdd3',
    fontSize: 12,
    fontWeight: '900',
  },

  composeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#1d2b54',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#32457b',
    borderRadius: 20,
    color: palette.text,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#141f42',
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    minWidth: 58,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#2a3a6a',
  },
  sendText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
});


