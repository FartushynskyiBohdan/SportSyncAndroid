import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  deleteAccount,
  getAccountSettings,
  getBlockedUsers,
  getCities,
  getCountries,
  getGenders,
  unblockUser,
  updateAccountSettings,
  updatePassword,
} from '../../api/appApi';
import { SearchableOptionSelect } from '../../components/SearchableOptionSelect';
import { useAuth } from '../../context/AuthContext';
import { AccountSettings, BlockedUser, OptionItem } from '../../types/app';
import { palette } from '../../theme/palette';

type Section = 'account' | 'password' | 'blocked' | 'delete';

const sectionLabels: Record<Section, string> = {
  account: 'Account',
  password: 'Password',
  blocked: 'Blocked',
  delete: 'Delete',
};

export function SettingsScreen({ onGoBack }: { onGoBack?: () => void }) {
  const { logout } = useAuth();
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [genders, setGenders] = useState<OptionItem[]>([]);
  const [countries, setCountries] = useState<OptionItem[]>([]);
  const [cities, setCities] = useState<OptionItem[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('account');

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const [account, genderList, countryList] = await Promise.all([
        getAccountSettings(),
        getGenders(),
        getCountries(),
      ]);

      setSettings(account);
      setGenders(genderList);
      setCountries(countryList);

      if (account.country_id) {
        setCities(await getCities(account.country_id));
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }

  async function loadBlockedUsers() {
    try {
      setBlockedUsers(await getBlockedUsers());
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to load blocked users.');
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.accent} size="large" />
        <Text style={styles.loadingText}>Loading account controls...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      {onGoBack ? (
        <Pressable style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backButtonText}>Back to profile</Text>
        </Pressable>
      ) : null}

      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>ACCOUNT CONTROL</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Update location, privacy, security, and account access.</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.sectionTabs}>
        {(Object.keys(sectionLabels) as Section[]).map((section) => (
          <Pressable
            key={section}
            style={[styles.sectionTab, activeSection === section && styles.sectionTabActive]}
            onPress={() => {
              setActiveSection(section);
              if (section === 'blocked') void loadBlockedUsers();
            }}
          >
            <Text style={[styles.sectionTabText, activeSection === section && styles.sectionTabTextActive]}>
              {sectionLabels[section]}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeSection === 'account' && settings ? (
        <AccountEditForm
          settings={settings}
          genders={genders}
          countries={countries}
          cities={cities}
          setCities={setCities}
          onSaved={setSettings}
        />
      ) : null}

      {activeSection === 'password' ? <PasswordChangeForm /> : null}

      {activeSection === 'blocked' ? (
        <BlockedUsersList users={blockedUsers} onReload={() => void loadBlockedUsers()} />
      ) : null}

      {activeSection === 'delete' ? <DeleteAccountForm /> : null}

      <Pressable
        style={styles.logoutButton}
        onPress={() => {
          Alert.alert('Log out?', 'You can sign back in at any time.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => void logout() },
          ]);
        }}
      >
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function AccountEditForm({
  settings,
  genders,
  countries,
  cities,
  setCities,
  onSaved,
}: {
  settings: AccountSettings;
  genders: OptionItem[];
  countries: OptionItem[];
  cities: OptionItem[];
  setCities: (cities: OptionItem[]) => void;
  onSaved: (settings: AccountSettings) => void;
}) {
  const [email, setEmail] = useState(settings.email);
  const [firstName, setFirstName] = useState(settings.first_name || '');
  const [lastName, setLastName] = useState(settings.last_name || '');
  const [birthDate, setBirthDate] = useState(settings.birth_date || '');
  const [genderId, setGenderId] = useState<number | null>(settings.gender_id || null);
  const [countryId, setCountryId] = useState<number | null>(settings.country_id || null);
  const [cityId, setCityId] = useState<number | null>(settings.city_id || null);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCountryChange(nextCountryId: number) {
    setCountryId(nextCountryId);
    setCityId(null);

    try {
      const nextCities = await getCities(nextCountryId);
      setCities(nextCities);
      if (nextCities[0]) {
        setCityId(nextCities[0].id);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to load cities.');
    }
  }

  async function handleSave() {
    if (!password) {
      Alert.alert('Password required', 'Enter your current password to save account changes.');
      return;
    }

    if (!email.trim() || !firstName.trim() || !lastName.trim() || !birthDate.trim() || !genderId || !cityId) {
      Alert.alert('Missing details', 'Fill in email, name, birth date, gender, country, and city.');
      return;
    }

    setSaving(true);
    try {
      const response = await updateAccountSettings({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate.trim(),
        gender_id: genderId,
        city_id: cityId,
        current_password: password,
      });

      if (response?.account) {
        onSaved(response.account);
      }

      setPassword('');
      Alert.alert('Saved', 'Account and location updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update account.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Account Information</Text>
      <Text style={styles.cardCopy}>This is where you change your public location and basic account details.</Text>

      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <View style={styles.twoColumn}>
        <Input label="First name" value={firstName} onChangeText={setFirstName} />
        <Input label="Last name" value={lastName} onChangeText={setLastName} />
      </View>
      <Input label="Birth date (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} />

      <SearchableOptionSelect label="Gender" value={genderId} options={genders} onChange={setGenderId} />
      <SearchableOptionSelect
        label="Country"
        value={countryId}
        options={countries}
        onChange={handleCountryChange}
        helperText="Use search rather than scrolling through every country."
      />
      <SearchableOptionSelect
        label="City / location"
        value={cityId}
        options={cities}
        onChange={setCityId}
        disabled={!countryId || cities.length === 0}
        placeholder={countryId ? 'Choose your city' : 'Pick a country first'}
      />

      <Input label="Current password required to save" value={password} onChangeText={setPassword} secureTextEntry />

      <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Account Changes'}</Text>
      </Pressable>
    </View>
  );
}

function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleChange() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing details', 'All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Too short', 'New password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      await updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      Alert.alert('Saved', 'Password changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Change Password</Text>
      <Input label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
      <Input label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
      <Input label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={handleChange} disabled={saving}>
        <Text style={styles.primaryButtonText}>{saving ? 'Updating...' : 'Change Password'}</Text>
      </Pressable>
    </View>
  );
}

function BlockedUsersList({ users, onReload }: { users: BlockedUser[]; onReload: () => void }) {
  const [unblocking, setUnblocking] = useState<number | null>(null);

  function handleUnblock(userId: number) {
    Alert.alert('Unblock user?', 'They will be able to see your profile and contact you again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          setUnblocking(userId);
          try {
            await unblockUser(userId);
            onReload();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error || 'Failed to unblock user.');
          } finally {
            setUnblocking(null);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Blocked Users</Text>
      {users.length === 0 ? (
        <Text style={styles.emptyText}>You have not blocked anyone yet.</Text>
      ) : (
        users.map((user) => (
          <View key={user.userId} style={styles.blockedUserRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.blockedUserName}>{user.name}</Text>
              <Text style={styles.blockedUserMeta}>{user.city}, {user.country}</Text>
            </View>
            <Pressable
              style={[styles.smallButton, unblocking === user.userId && styles.disabled]}
              onPress={() => handleUnblock(user.userId)}
              disabled={unblocking === user.userId}
            >
              <Text style={styles.smallButtonText}>{unblocking === user.userId ? 'Working...' : 'Unblock'}</Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

function DeleteAccountForm() {
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleDelete() {
    if (!password) {
      Alert.alert('Password required', 'Enter your password first.');
      return;
    }
    if (!confirm) {
      Alert.alert('Confirm deletion', 'Tick the confirmation before deleting your account.');
      return;
    }

    Alert.alert('Delete account?', 'This cannot be undone. Your profile, photos, matches, and messages will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteAccount(password);
            Alert.alert('Deleted', 'Account deleted.', [{ text: 'OK', onPress: () => void logout() }]);
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error || 'Failed to delete account.');
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Delete Account</Text>
      <Text style={styles.warningText}>Permanent action. All your data, photos, matches, and messages will be deleted.</Text>
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable style={styles.checkboxRow} onPress={() => setConfirm((value) => !value)}>
        <View style={[styles.checkboxBox, confirm && styles.checkboxBoxChecked]} />
        <Text style={styles.checkboxLabel}>I understand my account will be permanently deleted.</Text>
      </Pressable>
      <Pressable style={[styles.deleteButton, (!confirm || deleting) && styles.disabled]} onPress={handleDelete} disabled={!confirm || deleting}>
        <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete Account'}</Text>
      </Pressable>
    </View>
  );
}

function Input({
  label,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'number-pad';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholderTextColor="#647099"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 18,
    gap: 14,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: palette.background,
  },
  loadingText: {
    color: palette.textMuted,
    fontWeight: '700',
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#32457b',
    backgroundColor: '#101a39',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backButtonText: {
    color: '#d9e5ff',
    fontSize: 12,
    fontWeight: '700',
  },
  headerCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#263661',
    backgroundColor: '#0c1430',
    padding: 16,
    gap: 5,
  },
  eyebrow: {
    color: palette.accentSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
  },
  sectionTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#32457b',
    backgroundColor: '#121d3f',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  sectionTabActive: {
    backgroundColor: '#f4f7ff',
    borderColor: '#f4f7ff',
  },
  sectionTabText: {
    color: '#d6e1ff',
    fontWeight: '800',
    fontSize: 12,
  },
  sectionTabTextActive: {
    color: '#08112d',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#263661',
    backgroundColor: palette.panel,
    padding: 15,
    gap: 12,
  },
  cardTitle: {
    color: palette.text,
    fontWeight: '900',
    fontSize: 19,
  },
  cardCopy: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldGroup: {
    flex: 1,
    gap: 7,
  },
  fieldLabel: {
    color: '#d2ddff',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#2f437b',
    backgroundColor: '#0f152f',
    color: palette.text,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
  },
  selectionSummary: {
    color: palette.textMuted,
    fontSize: 12,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#36497f',
    backgroundColor: '#111b3d',
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  optionPillSelected: {
    backgroundColor: palette.accent,
    borderColor: '#bca7ff',
  },
  optionPillText: {
    color: '#c7d3ff',
    fontSize: 12,
    fontWeight: '700',
  },
  optionPillTextSelected: {
    color: '#fff',
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: palette.accent,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
  blockedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: '#0f152f',
    padding: 12,
    gap: 12,
  },
  blockedUserName: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 14,
  },
  blockedUserMeta: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  smallButton: {
    borderRadius: 10,
    backgroundColor: palette.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  warningText: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 19,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5d6fa8',
    backgroundColor: '#0f152f',
  },
  checkboxBoxChecked: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  checkboxLabel: {
    flex: 1,
    color: palette.text,
    fontSize: 13,
    lineHeight: 18,
  },
  deleteButton: {
    borderRadius: 14,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  logoutButton: {
    borderRadius: 14,
    backgroundColor: '#3a1220',
    borderWidth: 1,
    borderColor: '#7f2534',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fecdd3',
    fontWeight: '900',
    fontSize: 15,
  },
});
