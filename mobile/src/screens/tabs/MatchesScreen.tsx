import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getMatches } from '../../api/appApi';
import { buildMediaUrl } from '../../api/client';
import { MatchItem } from '../../types/app';
import { palette } from '../../theme/palette';

export function MatchesScreen({ onOpenMessages, onViewUser }: { onOpenMessages?: (matchId: number) => void; onViewUser?: (userId: number) => void }) {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getMatches();
        setMatches(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load matches.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.countBadge}>{matches.length}</Text>
      </View>
      <Text style={styles.subtitle}>Athletes who matched your energy ⚡</Text>

      {error ? (
        <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>
      ) : null}

      {matches.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>⚡</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyCopy}>Like more athletes in Discover to unlock conversations.</Text>
        </View>
      ) : (
        matches.map((m) => (
          <Pressable
            key={m.matchId}
            style={styles.card}
            onPress={() => onViewUser?.(m.userId)}
            android_ripple={{ color: '#ffffff10', borderless: false }}
          >
            <View style={styles.avatarWrap}>
              {m.image ? (
                <Image source={{ uri: buildMediaUrl(m.image) }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{m.name?.[0] ?? '?'}</Text>
                </View>
              )}
              {m.isOnline && <View style={styles.onlineDot} />}
            </View>

            <View style={styles.main}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{m.name}, {m.age}</Text>
              </View>
              <Text style={styles.meta}>{m.city}</Text>
              {m.sport ? (
                <View style={styles.sportPill}>
                  <Text style={styles.sportText}>{m.sport.icon} {m.sport.name}</Text>
                </View>
              ) : null}
              {(m.sharedSports ?? 0) > 0 ? (
                <Text style={styles.shared}>+{m.sharedSports} shared sport{m.sharedSports !== 1 ? 's' : ''}</Text>
              ) : null}
            </View>

            <Pressable
              style={styles.chatBtn}
              onPress={() => {
                onOpenMessages?.(m.matchId);
              }}
              android_ripple={{ color: '#ffffff22', borderless: true }}
            >
              <Text style={styles.chatIcon}>💬</Text>
            </Pressable>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 18,
    gap: 12,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: palette.accent,
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    marginBottom: 6,
  },
  errorBanner: {
    backgroundColor: '#3a0e0e',
    borderRadius: 10,
    padding: 10,
  },
  errorText: { color: palette.danger, fontSize: 13 },
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222f5a',
    backgroundColor: palette.panel,
    padding: 14,
    gap: 14,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#1a2d55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: palette.textMuted,
    fontSize: 22,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: palette.panel,
  },
  main: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 17,
  },
  meta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  sportPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#15254c',
    borderWidth: 1,
    borderColor: '#31457b',
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 3,
  },
  sportText: {
    color: '#d3e0ff',
    fontSize: 11,
    fontWeight: '700',
  },
  shared: {
    color: '#8b5cf6',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  chatBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#13204a',
    borderWidth: 1,
    borderColor: '#2a3f7a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIcon: {
    fontSize: 20,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: palette.panel,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 20,
  },
  emptyCopy: {
    color: palette.textMuted,
    textAlign: 'center',
  },
});
