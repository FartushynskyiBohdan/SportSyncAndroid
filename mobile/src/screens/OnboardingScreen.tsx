import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
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
} from '../api/appApi';
import { useAuth } from '../context/AuthContext';
import { OnboardingSportInput, OptionItem } from '../types/app';
import { palette } from '../theme/palette';

export function OnboardingScreen() {
  const { completeOnboarding, user } = useAuth();

  const [loadingLists, setLoadingLists] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      <Text style={styles.subtitle}>User #{user?.id} · This unlocks discover and messaging.</Text>

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
        <Text style={styles.label}>Country</Text>
        <OptionWrap options={countries} selectedId={countryId} onSelect={setCountryId} />
        <Text style={styles.label}>City</Text>
        <OptionWrap options={cities} selectedId={cityId} onSelect={setCityId} />
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
