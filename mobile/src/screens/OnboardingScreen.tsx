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
  getCities,
  getCountries,
  getFrequencies,
  getGenders,
  getGoals,
  getSkillLevels,
  getSportsCatalog,
  markOnboardingComplete,
  saveOnboardingBio,
  saveOnboardingPreferences,
  saveOnboardingProfile,
  saveOnboardingSports,
  uploadProfilePhotos,
} from '../api/appApi';
import { RemoteImage } from '../components/RemoteImage';
import { SearchableOptionSelect } from '../components/SearchableOptionSelect';
import { useAuth } from '../context/AuthContext';
import { OnboardingSportInput, OptionItem, ProfileEditPhoto } from '../types/app';
import { palette } from '../theme/palette';

export function OnboardingScreen() {
  const { completeOnboarding, user } = useAuth();

  const [loadingLists, setLoadingLists] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [genders, setGenders] = useState<OptionItem[]>([]);
  const [countries, setCountries] = useState<OptionItem[]>([]);
  const [cities, setCities] = useState<OptionItem[]>([]);
  const [sports, setSports] = useState<OptionItem[]>([]);
  const [skillLevels, setSkillLevels] = useState<OptionItem[]>([]);
  const [frequencies, setFrequencies] = useState<OptionItem[]>([]);
  const [goals, setGoals] = useState<OptionItem[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('2000-01-01');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<ProfileEditPhoto[]>([]);

  const [myGenderId, setMyGenderId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);

  const [prefGenderId, setPrefGenderId] = useState<number | null>(null);
  const [goalId, setGoalId] = useState<number | null>(null);
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('35');
  const [maxDistanceKm, setMaxDistanceKm] = useState('25');
  const [preferredSportIds, setPreferredSportIds] = useState<number[]>([]);

  const [mySportId, setMySportId] = useState<number | null>(null);
  const [mySkillLevelId, setMySkillLevelId] = useState<number | null>(null);
  const [myFrequencyId, setMyFrequencyId] = useState<number | null>(null);
  const [myYearsExp, setMyYearsExp] = useState('1');

  useEffect(() => {
    (async () => {
      setLoadingLists(true);
      setError('');
      try {
        const [
          gendersData,
          countriesData,
          sportsData,
          levelsData,
          frequenciesData,
          goalsData,
        ] = await Promise.all([
          getGenders(),
          getCountries(),
          getSportsCatalog(),
          getSkillLevels(),
          getFrequencies(),
          getGoals(),
        ]);

        setGenders(gendersData);
        setCountries(countriesData);
        setSports(sportsData);
        setSkillLevels(levelsData);
        setFrequencies(frequenciesData);
        setGoals(goalsData);

        if (gendersData[0]) {
          setMyGenderId(gendersData[0].id);
          setPrefGenderId(gendersData[0].id);
        }
        if (countriesData[0]) {
          setCountryId(countriesData[0].id);
        }
        if (sportsData[0]) {
          setMySportId(sportsData[0].id);
          setPreferredSportIds([sportsData[0].id]);
        }
        if (levelsData[0]) setMySkillLevelId(levelsData[0].id);
        if (frequenciesData[0]) setMyFrequencyId(frequenciesData[0].id);
        if (goalsData[0]) setGoalId(goalsData[0].id);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load onboarding data.');
      } finally {
        setLoadingLists(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!countryId) {
      setCities([]);
      setCityId(null);
      return;
    }

    (async () => {
      try {
        const cityData = await getCities(countryId);
        setCities(cityData);
        setCityId(cityData[0]?.id || null);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load cities.');
      }
    })();
  }, [countryId]);

  const canSubmit = useMemo(() => {
    return Boolean(
      firstName.trim() &&
      lastName.trim() &&
      birthDate.trim() &&
      bio.trim() &&
      photos.length > 0 &&
      !savingPhotos &&
      myGenderId &&
      cityId &&
      prefGenderId &&
      goalId &&
      preferredSportIds.length > 0 &&
      mySportId &&
      mySkillLevelId &&
      myFrequencyId
    );
  }, [
    firstName,
    lastName,
    birthDate,
    bio,
    photos.length,
    savingPhotos,
    myGenderId,
    cityId,
    prefGenderId,
    goalId,
    preferredSportIds,
    mySportId,
    mySkillLevelId,
    myFrequencyId,
  ]);

  function togglePreferredSport(sportId: number) {
    setPreferredSportIds((prev) => {
      if (prev.includes(sportId)) return prev.filter((id) => id !== sportId);
      if (prev.length >= 5) return prev;
      return [...prev, sportId];
    });
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
    setError('');
    try {
      const uploaded = await uploadProfilePhotos(
        result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName ?? `onboarding-${Date.now()}-${index}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        }))
      );

      setPhotos((prev) =>
        [...prev, ...uploaded]
          .sort((a, b) => a.display_order - b.display_order)
          .slice(0, 6)
      );
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.error || 'Failed to upload profile photos.');
    } finally {
      setSavingPhotos(false);
    }
  }

  function removePhoto(photoId: number) {
    Alert.alert('Remove photo?', 'This photo will be removed from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setSavingPhotos(true);
          try {
            await deleteProfilePhoto(photoId);
            setPhotos((prev) => prev.filter((photo) => photo.photo_id !== photoId));
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error || 'Failed to remove photo.');
          } finally {
            setSavingPhotos(false);
          }
        },
      },
    ]);
  }

  async function onSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');
    setNotice('Saving your onboarding...');

    try {
      const sportsPayload: OnboardingSportInput[] = [
        {
          sport_id: Number(mySportId),
          skill_level_id: Number(mySkillLevelId),
          frequency_id: Number(myFrequencyId),
          years_experience: myYearsExp.trim() ? Number(myYearsExp) : null,
        },
      ];

      await saveOnboardingProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate.trim(),
        gender_id: Number(myGenderId),
        city_id: Number(cityId),
      });

      await saveOnboardingBio(bio.trim());
      await saveOnboardingSports(sportsPayload);
      await saveOnboardingPreferences({
        gender_id: Number(prefGenderId),
        min_age: Number(minAge),
        max_age: Number(maxAge),
        max_distance_km: Number(maxDistanceKm),
        goal_id: Number(goalId),
        sports: preferredSportIds,
      });
      await markOnboardingComplete();
      await completeOnboarding();
      setNotice('Onboarding complete. Redirecting...');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to complete onboarding.');
      setNotice('');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingLists) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.accent} />
        <Text style={styles.centeredText}>Preparing onboarding...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.badge}>WELCOME TO SPORTSYNC</Text>
      <Text style={styles.title}>Complete your athlete profile</Text>
      <Text style={styles.subtitle}>User #{user?.id} - This unlocks discover and messaging.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Card title="Identity">
        <LabeledInput label="First name" value={firstName} onChangeText={setFirstName} />
        <LabeledInput label="Last name" value={lastName} onChangeText={setLastName} />
        <LabeledInput label="Birth date (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} />
        <Text style={styles.label}>Gender</Text>
        <OptionWrap options={genders} selectedId={myGenderId} onSelect={setMyGenderId} />
      </Card>

      <Card title="Location">
        <SearchableOptionSelect
          label="Country"
          value={countryId}
          options={countries}
          onChange={(id) => {
            setCityId(null);
            setCountryId(id);
          }}
          helperText="Search instead of scrolling through the whole database."
        />
        <SearchableOptionSelect
          label="City"
          value={cityId}
          options={cities}
          onChange={setCityId}
          disabled={!countryId || cities.length === 0}
          placeholder={countryId ? 'Choose your city' : 'Pick a country first'}
        />
      </Card>

      <Card title="Profile photos">
        <Text style={styles.photoHelp}>
          Add at least one clear profile photo. Your first photo becomes the main card image.
        </Text>
        {photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={photo.photo_id} style={styles.photoCard}>
                <RemoteImage
                  uri={photo.photo_url}
                  style={styles.photoThumb}
                  fallbackStyle={styles.photoThumb}
                  fallbackLabel="Photo"
                />
                {index === 0 ? (
                  <View style={styles.primaryPhotoBadge}>
                    <Text style={styles.primaryPhotoBadgeText}>Main</Text>
                  </View>
                ) : null}
                <Pressable style={styles.removePhotoButton} onPress={() => removePhoto(photo.photo_id)}>
                  <Text style={styles.removePhotoText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Pressable style={styles.emptyPhotoDropzone} onPress={pickPhotos}>
            <Text style={styles.emptyPhotoIcon}>+</Text>
            <Text style={styles.emptyPhotoTitle}>Upload profile photo</Text>
            <Text style={styles.emptyPhotoCopy}>This fixes blank cards and makes Discover feel like the web app.</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.photoUploadButton, (savingPhotos || photos.length >= 6) && styles.photoUploadButtonDisabled]}
          onPress={pickPhotos}
          disabled={savingPhotos || photos.length >= 6}
        >
          <Text style={styles.photoUploadButtonText}>
            {savingPhotos ? 'Uploading...' : photos.length === 0 ? 'Choose Photo' : 'Add More Photos'}
          </Text>
        </Pressable>
      </Card>

      <Card title="Your athlete baseline">
        <Text style={styles.label}>Main sport</Text>
        <OptionWrap options={sports} selectedId={mySportId} onSelect={setMySportId} />
        <Text style={styles.label}>Skill level</Text>
        <OptionWrap options={skillLevels} selectedId={mySkillLevelId} onSelect={setMySkillLevelId} />
        <Text style={styles.label}>Training frequency</Text>
        <OptionWrap options={frequencies} selectedId={myFrequencyId} onSelect={setMyFrequencyId} />
        <LabeledInput
          label="Years of experience"
          value={myYearsExp}
          onChangeText={setMyYearsExp}
          keyboardType="numeric"
        />
      </Card>

      <Card title="Discover preferences">
        <Text style={styles.label}>Looking for</Text>
        <OptionWrap options={genders} selectedId={prefGenderId} onSelect={setPrefGenderId} />
        <Text style={styles.label}>Relationship goal</Text>
        <OptionWrap options={goals} selectedId={goalId} onSelect={setGoalId} />
        <LabeledInput label="Min age" value={minAge} onChangeText={setMinAge} keyboardType="numeric" />
        <LabeledInput label="Max age" value={maxAge} onChangeText={setMaxAge} keyboardType="numeric" />
        <LabeledInput
          label="Max distance (km)"
          value={maxDistanceKm}
          onChangeText={setMaxDistanceKm}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Preferred sports (up to 5)</Text>
        <View style={styles.chipsWrap}>
          {sports.map((sport) => {
            const selected = preferredSportIds.includes(sport.id);
            return (
              <Pressable
                key={`pref-${sport.id}`}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => togglePreferredSport(sport.id)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{sport.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card title="Bio">
        <LabeledInput
          label="Tell people what training with you is like"
          value={bio}
          onChangeText={setBio}
          multiline
        />
      </Card>

      <Pressable
        style={[styles.submitButton, (!canSubmit || submitting) && styles.submitButtonDisabled]}
        onPress={onSubmit}
        disabled={!canSubmit || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#091128" />
        ) : (
          <Text style={styles.submitText}>Finish Onboarding</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        placeholderTextColor={palette.textMuted}
      />
    </View>
  );
}

function OptionWrap({
  options,
  selectedId,
  onSelect,
}: {
  options: OptionItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <View style={styles.optionWrap}>
      {options.map((option) => {
        const active = option.id === selectedId;
        return (
          <Pressable
            key={`${option.id}-${option.name}`}
            style={[styles.optionPill, active && styles.optionPillActive]}
            onPress={() => onSelect(option.id)}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 18,
    gap: 14,
    backgroundColor: palette.background,
  },
  centered: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centeredText: {
    color: palette.textMuted,
  },
  badge: {
    color: palette.accentSoft,
    fontSize: 12,
    letterSpacing: 2,
  },
  title: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 30,
    lineHeight: 34,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 13,
  },
  error: {
    color: palette.danger,
    fontSize: 13,
  },
  notice: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: palette.panel,
    padding: 12,
    gap: 10,
  },
  cardTitle: {
    color: '#e8edff',
    fontWeight: '800',
    fontSize: 17,
  },
  inputWrap: {
    gap: 6,
  },
  label: {
    color: '#9fb0de',
    fontSize: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#33406a',
    backgroundColor: palette.panelSoft,
    color: palette.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  photoHelp: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b3f72',
    backgroundColor: '#101936',
    padding: 8,
    gap: 8,
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    aspectRatio: 0.78,
    borderRadius: 12,
    backgroundColor: '#0b1026',
  },
  primaryPhotoBadge: {
    position: 'absolute',
    left: 14,
    top: 14,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  primaryPhotoBadgeText: {
    color: '#08112d',
    fontSize: 11,
    fontWeight: '900',
  },
  removePhotoButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7f2534',
    backgroundColor: '#3a1220',
    alignItems: 'center',
    paddingVertical: 8,
  },
  removePhotoText: {
    color: '#fecdd3',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyPhotoDropzone: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4a63a1',
    backgroundColor: '#0f1734',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyPhotoIcon: {
    color: palette.accentSoft,
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 36,
  },
  emptyPhotoTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyPhotoCopy: {
    color: palette.textMuted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
  },
  photoUploadButton: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoUploadButtonDisabled: {
    opacity: 0.5,
  },
  photoUploadButtonText: {
    color: '#091128',
    fontSize: 14,
    fontWeight: '900',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#32457b',
    backgroundColor: '#15254c',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  optionPillActive: {
    borderColor: '#ffffff',
    backgroundColor: '#f4f7ff',
  },
  optionText: {
    color: '#d6e1ff',
    fontSize: 12,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#08112d',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#32457b',
    backgroundColor: '#15254c',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipSelected: {
    borderColor: '#ffffff',
    backgroundColor: '#f4f7ff',
  },
  chipText: {
    color: '#d6e1ff',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#08112d',
  },
  submitButton: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 14,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#091128',
    fontWeight: '800',
    fontSize: 15,
  },
});
