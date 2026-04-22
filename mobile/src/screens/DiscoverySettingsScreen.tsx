import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getDiscoveryPreferences,
  getFrequencies,
  getGenders,
  getSkillLevels,
  getSportsCatalog,
  updateDiscoveryPreferences,
} from '../api/appApi';
import { OptionItem } from '../types/app';
import { palette } from '../theme/palette';

interface DiscoverySettingsScreenProps {
  onGoBack: () => void;
}

export function DiscoverySettingsScreen({ onGoBack }: DiscoverySettingsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [genders, setGenders] = useState<OptionItem[]>([]);
  const [sports, setSports] = useState<OptionItem[]>([]);
  const [skillLevels, setSkillLevels] = useState<OptionItem[]>([]);
  const [frequencies, setFrequencies] = useState<OptionItem[]>([]);

  const [genderId, setGenderId] = useState<number | null>(null);
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('60');
  const [maxDistance, setMaxDistance] = useState('50');
  const [minSkillLevelId, setMinSkillLevelId] = useState<number | null>(null);
  const [preferredFrequencyId, setPreferredFrequencyId] = useState<number | null>(null);
  const [minPhotos, setMinPhotos] = useState(1);
  const [showOutOfRange, setShowOutOfRange] = useState(false);
  const [sportIds, setSportIds] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [prefs, gendersData, sportsData, skillData, freqData] = await Promise.all([
          getDiscoveryPreferences(),
          getGenders(),
          getSportsCatalog(),
          getSkillLevels(),
          getFrequencies(),
        ]);

        setGenders(gendersData);
        setSports(sportsData);
        setSkillLevels(skillData);
        setFrequencies(freqData);

        setGenderId(prefs.gender_id ?? null);
        setMinAge(String(prefs.min_age ?? 18));
        setMaxAge(String(prefs.max_age ?? 60));
        setMaxDistance(prefs.max_distance_km != null ? String(prefs.max_distance_km) : '');
        setMinSkillLevelId(prefs.min_skill_level_id ?? null);
        setPreferredFrequencyId(prefs.preferred_frequency_id ?? null);
        setMinPhotos(prefs.min_photos ?? 1);
        setShowOutOfRange(Boolean(prefs.show_out_of_range));
        setSportIds(Array.isArray(prefs.sport_ids) ? prefs.sport_ids : []);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load discovery settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedSportsLabel = useMemo(() => {
    if (sportIds.length === 0) return 'Any sport';
    if (sportIds.length <= 3) {
      return sports
        .filter((s) => sportIds.includes(s.id))
        .map((s) => s.name)
        .join(', ');
    }
    return `${sportIds.length} sports selected`;
  }, [sportIds, sports]);

  const toggleSport = (id: number) => {
    setSportIds((prev) =>
      prev.includes(id) ? prev.filter((sportId) => sportId !== id) : [...prev, id]
    );
  };

  const save = async () => {
    if (!genderId) {
      Alert.alert('Validation', 'Please choose a preferred gender.');
      return;
    }

    const minAgeInt = Number(minAge);
    const maxAgeInt = Number(maxAge);
    const maxDistanceInt = maxDistance.trim() ? Number(maxDistance) : null;

    if (!Number.isInteger(minAgeInt) || !Number.isInteger(maxAgeInt) || minAgeInt >= maxAgeInt) {
      Alert.alert('Validation', 'Please enter a valid age range.');
      return;
    }

    if (maxDistanceInt !== null && (!Number.isFinite(maxDistanceInt) || maxDistanceInt < 0)) {
      Alert.alert('Validation', 'Distance must be empty or a positive number.');
      return;
    }

    setSaving(true);
    try {
      await updateDiscoveryPreferences({
        gender_id: genderId,
        min_age: minAgeInt,
        max_age: maxAgeInt,
        max_distance_km: maxDistanceInt,
        min_skill_level_id: minSkillLevelId,
        preferred_frequency_id: preferredFrequencyId,
        min_photos: minPhotos,
        show_out_of_range: showOutOfRange,
        sport_ids: sportIds,
      });
      Alert.alert('Saved', 'Discovery settings updated.');
      onGoBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.title}>Discovery Filters</Text>
        <View style={{ width: 42 }} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Who you want to meet</Text>
        <OptionSelector label="Preferred Gender" options={genders} selected={genderId} onSelect={setGenderId} />

        <View style={styles.row2}>
          <Field label="Min Age" value={minAge} onChangeText={setMinAge} keyboardType="number-pad" />
          <Field label="Max Age" value={maxAge} onChangeText={setMaxAge} keyboardType="number-pad" />
        </View>

        <Field
          label="Max Distance (km)"
          value={maxDistance}
          onChangeText={setMaxDistance}
          keyboardType="number-pad"
          placeholder="Leave empty for no distance limit"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Athlete quality filters</Text>
        <OptionSelector
          label="Minimum Skill Level"
          options={skillLevels}
          selected={minSkillLevelId}
          onSelect={setMinSkillLevelId}
          allowNone
        />
        <OptionSelector
          label="Preferred Frequency"
          options={frequencies}
          selected={preferredFrequencyId}
          onSelect={setPreferredFrequencyId}
          allowNone
        />

        <Text style={styles.label}>Minimum Profile Photos</Text>
        <View style={styles.chipsWrap}>
          {[1, 2, 3, 4, 5, 6].map((value) => (
            <Pressable
              key={value}
              style={[styles.chip, minPhotos === value && styles.chipSelected]}
              onPress={() => setMinPhotos(value)}
            >
              <Text style={[styles.chipText, minPhotos === value && styles.chipTextSelected]}>{value}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Show people outside distance</Text>
          <Switch value={showOutOfRange} onValueChange={setShowOutOfRange} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sports</Text>
        <Text style={styles.meta}>{selectedSportsLabel}</Text>
        <View style={styles.chipsWrap}>
          {sports.map((sport) => {
            const selected = sportIds.includes(sport.id);
            return (
              <Pressable
                key={sport.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleSport(sport.id)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{sport.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={[styles.saveButton, saving && styles.disabled]} disabled={saving} onPress={save}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Filters'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'number-pad';
  placeholder?: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#6a78a8"
      />
    </View>
  );
}

function OptionSelector({
  label,
  options,
  selected,
  onSelect,
  allowNone,
}: {
  label: string;
  options: OptionItem[];
  selected: number | null;
  onSelect: (id: number | null) => void;
  allowNone?: boolean;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipsWrap}>
        {allowNone ? (
          <Pressable
            style={[styles.chip, selected == null && styles.chipSelected]}
            onPress={() => onSelect(null)}
          >
            <Text style={[styles.chipText, selected == null && styles.chipTextSelected]}>Any</Text>
          </Pressable>
        ) : null}
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
  error: {
    color: palette.danger,
    fontSize: 13,
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
  label: {
    color: '#d2ddff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  meta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  row2: {
    flexDirection: 'row',
    gap: 8,
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
  switchRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: palette.accent,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.55,
  },
});
