import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getMyProfile } from '../../api/appApi';
import { buildMediaUrl } from '../../api/client';
import { MyProfile } from '../../types/app';
import { palette } from '../../theme/palette';

const SCREEN_W = Dimensions.get('window').width;

export function ProfileScreen({ onEditProfile }: { onEditProfile?: () => void }) {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getMyProfile();
        setProfile(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load profile.');
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

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'No profile found.'}</Text>
      </View>
    );
  }

  const photos = profile.photos ?? [];
  const currentPhoto = photos[photoIndex];

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      {/* ── Hero photo ── */}
      <View style={styles.heroWrap}>
        {currentPhoto ? (
          <Image source={{ uri: buildMediaUrl(currentPhoto) }} style={styles.heroPhoto} />
        ) : (
          <View style={[styles.heroPhoto, styles.heroFallback]}>
            <Text style={styles.heroFallbackText}>{profile.name?.[0] ?? '?'}</Text>
          </View>
        )}

        {/* Tap zones for cycling photos */}
        {photos.length > 1 && (
          <>
            <Pressable
              style={[styles.photoZone, styles.photoZoneLeft]}
              onPress={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
            />
            <Pressable
              style={[styles.photoZone, styles.photoZoneRight]}
              onPress={() => setPhotoIndex((i) => (i + 1) % photos.length)}
            />
          </>
        )}

        {/* Photo dots */}
        {photos.length > 1 && (
          <View style={styles.dotsRow}>
            {photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
            ))}
          </View>
        )}

        {/* Name overlay */}
        <View style={styles.heroOverlay}>
          <Text style={styles.heroName}>{profile.name}, {profile.age}</Text>
          <Text style={styles.heroMeta}>{profile.city}{profile.country ? `, ${profile.country}` : ''}</Text>
        </View>
      </View>

      {/* ── Goal + bio ── */}
      <View style={styles.panel}>
        {onEditProfile ? (
          <Pressable style={styles.editButton} onPress={onEditProfile}>
            <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
          </Pressable>
        ) : null}
        {profile.goal ? (
          <View style={styles.goalPill}>
            <Text style={styles.goalText}>🎯 {profile.goal}</Text>
          </View>
        ) : null}
        <Text style={styles.bio}>{profile.bio || 'No bio yet.'}</Text>
      </View>

      {/* ── Sports ── */}
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Sports</Text>
        {profile.sports.length === 0 ? (
          <Text style={styles.meta}>No sports added yet.</Text>
        ) : (
          profile.sports.map((sport) => (
            <View key={sport.name} style={styles.sportCard}>
              <View style={styles.sportCardLeft}>
                <Text style={styles.sportEmoji}>{sport.icon}</Text>
                <View>
                  <Text style={styles.sportName}>{sport.name}</Text>
                  <Text style={styles.sportMeta}>{sport.level}</Text>
                </View>
              </View>
              <View style={styles.sportFreqPill}>
                <Text style={styles.sportFreqText}>{sport.frequency}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: palette.danger,
    fontSize: 13,
    paddingHorizontal: 18,
  },

  // ── hero ──
  heroWrap: {
    position: 'relative',
    width: SCREEN_W,
    height: SCREEN_W * 1.15,
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroFallback: {
    backgroundColor: '#142347',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallbackText: {
    color: palette.textMuted,
    fontSize: 64,
    fontWeight: '800',
  },
  photoZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
  },
  photoZoneLeft: { left: 0 },
  photoZoneRight: { right: 0 },
  dotsRow: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 14,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingTop: 40,
    backgroundColor: 'rgba(7,11,31,0.72)',
  },
  heroName: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '900',
  },
  heroMeta: {
    color: '#b0bce8',
    fontSize: 14,
    marginTop: 2,
  },

  // ── panels ──
  panel: {
    marginHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: palette.panel,
    padding: 16,
    gap: 10,
  },
  editButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#15254c',
    borderWidth: 1,
    borderColor: '#2f4a88',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#d9e5ff',
    fontSize: 12,
    fontWeight: '700',
  },
  goalPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1a1040',
    borderWidth: 1,
    borderColor: palette.accent,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  goalText: {
    color: palette.accentSoft,
    fontWeight: '700',
    fontSize: 13,
  },
  bio: {
    color: palette.text,
    lineHeight: 22,
    fontSize: 14,
  },
  sectionTitle: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 4,
  },
  meta: {
    color: palette.textMuted,
    fontSize: 13,
  },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1d2b54',
    paddingTop: 10,
  },
  sportCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sportEmoji: {
    fontSize: 26,
  },
  sportName: {
    color: palette.text,
    fontWeight: '700',
    fontSize: 15,
  },
  sportMeta: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sportFreqPill: {
    borderRadius: 999,
    backgroundColor: '#15254c',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sportFreqText: {
    color: palette.accentSoft,
    fontSize: 11,
    fontWeight: '600',
  },
});
