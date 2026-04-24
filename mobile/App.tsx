import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { MainTabsScreen } from './src/screens/MainTabsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SuspendedScreen } from './src/screens/SuspendedScreen';
import { palette } from './src/theme/palette';

const Stack = createNativeStackNavigator();
type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

function AppLoadingScreen() {
  return (
    <View style={styles.loadingRoot}>
      <ActivityIndicator color={palette.accent} size="large" />
      <Text style={styles.loadingText}>Warming up SportSync...</Text>
    </View>
  );
}

function RootNavigator() {
  const { token, suspendedNotice, user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  useEffect(() => {
    if (token) {
      setAuthMode('login');
    }
  }, [token]);

  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {suspendedNotice ? (
        <Stack.Screen name="Suspended" component={SuspendedScreen} />
      ) : token && user && user.role !== 'admin' && !user.onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : token ? (
        <Stack.Screen name="MainTabs" component={MainTabsScreen} />
      ) : authMode === 'register' ? (
        <Stack.Screen name="Register">
          {() => <RegisterScreen onGoLogin={() => setAuthMode('login')} />}
        </Stack.Screen>
      ) : authMode === 'forgot' ? (
        <Stack.Screen name="ForgotPassword">
          {() => (
            <ForgotPasswordScreen
              onGoLogin={() => setAuthMode('login')}
              onGoReset={() => setAuthMode('reset')}
            />
          )}
        </Stack.Screen>
      ) : authMode === 'reset' ? (
        <Stack.Screen name="ResetPassword">
          {() => <ResetPasswordScreen onGoLogin={() => setAuthMode('login')} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login">
          {() => (
            <LoginScreen
              onGoRegister={() => setAuthMode('register')}
              onForgotPassword={() => setAuthMode('forgot')}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer
        theme={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: palette.background,
            card: palette.panel,
            text: palette.text,
            primary: palette.accent,
            border: '#1b2543',
            notification: palette.accent,
          },
        }}
      >
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: palette.background,
  },
  loadingText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});
