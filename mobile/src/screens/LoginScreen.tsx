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
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/palette';

export function LoginScreen({ onGoRegister }: { onGoRegister?: () => void }) {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    await login(email.trim(), password);
    setSubmitting(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.badge}>SPORTSYNC</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to keep your streak alive.</Text>

        <View style={styles.group}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="runner@sportsync.com"
            placeholderTextColor={palette.textMuted}
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={palette.textMuted}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, (!email || !password || submitting || loading) && styles.buttonDisabled]}
          disabled={!email || !password || submitting || loading}
          onPress={onSubmit}
        >
          {submitting || loading ? <ActivityIndicator color="#050814" /> : <Text style={styles.buttonText}>Log In</Text>}
        </Pressable>

        {onGoRegister ? (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>new here?</Text>
              <View style={styles.dividerLine} />
            </View>
            <Pressable style={styles.secondaryButton} onPress={onGoRegister}>
              <Text style={styles.secondaryText}>Create Account</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
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
  },
  title: {
    color: palette.text,
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    marginBottom: 8,
  },
  group: {
    gap: 8,
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
  },
  error: {
    color: palette.danger,
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    marginTop: 8,
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
