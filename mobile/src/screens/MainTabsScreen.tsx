import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
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

// Unicode symbols that render on both iOS and Android without any icon library
const TAB_ICONS: Record<TabKey, { inactive: string; active: string }> = {
  discover:  { inactive: '🧭', active: '🧭' },
  matches:   { inactive: '⚡', active: '⚡' },
  messages:  { inactive: '💬', active: '💬' },
  profile:   { inactive: '👤', active: '👤' },
  settings:  { inactive: '⚙️', active: '⚙️' },
  admin:     { inactive: '🛡️', active: '🛡️' },
};

export function MainTabsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('discover');
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const [showDiscoverySettings, setShowDiscoverySettings] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [messagesToMatchId, setMessagesToMatchId] = useState<number | null>(null);

  const tabs = useMemo(() => {
    const base: Array<{ key: TabKey; label: string }> = [
      { key: 'discover', label: 'Discover' },
      { key: 'matches',  label: 'Matches'  },
      { key: 'messages', label: 'Messages' },
      { key: 'profile',  label: 'Profile'  },
      { key: 'settings', label: 'Settings' },
    ];
    if (user?.role === 'admin') base.push({ key: 'admin', label: 'Admin' });
    return base;
  }, [user?.role]);

  const content = useMemo(() => {
    // If viewing a user profile, show that instead
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
    if (activeTab === 'matches')  return <MatchesScreen onOpenMessages={(matchId) => { setMessagesToMatchId(matchId); setActiveTab('messages'); }} onViewUser={setViewingUserId} />;
    if (activeTab === 'messages') return <MessagesScreen initialMatchId={messagesToMatchId ?? undefined} />;
    if (activeTab === 'profile') {
      return <ProfileScreen onEditProfile={() => setShowProfileEditor(true)} />;
    }
    if (activeTab === 'admin')    return <AdminScreen />;
    return <SettingsScreen />;
  }, [activeTab, showDiscoverySettings, showProfileEditor, viewingUserId]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>{content}</View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          const icons = TAB_ICONS[tab.key];
          return (
            <Pressable
              key={tab.key}
              style={styles.tabButton}
              onPress={() => {
                setShowDiscoverySettings(false);
                setShowProfileEditor(false);
                setViewingUserId(null);
                // Clear deep-link when tapping a tab directly
                setMessagesToMatchId(null);
                setActiveTab(tab.key);
              }}
              android_ripple={{ color: '#ffffff18', borderless: true }}
            >
              {active && <View style={styles.activePill} />}
              <Text style={styles.tabEmoji}>{active ? icons.active : icons.inactive}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
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
    fontSize: 22,
    lineHeight: 26,
  },
  tabLabel: {
    color: '#566090',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#c4d0ff',
    fontWeight: '700',
  },
});
