import { useState, useRef, useEffect } from 'react';
import { Search, Send, ChevronLeft, MoreVertical, CheckCheck } from 'lucide-react';
import { Navbar } from '../components/Navbar';

type Message = {
  id: number;
  text: string;
  sender: 'me' | 'them';
  time: string;
  read: boolean;
};

type Conversation = {
  id: number;
  name: string;
  age: number;
  sport: string;
  sportIcon: string;
  isOnline: boolean;
  lastMessage: string;
  timestamp: string;
  unread: number;
  image: string;
  messages: Message[];
};

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    name: 'Emma',
    age: 26,
    sport: 'Runner',
    sportIcon: '🏃',
    isOnline: true,
    lastMessage: "Want to run tomorrow morning?",
    timestamp: '10:45 AM',
    unread: 2,
    image: 'https://images.unsplash.com/photo-1771513699065-0f0f696341b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    messages: [
      { id: 1, text: "Hey! I saw you also do marathon training 🏃", sender: 'them', time: '10:30 AM', read: true },
      { id: 2, text: "Yes! I'm training for the city marathon next spring", sender: 'me', time: '10:32 AM', read: true },
      { id: 3, text: "That's amazing! What's your current weekly mileage?", sender: 'them', time: '10:35 AM', read: true },
      { id: 4, text: "Around 60km. Trying to build up to 80 before the race", sender: 'me', time: '10:37 AM', read: true },
      { id: 5, text: "Impressive! I'm at 70km right now. We should train together sometime 💪", sender: 'them', time: '10:40 AM', read: true },
      { id: 6, text: "Want to run tomorrow morning?", sender: 'them', time: '10:45 AM', read: false },
    ],
  },
  {
    id: 2,
    name: 'Alex',
    age: 28,
    sport: 'CrossFit',
    sportIcon: '🏋️',
    isOnline: false,
    lastMessage: "That PR was insane, congrats!",
    timestamp: 'Yesterday',
    unread: 0,
    image: 'https://images.unsplash.com/photo-1752778597829-9e92e6d8b42f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    messages: [
      { id: 1, text: "Saw your post about the 200kg deadlift 🔥", sender: 'them', time: 'Yesterday 3:10 PM', read: true },
      { id: 2, text: "Thanks! Took months but finally got there", sender: 'me', time: 'Yesterday 3:14 PM', read: true },
      { id: 3, text: "That PR was insane, congrats!", sender: 'them', time: 'Yesterday 3:15 PM', read: true },
    ],
  },
  {
    id: 3,
    name: 'Sarah',
    age: 24,
    sport: 'Swimming',
    sportIcon: '🏊‍♀️',
    isOnline: false,
    lastMessage: "The pool opens at 6, I'll be there",
    timestamp: 'Mon',
    unread: 0,
    image: 'https://images.unsplash.com/photo-1472521882609-05fb39814d60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    messages: [
      { id: 1, text: "Do you go to the university pool?", sender: 'me', time: 'Mon 9:00 AM', read: true },
      { id: 2, text: "Yes! Almost every morning", sender: 'them', time: 'Mon 9:15 AM', read: true },
      { id: 3, text: "Nice, maybe we could swim together sometime", sender: 'me', time: 'Mon 9:20 AM', read: true },
      { id: 4, text: "The pool opens at 6, I'll be there", sender: 'them', time: 'Mon 9:45 AM', read: true },
    ],
  },
  {
    id: 4,
    name: 'Jordan',
    age: 30,
    sport: 'Cycling',
    sportIcon: '🚴',
    isOnline: false,
    lastMessage: "You: Sounds like a plan!",
    timestamp: 'Sun',
    unread: 0,
    image: 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    messages: [
      { id: 1, text: "I'm planning a 100km ride this weekend, want to join?", sender: 'them', time: 'Sun 2:00 PM', read: true },
      { id: 2, text: "Sounds like a plan!", sender: 'me', time: 'Sun 2:10 PM', read: true },
    ],
  },
  {
    id: 5,
    name: 'Mia',
    age: 25,
    sport: 'Yoga',
    sportIcon: '🧘‍♀️',
    isOnline: false,
    lastMessage: "You: That sounds wonderful!",
    timestamp: 'Fri',
    unread: 0,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    messages: [
      { id: 1, text: "I do a sunrise yoga session every Saturday at the park", sender: 'them', time: 'Fri 7:00 PM', read: true },
      { id: 2, text: "That sounds wonderful!", sender: 'me', time: 'Fri 7:05 PM', read: true },
    ],
  },
];

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
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
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState(1);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const active = conversations.find(c => c.id === activeId)!;
  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length]);

  const selectConversation = (id: number) => {
    setActiveId(id);
    setMobileView('chat');
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const sendMessage = (text?: string) => {
    const content = (text ?? inputText).trim();
    if (!content) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = { id: Date.now(), text: content, sender: 'me', time, read: false };
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: `You: ${content}`, timestamp: 'Just now' }
        : c
    ));
    if (!text) setInputText('');
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
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-white/40 text-sm">No conversations found.</p>
            ) : (
              filtered.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeId}
                  onClick={() => selectConversation(conv.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Right Chat Panel ── */}
        <main
          className={`flex-1 flex flex-col overflow-hidden
            ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}
        >
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
                src={active.image}
                alt={active.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-white/20"
              />
              {active.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#2E1065]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base leading-tight">
                {active.name}, {active.age}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/60">{active.sportIcon} {active.sport}</span>
                <span className="text-white/30">·</span>
                <span className={active.isOnline ? 'text-green-400' : 'text-white/40'}>
                  {active.isOnline ? 'Active now' : 'Offline'}
                </span>
              </div>
            </div>

            <button className="text-white/50 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-3">
            {active.messages.map((msg, i) => {
              const isMe = msg.sender === 'me';
              const isLast = i === active.messages.length - 1;
              const prevSender = i > 0 ? active.messages[i - 1].sender : null;
              const showAvatar = !isMe && prevSender !== 'them';

              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar (received, only on first in a group) */}
                  {!isMe && (
                    <div className="w-8 shrink-0">
                      {showAvatar && (
                        <img
                          src={active.image}
                          alt={active.name}
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
                      <span className="text-[11px] text-white/30">{msg.time}</span>
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

          {/* Input area */}
          <div className="px-5 py-4 border-t border-white/10 bg-black/10 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder={`Message ${active.name}...`}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputText.trim()}
                className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30 shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
