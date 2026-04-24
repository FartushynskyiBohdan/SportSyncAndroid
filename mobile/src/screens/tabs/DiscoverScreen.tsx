import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getDiscover, likeUser, passUser } from '../../api/appApi';
import { RemoteImage } from '../../components/RemoteImage';
import { DiscoverProfile } from '../../types/app';
import { palette } from '../../theme/palette';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.35;
const SWIPE_OUT_DURATION = 250;

export function DiscoverScreen({
  onViewUser,
  onOpenDiscoverySettings,
}: {
  onViewUser?: (userId: number) => void;
  onOpenDiscoverySettings?: () => void;
}) {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [matchProfile, setMatchProfile] = useState<DiscoverProfile | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const position = useRef(new Animated.ValueXY()).current;
  const swipeDir = useRef<'left' | 'right' | null>(null);

  const likeOpacity  = position.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD / 2], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity  = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD / 2, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const cardRotate   = position.x.interpolate({ inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2], outputRange: ['-8deg', '0deg', '8deg'] });
  const cardAnimStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate: cardRotate },
    ],
  };

  const current = profiles[0] ?? null;
  const currentRef = useRef<DiscoverProfile | null>(null);
  currentRef.current = current;

  const busyRef = useRef(false);
  busyRef.current = busy;

  // Keep mutable refs so the PanResponder (created once) always calls
  // the latest versions of these functions and sees the current state.
  const onLikeRef = useRef<() => void>(() => {});
  const onPassRef = useRef<() => void>(() => {});
  const resetPositionRef = useRef<() => void>(() => {});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        swipeDir.current = gesture.dx > 0 ? 'right' : 'left';
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeOutRightRef.current();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeOutLeftRef.current();
        } else {
          resetPositionRef.current();
          swipeDir.current = null;
        }
      },
    })
  ).current;

  const swipeOutRightRef = useRef<() => void>(() => {});
  const swipeOutLeftRef  = useRef<() => void>(() => {});

  function resetPosition() {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
  }

  function swipeOutRight() {
    Animated.timing(position, {
      toValue: { x: SCREEN_W * 1.5, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => { onLikeRef.current(); });
  }

  function swipeOutLeft() {
    Animated.timing(position, {
      toValue: { x: -SCREEN_W * 1.5, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => { onPassRef.current(); });
  }

  // Sync refs every render so stale closures inside PanResponder always call fresh code
  onLikeRef.current        = onLike;
  onPassRef.current        = onPass;
  swipeOutRightRef.current = swipeOutRight;
  swipeOutLeftRef.current  = swipeOutLeft;
  resetPositionRef.current = resetPosition;

  function advanceCard(profile: DiscoverProfile, matched: boolean) {
    position.setValue({ x: 0, y: 0 });
    swipeDir.current = null;
    setPhotoIndex(0);  // Reset photo index for next card
    if (matched) setMatchProfile(profile);
    setProfiles((prev) => prev.slice(1));
    setBusy(false);
  }

  async function onLike() {
    const profile = currentRef.current;
    if (!profile || busyRef.current) return;
    setBusy(true);
    try {
      const result = await likeUser(profile.id);
      advanceCard(profile, result.matched);
    } catch {
      resetPosition();
      setBusy(false);
    }
  }

  async function onPass() {
    const profile = currentRef.current;
    if (!profile || busyRef.current) return;
    setBusy(true);
    try {
      await passUser(profile.id);
      advanceCard(profile, false);
    } catch {
      resetPosition();
      setBusy(false);
    }
  }

  async function loadDiscover() {
    setLoading(true);
    setError('');
    position.setValue({ x: 0, y: 0 });
    try {
      const data = await getDiscover();
      setProfiles(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load discover profiles.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDiscover(); }, []);

  const photoUrl = current?.photos && current.photos.length > photoIndex
    ? current.photos[photoIndex]
    : current?.photos?.[0]
    ? current.photos[0]
    : current?.image
    ? current.image
    : '';

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingEmoji}>🧭</Text>
        <Text style={styles.loadingText}>Finding athletes near you…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>SportSync</Text>
          <Text style={styles.headerSub}>Discover</Text>
        </View>
        {onOpenDiscoverySettings ? (
          <Pressable style={styles.headerSettingsButton} onPress={onOpenDiscoverySettings}>
            <Text style={styles.headerSettingsButtonText}>Filters</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Card area */}
      <View style={styles.cardArea}>
        {/* Next card peeking behind */}
        {profiles[1] ? (
          <View style={[styles.card, styles.cardBehind]}>
            <View style={styles.photoFallback} />
          </View>
        ) : null}

        {!current ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>😴</Text>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyCopy}>No more profiles right now. Check back later!</Text>
            <Pressable onPress={loadDiscover} style={styles.reloadBtn}>
              <Text style={styles.reloadBtnText}>Reload</Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View style={[styles.card, cardAnimStyle]} {...panResponder.panHandlers}>
            {/* LIKE stamp */}
            <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
              <Text style={styles.stampTextLike}>LIKE 💚</Text>
            </Animated.View>
            {/* NOPE stamp */}
            <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
              <Text style={styles.stampTextNope}>NOPE ✕</Text>
            </Animated.View>

            <RemoteImage
              uri={photoUrl}
              style={styles.photo}
              fallbackStyle={styles.photoFallback}
              fallbackLabel={current.name}
            />

            {/* Photo carousel dots */}
            {current.photos && current.photos.length > 1 && (
              <View style={styles.photoDotsRow}>
                {current.photos.map((_, i) => (
                  <View key={i} style={[styles.photoDot, i === photoIndex && styles.photoDotActive]} />
                ))}
              </View>
            )}

            {/* Photo navigation arrows */}
            {current.photos && current.photos.length > 1 && (
              <>
                <Pressable
                  style={[styles.photoArrow, styles.photoArrowLeft]}
                  onPress={() => setPhotoIndex(i => (i - 1 + current.photos!.length) % current.photos!.length)}
                >
                  <Text style={styles.photoArrowText}>‹</Text>
                </Pressable>
                <Pressable
                  style={[styles.photoArrow, styles.photoArrowRight]}
                  onPress={() => setPhotoIndex(i => (i + 1) % current.photos!.length)}
                >
                  <Text style={styles.photoArrowText}>›</Text>
                </Pressable>
              </>
            )}

            {/* View full profile button */}
            {onViewUser && (
              <Pressable
                style={styles.viewProfileButton}
                onPress={() => onViewUser(current.id)}
              >
                <Text style={styles.viewProfileButtonText}>👁‍🗨</Text>
              </Pressable>
            )}

            {/* Info overlay at bottom of photo */}
            <View style={styles.photoOverlay}>
              <Text style={styles.overlayName}>{current.name}, {current.age}</Text>
              <Text style={styles.overlayMeta}>{current.distance}{current.frequency ? ` · ${current.frequency}` : ''}</Text>
              {current.goal ? <Text style={styles.overlayGoal}>{current.goal}</Text> : null}
            </View>

            {/* Sports chips */}
            <View style={styles.sportsRow}>
              {current.sports.slice(0, 4).map((sport) => (
                <View key={`${current.id}-${sport.name}`} style={styles.sportPill}>
                  <Text style={styles.sportText}>{sport.icon} {sport.name}</Text>
                </View>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.actions}>
              <Pressable style={styles.passBtn} onPress={() => swipeOutLeft()} disabled={busy}>
                <Text style={styles.passBtnText}>✕  Pass</Text>
              </Pressable>
              <Pressable style={styles.likeBtn} onPress={() => swipeOutRight()} disabled={busy}>
                <Text style={styles.likeBtnText}>♥  Like</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Match modal */}
      <Modal transparent animationType="fade" visible={!!matchProfile} onRequestClose={() => setMatchProfile(null)}>
        <View style={styles.matchOverlay}>
          <View style={styles.matchCard}>
            <Text style={styles.matchEmoji}>🎉</Text>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSub}>You and {matchProfile?.name} liked each other.</Text>
            <Pressable style={styles.matchBtn} onPress={() => setMatchProfile(null)}>
              <Text style={styles.matchBtnText}>Keep Swiping</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CARD_H = SCREEN_H * 0.62;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingEmoji: { fontSize: 48 },
  loadingText: { color: palette.textMuted, fontSize: 15 },

  header: {
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  headerTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  headerSettingsButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: '#111a3a',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerSettingsButtonText: {
    color: '#dbe6ff',
    fontWeight: '700',
    fontSize: 12,
  },

  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#3a0e0e',
    borderRadius: 10,
    padding: 10,
  },
  errorText: { color: palette.danger, fontSize: 13 },

  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    position: 'absolute',
    width: SCREEN_W - 28,
    height: CARD_H,
    borderRadius: 24,
    backgroundColor: palette.panel,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  cardBehind: {
    transform: [{ scale: 0.95 }],
    top: 12,
    opacity: 0.7,
  },

  stamp: {
    position: 'absolute',
    top: 36,
    zIndex: 10,
    borderWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stampLike: {
    left: 22,
    borderColor: '#22c55e',
    transform: [{ rotate: '-12deg' }],
  },
  stampNope: {
    right: 22,
    borderColor: '#ef4444',
    transform: [{ rotate: '12deg' }],
  },
  stampTextLike: {
    color: '#22c55e',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 2,
  },
  stampTextNope: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 2,
  },

  photo: {
    width: '100%',
    height: '72%',
    resizeMode: 'cover',
  },
  photoFallback: {
    width: '100%',
    height: '72%',
    backgroundColor: '#14213d',
  },
  photoDotsRow: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  photoDotActive: {
    backgroundColor: '#fff',
    width: 16,
  },
  photoArrow: {
    position: 'absolute',
    top: '36%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  photoArrowLeft: {
    left: 12,
  },
  photoArrowRight: {
    right: 12,
  },
  photoArrowText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: '27%',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  overlayName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textShadowColor: '#000a',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  overlayMeta: {
    color: '#ffffffcc',
    fontSize: 13,
    marginTop: 2,
    textShadowColor: '#000a',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  overlayGoal: {
    color: '#c7d2fe',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '700',
  },

  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  sportPill: {
    borderRadius: 999,
    backgroundColor: '#15254c',
    borderWidth: 1,
    borderColor: '#31457b',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  sportText: {
    color: '#d3e0ff',
    fontSize: 12,
    fontWeight: '700',
  },

  viewProfileButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1040',
    borderWidth: 1,
    borderColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  viewProfileButtonText: {
    fontSize: 22,
  },

  actions: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 6,
    gap: 10,
  },
  passBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#1f1326',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  passBtnText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 15,
  },
  likeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#0f2a1e',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    alignItems: 'center',
  },
  likeBtnText: {
    color: '#22c55e',
    fontWeight: '800',
    fontSize: 15,
  },

  emptyCard: {
    width: SCREEN_W - 28,
    borderRadius: 24,
    backgroundColor: palette.panel,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a3a67',
  },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { color: palette.text, fontSize: 22, fontWeight: '800' },
  emptyCopy:  { color: palette.textMuted, fontSize: 14, textAlign: 'center' },
  reloadBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: palette.accent,
  },
  reloadBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  matchOverlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchCard: {
    width: SCREEN_W - 60,
    backgroundColor: '#0e1633',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  matchEmoji: { fontSize: 60 },
  matchTitle: { color: palette.text, fontSize: 30, fontWeight: '900' },
  matchSub:   { color: palette.textMuted, fontSize: 15, textAlign: 'center' },
  matchBtn: {
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: palette.accent,
  },
  matchBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
