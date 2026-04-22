import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getConversations, getThread, sendMessage } from '../../api/appApi';
import { buildMediaUrl } from '../../api/client';
import { ConversationItem, MessageThread } from '../../types/app';
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
    if (!activeMatchId) {
      setThread(null);
      return;
    }
    (async () => {
      try {
        const data = await getThread(activeMatchId);
        setThread(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load messages.');
      }
    })();
  }, [activeMatchId]);

  async function onSend() {
    if (!activeMatchId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const message = await sendMessage(activeMatchId, draft.trim());
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
      setDraft('');
      await loadConversations();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to send message.');
    } finally {
      setSending(false);
    }
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
        {activeConversation && (
          <View style={styles.headerStatus}>
            <View style={[styles.statusDot, activeConversation.user.isOnline ? styles.online : styles.offline]} />
            <Text style={styles.statusText}>{activeConversation.user.isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        )}
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
                    {item.user.image ? (
                      <Image source={{ uri: buildMediaUrl(item.user.image) }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                      </View>
                    )}
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
                renderItem={({ item }) => {
                  const mine = item.senderId === user?.id;
                  return (
                    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
                      {!mine && activeConversation.user.image ? (
                        <Image
                          source={{ uri: buildMediaUrl(activeConversation.user.image) }}
                          style={styles.bubbleAvatar}
                        />
                      ) : !mine ? (
                        <View style={[styles.bubbleAvatar, styles.avatarFallback]}>
                          <Text style={styles.bubbleAvatarInitials}>
                            {activeConversation.user.name.slice(0, 1)}
                          </Text>
                        </View>
                      ) : null}
                      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
                      </View>
                    </View>
                  );
                }}
              />

              <View style={styles.composeRow}>
                <TextInput
                  style={styles.input}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Message…"
                  placeholderTextColor={palette.textMuted}
                  multiline
                  maxLength={1000}
                  returnKeyType="send"
                  onSubmitEditing={onSend}
                  blurOnSubmit={false}
                />
                <Pressable
                  style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
                  onPress={onSend}
                  disabled={sending || !draft.trim()}
                >
                  <Text style={styles.sendText}>{sending ? '…' : '➤'}</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2a3a6a',
  },
  sendText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});


