import { User, LoginSuccess } from '../types/auth';
import {
  AccountSettings,
  AdminOverview,
  AdminPriorAction,
  AdminPriorComplaint,
  AdminReport,
  AdminReportContext,
  AdminUser,
  BlockedUser,
  ChatMessage,
  ComplaintType,
  ConversationItem,
  DiscoverProfile,
  DiscoveryPreferences,
  MatchItem,
  MessageThread,
  MyProfile,
  OnboardingSportInput,
  OptionItem,
  ProfileEditData,
  ProfileEditPhoto,
  UserProfile,
} from '../types/app';

type AccountStatus = 'active' | 'suspended' | 'banned';

interface CountryRecord {
  id: number;
  name: string;
  code: string;
}

interface CityRecord {
  id: number;
  countryId: number;
  name: string;
}

interface SportRecord {
  id: number;
  name: string;
  icon: string;
}

interface SkillRecord {
  id: number;
  name: string;
}

interface FrequencyRecord {
  id: number;
  name: string;
}

interface GoalRecord {
  id: number;
  name: string;
}

interface ComplaintTypeRecord {
  id: number;
  name: string;
}

interface DemoMember {
  id: number;
  email: string;
  role: 'user' | 'admin';
  accountStatus: AccountStatus;
  onboardingComplete: boolean;
  firstName: string;
  lastName: string;
  birthDate: string;
  genderId: number;
  cityId: number;
  bio: string;
  goalId: number;
  photos: string[];
  sports: OnboardingSportInput[];
  online: boolean;
  lastActive: string | null;
  distanceKm: number;
  headline: string;
  prompt: string;
  createsMatch?: boolean;
  suspensionReason?: string | null;
  suspendedUntil?: string | null;
}

interface DemoMatchRecord {
  matchId: number;
  userId: number;
  matchedAt: string;
  unreadCount: number;
}

interface DemoReportRecord {
  id: number;
  reporterId: number;
  reportedId: number;
  typeId: number;
  description: string;
  statusId: number;
  createdAt: string;
  internalNote: string | null;
  adminAction: string | null;
}

interface DemoModerationActionRecord {
  actionId: number;
  userId: number;
  actionType: 'warn' | 'suspend' | 'ban' | 'dismiss';
  previousStatus: AccountStatus;
  newStatus: AccountStatus;
  note: string | null;
  createdAt: string;
  adminEmail: string;
}

interface DemoState {
  currentUser: User;
  profile: {
    firstName: string;
    lastName: string;
    birthDate: string;
    genderId: number;
    cityId: number;
    bio: string;
    goalId: number;
    photos: ProfileEditPhoto[];
    sports: OnboardingSportInput[];
  };
  preferences: DiscoveryPreferences;
  likedUserIds: number[];
  passedUserIds: number[];
  blockedUserIds: number[];
  matches: DemoMatchRecord[];
  threads: Record<number, ChatMessage[]>;
  reports: DemoReportRecord[];
  moderationActions: DemoModerationActionRecord[];
  nextPhotoId: number;
  nextMessageId: number;
  nextReportId: number;
  nextActionId: number;
  deletedUserIds: number[];
}

const WAIT_MS = 120;

const genders: OptionItem[] = [
  { id: 1, name: 'Male' },
  { id: 2, name: 'Female' },
  { id: 3, name: 'Non-binary' },
];

const countries: CountryRecord[] = [
  { id: 1, name: 'United Kingdom', code: 'GB' },
  { id: 2, name: 'Ireland', code: 'IE' },
];

const cities: CityRecord[] = [
  { id: 1, countryId: 1, name: 'Sheffield' },
  { id: 2, countryId: 1, name: 'Manchester' },
  { id: 3, countryId: 1, name: 'London' },
  { id: 4, countryId: 1, name: 'Bristol' },
  { id: 5, countryId: 1, name: 'Leeds' },
  { id: 6, countryId: 1, name: 'Liverpool' },
  { id: 7, countryId: 1, name: 'Birmingham' },
  { id: 8, countryId: 2, name: 'Dublin' },
  { id: 9, countryId: 1, name: 'Leicester' },
  { id: 10, countryId: 1, name: 'Nottingham' },
];

const sportsCatalog: SportRecord[] = [
  { id: 1, name: 'Running', icon: '🏃' },
  { id: 2, name: 'Cycling', icon: '🚴' },
  { id: 3, name: 'Hyrox', icon: '🔥' },
  { id: 4, name: 'Climbing', icon: '🧗' },
  { id: 5, name: 'Strength', icon: '🏋️' },
  { id: 6, name: 'Swimming', icon: '🏊' },
];

const skillLevels: SkillRecord[] = [
  { id: 1, name: 'Beginner' },
  { id: 2, name: 'Intermediate' },
  { id: 3, name: 'Advanced' },
  { id: 4, name: 'Competitive' },
];

const frequencies: FrequencyRecord[] = [
  { id: 1, name: '1-2x / week' },
  { id: 2, name: '3-4x / week' },
  { id: 3, name: '5+ / week' },
];

const goals: GoalRecord[] = [
  { id: 1, name: 'Serious dating' },
  { id: 2, name: 'Active dates' },
  { id: 3, name: 'Training partner' },
];

const complaintTypes: ComplaintTypeRecord[] = [
  { id: 1, name: 'Harassment' },
  { id: 2, name: 'Spam' },
  { id: 3, name: 'Fake profile' },
  { id: 4, name: 'Inappropriate content' },
];

const complaintStatuses: Record<number, string> = {
  1: 'Pending',
  2: 'Under Review',
  3: 'Resolved',
  4: 'Dismissed',
};

const members: DemoMember[] = [
  {
    id: 1,
    email: 'lina@sportsync.demo',
    role: 'user',
    accountStatus: 'active',
    onboardingComplete: true,
    firstName: 'Lina',
    lastName: 'Ward',
    birthDate: '1999-05-14',
    genderId: 2,
    cityId: 2,
    bio: 'Looking for someone who understands early alarms, race weekends, and why a recovery walk still counts as a date.',
    goalId: 1,
    photos: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80'],
    sports: [
      { sport_id: 1, skill_level_id: 3, frequency_id: 2, years_experience: 6 },
      { sport_id: 5, skill_level_id: 2, frequency_id: 2, years_experience: 4 },
    ],
    online: true,
    lastActive: new Date().toISOString(),
    distanceKm: 5,
    headline: 'Half marathon prep and coffee after long runs.',
    prompt: 'Best reward after a hard session: bakery stop or cold plunge?',
    createsMatch: true,
  },
  {
    id: 2,
    email: 'amara@sportsync.demo',
    role: 'user',
    accountStatus: 'active',
    onboardingComplete: true,
    firstName: 'Amara',
    lastName: 'Cole',
    birthDate: '2001-02-09',
    genderId: 2,
    cityId: 7,
    bio: 'I like athletic people who are calm under pressure and excited about trying new things, indoors or outdoors.',
    goalId: 2,
    photos: ['https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=80'],
    sports: [
      { sport_id: 4, skill_level_id: 3, frequency_id: 1, years_experience: 3 },
      { sport_id: 5, skill_level_id: 2, frequency_id: 1, years_experience: 2 },
    ],
    online: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    distanceKm: 12,
    headline: 'Bouldering, climbing trips, and patient belay energy.',
    prompt: 'Indoor wall session first or straight to outdoor routes?',
  },
  {
    id: 3,
    email: 'noah@sportsync.demo',
    role: 'user',
    accountStatus: 'active',
    onboardingComplete: true,
    firstName: 'Noah',
    lastName: 'Reed',
    birthDate: '1998-09-22',
    genderId: 1,
    cityId: 3,
    bio: 'I care more about routine than hype. If we can train hard and still laugh through it, that is a very good sign.',
    goalId: 3,
    photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80'],
    sports: [
      { sport_id: 3, skill_level_id: 4, frequency_id: 3, years_experience: 2 },
      { sport_id: 5, skill_level_id: 3, frequency_id: 3, years_experience: 5 },
      { sport_id: 1, skill_level_id: 2, frequency_id: 2, years_experience: 4 },
    ],
    online: true,
    lastActive: new Date().toISOString(),
    distanceKm: 8,
    headline: 'Hyrox, gym consistency, and no flaky plans.',
    prompt: 'What makes someone feel disciplined instead of just performative?',
    createsMatch: true,
  },
  {
    id: 4,
    email: 'mia@sportsync.demo',
    role: 'user',
    accountStatus: 'active',
    onboardingComplete: true,
    firstName: 'Mia',
    lastName: 'Evans',
    birthDate: '2000-07-19',
    genderId: 2,
    cityId: 5,
    bio: 'I am happiest around people who are active without making it their entire personality.',
    goalId: 1,
    photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80'],
    sports: [
      { sport_id: 1, skill_level_id: 2, frequency_id: 2, years_experience: 4 },
      { sport_id: 5, skill_level_id: 2, frequency_id: 1, years_experience: 2 },
    ],
    online: true,
    lastActive: new Date().toISOString(),
    distanceKm: 21,
    headline: 'Trail runs, pilates, and Sunday reset routines.',
    prompt: 'Best kind of active date: race expo, long walk, or climbing gym?',
  },
  {
    id: 5,
    email: 'jordan@sportsync.demo',
    role: 'user',
    accountStatus: 'active',
    onboardingComplete: true,
    firstName: 'Jordan',
    lastName: 'Blake',
    birthDate: '1997-11-03',
    genderId: 1,
    cityId: 4,
    bio: 'If your idea of balance is a hard session followed by a proper meal, we will probably get along.',
    goalId: 2,
    photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80'],
    sports: [
      { sport_id: 2, skill_level_id: 3, frequency_id: 2, years_experience: 5 },
      { sport_id: 5, skill_level_id: 3, frequency_id: 2, years_experience: 6 },
    ],
    online: true,
    lastActive: new Date().toISOString(),
    distanceKm: 14,
    headline: 'Cycling, lifting, and planned spontaneity.',
    prompt: 'What is your version of a perfect recovery day?',
  },
  {
    id: 6,
    email: 'elise@sportsync.demo',
    role: 'user',
    accountStatus: 'active',
    onboardingComplete: true,
    firstName: 'Elise',
    lastName: 'Moore',
    birthDate: '1999-03-16',
    genderId: 2,
    cityId: 6,
    bio: 'I want someone who likes structure but still knows how to enjoy the off-season.',
    goalId: 1,
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80'],
    sports: [
      { sport_id: 6, skill_level_id: 3, frequency_id: 2, years_experience: 6 },
      { sport_id: 1, skill_level_id: 3, frequency_id: 2, years_experience: 5 },
    ],
    online: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    distanceKm: 18,
    headline: 'Race calendar nerd with a soft spot for sea swims.',
    prompt: 'Would you rather train together or compare notes after?',
  },
  {
    id: 7,
    email: 'dylan@sportsync.demo',
    role: 'user',
    accountStatus: 'active',
    onboardingComplete: true,
    firstName: 'Dylan',
    lastName: 'Hart',
    birthDate: '1996-12-10',
    genderId: 1,
    cityId: 3,
    bio: 'Short bio used for moderation preview.',
    goalId: 2,
    photos: ['https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1200&q=80'],
    sports: [{ sport_id: 5, skill_level_id: 2, frequency_id: 2, years_experience: 3 }],
    online: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    distanceKm: 11,
    headline: 'Used in admin moderation examples.',
    prompt: 'Admin context only.',
  },
  {
    id: 8,
    email: 'marta@sportsync.demo',
    role: 'user',
    accountStatus: 'active',
    onboardingComplete: true,
    firstName: 'Marta',
    lastName: 'Lane',
    birthDate: '1998-04-08',
    genderId: 2,
    cityId: 8,
    bio: 'Mock profile used in the admin reports list.',
    goalId: 2,
    photos: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80'],
    sports: [{ sport_id: 2, skill_level_id: 2, frequency_id: 1, years_experience: 2 }],
    online: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    distanceKm: 26,
    headline: 'Mock profile used for reports.',
    prompt: 'Admin context only.',
  },
  {
    id: 9,
    email: 'oliver@sportsync.demo',
    role: 'user',
    accountStatus: 'active',
    onboardingComplete: true,
    firstName: 'Oliver',
    lastName: 'Shaw',
    birthDate: '1997-01-12',
    genderId: 1,
    cityId: 9,
    bio: 'Used in the blocked users screen.',
    goalId: 3,
    photos: ['https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=1200&q=80'],
    sports: [{ sport_id: 3, skill_level_id: 2, frequency_id: 2, years_experience: 1 }],
    online: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    distanceKm: 30,
    headline: 'Blocked user example.',
    prompt: 'Blocked user example.',
  },
  {
    id: 10,
    email: 'tara@sportsync.demo',
    role: 'user',
    accountStatus: 'active',
    onboardingComplete: true,
    firstName: 'Tara',
    lastName: 'Fox',
    birthDate: '2000-08-30',
    genderId: 2,
    cityId: 10,
    bio: 'Second blocked user example.',
    goalId: 2,
    photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80'],
    sports: [{ sport_id: 4, skill_level_id: 2, frequency_id: 1, years_experience: 2 }],
    online: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    distanceKm: 33,
    headline: 'Blocked user example.',
    prompt: 'Blocked user example.',
  },
];

function wait(ms = WAIT_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function ageFromBirthDate(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function cityById(cityId: number) {
  const city = cities.find((item) => item.id === cityId);
  if (!city) throw new Error(`Unknown city id: ${cityId}`);
  return city;
}

function countryById(countryId: number) {
  const country = countries.find((item) => item.id === countryId);
  if (!country) throw new Error(`Unknown country id: ${countryId}`);
  return country;
}

function countryForCity(cityId: number) {
  return countryById(cityById(cityId).countryId);
}

function sportById(sportId: number) {
  const sport = sportsCatalog.find((item) => item.id === sportId);
  if (!sport) throw new Error(`Unknown sport id: ${sportId}`);
  return sport;
}

function skillById(skillId: number) {
  const skill = skillLevels.find((item) => item.id === skillId);
  if (!skill) throw new Error(`Unknown skill id: ${skillId}`);
  return skill;
}

function frequencyById(frequencyId: number) {
  const frequency = frequencies.find((item) => item.id === frequencyId);
  if (!frequency) throw new Error(`Unknown frequency id: ${frequencyId}`);
  return frequency;
}

function goalById(goalId: number) {
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) throw new Error(`Unknown goal id: ${goalId}`);
  return goal;
}

function complaintTypeById(typeId: number) {
  const type = complaintTypes.find((item) => item.id === typeId);
  if (!type) throw new Error(`Unknown complaint type id: ${typeId}`);
  return type;
}

function displayName(firstName: string, lastName: string) {
  return `${firstName}${lastName ? ` ${lastName}` : ''}`.trim();
}

function currentUserName() {
  return displayName(state.profile.firstName, state.profile.lastName);
}

function currentUserAge() {
  return ageFromBirthDate(state.profile.birthDate);
}

function currentUserCityName() {
  return cityById(state.profile.cityId).name;
}

function currentUserCountry() {
  return countryForCity(state.profile.cityId).name;
}

function currentPhotoUrls() {
  return [...state.profile.photos]
    .sort((a, b) => a.display_order - b.display_order)
    .map((photo) => photo.photo_url);
}

function findMember(userId: number) {
  const member = members.find((item) => item.id === userId && !state.deletedUserIds.includes(item.id));
  if (!member) throw new Error(`Unknown demo member id: ${userId}`);
  return member;
}

function currentSportIds() {
  return state.profile.sports.map((sport) => sport.sport_id);
}

function sharedSportsCount(member: DemoMember) {
  const currentIds = new Set(currentSportIds());
  return member.sports.filter((sport) => currentIds.has(sport.sport_id)).length;
}

function compatibilityMetric(pct: number, detail: string) {
  return { pct, detail };
}

function firstPhotoUrl(member: DemoMember) {
  return member.photos[0] ?? '';
}

function memberPrimarySport(member: DemoMember) {
  const row = member.sports[0];
  return row ? sportById(row.sport_id) : null;
}

function currentTrainingFrequencyId() {
  return state.profile.sports[0]?.frequency_id ?? 2;
}

function isOpenStatus(statusId: number) {
  return statusId === 1 || statusId === 2;
}

function createInitialState(): DemoState {
  return {
    currentUser: {
      id: 100,
      email: 'coach@sportsync.demo',
      role: 'user',
      onboardingComplete: true,
    },
    profile: {
      firstName: 'Chris',
      lastName: 'Bennett',
      birthDate: '1998-04-10',
      genderId: 1,
      cityId: 1,
      bio: 'Gym in the week, long runs at the weekend, and trying to date someone who actually gets that rhythm.',
      goalId: 1,
      photos: [
        {
          photo_id: 1001,
          photo_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
          display_order: 0,
        },
      ],
      sports: [
        { sport_id: 1, skill_level_id: 3, frequency_id: 2, years_experience: 5 },
        { sport_id: 5, skill_level_id: 2, frequency_id: 2, years_experience: 3 },
      ],
    },
    preferences: {
      gender_id: 2,
      min_age: 22,
      max_age: 32,
      max_distance_km: 25,
      goal_id: 1,
      min_skill_level_id: null,
      preferred_frequency_id: 2,
      min_photos: 1,
      show_out_of_range: false,
      sport_ids: [1, 5, 3],
    },
    likedUserIds: [],
    passedUserIds: [],
    blockedUserIds: [9, 10],
    matches: [
      { matchId: 501, userId: 5, matchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), unreadCount: 2 },
      { matchId: 502, userId: 6, matchedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), unreadCount: 0 },
    ],
    threads: {
      501: [
        { id: 1, senderId: 5, text: 'You mentioned early sessions. Are you actually a morning person?', sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), readAt: null },
        { id: 2, senderId: 100, text: 'Only if the plan is worth waking up for.', sentAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(), readAt: null },
        { id: 3, senderId: 5, text: 'Tomorrow morning ride or coffee first?', sentAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), readAt: null },
      ],
      502: [
        { id: 4, senderId: 6, text: 'You do race weekends too? That already makes this app feel more useful.', sentAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), readAt: null },
        { id: 5, senderId: 100, text: 'Exactly. I wanted something more specific than generic swiping.', sentAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(), readAt: null },
        { id: 6, senderId: 6, text: 'I can send over my race schedule later.', sentAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(), readAt: null },
      ],
    },
    reports: [
      {
        id: 801,
        reporterId: 100,
        reportedId: 7,
        typeId: 1,
        description: 'Harassment in messages',
        statusId: 1,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
        internalNote: null,
        adminAction: null,
      },
      {
        id: 802,
        reporterId: 5,
        reportedId: 8,
        typeId: 3,
        description: 'Fake profile concern',
        statusId: 3,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
        internalNote: 'Profile information checked.',
        adminAction: 'dismiss',
      },
    ],
    moderationActions: [
      {
        actionId: 9001,
        userId: 8,
        actionType: 'dismiss',
        previousStatus: 'active',
        newStatus: 'active',
        note: 'No evidence of impersonation after review.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 38).toISOString(),
        adminEmail: 'coach@sportsync.demo',
      },
    ],
    nextPhotoId: 2000,
    nextMessageId: 100,
    nextReportId: 900,
    nextActionId: 9100,
    deletedUserIds: [],
  };
}

let state = createInitialState();

function authResponse(): LoginSuccess {
  return {
    token: 'demo-token',
    user: clone(state.currentUser),
  };
}

export async function demoLogin(email: string): Promise<LoginSuccess> {
  await wait();
  const nextEmail = email.trim() || 'coach@sportsync.demo';
  state.currentUser = {
    ...state.currentUser,
    email: nextEmail,
    role: nextEmail.toLowerCase().includes('admin') ? 'admin' : 'user',
    onboardingComplete: true,
  };
  return authResponse();
}

export async function demoRegister(email: string): Promise<LoginSuccess> {
  await wait();
  state.currentUser = { ...state.currentUser, email: email.trim() || 'new@sportsync.demo', role: 'user', onboardingComplete: false };
  return authResponse();
}

function createDiscoverProfile(member: DemoMember): DiscoverProfile {
  const primary = memberPrimarySport(member);
  return {
    id: member.id,
    name: member.firstName,
    age: ageFromBirthDate(member.birthDate),
    distance: `${member.distanceKm} km away`,
    image: firstPhotoUrl(member),
    sports: member.sports.map((sport) => ({
      icon: sportById(sport.sport_id).icon,
      name: sportById(sport.sport_id).name,
      level: skillById(sport.skill_level_id).name,
    })),
    frequency: frequencyById(member.sports[0]?.frequency_id ?? 2).name,
    goal: goalById(member.goalId).name,
    tag: primary ? primary.name : null,
    photos: clone(member.photos),
  };
}

function matchForUser(userId: number) {
  return state.matches.find((item) => item.userId === userId);
}

function createMatchIfNeeded(userId: number) {
  const existing = matchForUser(userId);
  if (existing) return existing;
  const match: DemoMatchRecord = { matchId: 600 + userId, userId, matchedAt: nowIso(), unreadCount: 1 };
  state.matches = [match, ...state.matches];
  state.threads[match.matchId] = [
    {
      id: state.nextMessageId++,
      senderId: userId,
      text: `You matched with ${findMember(userId).firstName}. Start with the training question, not just "hey".`,
      sentAt: nowIso(),
      readAt: null,
    },
  ];
  return match;
}

export async function getDiscoverDemo() {
  await wait();
  return clone(
    members
      .filter((member) => !state.deletedUserIds.includes(member.id))
      .filter((member) => member.accountStatus === 'active')
      .filter((member) => !state.blockedUserIds.includes(member.id))
      .filter((member) => !state.likedUserIds.includes(member.id))
      .filter((member) => !state.passedUserIds.includes(member.id))
      .filter((member) => !state.matches.some((match) => match.userId === member.id))
      .filter((member) => [1, 2, 3, 4].includes(member.id))
      .map(createDiscoverProfile)
  );
}

export async function likeUserDemo(userId: number) {
  await wait();
  if (!state.likedUserIds.includes(userId)) state.likedUserIds.push(userId);
  const member = findMember(userId);
  if (member.createsMatch) {
    const match = createMatchIfNeeded(userId);
    return { matched: true, matchId: match.matchId };
  }
  return { matched: false, matchId: null };
}

export async function passUserDemo(userId: number) {
  await wait();
  if (!state.passedUserIds.includes(userId)) state.passedUserIds.push(userId);
  return { ok: true };
}

export async function getMatchesDemo() {
  await wait();
  const data: MatchItem[] = state.matches
    .filter((match) => !state.deletedUserIds.includes(match.userId))
    .map((match) => {
      const member = findMember(match.userId);
      const sport = memberPrimarySport(member);
      return {
        matchId: match.matchId,
        matchedAt: match.matchedAt,
        userId: member.id,
        name: member.firstName,
        age: ageFromBirthDate(member.birthDate),
        city: cityById(member.cityId).name,
        lastActive: member.lastActive,
        isOnline: member.online,
        sport: sport ? { icon: sport.icon, name: sport.name } : null,
        image: firstPhotoUrl(member),
        sharedSports: sharedSportsCount(member),
      };
    });
  return clone(data);
}

export async function getConversationsDemo() {
  await wait();
  const data: ConversationItem[] = state.matches
    .filter((match) => !state.deletedUserIds.includes(match.userId))
    .map((match) => {
      const member = findMember(match.userId);
      const thread = state.threads[match.matchId] ?? [];
      const lastMessage = thread[thread.length - 1] ?? null;
      return {
        matchId: match.matchId,
        matchedAt: match.matchedAt,
        user: {
          id: member.id,
          name: member.firstName,
          age: ageFromBirthDate(member.birthDate),
          city: cityById(member.cityId).name,
          image: firstPhotoUrl(member),
          isOnline: member.online,
          lastActive: member.lastActive,
        },
        lastMessage: lastMessage?.text ?? null,
        lastMessageSentAt: lastMessage?.sentAt ?? null,
        lastMessageSenderId: lastMessage?.senderId ?? null,
        unreadCount: match.unreadCount,
      };
    });
  return clone(data);
}

export async function getThreadDemo(matchId: number) {
  await wait();
  const match = state.matches.find((item) => item.matchId === matchId);
  if (!match) throw new Error('Match not found.');
  const member = findMember(match.userId);
  const thread: MessageThread = {
    matchId,
    peer: {
      user_id: member.id,
      first_name: member.firstName,
      age: ageFromBirthDate(member.birthDate),
      city_name: cityById(member.cityId).name,
      last_active: member.lastActive,
      photo_url: firstPhotoUrl(member),
    },
    messages: clone(state.threads[matchId] ?? []),
  };
  return thread;
}

export async function sendMessageDemo(matchId: number, text: string) {
  await wait();
  const message: ChatMessage = { id: state.nextMessageId++, senderId: state.currentUser.id, text, sentAt: nowIso(), readAt: null };
  state.threads[matchId] = [...(state.threads[matchId] ?? []), message];
  state.matches = state.matches.map((match) => (match.matchId === matchId ? { ...match, unreadCount: 0 } : match));
  return clone(message);
}

export async function editMessageDemo(matchId: number, messageId: number, text: string) {
  await wait();
  const thread = state.threads[matchId] ?? [];
  const message = thread.find((item) => item.id === messageId && item.senderId === state.currentUser.id);
  if (!message) throw new Error('Message not found or cannot be edited.');
  message.text = text;
  return clone(message);
}

export async function deleteMessageDemo(matchId: number, messageId: number) {
  await wait();
  state.threads[matchId] = (state.threads[matchId] ?? []).filter(
    (item) => !(item.id === messageId && item.senderId === state.currentUser.id)
  );
  return { ok: true };
}

export async function clearConversationDemo(matchId: number) {
  await wait();
  const deleted = state.threads[matchId]?.length ?? 0;
  state.threads[matchId] = [];
  return { ok: true, deleted };
}

export async function getMyProfileDemo() {
  await wait();
  const data: MyProfile = {
    id: state.currentUser.id,
    name: currentUserName(),
    age: currentUserAge(),
    city: currentUserCityName(),
    country: currentUserCountry(),
    bio: state.profile.bio,
    goal: goalById(state.profile.goalId).name,
    lastActive: nowIso(),
    isOnline: true,
    photos: currentPhotoUrls(),
    primaryFrequency: frequencyById(currentTrainingFrequencyId()).name,
    sports: state.profile.sports.map((sport) => ({
      icon: sportById(sport.sport_id).icon,
      name: sportById(sport.sport_id).name,
      level: skillById(sport.skill_level_id).name,
      frequency: frequencyById(sport.frequency_id).name,
      yearsExperience: sport.years_experience ?? 0,
    })),
  };
  return clone(data);
}

export async function getUserProfileDemo(userId: number) {
  await wait();
  const member = findMember(userId);
  const match = matchForUser(userId);
  const sameSports = sharedSportsCount(member);
  const goalMatch = member.goalId === state.profile.goalId;
  const theirFrequency = member.sports[0]?.frequency_id ?? 2;
  const frequencyDistance = Math.abs(theirFrequency - currentTrainingFrequencyId());
  const data: UserProfile = {
    id: member.id,
    name: member.firstName,
    age: ageFromBirthDate(member.birthDate),
    city: cityById(member.cityId).name,
    country: countryForCity(member.cityId).name,
    bio: member.bio,
    goal: goalById(member.goalId).name,
    lastActive: member.lastActive,
    isOnline: member.online,
    photos: clone(member.photos),
    primaryFrequency: frequencyById(theirFrequency).name,
    sports: member.sports.map((sport) => ({
      icon: sportById(sport.sport_id).icon,
      name: sportById(sport.sport_id).name,
      level: skillById(sport.skill_level_id).name,
      frequency: frequencyById(sport.frequency_id).name,
      yearsExperience: sport.years_experience,
    })),
    compatibility: {
      sharedSports: compatibilityMetric(Math.min(100, sameSports * 45), sameSports > 0 ? `${sameSports} overlapping sports` : 'Different primary sports'),
      trainingFrequency: compatibilityMetric(Math.max(30, 100 - frequencyDistance * 35), frequencyDistance === 0 ? 'Very similar weekly rhythm' : 'Some difference in training cadence'),
      goalAlignment: compatibilityMetric(goalMatch ? 92 : 46, goalMatch ? 'Similar relationship intentions' : 'Different reasons for being on the app'),
    },
    relation: {
      isSelf: false,
      alreadyLiked: state.likedUserIds.includes(userId),
      alreadyPassed: state.passedUserIds.includes(userId),
      matched: Boolean(match),
      matchId: match?.matchId ?? null,
      blockedByMe: state.blockedUserIds.includes(userId),
    },
  };
  return clone(data);
}

export async function blockUserDemo(userId: number) {
  await wait();
  if (!state.blockedUserIds.includes(userId)) state.blockedUserIds.push(userId);
  return { ok: true };
}

export async function unblockUserDemo(userId: number) {
  await wait();
  state.blockedUserIds = state.blockedUserIds.filter((id) => id !== userId);
  return { ok: true };
}

export async function getBlockedUsersDemo() {
  await wait();
  const data: BlockedUser[] = state.blockedUserIds.map((userId) => {
    const member = findMember(userId);
    return {
      userId: member.id,
      name: member.firstName,
      city: cityById(member.cityId).name,
      country: countryForCity(member.cityId).name,
      photo: firstPhotoUrl(member) || null,
      blockedAt: nowIso(),
    };
  });
  return clone(data);
}

export async function getAccountSettingsDemo() {
  await wait();
  const city = cityById(state.profile.cityId);
  return clone({
    id: state.currentUser.id,
    email: state.currentUser.email,
    first_name: state.profile.firstName,
    last_name: state.profile.lastName,
    birth_date: state.profile.birthDate,
    gender_id: state.profile.genderId,
    city_id: state.profile.cityId,
    city_name: city.name,
    country_id: city.countryId,
  } satisfies AccountSettings);
}

export async function verifyPasswordDemo() {
  await wait();
  return { ok: true };
}

export async function updateAccountSettingsDemo(payload: {
  email?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender_id?: number;
  city_id?: number;
  current_password: string;
}) {
  await wait();
  if (payload.email) state.currentUser.email = payload.email;
  if (payload.first_name) state.profile.firstName = payload.first_name;
  if (payload.last_name) state.profile.lastName = payload.last_name;
  if (payload.birth_date) state.profile.birthDate = payload.birth_date;
  if (payload.gender_id) state.profile.genderId = payload.gender_id;
  if (payload.city_id) state.profile.cityId = payload.city_id;
  return { ok: true };
}

export async function updatePasswordDemo() {
  await wait();
  return { ok: true };
}

export async function deleteAccountDemo() {
  await wait();
  return { ok: true };
}

export async function getComplaintTypesDemo() {
  await wait();
  const data: ComplaintType[] = complaintTypes.map((type) => ({ id: type.id, name: type.name }));
  return clone(data);
}

export async function reportUserDemo(userId: number, typeId: number, description?: string) {
  await wait();
  state.reports = [
    {
      id: state.nextReportId++,
      reporterId: state.currentUser.id,
      reportedId: userId,
      typeId,
      description: description?.trim() || complaintTypeById(typeId).name,
      statusId: 1,
      createdAt: nowIso(),
      internalNote: null,
      adminAction: null,
    },
    ...state.reports,
  ];
  return { ok: true };
}

export async function getDiscoveryPreferencesDemo() {
  await wait();
  return clone(state.preferences);
}

export async function updateDiscoveryPreferencesDemo(payload: {
  gender_id: number;
  min_age: number;
  max_age: number;
  max_distance_km: number | null;
  min_skill_level_id: number | null;
  preferred_frequency_id: number | null;
  min_photos: number;
  show_out_of_range: boolean;
  sport_ids: number[];
}) {
  await wait();
  state.preferences = {
    ...clone(payload),
    goal_id: state.preferences.goal_id,
  };
  return { ok: true };
}

export async function getProfileEditDataDemo() {
  await wait();
  const data: ProfileEditData = {
    bio: state.profile.bio,
    goal_id: state.profile.goalId,
    photos: clone(state.profile.photos),
    sports: clone(state.profile.sports),
  };
  return data;
}

export async function uploadProfilePhotosDemo(photos: Array<{ uri: string; name?: string; type?: string }>) {
  await wait();
  const startingOrder = state.profile.photos.length;
  const additions = photos.map((photo, index) => ({
    photo_id: state.nextPhotoId++,
    photo_url: photo.uri,
    display_order: startingOrder + index,
  }));
  state.profile.photos = [...state.profile.photos, ...additions].slice(0, 6);
  return clone(additions);
}

export async function reorderProfilePhotosDemo(items: Array<{ photo_id: number; display_order: number }>) {
  await wait();
  state.profile.photos = state.profile.photos.map((photo) => {
    const next = items.find((item) => item.photo_id === photo.photo_id);
    return next ? { ...photo, display_order: next.display_order } : photo;
  });
  return { ok: true };
}

export async function deleteProfilePhotoDemo(photoId: number) {
  await wait();
  state.profile.photos = state.profile.photos.filter((photo) => photo.photo_id !== photoId).map((photo, index) => ({ ...photo, display_order: index }));
  return { ok: true };
}

export async function updateProfileGoalDemo(goalId: number) {
  await wait();
  state.profile.goalId = goalId;
  return { ok: true };
}

export async function getGendersDemo() {
  await wait();
  return clone(genders);
}

export async function getCountriesDemo() {
  await wait();
  return clone(countries.map((country) => ({ id: country.id, name: country.name } satisfies OptionItem)));
}

export async function getCitiesDemo(countryId: number) {
  await wait();
  return clone(cities.filter((city) => city.countryId === countryId).map((city) => ({ id: city.id, name: city.name } satisfies OptionItem)));
}

export async function getSportsCatalogDemo() {
  await wait();
  return clone(sportsCatalog.map((sport) => ({ id: sport.id, name: sport.name } satisfies OptionItem)));
}

export async function getSkillLevelsDemo() {
  await wait();
  return clone(skillLevels.map((skill) => ({ id: skill.id, name: skill.name } satisfies OptionItem)));
}

export async function getFrequenciesDemo() {
  await wait();
  return clone(frequencies.map((frequency) => ({ id: frequency.id, name: frequency.name } satisfies OptionItem)));
}

export async function getGoalsDemo() {
  await wait();
  return clone(goals.map((goal) => ({ id: goal.id, name: goal.name } satisfies OptionItem)));
}

export async function saveOnboardingProfileDemo(payload: {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender_id: number;
  city_id: number;
}) {
  await wait();
  state.profile.firstName = payload.first_name;
  state.profile.lastName = payload.last_name;
  state.profile.birthDate = payload.birth_date;
  state.profile.genderId = payload.gender_id;
  state.profile.cityId = payload.city_id;
  return { ok: true };
}

export async function saveOnboardingBioDemo(bio: string) {
  await wait();
  state.profile.bio = bio;
  return { ok: true };
}

export async function saveOnboardingSportsDemo(sports: OnboardingSportInput[]) {
  await wait();
  state.profile.sports = clone(sports);
  return { ok: true };
}

export async function saveOnboardingPreferencesDemo(payload: {
  gender_id: number;
  min_age: number;
  max_age: number;
  max_distance_km: number;
  goal_id: number;
  sports: number[];
}) {
  await wait();
  state.profile.goalId = payload.goal_id;
  state.preferences = {
    gender_id: payload.gender_id,
    min_age: payload.min_age,
    max_age: payload.max_age,
    max_distance_km: payload.max_distance_km,
    goal_id: payload.goal_id,
    min_skill_level_id: null,
    preferred_frequency_id: null,
    min_photos: 1,
    show_out_of_range: false,
    sport_ids: clone(payload.sports),
  };
  return { ok: true };
}

export async function markOnboardingCompleteDemo() {
  await wait();
  state.currentUser = { ...state.currentUser, onboardingComplete: true };
  return { ok: true };
}

function adminUsersData(): AdminUser[] {
  return [
    {
      id: state.currentUser.id,
      email: state.currentUser.email,
      role: state.currentUser.role,
      account_status: 'active',
      last_active: nowIso(),
      created_at: '2026-01-15T09:00:00.000Z',
    },
    ...members
      .filter((member) => !state.deletedUserIds.includes(member.id))
      .map((member) => ({
        id: member.id,
        email: member.email,
        role: member.role,
        account_status: member.accountStatus,
        last_active: member.lastActive,
        created_at: '2026-01-01T09:00:00.000Z',
      })),
  ];
}

export async function getAdminOverviewDemo() {
  await wait();
  const activeUsers = adminUsersData().filter((user) => user.account_status === 'active').length;
  return clone({
    totalUsers: adminUsersData().length,
    activeUsers,
    totalMatches: state.matches.length,
    openReports: state.reports.filter((report) => isOpenStatus(report.statusId)).length,
  } satisfies AdminOverview);
}

export async function getAdminUsersDemo() {
  await wait();
  return clone(adminUsersData());
}

export async function updateAdminUserRoleDemo(userId: number, role: 'admin' | 'user') {
  await wait();
  if (userId === state.currentUser.id) {
    state.currentUser.role = role;
    return { ok: true };
  }
  findMember(userId).role = role;
  return { ok: true };
}

export async function deleteAdminUserDemo(userId: number) {
  await wait();
  if (!state.deletedUserIds.includes(userId)) state.deletedUserIds.push(userId);
  state.blockedUserIds = state.blockedUserIds.filter((id) => id !== userId);
  state.matches = state.matches.filter((match) => match.userId !== userId);
  delete state.threads[600 + userId];
  return { ok: true };
}

export async function getAdminReportsDemo() {
  await wait();
  const data: AdminReport[] = state.reports.map((report) => {
    const reporter = report.reporterId === state.currentUser.id ? null : members.find((member) => member.id === report.reporterId);
    const reported = findMember(report.reportedId);
    return {
      id: report.id,
      reporter_id: report.reporterId,
      reported_id: report.reportedId,
      reporter_email: report.reporterId === state.currentUser.id ? state.currentUser.email : reporter?.email ?? 'unknown@sportsync.demo',
      reported_email: reported.email,
      reported_account_status: reported.accountStatus,
      type: complaintTypeById(report.typeId).name,
      description: report.description,
      status: complaintStatuses[report.statusId] ?? 'Pending',
      created_at: report.createdAt,
    };
  });
  return clone(data);
}

export async function getAdminReportContextDemo(reportId: number) {
  await wait();
  const report = state.reports.find((item) => item.id === reportId);
  if (!report) throw new Error('Report not found.');
  const reportedUser = findMember(report.reportedId);
  const priorComplaints: AdminPriorComplaint[] = state.reports
    .filter((item) => item.reportedId === report.reportedId && item.id !== report.id)
    .map((item) => ({
      id: item.id,
      created_at: item.createdAt,
      type: complaintTypeById(item.typeId).name,
      status: complaintStatuses[item.statusId] ?? 'Pending',
      reporter_email: item.reporterId === state.currentUser.id ? state.currentUser.email : findMember(item.reporterId).email,
      description: item.description || null,
    }));

  const priorActions: AdminPriorAction[] = state.moderationActions
    .filter((action) => action.userId === report.reportedId)
    .map((action) => ({
      action_id: action.actionId,
      action_type: action.actionType,
      previous_account_status: action.previousStatus,
      new_account_status: action.newStatus,
      note: action.note,
      created_at: action.createdAt,
      admin_email: action.adminEmail,
    }));

  const context: AdminReportContext = {
    report: {
      id: report.id,
      internal_note: report.internalNote,
      admin_action: report.adminAction,
    },
    reporterStats: {
      totalReports: state.reports.filter((item) => item.reporterId === report.reporterId).length,
      openReports: state.reports.filter((item) => item.reporterId === report.reporterId && isOpenStatus(item.statusId)).length,
      isSerialReporter: state.reports.filter((item) => item.reporterId === report.reporterId).length >= 3,
    },
    reportedUser: {
      id: reportedUser.id,
      email: reportedUser.email,
      fullName: displayName(reportedUser.firstName, reportedUser.lastName) || null,
      bio: reportedUser.bio || null,
      accountStatus: reportedUser.accountStatus,
      suspendedUntil: reportedUser.suspendedUntil ?? null,
      suspensionReason: reportedUser.suspensionReason ?? null,
      createdAt: '2026-01-01T09:00:00.000Z',
      photos: clone(reportedUser.photos),
    },
    priorComplaints,
    priorActions,
  };
  return clone(context);
}

export async function updateAdminReportStatusDemo(reportId: number, statusId: number) {
  await wait();
  state.reports = state.reports.map((report) => (report.id === reportId ? { ...report, statusId } : report));
  return { ok: true };
}

export async function moderateAdminReportDemo(payload: {
  reportId: number;
  action: 'warn' | 'suspend' | 'ban' | 'dismiss';
  statusName: string;
  note: string;
  suspensionReason?: string;
  suspendedUntil?: string;
}) {
  await wait();
  const report = state.reports.find((item) => item.id === payload.reportId);
  if (!report) throw new Error('Report not found.');
  const user = findMember(report.reportedId);
  const previousStatus = user.accountStatus;
  const nextStatus: AccountStatus =
    payload.action === 'ban' ? 'banned' : payload.action === 'suspend' ? 'suspended' : 'active';
  user.accountStatus = nextStatus;
  user.suspensionReason = payload.action === 'suspend' ? payload.suspensionReason ?? 'Moderation review' : null;
  user.suspendedUntil =
    payload.action === 'suspend'
      ? payload.suspendedUntil ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
      : null;
  const statusEntry = Object.entries(complaintStatuses).find(([, value]) => value === payload.statusName);
  const statusId = statusEntry ? Number(statusEntry[0]) : 3;
  state.reports = state.reports.map((item) =>
    item.id === payload.reportId ? { ...item, statusId, internalNote: payload.note || null, adminAction: payload.action } : item
  );
  state.moderationActions = [
    {
      actionId: state.nextActionId++,
      userId: user.id,
      actionType: payload.action,
      previousStatus,
      newStatus: nextStatus,
      note: payload.note || null,
      createdAt: nowIso(),
      adminEmail: state.currentUser.email,
    },
    ...state.moderationActions,
  ];
  return { ok: true };
}
