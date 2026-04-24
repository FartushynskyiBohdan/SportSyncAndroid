import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { getUserProfile, blockUser, unblockUser, getComplaintTypes, reportUser } from '../api/appApi';
import { RemoteImage } from '../components/RemoteImage';
import { ComplaintType, UserProfile } from '../types/app';
import { palette } from '../theme/palette';

const SCREEN_W = Dimensions.get('window').width;

interface UserProfileScreenProps {
  userId: number;
  onGoBack: () => void;
  onOpenMessages?: (matchId: number) => void;
}

export function UserProfileScreen({ userId, onGoBack, onOpenMessages }: UserProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [blocking, setBlocking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTypes, setReportTypes] = useState<ComplaintType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getUserProfile(userId);
        setProfile(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (!reportOpen || reportTypes.length > 0) return;

    (async () => {
      setReportLoading(true);
      try {
        const types = await getComplaintTypes();
        setReportTypes(types);
      } catch {
        Alert.alert('Error', 'Failed to load report reasons.');
      } finally {
        setReportLoading(false);
      }
    })();
  }, [reportOpen, reportTypes.length]);

  const handleBlock = async () => {
    if (!profile) return;
    const action = profile.relation.blockedByMe ? 'unblock' : 'block';
    Alert.alert(
      action === 'block' ? 'Block User?' : 'Unblock User?',
      action === 'block'
        ? `${profile.name} won't be able to see your profile or contact you.`
        : `${profile.name} will be able to see your profile and contact you again.`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: action === 'block' ? 'Block' : 'Unblock',
          onPress: async () => {
            setBlocking(true);
            try {
              if (action === 'block') {
                await blockUser(userId);
              } else {
                await unblockUser(userId);
              }
              setProfile(p =>
                p ? { ...p, relation: { ...p.relation, blockedByMe: !p.relation.blockedByMe } } : null
              );
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || `Failed to ${action} user.`);
            } finally {
              setBlocking(false);
            }
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    if (profile?.relation.matched && profile.relation.matchId) {
      onOpenMessages?.(profile.relation.matchId);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedTypeId) {
      Alert.alert('Validation', 'Please select a report reason.');
      return;
    }

    setReportSubmitting(true);
    try {
      await reportUser(userId, selectedTypeId, reportDescription);
      setReportOpen(false);
      setSelectedTypeId(null);
      setReportDescription('');
      Alert.alert('Submitted', 'Thanks for helping keep SportSync safe.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to submit report.');
    } finally {
      setReportSubmitting(false);
    }
  };

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
        <Text style={styles.error}>{error || 'Profile not found.'}</Text>
        <Pressable style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const photos = profile.photos ?? [];
  const currentPhoto = photos[photoIndex];

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onGoBack}>
          <Text style={styles.backIcon}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Hero photo ── */}
      <View style={styles.heroWrap}>
        <RemoteImage
          uri={currentPhoto}
          style={styles.heroPhoto}
          fallbackStyle={styles.heroFallback}
          fallbackLabel={profile.name}
        />

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
          <Text style={styles.heroName}>
            {profile.name}, {profile.age}
          </Text>
          <Text style={styles.heroMeta}>
            {profile.city}
            {profile.country ? `, ${profile.country}` : ''}
          </Text>
        </View>
      </View>

      {/* ── Goal + bio ── */}
      <View style={styles.panel}>
        {profile.goal ? (
          <View style={styles.goalPill}>
            <Text style={styles.goalText}>🎯 {profile.goal}</Text>
          </View>
        ) : null}
        <Text style={styles.bio}>{profile.bio || 'No bio yet.'}</Text>
      </View>

      {/* ── Sports ── */}
      {profile.sports.length > 0 && (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Sports & Training</Text>
          {profile.sports.map((sport) => (
            <View key={`${profile.id}-${sport.name}`} style={styles.sportCard}>
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
          ))}
        </View>
      )}

      {/* ── Compatibility ── */}
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Compatibility</Text>
        <CompatRow label="Shared Sports" metric={profile.compatibility.sharedSports} />
        <CompatRow label="Training Frequency" metric={profile.compatibility.trainingFrequency} />
        <CompatRow label="Goal Alignment" metric={profile.compatibility.goalAlignment} />
      </View>

      {/* ── Actions ── */}
      <View style={styles.actionsPanel}>
        {profile.relation.matched && profile.relation.matchId ? (
          <Pressable style={styles.messageButton} onPress={handleMessage}>
            <Text style={styles.messageButtonText}>💬 Message</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[styles.blockButton, blocking && styles.blockButtonDisabled]}
          onPress={handleBlock}
          disabled={blocking}
        >
          <Text style={styles.blockButtonText}>
            {profile.relation.blockedByMe ? '🔓 Unblock' : '🚫 Block'}
          </Text>
        </Pressable>

        <Pressable style={styles.reportButton} onPress={() => setReportOpen(true)}>
          <Text style={styles.reportButtonText}>⚠️ Report</Text>
        </Pressable>
      </View>

      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report {profile.name}</Text>
            <Text style={styles.modalSubtitle}>Choose a reason and add details if needed.</Text>

            {reportLoading ? (
              <ActivityIndicator color={palette.accent} style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.modalOptionsWrap}>
                {reportTypes.map((type) => {
                  const selected = selectedTypeId === type.id;
                  return (
                    <Pressable
                      key={type.id}
                      style={[styles.modalOption, selected && styles.modalOptionSelected]}
                      onPress={() => setSelectedTypeId(type.id)}
                    >
                      <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                        {type.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <TextInput
              style={styles.modalInput}
              multiline
              maxLength={500}
              placeholder="Optional details"
              placeholderTextColor="#7b86a8"
              value={reportDescription}
              onChangeText={setReportDescription}
            />
            <Text style={styles.modalCount}>{reportDescription.length}/500</Text>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setReportOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, reportSubmitting && styles.blockButtonDisabled]}
                onPress={handleSubmitReport}
                disabled={reportSubmitting}
              >
                <Text style={styles.modalSubmitText}>{reportSubmitting ? 'Submitting...' : 'Submit'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function CompatRow({ label, metric }: { label: string; metric: { pct: number; detail: string } }) {
  const percentage = Math.round(metric.pct);
  return (
    <View style={styles.compatRow}>
      <View>
        <Text style={styles.compatLabel}>{label}</Text>
        <Text style={styles.compatDetail}>{metric.detail}</Text>
      </View>
      <View style={styles.compatBar}>
        <View
          style={[
            styles.compatBarFill,
            { width: `${percentage}%` },
            percentage > 70 ? styles.compatBarGood : percentage > 40 ? styles.compatBarOk : styles.compatBarLow,
          ]}
        />
      </View>
      <Text style={styles.compatPercent}>{percentage}%</Text>
    </View>
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
    gap: 16,
  },
  error: {
    color: palette.danger,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 18,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: palette.accent,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // ── header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: palette.background,
  },
  backIcon: {
    color: palette.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  headerTitle: {
    color: palette.text,
    fontWeight: '700',
    fontSize: 16,
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

  // ── sports ──
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

  // ── compatibility ──
  compatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1d2b54',
    paddingTop: 10,
  },
  compatLabel: {
    color: palette.text,
    fontWeight: '600',
    fontSize: 13,
  },
  compatDetail: {
    color: palette.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  compatBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0f1a3a',
    overflow: 'hidden',
  },
  compatBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  compatBarGood: {
    backgroundColor: '#10b981',
  },
  compatBarOk: {
    backgroundColor: '#f59e0b',
  },
  compatBarLow: {
    backgroundColor: '#ef4444',
  },
  compatPercent: {
    color: palette.accentSoft,
    fontWeight: '700',
    fontSize: 12,
    minWidth: 35,
    textAlign: 'right',
  },

  // ── actions ──
  actionsPanel: {
    marginHorizontal: 18,
    gap: 10,
  },
  messageButton: {
    borderRadius: 20,
    backgroundColor: palette.accent,
    paddingVertical: 16,
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  blockButton: {
    borderRadius: 20,
    backgroundColor: '#2a3a67',
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  blockButtonDisabled: {
    opacity: 0.5,
  },
  blockButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  reportButton: {
    borderRadius: 20,
    backgroundColor: '#2a1a1f',
    borderWidth: 1,
    borderColor: '#9d4458',
    paddingVertical: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#ffb7c4',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,5,16,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2d3f74',
    backgroundColor: '#0f1735',
    padding: 14,
    gap: 10,
  },
  modalTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: palette.textMuted,
    fontSize: 12,
  },
  modalOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalOption: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3f5291',
    backgroundColor: '#152450',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  modalOptionSelected: {
    backgroundColor: '#2f1e6b',
    borderColor: palette.accent,
  },
  modalOptionText: {
    color: '#ced9ff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOptionTextSelected: {
    color: '#fff',
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#324681',
    backgroundColor: '#111b3d',
    color: palette.text,
    minHeight: 90,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  modalCount: {
    color: palette.textMuted,
    fontSize: 11,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#42558f',
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#152450',
  },
  modalCancelText: {
    color: '#c9d6ff',
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: palette.accent,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '800',
  },
});
