import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getAccountSettings, getCities, getCountries, getGenders, updateAccountSettings, updatePassword, getBlockedUsers, unblockUser, deleteAccount } from '../../api/appApi';
import { useAuth } from '../../context/AuthContext';
import { AccountSettings, OptionItem } from '../../types/app';
import { palette } from '../../theme/palette';

type Section = 'account' | 'password' | 'blocked' | 'delete';

export function SettingsScreen() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [genders, setGenders] = useState<OptionItem[]>([]);
  const [countries, setCountries] = useState<OptionItem[]>([]);
  const [cities, setCities] = useState<OptionItem[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('account');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [s, g, c] = await Promise.all([
          getAccountSettings(),
          getGenders(),
          getCountries(),
        ]);
        setSettings(s);
        setGenders(g);
        setCountries(c);
        if (s.country_id) {
          const citiesData = await getCities(s.country_id);
          setCities(citiesData);
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const blocked = await getBlockedUsers();
      setBlockedUsers(blocked);
    } catch (err) {
      Alert.alert('Error', 'Failed to load blocked users.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your account and privacy.</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Section tabs */}
      <View style={styles.tabs}>
        {(['account', 'password', 'blocked', 'delete'] as Section[]).map(section => (
          <Pressable
            key={section}
            style={[styles.tab, activeSection === section && styles.tabActive]}
            onPress={() => {
              setActiveSection(section);
              if (section === 'blocked' && blockedUsers.length === 0) {
                loadBlockedUsers();
              }
            }}
          >
            <Text style={[styles.tabText, activeSection === section && styles.tabTextActive]}>
              {section === 'account' ? '👤 Account' : section === 'password' ? '🔐 Password' : section === 'blocked' ? '🚫 Blocked' : '⛔ Delete'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Account section */}
      {activeSection === 'account' && settings && (
        <AccountEditForm settings={settings} genders={genders} countries={countries} cities={cities} setCities={setCities} />
      )}

      {/* Password section */}
      {activeSection === 'password' && (
        <PasswordChangeForm />
      )}

      {/* Blocked users section */}
      {activeSection === 'blocked' && (
        <BlockedUsersList users={blockedUsers} onUnblock={() => loadBlockedUsers()} />
      )}

      {/* Delete account section */}
      {activeSection === 'delete' && (
        <DeleteAccountForm />
      )}

      {/* Logout */}
      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>🚪 Log Out</Text>
      </Pressable>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function AccountEditForm({ settings, genders, countries, cities, setCities }: any) {
  const [email, setEmail] = useState(settings.email);
  const [firstName, setFirstName] = useState(settings.first_name || '');
  const [lastName, setLastName] = useState(settings.last_name || '');
  const [birthDate, setBirthDate] = useState(settings.birth_date || '');
  const [genderId, setGenderId] = useState(String(settings.gender_id));
  const [countryId, setCountryId] = useState(String(settings.country_id));
  const [cityId, setCityId] = useState(String(settings.city_id));
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCountryChange = async (newCountryId: string) => {
    setCountryId(newCountryId);
    if (newCountryId) {
      try {
        const citiesData = await getCities(Number(newCountryId));
        setCities(citiesData);
        setCityId('');
      } catch (err) {
        Alert.alert('Error', 'Failed to load cities.');
      }
    }
  };

  const handleSave = async () => {
    if (!password) {
      Alert.alert('Error', 'Password is required to update account.');
      return;
    }
    setSaving(true);
    try {
      await updateAccountSettings({
        email,
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
        gender_id: Number(genderId),
        city_id: Number(cityId),
        current_password: password,
      });
      Alert.alert('Success', 'Account updated.');
      setPassword('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Information</Text>

      <Input label="Email" value={email} onChangeText={setEmail} />
      <Input label="First Name" value={firstName} onChangeText={setFirstName} />
      <Input label="Last Name" value={lastName} onChangeText={setLastName} />
      <Input label="Birth Date (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} />

      <Select label="Gender" value={genderId} options={genders} onChange={setGenderId} />
      <Select label="Country" value={countryId} options={countries} onChange={handleCountryChange} />
      {cities.length > 0 && <Select label="City" value={cityId} options={cities} onChange={setCityId} />}

      <Input label="Current Password" value={password} onChangeText={setPassword} secureTextEntry />

      <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
      </Pressable>
    </View>
  );
}

function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      await updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      Alert.alert('Success', 'Password changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Change Password</Text>

      <Input label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
      <Input label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
      <Input label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

      <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={handleChange} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Updating...' : 'Change Password'}</Text>
      </Pressable>
    </View>
  );
}

function BlockedUsersList({ users, onUnblock }: { users: any[]; onUnblock: () => void }) {
  const [unblocking, setUnblocking] = useState<number | null>(null);

  const handleUnblock = async (userId: number) => {
    Alert.alert(
      'Unblock User?',
      'They will be able to see your profile and contact you again.',
      [
        { text: 'Cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setUnblocking(userId);
            try {
              await unblockUser(userId);
              onUnblock();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to unblock user.');
            } finally {
              setUnblocking(null);
            }
          },
        },
      ]
    );
  };

  if (users.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocked Users</Text>
        <Text style={styles.emptyText}>You haven't blocked anyone yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Blocked Users</Text>
      {users.map(user => (
        <View key={user.userId} style={styles.blockedUserRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockedUserName}>{user.name}</Text>
            <Text style={styles.blockedUserMeta}>{user.city}, {user.country}</Text>
          </View>
          <Pressable
            style={[styles.smallButton, unblocking === user.userId && styles.buttonDisabled]}
            onPress={() => handleUnblock(user.userId)}
            disabled={unblocking === user.userId}
          >
            <Text style={styles.smallButtonText}>Unblock</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function DeleteAccountForm() {
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      Alert.alert('Error', 'Password is required.');
      return;
    }
    if (!confirm) {
      Alert.alert('Error', 'Please confirm account deletion.');
      return;
    }

    Alert.alert(
      'Delete Account?',
      'This cannot be undone. All your data will be permanently removed.',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount(password);
              Alert.alert('Success', 'Account deleted.', [{ text: 'OK', onPress: () => logout() }]);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to delete account.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Delete Account</Text>
      <Text style={styles.warningText}>⚠️ This action is permanent. All your data, photos, and matches will be deleted.</Text>

      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />

      <Pressable style={styles.checkboxRow} onPress={() => setConfirm(!confirm)}>
        <Text style={styles.checkbox}>{confirm ? '☑️' : '☐'}</Text>
        <Text style={styles.checkboxLabel}>I understand my account will be permanently deleted</Text>
      </Pressable>

      <Pressable style={[styles.deleteButton, (!confirm || deleting) && styles.buttonDisabled]} onPress={handleDelete} disabled={!confirm || deleting}>
        <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete Account'}</Text>
      </Pressable>
    </View>
  );
}

function Input({ label, value, onChangeText, secureTextEntry }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#555"
      />
    </View>
  );
}

function Select({ label, value, options, onChange }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.select}>
        <Text style={styles.selectText}>{options.find((o: any) => String(o.id) === value)?.name || 'Select...'}</Text>
        <View style={styles.selectDropdown}>
          {options.map((option: any) => (
            <Pressable
              key={option.id}
              style={[styles.selectOption, String(option.id) === value && styles.selectOptionSelected]}
              onPress={() => onChange(String(option.id))}
            >
              <Text style={String(option.id) === value ? styles.selectOptionTextSelected : styles.selectOptionText}>
                {option.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 18,
    gap: 12,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    marginBottom: 6,
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
    marginBottom: 12,
  },

  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a1f3a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3a67',
  },
  tabActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  tabText: {
    color: palette.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#fff',
  },

  section: {
    gap: 12,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 18,
    marginTop: 6,
  },

  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: '#0f1520',
    color: palette.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  select: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: '#0f1520',
    overflow: 'hidden',
  },
  selectText: {
    color: palette.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectDropdown: {
    borderTopWidth: 1,
    borderTopColor: '#1d2b54',
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1d2b54',
  },
  selectOptionSelected: {
    backgroundColor: '#1a1f3a',
  },
  selectOptionText: {
    color: palette.textMuted,
  },
  selectOptionTextSelected: {
    color: palette.accent,
    fontWeight: '600',
  },

  button: {
    borderRadius: 12,
    backgroundColor: palette.accent,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  deleteButton: {
    borderRadius: 12,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  smallButton: {
    borderRadius: 8,
    backgroundColor: palette.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  blockedUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: '#0f1520',
    padding: 12,
    gap: 12,
  },
  blockedUserName: {
    color: palette.text,
    fontWeight: '600',
    fontSize: 14,
  },
  blockedUserMeta: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    fontSize: 18,
  },
  checkboxLabel: {
    color: palette.text,
    fontSize: 14,
    flex: 1,
  },

  warningText: {
    color: '#fca5a5',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },

  emptyText: {
    color: palette.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },

  logoutButton: {
    borderRadius: 12,
    backgroundColor: '#3a1220',
    borderWidth: 1,
    borderColor: '#7f2534',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#fecdd3',
    fontWeight: '700',
    fontSize: 16,
  },
});
