import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/palette';

interface Props {
  onGoLogin: () => void;
}

export function RegisterScreen({ onGoLogin }: Props) {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const passwordsMatch = password === confirm;
  const passwordLong = password.length >= 8;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailValid && passwordLong && passwordsMatch && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setLocalError('');
    setSubmitting(true);
    const err = await register(email.trim(), password);
    if (err) setLocalError(err);
    setSubmitting(false);
  }

  const displayError = localError;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.badge}>SPORTSYNC</Text>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join thousands of athletes near you.</Text>

          {/* Email */}
          <View style={styles.group}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, email && !emailValid && styles.inputError]}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              placeholder="runner@sportsync.com"
              placeholderTextColor={palette.textMuted}
              returnKeyType="next"
            />
            {email !== '' && !emailValid && (
              <Text style={styles.hint}>Enter a valid email address.</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.group}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, password && !passwordLong && styles.inputError]}
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={palette.textMuted}
              returnKeyType="next"
            />
            {password !== '' && !passwordLong && (
              <Text style={styles.hint}>Must be at least 8 characters.</Text>
            )}
          </View>

          {/* Confirm password */}
          <View style={styles.group}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={[styles.input, confirm && !passwordsMatch && styles.inputError]}
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat your password"
              placeholderTextColor={palette.textMuted}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            {confirm !== '' && !passwordsMatch && (
              <Text style={styles.hint}>Passwords do not match.</Text>
            )}
          </View>

          {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            disabled={!canSubmit}
            onPress={onSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#050814" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>already a member?</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.secondaryButton} onPress={onGoLogin}>
            <Text style={styles.secondaryText}>Log In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#29365d',
    backgroundColor: palette.panel,
    padding: 24,
    gap: 14,
  },
  badge: {
    color: palette.accentSoft,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '700',
  },
  title: {
    color: palette.text,
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    marginBottom: 4,
  },
  group: {
    gap: 6,
  },
  label: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#33406a',
    backgroundColor: palette.panelSoft,
    color: palette.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputError: {
    borderColor: palette.danger,
  },
  hint: {
    color: palette.danger,
    fontSize: 12,
    marginTop: 2,
  },
  error: {
    color: palette.danger,
    fontSize: 13,
    marginTop: 2,
  },
  button: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#060912',
    fontWeight: '700',
    fontSize: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1f2e58',
  },
  dividerText: {
    color: palette.textMuted,
    fontSize: 12,
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#33406a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: palette.text,
    fontWeight: '600',
    fontSize: 15,
  },
});
