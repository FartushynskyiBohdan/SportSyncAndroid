import { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { DiscoverScreen } from './tabs/DiscoverScreen';
import { MatchesScreen } from './tabs/MatchesScreen';
import { MessagesScreen } from './tabs/MessagesScreen';
import { ProfileScreen } from './tabs/ProfileScreen';
import { SettingsScreen } from './tabs/SettingsScreen';
import { AdminScreen } from './tabs/AdminScreen';
import { UserProfileScreen } from './UserProfileScreen';
import { DiscoverySettingsScreen } from './DiscoverySettingsScreen';
import { ProfileEditScreen } from './ProfileEditScreen';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/palette';

type TabKey = 'discover' | 'matches' | 'messages' | 'profile' | 'settings' | 'admin';

const TAB_ICONS: Record<TabKey, string> = {
  discover: '\u{1f9ed}',
  matches: '\u26a1',
  messages: '\u{1f4ac}',
  profile: '\u{1f464}',
  settings: '\u2699',
  admin: '\u{1f6e1}',
};

export function MainTabsScreen() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminOnlyScreen />;
  }

  return <UserTabsScreen />;
}

function UserTabsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('discover');
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const [showDiscoverySettings, setShowDiscoverySettings] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [messagesToMatchId, setMessagesToMatchId] = useState<number | null>(null);

  const tabs = useMemo(() => {
    return [
      { key: 'discover', label: 'Discover' },
      { key: 'matches', label: 'Matches' },
      { key: 'messages', label: 'Messages' },
      { key: 'profile', label: 'Profile' },
      { key: 'settings', label: 'Settings' },
    ] satisfies Array<{ key: TabKey; label: string }>;
  }, []);

  const content = useMemo(() => {
    if (viewingUserId !== null) {
      return (
        <UserProfileScreen
          userId={viewingUserId}
          onGoBack={() => setViewingUserId(null)}
          onOpenMessages={(matchId) => {
            setViewingUserId(null);
            setMessagesToMatchId(matchId);
            setActiveTab('messages');
          }}
        />
      );
    }

    if (showDiscoverySettings) {
      return <DiscoverySettingsScreen onGoBack={() => setShowDiscoverySettings(false)} />;
    }

    if (showProfileEditor) {
      return <ProfileEditScreen onGoBack={() => setShowProfileEditor(false)} />;
    }

    if (activeTab === 'discover') {
      return (
        <DiscoverScreen
          onViewUser={setViewingUserId}
          onOpenDiscoverySettings={() => setShowDiscoverySettings(true)}
        />
      );
    }

    if (activeTab === 'matches') {
      return (
        <MatchesScreen
          onOpenMessages={(matchId) => {
            setMessagesToMatchId(matchId);
            setActiveTab('messages');
          }}
          onViewUser={setViewingUserId}
        />
      );
    }

    if (activeTab === 'messages') {
      return <MessagesScreen initialMatchId={messagesToMatchId ?? undefined} />;
    }

    if (activeTab === 'profile') {
      return (
        <ProfileScreen
          onEditProfile={() => setShowProfileEditor(true)}
          onOpenSettings={() => setActiveTab('settings')}
        />
      );
    }

    if (activeTab === 'settings') {
      return <SettingsScreen />;
    }

    if (activeTab === 'admin') {
      return <AdminScreen />;
    }

    return null;
  }, [activeTab, messagesToMatchId, showDiscoverySettings, showProfileEditor, viewingUserId]);

  function openTab(tabKey: TabKey) {
    setShowDiscoverySettings(false);
    setShowProfileEditor(false);
    setViewingUserId(null);
    setMessagesToMatchId(null);
    setActiveTab(tabKey);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>{content}</View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              style={styles.tabButton}
              onPress={() => openTab(tab.key)}
              android_ripple={{ color: '#ffffff18', borderless: true }}
            >
              {active && <View style={styles.activePill} />}
              <Text style={styles.tabEmoji}>{TAB_ICONS[tab.key]}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function AdminOnlyScreen() {
  const { logout } = useAuth();

  function confirmLogout() {
    Alert.alert('Log out?', 'You can sign back in to the admin dashboard at any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.adminHeader}>
        <View>
          <Text style={styles.adminEyebrow}>ADMIN MODE</Text>
          <Text style={styles.adminTitle}>Dashboard only</Text>
        </View>
        <Pressable style={styles.adminLogoutButton} onPress={confirmLogout}>
          <Text style={styles.adminLogoutText}>Log Out</Text>
        </Pressable>
      </View>
      <View style={styles.content}>
        <AdminScreen />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
  },
  adminHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#1d2a52',
    backgroundColor: '#080d22',
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  adminEyebrow: {
    color: palette.accentSoft,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
  adminTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  adminLogoutButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#7f2534',
    backgroundColor: '#3a1220',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  adminLogoutText: {
    color: '#fecdd3',
    fontSize: 12,
    fontWeight: '900',
  },
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: '#1d2a52',
    backgroundColor: '#080d22',
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
    gap: 3,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    borderRadius: 3,
    backgroundColor: palette.accent,
  },
  tabEmoji: {
    fontSize: 21,
    lineHeight: 25,
  },
  tabLabel: {
    color: '#566090',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: '#c4d0ff',
    fontWeight: '700',
  },
});
