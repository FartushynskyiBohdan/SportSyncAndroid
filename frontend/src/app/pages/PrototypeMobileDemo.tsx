import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bolt,
  CheckCircle2,
  ChevronRight,
  Compass,
  Filter,
  Heart,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

type Flow = 'welcome' | 'login' | 'register' | 'onboarding' | 'app';
type TabKey = 'discover' | 'matches' | 'messages' | 'profile';
type PanelKey =
  | null
  | 'filters'
  | 'profileDetail'
  | 'editProfile'
  | 'settings'
  | 'blocked'
  | 'admin'
  | 'suspended';

type GoalKey = 'serious' | 'active-dates' | 'training-partner';
type SportKey = 'running' | 'cycling' | 'hyrox' | 'climbing' | 'strength';
type FrequencyKey = '2x' | '4x' | 'daily';

interface DemoProfile {
  id: number;
  name: string;
  age: number;
  city: string;
  distance: string;
  title: string;
  bio: string;
  goal: string;
  training: string;
  sports: string[];
  prompt: string;
  photo: string;
  createsMatch?: boolean;
}

interface DemoMatch {
  id: number;
  userId: number;
  lastMessage: string;
  unread: number;
  online: boolean;
}

interface DemoThreadMessage {
  id: number;
  author: 'me' | 'them';
  text: string;
}

interface BlockedUser {
  id: number;
  name: string;
  city: string;
  reason: string;
}

interface DemoReport {
  id: number;
  userName: string;
  reason: string;
  status: 'Pending' | 'Reviewed' | 'Dismissed';
}

interface DemoUser {
  firstName: string;
  age: number;
  city: string;
  bio: string;
  goal: GoalKey;
  primarySport: SportKey;
  training: FrequencyKey;
  lookingFor: string;
}

interface FilterState {
  distance: '10 km' | '25 km' | '50 km';
  goals: GoalKey[];
  sports: SportKey[];
}

interface NotificationPrefs {
  matches: boolean;
  messages: boolean;
  reminders: boolean;
}

const SPORT_LABELS: Record<SportKey, string> = {
  running: 'Running',
  cycling: 'Cycling',
  hyrox: 'Hyrox',
  climbing: 'Climbing',
  strength: 'Strength',
};

const GOAL_LABELS: Record<GoalKey, string> = {
  serious: 'Serious dating',
  'active-dates': 'Active dates',
  'training-partner': 'Training partner',
};

const TRAINING_LABELS: Record<FrequencyKey, string> = {
  '2x': '1-2 sessions/week',
  '4x': '3-4 sessions/week',
  daily: '5+ sessions/week',
};

const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 1,
    name: 'Lina',
    age: 26,
    city: 'Manchester',
    distance: '5 km away',
    title: 'Half marathon prep and coffee after long runs.',
    bio: 'Looking for someone who understands early alarms, race weekends, and why a recovery walk still counts as a date.',
    goal: 'Serious dating',
    training: '4x / week',
    sports: ['Running', 'Strength', 'Mobility'],
    prompt: 'Best reward after a hard session: bakery stop or cold plunge?',
    photo:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
    createsMatch: true,
  },
  {
    id: 2,
    name: 'Amara',
    age: 24,
    city: 'Birmingham',
    distance: '12 km away',
    title: 'Bouldering, climbing trips, and patient belay energy.',
    bio: 'I like athletic people who are calm under pressure and excited about trying new things, indoors or outdoors.',
    goal: 'Active dates',
    training: '3x / week',
    sports: ['Climbing', 'Yoga', 'Hiking'],
    prompt: 'Indoor wall session first or straight to outdoor routes?',
    photo:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 3,
    name: 'Noah',
    age: 27,
    city: 'London',
    distance: '8 km away',
    title: 'Hyrox, gym consistency, and no flaky plans.',
    bio: 'I care more about routine than hype. If we can train hard and still laugh through it, that is a very good sign.',
    goal: 'Training partner',
    training: '5x / week',
    sports: ['Hyrox', 'Strength', 'Running'],
    prompt: 'What makes someone feel disciplined instead of just performative?',
    photo:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80',
    createsMatch: true,
  },
  {
    id: 4,
    name: 'Mia',
    age: 25,
    city: 'Leeds',
    distance: '21 km away',
    title: 'Trail runs, pilates, and Sunday reset routines.',
    bio: 'I am happiest around people who are active without making it their entire personality.',
    goal: 'Serious dating',
    training: '4x / week',
    sports: ['Running', 'Pilates', 'Trail'],
    prompt: 'Best kind of active date: race expo, long walk, or climbing gym?',
    photo:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 5,
    name: 'Jordan',
    age: 28,
    city: 'Bristol',
    distance: '14 km away',
    title: 'Cycling, lifting, and planned spontaneity.',
    bio: 'If your idea of balance is a hard session followed by a proper meal, we will probably get along.',
    goal: 'Active dates',
    training: '4x / week',
    sports: ['Cycling', 'Gym', 'Mobility'],
    prompt: 'What is your version of a perfect recovery day?',
    photo:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 6,
    name: 'Elise',
    age: 26,
    city: 'Liverpool',
    distance: '18 km away',
    title: 'Race calendar nerd with a soft spot for sea swims.',
    bio: 'I want someone who likes structure but still knows how to enjoy the off-season.',
    goal: 'Serious dating',
    training: '5x / week',
    sports: ['Triathlon', 'Swimming', 'Running'],
    prompt: 'Would you rather train together or compare notes after?',
    photo:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80',
  },
];

const INITIAL_DISCOVER_IDS = [1, 2, 3, 4];

const DEFAULT_USER: DemoUser = {
  firstName: 'Chris',
  age: 27,
  city: 'Sheffield',
  bio: 'Gym in the week, long runs at the weekend, and trying to date someone who actually gets that rhythm.',
  goal: 'serious',
  primarySport: 'running',
  training: '4x',
  lookingFor: 'Someone active, kind, and realistic about building routine together.',
};

const DEFAULT_FILTERS: FilterState = {
  distance: '25 km',
  goals: ['serious', 'active-dates'],
  sports: ['running', 'strength', 'hyrox'],
};

const DEFAULT_PREFS: NotificationPrefs = {
  matches: true,
  messages: true,
  reminders: false,
};

function createInitialMatches(): DemoMatch[] {
  return [
    { id: 501, userId: 5, lastMessage: 'Tomorrow morning ride or coffee first?', unread: 2, online: true },
    { id: 502, userId: 6, lastMessage: 'I can send over my race schedule later.', unread: 0, online: false },
  ];
}

function createInitialThreads(): Record<number, DemoThreadMessage[]> {
  return {
    501: [
      { id: 1, author: 'them', text: 'You mentioned early sessions. Are you actually a morning person?' },
      { id: 2, author: 'me', text: 'Only if the plan is worth waking up for.' },
      { id: 3, author: 'them', text: 'Tomorrow morning ride or coffee first?' },
    ],
    502: [
      { id: 1, author: 'them', text: 'You do race weekends too? That already makes this app feel more useful.' },
      { id: 2, author: 'me', text: 'Exactly. I wanted something more specific than generic swiping.' },
      { id: 3, author: 'them', text: 'I can send over my race schedule later.' },
    ],
  };
}

function createInitialBlockedUsers(): BlockedUser[] {
  return [
    { id: 91, name: 'Oliver', city: 'Leicester', reason: 'Spam links in chat' },
    { id: 92, name: 'Tara', city: 'Nottingham', reason: 'Repeatedly ignored boundaries' },
  ];
}

function createInitialReports(): DemoReport[] {
  return [
    { id: 801, userName: 'Dylan', reason: 'Harassment in messages', status: 'Pending' },
    { id: 802, userName: 'Marta', reason: 'Fake profile concern', status: 'Reviewed' },
  ];
}

function getProfile(userId: number) {
  const profile = DEMO_PROFILES.find((item) => item.id === userId);
  if (!profile) {
    throw new Error(`Missing profile for id ${userId}`);
  }
  return profile;
}

function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[390px] rounded-[2.6rem] border border-white/10 bg-[#0c1318] p-3 shadow-[0_35px_90px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none mx-auto mb-2 h-6 w-32 rounded-b-2xl bg-[#05080b]" />
      <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-[#f4efe5]">{children}</div>
    </div>
  );
}

function ScreenHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <header className="border-b border-[#ddd5c5] bg-[#f7f2e8]/90 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {onBack ? (
            <button
              onClick={onBack}
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d4cbb8] bg-white/80 text-[#22303c]"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <div>
            <h2 className="text-[1.55rem] font-black tracking-[-0.05em] text-[#15212c]">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-[#5c6a75]">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}

function Pill({
  children,
  active = false,
  tone = 'neutral',
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  tone?: 'neutral' | 'accent' | 'dark';
  onClick?: () => void;
}) {
  const neutral = active
    ? 'border-[#102a3b] bg-[#102a3b] text-[#f4efe5]'
    : 'border-[#d5ccb9] bg-white/80 text-[#2a3742]';
  const accent = active
    ? 'border-[#ff7b57] bg-[#ff7b57] text-white'
    : 'border-[#ffc0af] bg-[#fff3ef] text-[#a94a31]';
  const dark = active
    ? 'border-[#1ec28b] bg-[#102a23] text-[#8ff0bf]'
    : 'border-[#284153] bg-[#13202c] text-[#dfe7ec]';
  const classes = tone === 'accent' ? accent : tone === 'dark' ? dark : neutral;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${classes}`}
    >
      {children}
    </button>
  );
}

function RowLink({
  icon,
  label,
  description,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[1.2rem] border px-4 py-3 text-left ${
        danger
          ? 'border-[#f0c3bb] bg-[#fff3f0]'
          : 'border-[#d8d0bf] bg-white/80'
      }`}
    >
      <div className={`grid h-10 w-10 place-items-center rounded-full ${danger ? 'bg-[#ffe0da] text-[#bf4024]' : 'bg-[#13202c] text-[#f4efe5]'}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${danger ? 'text-[#8d2c16]' : 'text-[#1d2b37]'}`}>{label}</p>
        {description ? <p className={`mt-0.5 text-xs ${danger ? 'text-[#ab5a49]' : 'text-[#61707b]'}`}>{description}</p> : null}
      </div>
      <ChevronRight className={`h-4 w-4 ${danger ? 'text-[#bf4024]' : 'text-[#53626e]'}`} />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-[1.2rem] border border-[#d8d0bf] bg-white/80 px-4 py-3 text-left"
    >
      <div>
        <p className="text-sm font-semibold text-[#1d2b37]">{label}</p>
        <p className="mt-0.5 text-xs text-[#64727d]">{description}</p>
      </div>
      <span className={`inline-flex h-7 w-12 items-center rounded-full p-1 ${value ? 'bg-[#1ec28b]' : 'bg-[#ced4d8]'}`}>
        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

export function PrototypeMobileDemo() {
  const [flow, setFlow] = useState<Flow>('welcome');
  const [panel, setPanel] = useState<PanelKey>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('discover');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [discoverIds, setDiscoverIds] = useState<number[]>(INITIAL_DISCOVER_IDS);
  const [matches, setMatches] = useState<DemoMatch[]>(createInitialMatches());
  const [threads, setThreads] = useState<Record<number, DemoThreadMessage[]>>(createInitialThreads());
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(createInitialBlockedUsers());
  const [reports, setReports] = useState<DemoReport[]>(createInitialReports());
  const [demoUser, setDemoUser] = useState<DemoUser>(DEFAULT_USER);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [activeChatId, setActiveChatId] = useState<number>(501);
  const [matchModalId, setMatchModalId] = useState<number | null>(null);
  const [chatDraft, setChatDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('runner@sportsync.app');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [registerName, setRegisterName] = useState('Chris');
  const [registerEmail, setRegisterEmail] = useState('chris@sportsync.app');
  const [reportReason, setReportReason] = useState('Inappropriate behaviour');
  const [isAdminMode, setIsAdminMode] = useState(true);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const currentDiscoverProfile = discoverIds.length > 0 ? getProfile(discoverIds[0]) : null;
  const selectedProfile = selectedProfileId ? getProfile(selectedProfileId) : null;
  const activeMatch = matches.find((item) => item.id === activeChatId) ?? matches[0] ?? null;
  const activeThread = activeMatch ? threads[activeMatch.id] ?? [] : [];

  function resetDemo() {
    setFlow('welcome');
    setPanel(null);
    setActiveTab('discover');
    setOnboardingStep(0);
    setDiscoverIds(INITIAL_DISCOVER_IDS);
    setMatches(createInitialMatches());
    setThreads(createInitialThreads());
    setBlockedUsers(createInitialBlockedUsers());
    setReports(createInitialReports());
    setDemoUser(DEFAULT_USER);
    setFilters(DEFAULT_FILTERS);
    setNotifications(DEFAULT_PREFS);
    setSelectedProfileId(null);
    setActiveChatId(501);
    setMatchModalId(null);
    setChatDraft('');
    setToast('Demo reset');
    setLoginEmail('runner@sportsync.app');
    setLoginPassword('password123');
    setRegisterName('Chris');
    setRegisterEmail('chris@sportsync.app');
    setReportReason('Inappropriate behaviour');
    setIsAdminMode(true);
  }

  function openProfile(profileId: number) {
    setSelectedProfileId(profileId);
    setPanel('profileDetail');
  }

  function returnToMainTab(tab: TabKey) {
    setPanel(null);
    setActiveTab(tab);
  }

  function handleAuthContinue(target: 'login' | 'register') {
    setFlow(target);
    setPanel(null);
  }

  function handleStartOnboarding() {
    if (registerName.trim()) {
      setDemoUser((prev) => ({ ...prev, firstName: registerName.trim() }));
    }
    setFlow('onboarding');
    setOnboardingStep(0);
  }

  function goToDemoApp() {
    setFlow('app');
    setPanel(null);
    setActiveTab('discover');
  }

  function createMatchFromProfile(profile: DemoProfile) {
    const matchId = 600 + profile.id;
    const firstMessage = `You matched with ${profile.name}. Start with the training question, not just "hey".`;
    setMatches((prev) => {
      if (prev.some((item) => item.userId === profile.id)) {
        return prev;
      }
      return [
        {
          id: matchId,
          userId: profile.id,
          lastMessage: firstMessage,
          unread: 1,
          online: true,
        },
        ...prev,
      ];
    });
    setThreads((prev) => ({
      ...prev,
      [matchId]: prev[matchId] ?? [{ id: 1, author: 'them', text: firstMessage }],
    }));
    setActiveChatId(matchId);
    setMatchModalId(profile.id);
  }

  function handleDiscoverAction(action: 'like' | 'pass') {
    if (!currentDiscoverProfile) return;

    const nextId = currentDiscoverProfile.id;
    setDiscoverIds((prev) => prev.filter((id) => id !== nextId));

    if (action === 'like') {
      if (currentDiscoverProfile.createsMatch) {
        createMatchFromProfile(currentDiscoverProfile);
      } else {
        setToast(`Liked ${currentDiscoverProfile.name}`);
      }
    } else {
      setToast(`Passed on ${currentDiscoverProfile.name}`);
    }
  }

  function sendMessage() {
    if (!activeMatch || !chatDraft.trim()) return;

    const newMessage: DemoThreadMessage = {
      id: Date.now(),
      author: 'me',
      text: chatDraft.trim(),
    };

    setThreads((prev) => ({
      ...prev,
      [activeMatch.id]: [...(prev[activeMatch.id] ?? []), newMessage],
    }));
    setMatches((prev) =>
      prev.map((item) =>
        item.id === activeMatch.id
          ? { ...item, lastMessage: newMessage.text, unread: 0 }
          : item
      )
    );
    setChatDraft('');
  }

  function submitReport() {
    if (!selectedProfile) return;
    setReports((prev) => [
      {
        id: Date.now(),
        userName: selectedProfile.name,
        reason: reportReason,
        status: 'Pending',
      },
      ...prev,
    ]);
    setToast(`Report submitted for ${selectedProfile.name}`);
    setPanel('settings');
  }

  function updateReportStatus(reportId: number, status: DemoReport['status']) {
    setReports((prev) => prev.map((item) => (item.id === reportId ? { ...item, status } : item)));
    setToast(`Report marked as ${status.toLowerCase()}`);
  }

  function renderWelcome() {
    return (
      <div className="bg-[radial-gradient(circle_at_top,_#23475e,_#0f1a23_58%,_#081018)] px-6 py-8 text-white">
        <div className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/75">
          Interactive teacher demo
        </div>
        <h1 className="mt-6 text-[2.4rem] font-black tracking-[-0.06em]">SportSync mobile prototype</h1>
        <p className="mt-3 text-sm leading-7 text-white/75">
          Fully mocked, backend-free, and designed so your teacher can test the entire concept without setup pain.
        </p>

        <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
          <div className="grid gap-3">
            <button
              type="button"
              onClick={goToDemoApp}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff7b57] px-4 py-3 text-sm font-bold text-white"
            >
              Open instant demo
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleAuthContinue('login')}
              className="rounded-full border border-white/14 bg-white/6 px-4 py-3 text-sm font-semibold text-white"
            >
              Log in flow
            </button>
            <button
              type="button"
              onClick={() => handleAuthContinue('register')}
              className="rounded-full border border-white/14 bg-white/6 px-4 py-3 text-sm font-semibold text-white"
            >
              Register + onboarding flow
            </button>
          </div>

          <div className="mt-5 grid gap-3 text-left">
            <div className="rounded-[1.2rem] bg-[#101e29] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#88d2bb]">Included</p>
              <p className="mt-1 text-sm text-white/78">Auth, onboarding, discover, matches, chat, profile, settings, blocked users, admin, suspended preview.</p>
            </div>
            <div className="rounded-[1.2rem] bg-[#101e29] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec4ff]">No backend mode</p>
              <p className="mt-1 text-sm text-white/78">Everything runs from local React state, so it is safe to demo live.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderLogin() {
    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader title="Welcome back" subtitle="This version is fully mocked for presentation." onBack={() => setFlow('welcome')} />
        <div className="space-y-4 px-5 py-6">
          <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">Email</label>
            <input
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              className="mt-2 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
            />
          </div>
          <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              className="mt-2 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
            />
          </div>
          <button type="button" onClick={goToDemoApp} className="w-full rounded-full bg-[#102a3b] px-4 py-3 text-sm font-bold text-[#f4efe5]">
            Enter demo app
          </button>
          <button type="button" onClick={() => setFlow('register')} className="w-full rounded-full border border-[#cfc6b2] bg-white/70 px-4 py-3 text-sm font-semibold text-[#22303c]">
            Need an account? Register
          </button>
        </div>
      </div>
    );
  }

  function renderRegister() {
    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader title="Create account" subtitle="We only collect enough to start the mobile flow." onBack={() => setFlow('welcome')} />
        <div className="space-y-4 px-5 py-6">
          <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">First name</label>
            <input
              value={registerName}
              onChange={(event) => setRegisterName(event.target.value)}
              className="mt-2 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
            />
          </div>
          <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">Email</label>
            <input
              value={registerEmail}
              onChange={(event) => setRegisterEmail(event.target.value)}
              className="mt-2 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
            />
          </div>
          <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">Password</label>
            <input type="password" value="password123" readOnly className="mt-2 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#7a756b]" />
          </div>
          <button type="button" onClick={handleStartOnboarding} className="w-full rounded-full bg-[#ff7b57] px-4 py-3 text-sm font-bold text-white">
            Continue to onboarding
          </button>
        </div>
      </div>
    );
  }

  function renderOnboarding() {
    const steps = ['Identity', 'Sport', 'Goals', 'Profile'];

    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader
          title={steps[onboardingStep]}
          subtitle={`Step ${onboardingStep + 1} of ${steps.length}`}
          onBack={() => {
            if (onboardingStep === 0) {
              setFlow('register');
            } else {
              setOnboardingStep((prev) => prev - 1);
            }
          }}
          action={
            <span className="rounded-full bg-[#102a3b] px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8df1bb]">
              {Math.round(((onboardingStep + 1) / steps.length) * 100)}%
            </span>
          }
        />
        <div className="px-5 py-5">
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-[#ddd4c2]">
            <div
              className="h-full rounded-full bg-[#1ec28b] transition-all"
              style={{ width: `${((onboardingStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {onboardingStep === 0 ? (
            <div className="space-y-4">
              <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">Name</label>
                <input
                  value={demoUser.firstName}
                  onChange={(event) => setDemoUser((prev) => ({ ...prev, firstName: event.target.value }))}
                  className="mt-2 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
                />
              </div>
              <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">Age</label>
                <input
                  type="number"
                  value={demoUser.age}
                  onChange={(event) => setDemoUser((prev) => ({ ...prev, age: Number(event.target.value) || prev.age }))}
                  className="mt-2 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
                />
              </div>
              <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">City</label>
                <input
                  value={demoUser.city}
                  onChange={(event) => setDemoUser((prev) => ({ ...prev, city: event.target.value }))}
                  className="mt-2 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
                />
              </div>
            </div>
          ) : null}

          {onboardingStep === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60707b]">Primary sport</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(SPORT_LABELS) as SportKey[]).map((sport) => (
                    <Pill
                      key={sport}
                      active={demoUser.primarySport === sport}
                      onClick={() => setDemoUser((prev) => ({ ...prev, primarySport: sport }))}
                    >
                      {SPORT_LABELS[sport]}
                    </Pill>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60707b]">Training frequency</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(TRAINING_LABELS) as FrequencyKey[]).map((frequency) => (
                    <Pill
                      key={frequency}
                      active={demoUser.training === frequency}
                      tone="accent"
                      onClick={() => setDemoUser((prev) => ({ ...prev, training: frequency }))}
                    >
                      {TRAINING_LABELS[frequency]}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {onboardingStep === 2 ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60707b]">Relationship goal</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(GOAL_LABELS) as GoalKey[]).map((goal) => (
                    <Pill
                      key={goal}
                      active={demoUser.goal === goal}
                      tone="accent"
                      onClick={() => setDemoUser((prev) => ({ ...prev, goal }))}
                    >
                      {GOAL_LABELS[goal]}
                    </Pill>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">What are you looking for?</label>
                <textarea
                  value={demoUser.lookingFor}
                  onChange={(event) => setDemoUser((prev) => ({ ...prev, lookingFor: event.target.value }))}
                  className="mt-2 min-h-28 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
                />
              </div>
            </div>
          ) : null}

          {onboardingStep === 3 ? (
            <div className="space-y-5">
              <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">Short bio</label>
                <textarea
                  value={demoUser.bio}
                  onChange={(event) => setDemoUser((prev) => ({ ...prev, bio: event.target.value }))}
                  className="mt-2 min-h-28 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
                />
              </div>
              <div className="rounded-[1.4rem] border border-[#d6cdbc] bg-[#13202c] p-4 text-[#f4efe5]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8dd8c1]">Profile preview</p>
                <p className="mt-2 text-lg font-bold">{demoUser.firstName}, {demoUser.age}</p>
                <p className="mt-1 text-sm text-white/68">{demoUser.city} - {SPORT_LABELS[demoUser.primarySport]}</p>
                <p className="mt-3 text-sm leading-6 text-white/82">{demoUser.bio}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            {onboardingStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setOnboardingStep((prev) => prev + 1)}
                className="flex-1 rounded-full bg-[#102a3b] px-4 py-3 text-sm font-bold text-[#f4efe5]"
              >
                Continue
              </button>
            ) : (
              <button type="button" onClick={goToDemoApp} className="flex-1 rounded-full bg-[#ff7b57] px-4 py-3 text-sm font-bold text-white">
                Finish onboarding
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderDiscover() {
    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader
          title="Discover"
          subtitle="Swipe-like decisions, but with athlete context."
          action={
            <button
              type="button"
              onClick={() => setPanel('filters')}
              className="inline-flex items-center gap-2 rounded-full border border-[#d2c9b7] bg-white/75 px-3 py-2 text-xs font-semibold text-[#22303c]"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>
          }
        />
        <div className="px-4 py-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <Pill active tone="dark">{filters.distance}</Pill>
            {filters.goals.map((goal) => (
              <Pill key={goal} tone="dark">{GOAL_LABELS[goal]}</Pill>
            ))}
          </div>

          {!currentDiscoverProfile ? (
            <div className="rounded-[2rem] border border-[#d8d0bf] bg-white/70 p-8 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-[#ff7b57]" />
              <h3 className="mt-4 text-xl font-black tracking-[-0.04em] text-[#15212c]">That is the full queue.</h3>
              <p className="mt-2 text-sm leading-7 text-[#65727d]">For the demo, you can repopulate the stack and try another path.</p>
              <button
                type="button"
                onClick={() => setDiscoverIds(INITIAL_DISCOVER_IDS)}
                className="mt-5 rounded-full bg-[#102a3b] px-5 py-3 text-sm font-bold text-[#f4efe5]"
              >
                Reload demo profiles
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-[#d7cfbd] bg-[#12202b] shadow-[0_20px_55px_rgba(10,18,25,0.18)]">
              <div className="relative h-[23rem]">
                <ImageWithFallback src={currentDiscoverProfile.photo} alt={currentDiscoverProfile.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081018] via-transparent to-transparent" />
                <div className="absolute inset-x-4 top-4 flex flex-wrap gap-2">
                  <Pill tone="dark" active>{currentDiscoverProfile.distance}</Pill>
                  <Pill tone="dark" active>{currentDiscoverProfile.training}</Pill>
                </div>
                <button
                  type="button"
                  onClick={() => openProfile(currentDiscoverProfile.id)}
                  className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/25 px-3 py-2 text-xs font-semibold text-white backdrop-blur"
                >
                  View profile
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="text-[2rem] font-black tracking-[-0.05em]">{currentDiscoverProfile.name}, {currentDiscoverProfile.age}</h3>
                  <p className="mt-2 text-sm text-white/72">{currentDiscoverProfile.city} - {currentDiscoverProfile.title}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentDiscoverProfile.sports.map((sport) => (
                      <Pill key={sport} tone="dark">{sport}</Pill>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-[#f7f2e8] px-5 py-5">
                <div className="rounded-[1.3rem] border border-[#dbd2c1] bg-white/75 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64727d]">Prompt</p>
                  <p className="mt-2 text-sm leading-7 text-[#22303c]">{currentDiscoverProfile.prompt}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => handleDiscoverAction('pass')} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d4cbb8] bg-white/70 px-4 py-3 text-sm font-semibold text-[#22303c]">
                    <X className="h-4 w-4" />
                    Pass
                  </button>
                  <button type="button" onClick={() => openProfile(currentDiscoverProfile.id)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d4cbb8] bg-white/70 px-4 py-3 text-sm font-semibold text-[#22303c]">
                    <Users className="h-4 w-4" />
                    Details
                  </button>
                  <button type="button" onClick={() => handleDiscoverAction('like')} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff7b57] px-4 py-3 text-sm font-bold text-white">
                    <Heart className="h-4 w-4 fill-current" />
                    Like
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderMatches() {
    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader title="Matches" subtitle="Where the concept becomes a conversation." />
        <div className="space-y-3 px-4 py-5">
          {matches.map((match) => {
            const profile = getProfile(match.userId);
            return (
              <button
                key={match.id}
                type="button"
                onClick={() => {
                  setActiveChatId(match.id);
                  setActiveTab('messages');
                }}
                className="flex w-full items-center gap-3 rounded-[1.5rem] border border-[#d8d0bf] bg-white/80 p-3 text-left"
              >
                <ImageWithFallback src={profile.photo} alt={profile.name} className="h-14 w-14 rounded-[1rem] object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-[#1d2b37]">{profile.name}</p>
                    {match.online ? <span className="h-2.5 w-2.5 rounded-full bg-[#1ec28b]" /> : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-[#5f6d78]">{profile.city} - {profile.goal}</p>
                  <p className="mt-1 truncate text-xs text-[#354450]">{match.lastMessage}</p>
                </div>
                <div className="text-right">
                  {match.unread > 0 ? <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#102a3b] px-2 text-[0.68rem] font-bold text-[#f4efe5]">{match.unread}</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderMessages() {
    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader
          title="Messages"
          subtitle={activeMatch ? `Chat with ${getProfile(activeMatch.userId).name}` : 'No active conversation'}
        />
        {!activeMatch ? (
          <div className="px-5 py-8 text-center text-sm text-[#5f6d78]">No conversations yet.</div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto border-b border-[#ddd5c5] px-4 py-3">
              {matches.map((match) => {
                const profile = getProfile(match.userId);
                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => setActiveChatId(match.id)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      activeChatId === match.id
                        ? 'bg-[#102a3b] text-[#f4efe5]'
                        : 'border border-[#d5ccba] bg-white/70 text-[#22303c]'
                    }`}
                  >
                    {profile.name}
                  </button>
                );
              })}
            </div>
            <div className="space-y-3 px-4 py-5">
              {activeThread.map((message) => (
                <div key={message.id} className={`flex ${message.author === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-[1.4rem] px-4 py-3 text-sm leading-6 ${
                      message.author === 'me'
                        ? 'rounded-br-md bg-[#102a3b] text-[#f4efe5]'
                        : 'rounded-bl-md border border-[#ddd4c2] bg-white text-[#22303c]'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#ddd5c5] px-4 py-4">
              <div className="flex items-center gap-3 rounded-full border border-[#d5ccba] bg-white/80 px-4 py-2">
                <input
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  placeholder="Reply as if this were the final prototype..."
                  className="flex-1 bg-transparent py-2 text-sm text-[#22303c] outline-none placeholder:text-[#7a776f]"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7b57] text-white"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderProfile() {
    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader
          title={`${demoUser.firstName}, ${demoUser.age}`}
          subtitle={`${demoUser.city} - ${SPORT_LABELS[demoUser.primarySport]}`}
          action={
            <button
              type="button"
              onClick={() => setPanel('settings')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d4cbb8] bg-white/75 text-[#22303c]"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          }
        />
        <div className="space-y-4 px-4 py-5">
          <div className="overflow-hidden rounded-[1.8rem] border border-[#d7cfbd] bg-[#13202c] text-[#f4efe5]">
            <div className="h-64 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.05))] p-5">
              <div className="flex h-full flex-col justify-end">
                <div className="flex flex-wrap gap-2">
                  <Pill tone="dark">{SPORT_LABELS[demoUser.primarySport]}</Pill>
                  <Pill tone="dark">{TRAINING_LABELS[demoUser.training]}</Pill>
                  <Pill tone="dark">{GOAL_LABELS[demoUser.goal]}</Pill>
                </div>
                <p className="mt-4 text-xl font-black tracking-[-0.04em]">Mobile-first athlete profile</p>
                <p className="mt-2 text-sm leading-6 text-white/72">Focused on routine, compatibility, and clarity rather than overloaded profile chrome.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-[#d8d0bf] bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#1d2b37]">About</p>
              <button type="button" onClick={() => setPanel('editProfile')} className="text-xs font-semibold uppercase tracking-[0.16em] text-[#102a3b]">
                Edit
              </button>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#22303c]">{demoUser.bio}</p>
          </div>

          <div className="rounded-[1.4rem] border border-[#d8d0bf] bg-white/80 p-4">
            <p className="text-sm font-bold text-[#1d2b37]">Looking for</p>
            <p className="mt-3 text-sm leading-7 text-[#22303c]">{demoUser.lookingFor}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[1.3rem] bg-[#102a3b] px-3 py-4 text-center text-[#f4efe5]">
              <p className="text-xl font-black">92%</p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-white/62">sport fit</p>
            </div>
            <div className="rounded-[1.3rem] bg-[#102a3b] px-3 py-4 text-center text-[#f4efe5]">
              <p className="text-xl font-black">{demoUser.age}</p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-white/62">age</p>
            </div>
            <div className="rounded-[1.3rem] bg-[#102a3b] px-3 py-4 text-center text-[#f4efe5]">
              <p className="text-xl font-black">7</p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-white/62">nearby</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderFilters() {
    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader title="Discovery filters" subtitle="Adjust the demo matching logic visually." onBack={() => setPanel(null)} />
        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60707b]">Distance</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['10 km', '25 km', '50 km'] as FilterState['distance'][]).map((distance) => (
                <Pill
                  key={distance}
                  active={filters.distance === distance}
                  onClick={() => setFilters((prev) => ({ ...prev, distance }))}
                >
                  {distance}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60707b]">Goals</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(GOAL_LABELS) as GoalKey[]).map((goal) => (
                <Pill
                  key={goal}
                  active={filters.goals.includes(goal)}
                  tone="accent"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      goals: prev.goals.includes(goal) ? prev.goals.filter((item) => item !== goal) : [...prev.goals, goal],
                    }))
                  }
                >
                  {GOAL_LABELS[goal]}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60707b]">Sports</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(SPORT_LABELS) as SportKey[]).map((sport) => (
                <Pill
                  key={sport}
                  active={filters.sports.includes(sport)}
                  tone="dark"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      sports: prev.sports.includes(sport) ? prev.sports.filter((item) => item !== sport) : [...prev.sports, sport],
                    }))
                  }
                >
                  {SPORT_LABELS[sport]}
                </Pill>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => setPanel(null)} className="w-full rounded-full bg-[#102a3b] px-4 py-3 text-sm font-bold text-[#f4efe5]">
            Apply demo filters
          </button>
        </div>
      </div>
    );
  }

  function renderProfileDetail() {
    if (!selectedProfile) return null;

    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader title={`${selectedProfile.name}, ${selectedProfile.age}`} subtitle={`${selectedProfile.city} - ${selectedProfile.goal}`} onBack={() => setPanel(null)} />
        <div className="space-y-4 px-4 py-5">
          <div className="overflow-hidden rounded-[1.8rem] border border-[#d7cfbd] bg-[#13202c]">
            <ImageWithFallback src={selectedProfile.photo} alt={selectedProfile.name} className="h-72 w-full object-cover" />
          </div>

          <div className="rounded-[1.4rem] border border-[#d8d0bf] bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60707b]">Headline</p>
            <p className="mt-2 text-sm leading-7 text-[#22303c]">{selectedProfile.title}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProfile.sports.map((sport) => (
                <Pill key={sport}>{sport}</Pill>
              ))}
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-[#d8d0bf] bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60707b]">Bio</p>
            <p className="mt-2 text-sm leading-7 text-[#22303c]">{selectedProfile.bio}</p>
          </div>

          <div className="rounded-[1.4rem] border border-[#d8d0bf] bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60707b]">Conversation starter</p>
            <p className="mt-2 text-sm leading-7 text-[#22303c]">{selectedProfile.prompt}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => handleDiscoverAction('pass')} className="rounded-full border border-[#d4cbb8] bg-white/70 px-4 py-3 text-sm font-semibold text-[#22303c]">
              Pass
            </button>
            <button
              type="button"
              onClick={() => {
                createMatchFromProfile(selectedProfile);
                setPanel(null);
              }}
              className="rounded-full bg-[#ff7b57] px-4 py-3 text-sm font-bold text-white"
            >
              Like and match
            </button>
          </div>

          <button type="button" onClick={submitReport} className="w-full rounded-full border border-[#f0c3bb] bg-[#fff3f0] px-4 py-3 text-sm font-semibold text-[#9f3e27]">
            Report profile
          </button>
        </div>
      </div>
    );
  }

  function renderEditProfile() {
    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader title="Edit profile" subtitle="Prototype editing stays local only." onBack={() => setPanel(null)} />
        <div className="space-y-4 px-5 py-5">
          <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">Bio</label>
            <textarea
              value={demoUser.bio}
              onChange={(event) => setDemoUser((prev) => ({ ...prev, bio: event.target.value }))}
              className="mt-2 min-h-28 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
            />
          </div>
          <div className="rounded-[1.4rem] border border-[#d9d0be] bg-white/80 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6d78]">Looking for</label>
            <textarea
              value={demoUser.lookingFor}
              onChange={(event) => setDemoUser((prev) => ({ ...prev, lookingFor: event.target.value }))}
              className="mt-2 min-h-24 w-full rounded-[1rem] border border-[#ddd4c2] bg-[#f6f1e8] px-4 py-3 text-sm text-[#22303c]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setPanel(null);
              setToast('Profile updated');
            }}
            className="w-full rounded-full bg-[#102a3b] px-4 py-3 text-sm font-bold text-[#f4efe5]"
          >
            Save changes
          </button>
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader title="Settings" subtitle="This screen replaces the unstable backend-driven account area." onBack={() => setPanel(null)} />
        <div className="space-y-3 px-4 py-5">
          <ToggleRow
            label="Match notifications"
            description="Notify when a mutual like happens"
            value={notifications.matches}
            onToggle={() => setNotifications((prev) => ({ ...prev, matches: !prev.matches }))}
          />
          <ToggleRow
            label="Message notifications"
            description="Notify for new chat activity"
            value={notifications.messages}
            onToggle={() => setNotifications((prev) => ({ ...prev, messages: !prev.messages }))}
          />
          <ToggleRow
            label="Training reminders"
            description="Keep prototype reminders on or off"
            value={notifications.reminders}
            onToggle={() => setNotifications((prev) => ({ ...prev, reminders: !prev.reminders }))}
          />

          <RowLink
            icon={<Settings className="h-4 w-4" />}
            label="Discovery preferences"
            description="Change distance, goals, and sports"
            onClick={() => setPanel('filters')}
          />
          <RowLink
            icon={<Shield className="h-4 w-4" />}
            label="Blocked users"
            description={`${blockedUsers.length} people currently blocked`}
            onClick={() => setPanel('blocked')}
          />
          <RowLink
            icon={<Lock className="h-4 w-4" />}
            label="Suspended account preview"
            description="Show the moderation state screen"
            onClick={() => setPanel('suspended')}
          />
          <RowLink
            icon={<Wrench className="h-4 w-4" />}
            label={isAdminMode ? 'Admin dashboard enabled' : 'Enable admin dashboard'}
            description="Useful because the original app includes moderation routes"
            onClick={() => {
              setIsAdminMode(true);
              setPanel('admin');
            }}
          />
          <RowLink
            icon={<LogOut className="h-4 w-4" />}
            label="Sign out to welcome"
            description="Keeps the mocked data in memory for the session"
            onClick={() => {
              setFlow('welcome');
              setPanel(null);
            }}
          />
          <RowLink
            icon={<Trash2 className="h-4 w-4" />}
            label="Reset prototype state"
            description="Restore the original demo data"
            onClick={resetDemo}
            danger
          />
        </div>
      </div>
    );
  }

  function renderBlockedUsers() {
    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader title="Blocked users" subtitle="Safety flow included in the prototype." onBack={() => setPanel('settings')} />
        <div className="space-y-3 px-4 py-5">
          {blockedUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-[1.4rem] border border-[#d8d0bf] bg-white/80 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#13202c] text-[#f4efe5]">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1d2b37]">{user.name}</p>
                <p className="mt-0.5 text-xs text-[#64727d]">{user.city} - {user.reason}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBlockedUsers((prev) => prev.filter((item) => item.id !== user.id));
                  setToast(`Unblocked ${user.name}`);
                }}
                className="rounded-full border border-[#d4cbb8] px-3 py-2 text-xs font-semibold text-[#22303c]"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderAdmin() {
    const pendingCount = reports.filter((item) => item.status === 'Pending').length;

    return (
      <div className="min-h-[780px] bg-[#f4efe5]">
        <ScreenHeader title="Admin dashboard" subtitle="Mock moderation and reporting view." onBack={() => setPanel('settings')} />
        <div className="space-y-4 px-4 py-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[1.3rem] bg-[#102a3b] px-3 py-4 text-center text-[#f4efe5]">
              <p className="text-xl font-black">{matches.length}</p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-white/62">matches</p>
            </div>
            <div className="rounded-[1.3rem] bg-[#102a3b] px-3 py-4 text-center text-[#f4efe5]">
              <p className="text-xl font-black">{pendingCount}</p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-white/62">pending</p>
            </div>
            <div className="rounded-[1.3rem] bg-[#102a3b] px-3 py-4 text-center text-[#f4efe5]">
              <p className="text-xl font-black">{blockedUsers.length}</p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-white/62">blocked</p>
            </div>
          </div>

          {reports.map((report) => (
            <div key={report.id} className="rounded-[1.5rem] border border-[#d8d0bf] bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#1d2b37]">{report.userName}</p>
                  <p className="mt-1 text-xs text-[#64727d]">{report.reason}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] ${
                  report.status === 'Pending'
                    ? 'bg-[#fff1dd] text-[#a46611]'
                    : report.status === 'Reviewed'
                    ? 'bg-[#e6f7f0] text-[#178057]'
                    : 'bg-[#f0f3f6] text-[#55626d]'
                }`}>
                  {report.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateReportStatus(report.id, 'Reviewed')}
                  className="rounded-full bg-[#102a3b] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#f4efe5]"
                >
                  Mark reviewed
                </button>
                <button
                  type="button"
                  onClick={() => updateReportStatus(report.id, 'Dismissed')}
                  className="rounded-full border border-[#d4cbb8] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#22303c]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderSuspendedPreview() {
    return (
      <div className="min-h-[780px] bg-[radial-gradient(circle_at_top,_#2b1a1a,_#120d10_58%,_#08090b)] px-6 py-10 text-white">
        <button
          type="button"
          onClick={() => setPanel('settings')}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/72"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="mt-16 rounded-[2rem] border border-[#66353a] bg-[#1b1418]/90 p-6">
          <ShieldAlert className="h-8 w-8 text-[#ff8f78]" />
          <h2 className="mt-6 text-3xl font-black tracking-[-0.05em]">Account temporarily suspended</h2>
          <p className="mt-4 text-sm leading-7 text-white/74">
            This preview exists because the original project already had moderation and suspension flows. Keeping it in the prototype shows the safety design thinking without needing backend enforcement.
          </p>
          <div className="mt-6 rounded-[1.4rem] border border-[#5b3136] bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f0b4aa]">Reason</p>
            <p className="mt-2 text-sm text-white/82">Report threshold reached while moderation review is in progress.</p>
          </div>
          <button
            type="button"
            onClick={() => setPanel('settings')}
            className="mt-6 w-full rounded-full bg-[#ff7b57] px-4 py-3 text-sm font-bold text-white"
          >
            Return to demo
          </button>
        </div>
      </div>
    );
  }

  function renderAppView() {
    if (panel === 'filters') return renderFilters();
    if (panel === 'profileDetail') return renderProfileDetail();
    if (panel === 'editProfile') return renderEditProfile();
    if (panel === 'settings') return renderSettings();
    if (panel === 'blocked') return renderBlockedUsers();
    if (panel === 'admin') return renderAdmin();
    if (panel === 'suspended') return renderSuspendedPreview();

    if (activeTab === 'discover') return renderDiscover();
    if (activeTab === 'matches') return renderMatches();
    if (activeTab === 'messages') return renderMessages();
    return renderProfile();
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#081018] text-[#f6f1e7]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-[#193341]/24 blur-3xl" />
        <div className="absolute right-[-12rem] top-12 h-96 w-96 rounded-full bg-[#1f2c36]/24 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-7xl px-6 py-10 md:px-10">
        <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8ea0ad]">
              SportSync / coursework prototype
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.045em] text-[#f6f1e7] md:text-5xl">
              Interactive mobile demo
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#c4ccd2]">
              This page is a self-contained version of the app for presentation. It runs on mocked data, so the main
              screens can be tested without the API or database.
            </p>

            <div className="mt-8 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold text-[#eef1f3]">What is included</p>
              <div className="mt-4 grid gap-3 text-sm text-[#d0d7dc] sm:grid-cols-2">
                <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                  Welcome, login, register, onboarding, discover, matches, messages, profile
                </div>
                <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                  Settings, blocked users, reports, admin view, suspended account preview
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-[#eef1f3]">Suggested demo path</p>
              <div className="mt-4 space-y-2 text-sm leading-7 text-[#d5dbe0]">
                <p>1. Open the instant demo or go through register + onboarding.</p>
                <p>2. Like Lina or Noah in Discover to trigger a match.</p>
                <p>3. Open Messages, then Profile, then Settings.</p>
                <p>4. Show blocked users, admin, and the suspended account preview.</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a href="/prototype-redesign" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm font-semibold text-[#f6f1e7]">
                  View redesign board
                </a>
                <a href="/design-system" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm font-semibold text-[#f6f1e7]">
                  Compare old design system
                </a>
              </div>
            </div>
          </div>

          <div>
            <MobileFrame>
              <div className="flex items-center justify-between border-b border-[#ddd5c5] bg-[#f7f2e8]/95 px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#5f6d78]">
                <span>9:41</span>
                <span>No backend mode</span>
                <span className="inline-flex items-center gap-1">
                  <Bell className="h-3.5 w-3.5" />
                  Local
                </span>
              </div>

              {flow === 'welcome' ? renderWelcome() : null}
              {flow === 'login' ? renderLogin() : null}
              {flow === 'register' ? renderRegister() : null}
              {flow === 'onboarding' ? renderOnboarding() : null}
              {flow === 'app' ? renderAppView() : null}

              {flow === 'app' && panel === null ? (
                <nav className="grid grid-cols-4 border-t border-[#ddd5c5] bg-[#f7f2e8]/95 px-2 py-2">
                  {[
                    { key: 'discover' as const, label: 'Discover', icon: <Compass className="h-4 w-4" /> },
                    { key: 'matches' as const, label: 'Matches', icon: <Heart className="h-4 w-4" /> },
                    { key: 'messages' as const, label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
                    { key: 'profile' as const, label: 'Profile', icon: <User className="h-4 w-4" /> },
                  ].map((item) => {
                    const active = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => returnToMainTab(item.key)}
                        className={`flex flex-col items-center gap-1 rounded-[1rem] px-2 py-2 text-[0.68rem] font-semibold ${
                          active ? 'bg-[#102a3b] text-[#f4efe5]' : 'text-[#566571]'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              ) : null}
            </MobileFrame>
          </div>
        </section>
      </main>

      {matchModalId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-5">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#10202c] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#143629] text-[#8df1bb]">
              <Bolt className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-3xl font-black tracking-[-0.05em]">It is a match.</h3>
            <p className="mt-3 text-sm leading-7 text-white/74">
              {getProfile(matchModalId).name} already liked your profile. This is the key interaction point for the teacher to test.
            </p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setMatchModalId(null);
                  setActiveTab('messages');
                  setPanel(null);
                }}
                className="rounded-full bg-[#ff7b57] px-4 py-3 text-sm font-bold text-white"
              >
                Open messages
              </button>
              <button
                type="button"
                onClick={() => {
                  setMatchModalId(null);
                  setActiveTab('matches');
                }}
                className="rounded-full border border-white/14 bg-white/6 px-4 py-3 text-sm font-semibold text-white"
              >
                View matches
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#102a3b] px-5 py-3 text-sm font-semibold text-[#f4efe5] shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
