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
import { resetPassword } from '../api/authApi';
import { palette } from '../theme/palette';

interface Props {
  onGoLogin: () => void;
}

export function ResetPasswordScreen({ onGoLogin }: Props) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const passwordStrong = password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
  const passwordsMatch = password === confirm;
  const canSubmit = token.trim().length >= 20 && passwordStrong && passwordsMatch && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const result = await resetPassword(token.trim(), password);
      setMessage(result.message || 'Password has been reset successfully.');
      setPassword('');
      setConfirm('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not reset your password.');
    } finally {
      setSubmitting(false);
    }
  }

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
          <Text style={styles.badge}>RESET TOKEN</Text>
          <Text style={styles.title}>Choose a new password</Text>
          <Text style={styles.subtitle}>
            Paste the token from your reset link, then set a stronger password.
          </Text>

          <View style={styles.group}>
            <Text style={styles.label}>Reset token</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={token}
              onChangeText={setToken}
              placeholder="Paste token from reset link"
              placeholderTextColor={palette.textMuted}
              multiline
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>New password</Text>
            <TextInput
              style={[styles.input, password !== '' && !passwordStrong && styles.inputError]}
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              placeholder="Uppercase, lowercase, number"
              placeholderTextColor={palette.textMuted}
            />
            {password !== '' && !passwordStrong ? (
              <Text style={styles.hint}>Use at least 8 characters, one uppercase letter, one lowercase letter, and one number.</Text>
            ) : null}
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={[styles.input, confirm !== '' && !passwordsMatch && styles.inputError]}
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat your password"
              placeholderTextColor={palette.textMuted}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            {confirm !== '' && !passwordsMatch ? (
              <Text style={styles.hint}>Passwords do not match.</Text>
            ) : null}
          </View>

          {message ? <Text style={styles.success}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            disabled={!canSubmit}
            onPress={onSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#050814" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onGoLogin}>
            <Text style={styles.secondaryText}>Back To Login</Text>
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
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 21,
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
    minHeight: 46,
  },
  inputError: {
    borderColor: palette.danger,
  },
  hint: {
    color: palette.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  success: {
    color: '#86efac',
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: palette.danger,
    fontSize: 13,
    lineHeight: 19,
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
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#33406a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: palette.text,
    fontWeight: '700',
    fontSize: 14,
  },
});
