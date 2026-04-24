import { useEffect, useMemo, useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import {
  deleteProfilePhoto,
  getFrequencies,
  getGoals,
  getProfileEditData,
  getSkillLevels,
  getSportsCatalog,
  reorderProfilePhotos,
  saveOnboardingBio,
  saveOnboardingSports,
  updateProfileGoal,
  uploadProfilePhotos,
} from '../api/appApi';
import { RemoteImage } from '../components/RemoteImage';
import { OnboardingSportInput, OptionItem, ProfileEditPhoto } from '../types/app';
import { palette } from '../theme/palette';

interface ProfileEditScreenProps {
  onGoBack: () => void;
}

export function ProfileEditScreen({ onGoBack }: ProfileEditScreenProps) {
  const [loading, setLoading] = useState(true);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingSports, setSavingSports] = useState(false);

  const [bio, setBio] = useState('');
  const [goalId, setGoalId] = useState<number | null>(null);
  const [photos, setPhotos] = useState<ProfileEditPhoto[]>([]);
  const [sportsRows, setSportsRows] = useState<OnboardingSportInput[]>([]);

  const [goals, setGoals] = useState<OptionItem[]>([]);
  const [sportsCatalog, setSportsCatalog] = useState<OptionItem[]>([]);
  const [skillLevels, setSkillLevels] = useState<OptionItem[]>([]);
  const [frequencies, setFrequencies] = useState<OptionItem[]>([]);

  const sortedPhotos = useMemo(
    () => [...photos].sort((a, b) => a.display_order - b.display_order),
    [photos]
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [editData, goalsData, sportsData, skillsData, frequenciesData] = await Promise.all([
        getProfileEditData(),
        getGoals(),
        getSportsCatalog(),
        getSkillLevels(),
        getFrequencies(),
      ]);

      setBio(editData.bio ?? '');
      setGoalId(editData.goal_id);
      setPhotos(editData.photos ?? []);
      setSportsRows(editData.sports ?? []);
      setGoals(goalsData);
      setSportsCatalog(sportsData);
      setSkillLevels(skillsData);
      setFrequencies(frequenciesData);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to load profile edit data.');
      onGoBack();
    } finally {
      setLoading(false);
    }
  }

  async function pickPhotos() {
    if (photos.length >= 6) {
      Alert.alert('Limit reached', 'You can upload up to 6 photos.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload profile photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6 - photos.length,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setSavingPhotos(true);
    try {
      await uploadProfilePhotos(
        result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName ?? `upload-${Date.now()}-${index}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        }))
      );
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to upload photos.');
    } finally {
      setSavingPhotos(false);
    }
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const next = [...sortedPhotos];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= next.length) return;

    const tmp = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = tmp;
    setPhotos(next.map((photo, i) => ({ ...photo, display_order: i })));
  }

  async function savePhotoOrder() {
    setSavingPhotos(true);
    try {
      await reorderProfilePhotos(
        sortedPhotos.map((photo, index) => ({ photo_id: photo.photo_id, display_order: index }))
      );
      await loadData();
      Alert.alert('Saved', 'Photo order updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update photo order.');
    } finally {
      setSavingPhotos(false);
    }
  }

  function removePhoto(photoId: number) {
    Alert.alert('Delete photo?', 'This photo will be removed from your profile.', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSavingPhotos(true);
          try {
            await deleteProfilePhoto(photoId);
            await loadData();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error || 'Failed to delete photo.');
          } finally {
            setSavingPhotos(false);
          }
        },
      },
    ]);
  }

  async function saveBio() {
    const nextBio = bio.trim();
    if (nextBio.length < 20 || nextBio.length > 250) {
      Alert.alert('Validation', 'Bio must be between 20 and 250 characters.');
      return;
    }

    setSavingBio(true);
    try {
      await saveOnboardingBio(nextBio);
      Alert.alert('Saved', 'Bio updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save bio.');
    } finally {
      setSavingBio(false);
    }
  }

  async function saveGoal() {
    if (!goalId) {
      Alert.alert('Validation', 'Select a relationship goal.');
      return;
    }

    setSavingGoal(true);
    try {
      await updateProfileGoal(goalId);
      Alert.alert('Saved', 'Goal updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save goal.');
    } finally {
      setSavingGoal(false);
    }
  }

  function addSportRow() {
    if (!sportsCatalog[0] || !skillLevels[0] || !frequencies[0]) {
      return;
    }

    setSportsRows((prev) => [
      ...prev,
      {
        sport_id: sportsCatalog[0].id,
        skill_level_id: skillLevels[0].id,
        frequency_id: frequencies[0].id,
        years_experience: null,
      },
    ]);
  }

  function updateSportRow(index: number, patch: Partial<OnboardingSportInput>) {
    setSportsRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeSportRow(index: number) {
    setSportsRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveSports() {
    if (sportsRows.length === 0) {
      Alert.alert('Validation', 'Add at least one sport.');
      return;
    }

    setSavingSports(true);
    try {
      await saveOnboardingSports(
        sportsRows.map((row) => ({
          ...row,
          years_experience:
            row.years_experience == null || Number.isNaN(Number(row.years_experience))
              ? null
              : Number(row.years_experience),
        }))
      );
      Alert.alert('Saved', 'Sports updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save sports.');
    } finally {
      setSavingSports(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Pressable onPress={onGoBack}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos ({photos.length}/6)</Text>
        <View style={styles.photoGrid}>
          {sortedPhotos.map((photo, index) => (
            <View key={photo.photo_id} style={styles.photoCard}>
              <RemoteImage
                uri={photo.photo_url}
                style={styles.photoThumb}
                fallbackStyle={styles.photoThumb}
                fallbackLabel="Photo"
              />
              <View style={styles.photoActions}>
                <Pressable style={styles.miniBtn} onPress={() => movePhoto(index, -1)}>
                  <Text style={styles.miniBtnText}>←</Text>
                </Pressable>
                <Pressable style={styles.miniBtn} onPress={() => movePhoto(index, 1)}>
                  <Text style={styles.miniBtnText}>→</Text>
                </Pressable>
                <Pressable style={[styles.miniBtn, styles.miniBtnDanger]} onPress={() => removePhoto(photo.photo_id)}>
                  <Text style={styles.miniBtnText}>✕</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.rowButtons}>
          <Pressable style={styles.smallAction} onPress={pickPhotos}>
            <Text style={styles.smallActionText}>{savingPhotos ? 'Working...' : 'Upload Photos'}</Text>
          </Pressable>
          <Pressable style={styles.smallAction} onPress={savePhotoOrder}>
            <Text style={styles.smallActionText}>Save Order</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={250}
          placeholder="Tell athletes about yourself..."
          placeholderTextColor="#6a78a8"
        />
        <Text style={styles.meta}>{bio.trim().length} / 250</Text>
        <Pressable style={styles.saveButton} onPress={saveBio} disabled={savingBio}>
          <Text style={styles.saveButtonText}>{savingBio ? 'Saving...' : 'Save Bio'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relationship Goal</Text>
        <View style={styles.chipsWrap}>
          {goals.map((goal) => {
            const selected = goal.id === goalId;
            return (
              <Pressable
                key={goal.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setGoalId(goal.id)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{goal.name}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.saveButton} onPress={saveGoal} disabled={savingGoal}>
          <Text style={styles.saveButtonText}>{savingGoal ? 'Saving...' : 'Save Goal'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sports & Training</Text>
        {sportsRows.map((row, index) => (
          <View key={`${row.sport_id}-${index}`} style={styles.sportRowCard}>
            <InlineSelector
              label="Sport"
              options={sportsCatalog}
              selected={row.sport_id}
              onSelect={(id) => updateSportRow(index, { sport_id: id })}
            />
            <InlineSelector
              label="Skill"
              options={skillLevels}
              selected={row.skill_level_id}
              onSelect={(id) => updateSportRow(index, { skill_level_id: id })}
            />
            <InlineSelector
              label="Frequency"
              options={frequencies}
              selected={row.frequency_id}
              onSelect={(id) => updateSportRow(index, { frequency_id: id })}
            />

            <Text style={styles.label}>Years Experience</Text>
            <TextInput
              style={styles.input}
              value={row.years_experience == null ? '' : String(row.years_experience)}
              onChangeText={(text) =>
                updateSportRow(index, {
                  years_experience: text.trim() === '' ? null : Number(text),
                })
              }
              keyboardType="number-pad"
              placeholder="Optional"
              placeholderTextColor="#6a78a8"
            />

            <Pressable style={styles.removeRowBtn} onPress={() => removeSportRow(index)}>
              <Text style={styles.removeRowBtnText}>Remove Sport</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.rowButtons}>
          <Pressable style={styles.smallAction} onPress={addSportRow}>
            <Text style={styles.smallActionText}>Add Sport</Text>
          </Pressable>
          <Pressable style={styles.smallAction} onPress={saveSports}>
            <Text style={styles.smallActionText}>{savingSports ? 'Saving...' : 'Save Sports'}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function InlineSelector({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: OptionItem[];
  selected: number;
  onSelect: (id: number) => void;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipsWrap}>
        {options.map((option) => {
          const isSelected = selected === option.id;
          return (
            <Pressable
              key={option.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelect(option.id)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 18,
    gap: 14,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    color: palette.accentSoft,
    fontWeight: '700',
  },
  title: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#263661',
    backgroundColor: palette.panel,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCard: {
    width: '48%',
    gap: 6,
  },
  photoThumb: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 12,
    backgroundColor: '#10172f',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 6,
  },
  miniBtn: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#17244a',
    alignItems: 'center',
    paddingVertical: 6,
  },
  miniBtnDanger: {
    backgroundColor: '#471a22',
  },
  miniBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  smallAction: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#36497f',
    backgroundColor: '#121d3f',
    paddingVertical: 10,
    alignItems: 'center',
  },
  smallActionText: {
    color: '#d6e0ff',
    fontWeight: '700',
    fontSize: 12,
  },
  bioInput: {
    minHeight: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2f437b',
    backgroundColor: '#111a3a',
    color: palette.text,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  meta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  saveButton: {
    borderRadius: 12,
    backgroundColor: palette.accent,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  label: {
    color: '#d2ddff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2f437b',
    backgroundColor: '#111a3a',
    color: palette.text,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#36497f',
    backgroundColor: '#121d3f',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipSelected: {
    backgroundColor: '#2f1e6b',
    borderColor: palette.accent,
  },
  chipText: {
    color: '#c7d3ff',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  sportRowCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#263661',
    backgroundColor: '#0f1733',
    padding: 10,
    gap: 8,
  },
  removeRowBtn: {
    borderRadius: 8,
    backgroundColor: '#471a22',
    alignItems: 'center',
    paddingVertical: 8,
  },
  removeRowBtnText: {
    color: '#ffc1c1',
    fontWeight: '700',
    fontSize: 12,
  },
});
