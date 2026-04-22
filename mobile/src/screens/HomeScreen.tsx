import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/palette';

export function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.badge}>SPORTSYNC MOBILE</Text>
        <Text style={styles.title}>Signed in as</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.copy}>Foundation slice is ready. Next screens to port: Discover, Matches, Messages.</Text>
        <Pressable style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#29365d',
    backgroundColor: palette.panel,
    padding: 24,
    gap: 10,
  },
  badge: {
    color: palette.accentSoft,
    fontSize: 12,
    letterSpacing: 3,
  },
  title: {
    color: palette.textMuted,
    fontSize: 14,
  },
  email: {
    color: palette.text,
    fontSize: 27,
    fontWeight: '800',
  },
  copy: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 10,
  },
  button: {
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#060912',
    fontWeight: '700',
  },
});
