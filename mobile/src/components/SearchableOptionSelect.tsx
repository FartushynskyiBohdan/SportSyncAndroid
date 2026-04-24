import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { OptionItem } from '../types/app';
import { palette } from '../theme/palette';

interface SearchableOptionSelectProps {
  label: string;
  value: number | null;
  options: OptionItem[];
  onChange: (id: number) => void;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
}

export function SearchableOptionSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Choose one',
  disabled,
  helperText,
}: SearchableOptionSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.id === value) ?? null;

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.name.toLowerCase().includes(normalized));
  }, [options, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  function handleSelect(id: number) {
    onChange(id);
    setOpen(false);
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
      <Pressable
        style={[styles.selectButton, disabled && styles.disabled]}
        onPress={() => {
          if (!disabled) setOpen(true);
        }}
        disabled={disabled}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.selectValue, !selected && styles.placeholder]} numberOfLines={1}>
            {selected?.name ?? placeholder}
          </Text>
          <Text style={styles.selectHint}>{disabled ? 'Unavailable' : 'Tap to search'}</Text>
        </View>
        <Text style={styles.chevron}>v</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetEyebrow}>{label.toUpperCase()}</Text>
                <Text style={styles.sheetTitle}>{selected?.name ?? placeholder}</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            <TextInput
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              placeholder={`Search ${label.toLowerCase()}...`}
              placeholderTextColor="#6f7da8"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.resultCount}>
              {filteredOptions.length} result{filteredOptions.length === 1 ? '' : 's'}
            </Text>

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={filteredOptions.length === 0 ? styles.emptyList : styles.listContent}
              ListEmptyComponent={<Text style={styles.emptyText}>No matching options.</Text>}
              renderItem={({ item }) => {
                const active = item.id === value;
                return (
                  <Pressable
                    style={[styles.optionRow, active && styles.optionRowActive]}
                    onPress={() => handleSelect(item.id)}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.name}</Text>
                    {active ? <Text style={styles.selectedMark}>Selected</Text> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 7,
  },
  label: {
    color: '#d2ddff',
    fontSize: 13,
    fontWeight: '800',
  },
  helperText: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  selectButton: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#33477e',
    backgroundColor: '#0f1734',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  selectValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  placeholder: {
    color: '#7b88b6',
  },
  selectHint: {
    color: palette.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    color: palette.accentSoft,
    fontSize: 16,
    fontWeight: '900',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#2d3c6c',
    backgroundColor: '#0a1028',
    padding: 18,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
  },
  sheetEyebrow: {
    color: palette.accentSoft,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  sheetTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#384a7c',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  closeText: {
    color: '#dce5ff',
    fontSize: 12,
    fontWeight: '800',
  },
  searchInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#33477e',
    backgroundColor: '#111a39',
    color: palette.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  resultCount: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    maxHeight: 420,
  },
  listContent: {
    gap: 8,
    paddingBottom: 16,
  },
  emptyList: {
    minHeight: 120,
    justifyContent: 'center',
  },
  emptyText: {
    color: palette.textMuted,
    textAlign: 'center',
  },
  optionRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#243762',
    backgroundColor: '#101936',
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionRowActive: {
    borderColor: '#d9dfff',
    backgroundColor: '#f4f7ff',
  },
  optionText: {
    flex: 1,
    color: '#dce5ff',
    fontSize: 14,
    fontWeight: '800',
  },
  optionTextActive: {
    color: '#08112d',
  },
  selectedMark: {
    color: '#263057',
    fontSize: 11,
    fontWeight: '900',
  },
});
