import { api } from './client';
import { DEMO_MODE } from '../config/demo';
import {
  blockUserDemo,
  deleteAccountDemo,
  deleteAdminUserDemo,
  deleteProfilePhotoDemo,
  getAccountSettingsDemo,
  getAdminOverviewDemo,
  getAdminReportContextDemo,
  getAdminReportsDemo,
  getAdminUsersDemo,
  getBlockedUsersDemo,
  getCitiesDemo,
  getComplaintTypesDemo,
  getConversationsDemo,
  getCountriesDemo,
  getDiscoverDemo,
  getDiscoveryPreferencesDemo,
  getFrequenciesDemo,
  getGendersDemo,
  getGoalsDemo,
  getMatchesDemo,
  getMyProfileDemo,
  getProfileEditDataDemo,
  getSkillLevelsDemo,
  getSportsCatalogDemo,
  getThreadDemo,
  clearConversationDemo,
  deleteMessageDemo,
  editMessageDemo,
  getUserProfileDemo,
  likeUserDemo,
  markOnboardingCompleteDemo,
  moderateAdminReportDemo,
  passUserDemo,
  reorderProfilePhotosDemo,
  reportUserDemo,
  saveOnboardingBioDemo,
  saveOnboardingPreferencesDemo,
  saveOnboardingProfileDemo,
  saveOnboardingSportsDemo,
  sendMessageDemo,
  unblockUserDemo,
  updateAccountSettingsDemo,
  updateAdminReportStatusDemo,
  updateAdminUserRoleDemo,
  updateDiscoveryPreferencesDemo,
  updatePasswordDemo,
  updateProfileGoalDemo,
  uploadProfilePhotosDemo,
  verifyPasswordDemo,
} from '../demo/demoApi';
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
  ProfileEditPhoto,
  UserProfile,
} from '../types/app';

export async function getDiscover() {
  if (DEMO_MODE) return getDiscoverDemo();
  const { data } = await api.get<DiscoverProfile[]>('/api/discover');
  return data;
}

export async function likeUser(userId: number) {
  if (DEMO_MODE) return likeUserDemo(userId);
  const { data } = await api.post<{ matched: boolean; matchId: number | null }>(`/api/discover/like/${userId}`);
  return data;
}

export async function passUser(userId: number) {
  if (DEMO_MODE) return passUserDemo(userId);
  const { data } = await api.post<{ ok: boolean }>(`/api/discover/pass/${userId}`);
  return data;
}

export async function getMatches() {
  if (DEMO_MODE) return getMatchesDemo();
  const { data } = await api.get<MatchItem[]>('/api/matches');
  return data;
}

export async function getConversations() {
  if (DEMO_MODE) return getConversationsDemo();
  const { data } = await api.get<ConversationItem[]>('/api/messages/conversations');
  return data;
}

export async function getThread(matchId: number) {
  if (DEMO_MODE) return getThreadDemo(matchId);
  const { data } = await api.get<MessageThread>(`/api/messages/${matchId}`);
  return data;
}

export async function sendMessage(matchId: number, text: string) {
  if (DEMO_MODE) return sendMessageDemo(matchId, text);
  const { data } = await api.post<ChatMessage>(`/api/messages/${matchId}`, { text });
  return data;
}

export async function editMessage(matchId: number, messageId: number, text: string) {
  if (DEMO_MODE) return editMessageDemo(matchId, messageId, text);
  const { data } = await api.put<ChatMessage>(`/api/messages/${matchId}/${messageId}`, { text });
  return data;
}

export async function deleteMessage(matchId: number, messageId: number) {
  if (DEMO_MODE) return deleteMessageDemo(matchId, messageId);
  const { data } = await api.delete<{ ok: boolean }>(`/api/messages/${matchId}/${messageId}`);
  return data;
}

export async function clearConversation(matchId: number) {
  if (DEMO_MODE) return clearConversationDemo(matchId);
  const { data } = await api.delete<{ ok: boolean; deleted: number }>(`/api/messages/${matchId}`);
  return data;
}

export async function getMyProfile() {
  if (DEMO_MODE) return getMyProfileDemo();
  const { data } = await api.get<MyProfile>('/api/users/me');
  return data;
}

export async function getUserProfile(userId: number) {
  if (DEMO_MODE) return getUserProfileDemo(userId);
  const { data } = await api.get<UserProfile>(`/api/users/${userId}`);
  return data;
}

export async function blockUser(userId: number) {
  if (DEMO_MODE) return blockUserDemo(userId);
  const { data } = await api.post(`/api/users/${userId}/block`);
  return data;
}

export async function unblockUser(userId: number) {
  if (DEMO_MODE) return unblockUserDemo(userId);
  const { data } = await api.delete(`/api/users/${userId}/block`);
  return data;
}

export async function getBlockedUsers() {
  if (DEMO_MODE) return getBlockedUsersDemo();
  const { data } = await api.get<{ blockedUsers: BlockedUser[] }>('/api/blocked-users');
  return data.blockedUsers;
}

export async function getAccountSettings() {
  if (DEMO_MODE) return getAccountSettingsDemo();
  const { data } = await api.get<AccountSettings>('/api/settings/account');
  return data;
}

export async function verifyPassword(password: string) {
  if (DEMO_MODE) return verifyPasswordDemo();
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
  if (DEMO_MODE) return updateAccountSettingsDemo(payload);
  const { data } = await api.put('/api/settings/account', payload);
  return data;
}

export async function updatePassword(payload: {
  current_password: string;
  new_password: string;
}) {
  if (DEMO_MODE) return updatePasswordDemo();
  const { data } = await api.put('/api/settings/password', payload);
  return data;
}

export async function deleteAccount(password: string) {
  if (DEMO_MODE) return deleteAccountDemo();
  const { data } = await api.delete('/api/settings/account', {
    data: {
      current_password: password,
      confirmation: 'DELETE',
    },
  });
  return data;
}

export async function getComplaintTypes() {
  if (DEMO_MODE) return getComplaintTypesDemo();
  const { data } = await api.get<{ types: ComplaintType[] }>('/api/complaint-types');
  return data.types;
}

export async function reportUser(userId: number, typeId: number, description?: string) {
  if (DEMO_MODE) return reportUserDemo(userId, typeId, description);
  const { data } = await api.post(`/api/users/${userId}/report`, {
    typeId,
    description: description?.trim() ? description.trim() : undefined,
  });
  return data;
}

export async function getDiscoveryPreferences() {
  if (DEMO_MODE) return getDiscoveryPreferencesDemo();
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
  if (DEMO_MODE) return updateDiscoveryPreferencesDemo(payload);
  const { data } = await api.put('/api/preferences', payload);
  return data;
}

export async function getProfileEditData() {
  if (DEMO_MODE) return getProfileEditDataDemo();
  const { data } = await api.get<ProfileEditData>('/api/profile/edit-data');
  return data;
}

export async function uploadProfilePhotos(photos: Array<{ uri: string; name?: string; type?: string }>) {
  if (DEMO_MODE) return uploadProfilePhotosDemo(photos);
  const formData = new FormData();
  photos.forEach((photo) => {
    formData.append('photos', {
      uri: photo.uri,
      name: photo.name ?? `photo-${Date.now()}.jpg`,
      type: photo.type ?? 'image/jpeg',
    } as any);
  });

  const { data } = await api.post<ProfileEditPhoto[]>('/api/onboarding/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function reorderProfilePhotos(items: Array<{ photo_id: number; display_order: number }>) {
  if (DEMO_MODE) return reorderProfilePhotosDemo(items);
  const { data } = await api.put('/api/onboarding/photos/order', items);
  return data;
}

export async function deleteProfilePhoto(photoId: number) {
  if (DEMO_MODE) return deleteProfilePhotoDemo(photoId);
  const { data } = await api.delete(`/api/onboarding/photos/${photoId}`);
  return data;
}

export async function updateProfileGoal(goalId: number) {
  if (DEMO_MODE) return updateProfileGoalDemo(goalId);
  const { data } = await api.patch('/api/profile/goal', { goal_id: goalId });
  return data;
}

export async function getGenders() {
  if (DEMO_MODE) return getGendersDemo();
  const { data } = await api.get<OptionItem[]>('/api/genders');
  return data;
}

export async function getCountries() {
  if (DEMO_MODE) return getCountriesDemo();
  const { data } = await api.get<OptionItem[]>('/api/countries');
  return data;
}

export async function getCities(countryId: number) {
  if (DEMO_MODE) return getCitiesDemo(countryId);
  const { data } = await api.get<OptionItem[]>(`/api/countries/${countryId}/cities`);
  return data;
}

export async function getSportsCatalog() {
  if (DEMO_MODE) return getSportsCatalogDemo();
  const { data } = await api.get<OptionItem[]>('/api/sports');
  return data;
}

export async function getSkillLevels() {
  if (DEMO_MODE) return getSkillLevelsDemo();
  const { data } = await api.get<OptionItem[]>('/api/skill-levels');
  return data;
}

export async function getFrequencies() {
  if (DEMO_MODE) return getFrequenciesDemo();
  const { data } = await api.get<OptionItem[]>('/api/frequencies');
  return data;
}

export async function getGoals() {
  if (DEMO_MODE) return getGoalsDemo();
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
  if (DEMO_MODE) return saveOnboardingProfileDemo(payload);
  const { data } = await api.post('/api/onboarding/profile', payload);
  return data;
}

export async function saveOnboardingBio(bio: string) {
  if (DEMO_MODE) return saveOnboardingBioDemo(bio);
  const { data } = await api.post('/api/onboarding/bio', { bio });
  return data;
}

export async function saveOnboardingSports(sports: OnboardingSportInput[]) {
  if (DEMO_MODE) return saveOnboardingSportsDemo(sports);
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
  if (DEMO_MODE) return saveOnboardingPreferencesDemo(payload);
  const { data } = await api.post('/api/onboarding/preferences', payload);
  return data;
}

export async function markOnboardingComplete() {
  if (DEMO_MODE) return markOnboardingCompleteDemo();
  const { data } = await api.patch('/api/users/onboarding-complete');
  return data;
}

export async function getAdminOverview() {
  if (DEMO_MODE) return getAdminOverviewDemo();
  const { data } = await api.get<AdminOverview>('/api/admin/overview');
  return data;
}

export async function getAdminUsers() {
  if (DEMO_MODE) return getAdminUsersDemo();
  const { data } = await api.get<AdminUser[]>('/api/admin/users');
  return data;
}

export async function updateAdminUserRole(userId: number, role: 'admin' | 'user') {
  if (DEMO_MODE) return updateAdminUserRoleDemo(userId, role);
  const { data } = await api.patch(`/api/admin/users/${userId}/role`, { role });
  return data;
}

export async function deleteAdminUser(userId: number) {
  if (DEMO_MODE) return deleteAdminUserDemo(userId);
  const { data } = await api.delete(`/api/admin/users/${userId}`);
  return data;
}

export async function getAdminReports() {
  if (DEMO_MODE) return getAdminReportsDemo();
  const { data } = await api.get<AdminReport[]>('/api/admin/reports');
  return data;
}

export async function getAdminReportContext(reportId: number) {
  if (DEMO_MODE) return getAdminReportContextDemo(reportId);
  const { data } = await api.get<AdminReportContext>(`/api/admin/reports/${reportId}/context`);
  return data;
}

export async function updateAdminReportStatus(reportId: number, statusId: number) {
  if (DEMO_MODE) return updateAdminReportStatusDemo(reportId, statusId);
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
  if (DEMO_MODE) return moderateAdminReportDemo(payload);
  const { reportId, ...body } = payload;
  const { data } = await api.post(`/api/admin/reports/${reportId}/moderate`, body);
  return data;
}
