import { api } from './client';
import {
  AccountSettings,
  AdminOverview,
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
  UserProfile,
} from '../types/app';

export async function getDiscover() {
  const { data } = await api.get<DiscoverProfile[]>('/api/discover');
  return data;
}

export async function likeUser(userId: number) {
  const { data } = await api.post<{ matched: boolean; matchId: number | null }>(`/api/discover/like/${userId}`);
  return data;
}

export async function passUser(userId: number) {
  const { data } = await api.post<{ ok: boolean }>(`/api/discover/pass/${userId}`);
  return data;
}

export async function getMatches() {
  const { data } = await api.get<MatchItem[]>('/api/matches');
  return data;
}

export async function getConversations() {
  const { data } = await api.get<ConversationItem[]>('/api/messages/conversations');
  return data;
}

export async function getThread(matchId: number) {
  const { data } = await api.get<MessageThread>(`/api/messages/${matchId}`);
  return data;
}

export async function sendMessage(matchId: number, text: string) {
  const { data } = await api.post<ChatMessage>(`/api/messages/${matchId}`, { text });
  return data;
}

export async function getMyProfile() {
  const { data } = await api.get<MyProfile>('/api/users/me');
  return data;
}

export async function getUserProfile(userId: number) {
  const { data } = await api.get<UserProfile>(`/api/users/${userId}`);
  return data;
}

export async function blockUser(userId: number) {
  const { data } = await api.post(`/api/users/${userId}/block`);
  return data;
}

export async function unblockUser(userId: number) {
  const { data } = await api.delete(`/api/users/${userId}/block`);
  return data;
}

export async function getBlockedUsers() {
  const { data } = await api.get<{ blockedUsers: BlockedUser[] }>('/api/blocked-users');
  return data.blockedUsers;
}

export async function getAccountSettings() {
  const { data } = await api.get<AccountSettings>('/api/settings/account');
  return data;
}

export async function verifyPassword(password: string) {
  const { data } = await api.post('/api/settings/verify-password', { current_password: password });
  return data;
}

export async function updateAccountSettings(payload: {
  email?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender_id?: number;
  city_id?: number;
  current_password: string;
}) {
  const { data } = await api.put('/api/settings/account', payload);
  return data;
}

export async function updatePassword(payload: {
  current_password: string;
  new_password: string;
}) {
  const { data } = await api.put('/api/settings/password', payload);
  return data;
}

export async function deleteAccount(password: string) {
  const { data } = await api.delete('/api/settings/account', {
    data: {
      current_password: password,
      confirmation: 'DELETE',
    },
  });
  return data;
}

export async function getComplaintTypes() {
  const { data } = await api.get<{ types: ComplaintType[] }>('/api/complaint-types');
  return data.types;
}

export async function reportUser(userId: number, typeId: number, description?: string) {
  const { data } = await api.post(`/api/users/${userId}/report`, {
    typeId,
    description: description?.trim() ? description.trim() : undefined,
  });
  return data;
}

export async function getDiscoveryPreferences() {
  const { data } = await api.get<DiscoveryPreferences>('/api/preferences');
  return data;
}

export async function updateDiscoveryPreferences(payload: {
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
  const { data } = await api.put('/api/preferences', payload);
  return data;
}

export async function getProfileEditData() {
  const { data } = await api.get<ProfileEditData>('/api/profile/edit-data');
  return data;
}

export async function uploadProfilePhotos(photos: Array<{ uri: string; name?: string; type?: string }>) {
  const formData = new FormData();
  photos.forEach((photo) => {
    formData.append('photos', {
      uri: photo.uri,
      name: photo.name ?? `photo-${Date.now()}.jpg`,
      type: photo.type ?? 'image/jpeg',
    } as any);
  });

  const { data } = await api.post('/api/onboarding/photos', formData);
  return data;
}

export async function reorderProfilePhotos(items: Array<{ photo_id: number; display_order: number }>) {
  const { data } = await api.put('/api/onboarding/photos/order', items);
  return data;
}

export async function deleteProfilePhoto(photoId: number) {
  const { data } = await api.delete(`/api/onboarding/photos/${photoId}`);
  return data;
}

export async function updateProfileGoal(goalId: number) {
  const { data } = await api.patch('/api/profile/goal', { goal_id: goalId });
  return data;
}

export async function getGenders() {
  const { data } = await api.get<OptionItem[]>('/api/genders');
  return data;
}

export async function getCountries() {
  const { data } = await api.get<OptionItem[]>('/api/countries');
  return data;
}

export async function getCities(countryId: number) {
  const { data } = await api.get<OptionItem[]>(`/api/countries/${countryId}/cities`);
  return data;
}

export async function getSportsCatalog() {
  const { data } = await api.get<OptionItem[]>('/api/sports');
  return data;
}

export async function getSkillLevels() {
  const { data } = await api.get<OptionItem[]>('/api/skill-levels');
  return data;
}

export async function getFrequencies() {
  const { data } = await api.get<OptionItem[]>('/api/frequencies');
  return data;
}

export async function getGoals() {
  const { data } = await api.get<OptionItem[]>('/api/goals');
  return data;
}

export async function saveOnboardingProfile(payload: {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender_id: number;
  city_id: number;
}) {
  const { data } = await api.post('/api/onboarding/profile', payload);
  return data;
}

export async function saveOnboardingBio(bio: string) {
  const { data } = await api.post('/api/onboarding/bio', { bio });
  return data;
}

export async function saveOnboardingSports(sports: OnboardingSportInput[]) {
  const { data } = await api.post('/api/onboarding/sports', sports);
  return data;
}

export async function saveOnboardingPreferences(payload: {
  gender_id: number;
  min_age: number;
  max_age: number;
  max_distance_km: number;
  goal_id: number;
  sports: number[];
}) {
  const { data } = await api.post('/api/onboarding/preferences', payload);
  return data;
}

export async function markOnboardingComplete() {
  const { data } = await api.patch('/api/users/onboarding-complete');
  return data;
}

export async function getAdminOverview() {
  const { data } = await api.get<AdminOverview>('/api/admin/overview');
  return data;
}

export async function getAdminUsers() {
  const { data } = await api.get<AdminUser[]>('/api/admin/users');
  return data;
}

export async function updateAdminUserRole(userId: number, role: 'admin' | 'user') {
  const { data } = await api.patch(`/api/admin/users/${userId}/role`, { role });
  return data;
}

export async function deleteAdminUser(userId: number) {
  const { data } = await api.delete(`/api/admin/users/${userId}`);
  return data;
}

export async function getAdminReports() {
  const { data } = await api.get<AdminReport[]>('/api/admin/reports');
  return data;
}

export async function getAdminReportContext(reportId: number) {
  const { data } = await api.get<AdminReportContext>(`/api/admin/reports/${reportId}/context`);
  return data;
}

export async function updateAdminReportStatus(reportId: number, statusId: number) {
  const { data } = await api.patch(`/api/admin/reports/${reportId}/status`, { statusId });
  return data;
}

export async function moderateAdminReport(payload: {
  reportId: number;
  action: 'warn' | 'suspend' | 'ban' | 'dismiss';
  statusName: string;
  note: string;
  suspensionReason?: string;
  suspendedUntil?: string;
}) {
  const { reportId, ...body } = payload;
  const { data } = await api.post(`/api/admin/reports/${reportId}/moderate`, body);
  return data;
}
