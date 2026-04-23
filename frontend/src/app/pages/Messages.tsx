import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, Send, ChevronLeft, MoreVertical, CheckCheck, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import apiClient from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function readToken(): string | null {
  return localStorage.getItem('token') ?? sessionStorage.getItem('token');
}

type Message = {
  id: number;
  senderId: number;
  text: string;
  sentAt: string;
  readAt: string | null;
};

type Conversation = {
  matchId: number;
  matchedAt: string;
  user: {
    id: number;
    name: string;
    age: number;
    city: string;
    image: string;
    isOnline: boolean;
    lastActive: string | null;
  };
  lastMessage: string | null;
  lastMessageSentAt: string | null;
  lastMessageSenderId: number | null;
  unreadCount: number;
};

type ConversationThread = {
  matchId: number;
  peer: {
    user_id: number;
    first_name: string;
    age: number;
    city_name: string;
    last_active: string | null;
    photo_url: string | null;
  } | null;
  messages: Message[];
};

type RenderConversation = {
  matchId: number;
  name: string;
  age: number;
  city: string;
  isOnline: boolean;
  lastMessage: string;
  timestamp: string;
  unread: number;
  image: string;
};

function formatConversationTime(timestamp: string | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: RenderConversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-all border-b border-white/5
        ${isActive ? 'bg-white/10 border-l-2 border-l-purple-400' : 'hover:bg-white/5'}`}
    >
      <div className="relative shrink-0">
        <img
          src={conv.image}
          alt={conv.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
        />
        {conv.isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#1a0840]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className={`text-sm font-semibold truncate ${conv.unread > 0 ? 'text-white' : 'text-white/80'}`}>
            {conv.name}
          </span>
          <span className="text-xs text-white/40 shrink-0 ml-2">{conv.timestamp}</span>
        </div>
        <p className={`text-xs truncate ${conv.unread > 0 ? 'text-white/80 font-medium' : 'text-white/40'}`}>
          {conv.lastMessage}
        </p>
      </div>

      {conv.unread > 0 && (
        <span className="w-5 h-5 bg-purple-500 rounded-full text-xs font-bold flex items-center justify-center shrink-0">
          {conv.unread}
        </span>
      )}
    </button>
  );
}

export function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [pageError, setPageError] = useState('');
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [forceScrollToBottom, setForceScrollToBottom] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const renderedConversations = useMemo<RenderConversation[]>(() => {
    return conversations.map((conversation) => {
      const previewText = conversation.lastMessage
        ? (conversation.lastMessageSenderId === user?.id
          ? `You: ${conversation.lastMessage}`
          : conversation.lastMessage)
        : 'You matched. Say hello!';

      const timestamp = formatConversationTime(
        conversation.lastMessageSentAt || conversation.matchedAt
      );

      const onlineFromLastActive = conversation.user.lastActive
        ? (Date.now() - new Date(conversation.user.lastActive).getTime()) < ONLINE_WINDOW_MS
        : false;

      return {
        matchId: conversation.matchId,
        name: conversation.user.name,
        age: conversation.user.age,
        city: conversation.user.city,
        isOnline: conversation.user.isOnline || onlineFromLastActive,
        lastMessage: previewText,
        timestamp,
        unread: conversation.unreadCount,
        image: conversation.user.image,
      };
    });
  }, [conversations, user?.id]);

  const activeConversation = renderedConversations.find((c) => c.matchId === activeMatchId) || null;

  const filtered = renderedConversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const syncConversations = useCallback((loaded: Conversation[], preserveSelection: boolean) => {
    setConversations(loaded);

    if (loaded.length === 0) {
      setActiveMatchId(null);
      setThread(null);
      return;
    }

    const requestedMatchId = Number(searchParams.get('matchId'));
    const hasRequested = Number.isInteger(requestedMatchId) && requestedMatchId > 0;
    const requestedExists = hasRequested && loaded.some((c) => c.matchId === requestedMatchId);

    setActiveMatchId((previous) => {
      if (preserveSelection && previous && loaded.some((c) => c.matchId === previous)) {
        return previous;
      }
      if (requestedExists) {
        return requestedMatchId;
      }
      return loaded[0].matchId;
    });
  }, [searchParams]);

  const loadConversations = useCallback(async (preserveSelection = false) => {
    if (!preserveSelection) {
      setLoadingConversations(true);
      setPageError('');
    }
    try {
      const response = await apiClient.get<Conversation[]>('/api/messages/conversations');
      syncConversations(response.data, preserveSelection);
    } catch {
      if (!preserveSelection) {
        setPageError('Failed to load conversations.');
      }
    } finally {
      if (!preserveSelection) {
        setLoadingConversations(false);
      }
    }
  }, [syncConversations]);

  const loadThread = useCallback(async (matchId: number, background = false) => {
    if (!background) {
      setLoadingMessages(true);
      setPageError('');
    }
    try {
      const response = await apiClient.get<ConversationThread>(`/api/messages/${matchId}`);
      setThread(response.data);
      setConversations((prev) => prev.map((c) => (
        c.matchId === matchId ? { ...c, unreadCount: 0 } : c
      )));
    } catch {
      if (!background) {
        setPageError('Failed to load messages.');
      }
    } finally {
      if (!background) {
        setLoadingMessages(false);
      }
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 72;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setIsAtBottom(distanceToBottom <= threshold);
  }, [thread?.messages.length]);

  useEffect(() => {
    if (!thread) return;
    if (forceScrollToBottom || isAtBottom) {
      scrollToBottom(forceScrollToBottom ? 'smooth' : 'auto');
      if (forceScrollToBottom) {
        setForceScrollToBottom(false);
      }
    }
  }, [thread?.messages.length, isAtBottom, forceScrollToBottom, scrollToBottom, thread]);

  useEffect(() => {
    setShowOptionsMenu(false);
  }, [activeMatchId]);

  useEffect(() => {
    if (!showOptionsMenu) return;

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(target)) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, [showOptionsMenu]);

  useEffect(() => {
    loadConversations(false);
  }, [loadConversations]);

  useEffect(() => {
    if (!activeMatchId) return;
    loadThread(activeMatchId, false);
  }, [activeMatchId, loadThread]);

  const activeMatchIdRef = useRef<number | null>(null);
  useEffect(() => {
    activeMatchIdRef.current = activeMatchId;
  }, [activeMatchId]);

  useEffect(() => {
    if (!user?.id) return;
    const token = readToken();
    if (!token) return;

    const source = new EventSource(
      `/api/notifications/stream?token=${encodeURIComponent(token)}`
    );

    source.addEventListener('message', (evt) => {
      try {
        const { matchId, message } = JSON.parse((evt as MessageEvent).data) as {
          matchId: number;
          message: Message;
        };
        const isActive = activeMatchIdRef.current === matchId;

        setThread((prev) => {
          if (!prev || prev.matchId !== matchId) return prev;
          if (prev.messages.some((m) => m.id === message.id)) return prev;
          return { ...prev, messages: [...prev.messages, message] };
        });

        setConversations((prev) => prev.map((c) => (
          c.matchId === matchId
            ? {
                ...c,
                lastMessage: message.text,
                lastMessageSentAt: message.sentAt,
                lastMessageSenderId: message.senderId,
                unreadCount: isActive ? 0 : c.unreadCount + 1,
              }
            : c
        )));

        if (isActive) {
          apiClient
            .patch(`/api/messages/${matchId}/read`)
            .catch(() => { /* best-effort */ });
        }
      } catch {
        // Ignore malformed payloads.
      }
    });

    source.addEventListener('chat_cleared', (evt) => {
      try {
        const { matchId } = JSON.parse((evt as MessageEvent).data) as { matchId: number };

        setThread((prev) => {
          if (!prev || prev.matchId !== matchId) return prev;
          return { ...prev, messages: [] };
        });

        setConversations((prev) => prev.map((c) => (
          c.matchId === matchId
            ? {
                ...c,
                lastMessage: null,
                lastMessageSentAt: null,
                lastMessageSenderId: null,
                unreadCount: 0,
              }
            : c
        )));
      } catch {
        // Ignore malformed payloads.
      }
    });

    return () => source.close();
  }, [user?.id]);

  const selectConversation = (matchId: number) => {
    setActiveMatchId(matchId);
    setMobileView('chat');
  };

  const sendMessage = async (text?: string) => {
    if (!activeMatchId || !user?.id) return;
    const content = (text ?? inputText).trim();
    if (!content) return;

    const tempId = -Date.now();
    const nowIso = new Date().toISOString();
    const optimistic: Message = {
      id: tempId,
      senderId: user.id,
      text: content,
      sentAt: nowIso,
      readAt: null,
    };
    const targetMatchId = activeMatchId;

    setThread((prev) => {
      if (!prev || prev.matchId !== targetMatchId) return prev;
      return { ...prev, messages: [...prev.messages, optimistic] };
    });
    setConversations((prev) => prev.map((conversation) => (
      conversation.matchId === targetMatchId
        ? {
            ...conversation,
            lastMessage: content,
            lastMessageSentAt: nowIso,
            lastMessageSenderId: user.id,
          }
        : conversation
    )));
    if (!text) {
      setInputText('');
    }
    setForceScrollToBottom(true);

    try {
      const response = await apiClient.post<Message>(`/api/messages/${targetMatchId}`, {
        text: content,
      });

      const newMessage = response.data;
      setThread((prev) => {
        if (!prev || prev.matchId !== targetMatchId) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) => (m.id === tempId ? newMessage : m)),
        };
      });
      setConversations((prev) => prev.map((conversation) => (
        conversation.matchId === targetMatchId
          ? {
              ...conversation,
              lastMessage: newMessage.text,
              lastMessageSentAt: newMessage.sentAt,
              lastMessageSenderId: newMessage.senderId,
            }
          : conversation
      )));
    } catch {
      setThread((prev) => {
        if (!prev || prev.matchId !== targetMatchId) return prev;
        return { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) };
      });
      setPageError('Failed to send message. Please try again.');
    }
  };

  const handleMessageScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 72;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setIsAtBottom(distanceToBottom <= threshold);
  };

  const clearConversation = async () => {
    if (!activeMatchId || !thread) return;
    const confirmed = window.confirm('Clear this chat history? This will remove all messages in this conversation for both users.');
    if (!confirmed) return;

    setClearingChat(true);
    setPageError('');
    try {
      await apiClient.delete(`/api/messages/${activeMatchId}`);
      setThread((prev) => (prev && prev.matchId === activeMatchId ? { ...prev, messages: [] } : prev));
      setConversations((prev) => prev.map((conversation) => (
        conversation.matchId === activeMatchId
          ? {
              ...conversation,
              lastMessage: null,
              lastMessageSentAt: null,
              lastMessageSenderId: null,
              unreadCount: 0,
            }
          : conversation
      )));
      setShowOptionsMenu(false);
    } catch {
      setPageError('Failed to clear chat. Please try again.');
    } finally {
      setClearingChat(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden mt-20">

        {/* ── Left Sidebar ── */}
        <aside
          className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-white/10 flex flex-col bg-black/20
            ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Sidebar header */}
          <div className="px-4 pt-5 pb-4 border-b border-white/10 shrink-0">
            <h2 className="text-lg font-bold mb-3">Messages</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search matches..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="h-full flex items-center justify-center text-white/50 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading conversations...
              </div>
            ) : null}

            {!loadingConversations && filtered.length === 0 ? (
              <p className="p-6 text-center text-white/40 text-sm">
                {conversations.length === 0 ? 'No matches yet. Go to Matches to start chatting.' : 'No conversations found.'}
              </p>
            ) : null}

            {!loadingConversations && filtered.length > 0 ? (
              filtered.map(conv => (
                <ConversationItem
                  key={conv.matchId}
                  conv={conv}
                  isActive={conv.matchId === activeMatchId}
                  onClick={() => selectConversation(conv.matchId)}
                />
              ))
            ) : null}
          </div>
        </aside>

        {/* ── Right Chat Panel ── */}
        <main
          className={`flex-1 flex flex-col overflow-hidden min-h-0 relative
            ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}
        >
          {!activeConversation || !thread ? (
            <div className="flex-1 flex items-center justify-center text-white/50 px-8 text-center">
              {loadingConversations ? 'Loading...' : 'Select a conversation from your matches to start messaging.'}
            </div>
          ) : (
          <>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-black/10 backdrop-blur-sm shrink-0">
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden text-white/70 hover:text-white transition-colors mr-1"
              aria-label="Back to conversations"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="relative shrink-0">
              <img
                src={activeConversation.image}
                alt={activeConversation.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-white/20"
              />
              {activeConversation.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#2E1065]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base leading-tight">
                {activeConversation.name}, {activeConversation.age}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/60">{activeConversation.city}</span>
                <span className="text-white/30">·</span>
                <span className={activeConversation.isOnline ? 'text-green-400' : 'text-white/40'}>
                  {activeConversation.isOnline ? 'Active now' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="relative" ref={optionsMenuRef}>
              <button
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Chat options"
                onClick={() => setShowOptionsMenu((prev) => !prev)}
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/15 bg-[#1f0d47] shadow-xl overflow-hidden z-20">
                  <button
                    onClick={clearConversation}
                    disabled={clearingChat}
                    className="w-full text-left px-4 py-2.5 text-sm text-rose-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {clearingChat ? 'Clearing chat...' : 'Clear chat'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div
            ref={messagesContainerRef}
            onScroll={handleMessageScroll}
            className="flex-1 overflow-y-auto px-5 py-6 space-y-3 min-h-0"
          >
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center text-white/50 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading messages...
              </div>
            ) : null}

            {!loadingMessages && thread.messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/50 text-sm text-center px-8">
                You matched. Send the first message.
              </div>
            ) : null}

            {!loadingMessages && thread.messages.map((msg, i) => {
              const isMe = msg.senderId === user?.id;
              const isLast = i === thread.messages.length - 1;
              const prevSender = i > 0 ? thread.messages[i - 1].senderId : null;
              const showAvatar = !isMe && prevSender !== msg.senderId;

              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar (received, only on first in a group) */}
                  {!isMe && (
                    <div className="w-8 shrink-0">
                      {showAvatar && (
                        <img
                          src={activeConversation.image}
                          alt={activeConversation.name}
                          className="w-8 h-8 rounded-full object-cover border border-white/20"
                        />
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-2.5 text-sm leading-relaxed
                        ${isMe
                          ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-3xl rounded-br-md shadow-lg shadow-purple-700/20'
                          : 'bg-white/10 backdrop-blur-sm border border-white/10 text-white rounded-3xl rounded-bl-md'
                        }`}
                    >
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[11px] text-white/30">{formatMessageTime(msg.sentAt)}</span>
                      {isMe && isLast && (
                        <CheckCheck className="w-3.5 h-3.5 text-purple-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {!isAtBottom && !loadingMessages ? (
            <div className="absolute bottom-24 right-6">
              <button
                onClick={() => {
                  setForceScrollToBottom(true);
                  scrollToBottom();
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white shadow-lg"
              >
                Jump to latest
              </button>
            </div>
          ) : null}

          {/* Input area */}
          <div className="px-5 py-4 border-t border-white/10 bg-black/10 backdrop-blur-sm shrink-0">
            {pageError ? <p className="mb-3 text-xs text-rose-300">{pageError}</p> : null}
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder={`Message ${activeConversation.name}...`}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputText.trim() || loadingMessages}
                className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30 shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
}
