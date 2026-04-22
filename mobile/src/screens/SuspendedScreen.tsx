import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/palette';

function formatUntil(until: string | null) {
  if (!until) {
    return 'until further notice';
  }

  const date = new Date(until);
  if (Number.isNaN(date.getTime())) {
    return 'until further notice';
  }

  return date.toLocaleString();
}

export function SuspendedScreen() {
  const { suspendedNotice, clearSuspension } = useAuth();

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.badge}>ACCOUNT SUSPENDED</Text>
        <Text style={styles.title}>You are authenticated, but currently blocked from app access.</Text>
        <Text style={styles.body}>Reason: {suspendedNotice?.reason || 'A moderation action is in effect.'}</Text>
        <Text style={styles.body}>Access returns: {formatUntil(suspendedNotice?.until || null)}</Text>

        <Pressable style={styles.button} onPress={clearSuspension}>
          <Text style={styles.buttonText}>Back to login</Text>
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
    borderColor: '#614f2a',
    backgroundColor: '#1a1426',
    padding: 24,
    gap: 14,
  },
  badge: {
    color: '#f8c471',
    fontSize: 12,
    letterSpacing: 2,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  body: {
    color: '#dbcdb1',
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#aa8a50',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffe4ad',
    fontWeight: '700',
  },
});
