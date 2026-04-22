export interface SportBadge {
  icon: string;
  name: string;
  level?: string;
}

export interface OptionItem {
  id: number;
  name: string;
}

export interface OnboardingSportInput {
  sport_id: number;
  skill_level_id: number;
  years_experience: number | null;
  frequency_id: number;
}

export interface DiscoverProfile {
  id: number;
  name: string;
  age: number;
  distance: string;
  image: string;
  sports: SportBadge[];
  frequency: string;
  goal: string;
  tag: string | null;
  photos: string[];
}

export interface UserProfileSport {
  icon: string;
  name: string;
  level: string;
  frequency: string;
  yearsExperience: number | null;
}

export interface CompatMetric {
  pct: number;
  detail: string;
}

export interface UserProfile {
  id: number;
  name: string;
  age: number;
  city: string;
  country: string;
  bio: string | null;
  goal: string | null;
  lastActive: string | null;
  isOnline: boolean;
  photos: string[];
  primaryFrequency: string | null;
  sports: UserProfileSport[];
  compatibility: {
    sharedSports: CompatMetric;
    trainingFrequency: CompatMetric;
    goalAlignment: CompatMetric;
  };
  relation: {
    isSelf: boolean;
    alreadyLiked: boolean;
    alreadyPassed: boolean;
    matched: boolean;
    matchId: number | null;
    blockedByMe: boolean;
  };
}

export interface MatchItem {
  matchId: number;
  matchedAt: string;
  userId: number;
  name: string;
  age: number;
  city: string;
  lastActive: string | null;
  isOnline: boolean;
  sport: {
    icon: string;
    name: string;
  } | null;
  image: string;
  sharedSports: number;
}

export interface ConversationItem {
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
}

export interface ChatMessage {
  id: number;
  senderId: number;
  text: string;
  sentAt: string;
  readAt: string | null;
}

export interface MessageThread {
  matchId: number;
  peer: {
    user_id: number;
    first_name: string;
    age: number;
    city_name: string;
    last_active: string | null;
    photo_url: string | null;
  } | null;
  messages: ChatMessage[];
}

export interface MyProfile {
  id: number;
  name: string;
  age: number;
  city: string;
  country: string;
  bio: string;
  goal: string | null;
  lastActive: string | null;
  isOnline: boolean;
  photos: string[];
  primaryFrequency: string | null;
  sports: Array<{
    icon: string;
    name: string;
    level: string;
    frequency: string;
    yearsExperience: number;
  }>;
}

export interface AccountSettings {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender_id: number;
  city_id: number;
  city_name: string;
  country_id: number;
}

export interface BlockedUser {
  userId: number;
  name: string;
  city: string;
  country: string;
  photo: string | null;
  blockedAt: string;
}

export interface ComplaintType {
  id: number;
  name: string;
}

export interface DiscoveryPreferences {
  gender_id: number;
  min_age: number;
  max_age: number;
  max_distance_km: number | null;
  goal_id: number | null;
  min_skill_level_id: number | null;
  preferred_frequency_id: number | null;
  min_photos: number;
  show_out_of_range: boolean;
  sport_ids: number[];
}

export interface ProfileEditPhoto {
  photo_id: number;
  photo_url: string;
  display_order: number;
}

export interface ProfileEditData {
  bio: string | null;
  goal_id: number | null;
  photos: ProfileEditPhoto[];
  sports: OnboardingSportInput[];
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  openReports: number;
}

export interface AdminUser {
  id: number;
  email: string;
  role: 'admin' | 'user';
  account_status: 'active' | 'suspended' | 'banned';
  last_active: string | null;
  created_at: string;
}

export interface AdminReport {
  id: number;
  reporter_id: number;
  reported_id: number;
  reporter_email: string;
  reported_email: string;
  reported_account_status: 'active' | 'suspended' | 'banned';
  type: string;
  description: string;
  status: string;
  created_at: string;
}

export interface AdminPriorComplaint {
  id: number;
  created_at: string;
  type: string;
  status: string;
  reporter_email: string;
  description: string | null;
}

export interface AdminPriorAction {
  action_id: number;
  action_type: 'warn' | 'suspend' | 'ban' | 'dismiss';
  previous_account_status: 'active' | 'suspended' | 'banned';
  new_account_status: 'active' | 'suspended' | 'banned';
  note: string | null;
  created_at: string;
  admin_email: string;
}

export interface AdminReportContext {
  report: {
    id: number;
    internal_note: string | null;
    admin_action: string | null;
  };
  reporterStats: {
    totalReports: number;
    openReports: number;
    isSerialReporter: boolean;
  };
  reportedUser: {
    id: number;
    email: string;
    fullName: string | null;
    bio: string | null;
    accountStatus: 'active' | 'suspended' | 'banned';
    suspendedUntil: string | null;
    suspensionReason: string | null;
    createdAt: string;
    photos: string[];
  };
  priorComplaints: AdminPriorComplaint[];
  priorActions: AdminPriorAction[];
}
