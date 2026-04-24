import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { requestPasswordReset } from '../api/authApi';
import { palette } from '../theme/palette';

interface Props {
  onGoLogin: () => void;
  onGoReset: () => void;
}

export function ForgotPasswordScreen({ onGoLogin, onGoReset }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function onSubmit() {
    if (!emailValid || submitting) return;

    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message || 'If an account exists, a reset link has been sent.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not send a reset email right now.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.badge}>ACCOUNT RECOVERY</Text>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          Enter your email and SportSync will send the reset link configured by the backend.
        </Text>

        <View style={styles.group}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, email !== '' && !emailValid && styles.inputError]}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            placeholder="runner@sportsync.com"
            placeholderTextColor={palette.textMuted}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
          />
          {email !== '' && !emailValid ? (
            <Text style={styles.hint}>Enter a valid email address.</Text>
          ) : null}
        </View>

        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, (!emailValid || submitting) && styles.buttonDisabled]}
          disabled={!emailValid || submitting}
          onPress={onSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#050814" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onGoReset}>
          <Text style={styles.secondaryText}>I Have A Reset Token</Text>
        </Pressable>

        <Pressable style={styles.linkButton} onPress={onGoLogin}>
          <Text style={styles.linkText}>Back to login</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: palette.background,
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
  },
  inputError: {
    borderColor: palette.danger,
  },
  hint: {
    color: palette.danger,
    fontSize: 12,
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
  linkButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkText: {
    color: palette.accentSoft,
    fontWeight: '700',
  },
});
