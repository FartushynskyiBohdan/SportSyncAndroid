import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { MainTabsScreen } from './src/screens/MainTabsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SuspendedScreen } from './src/screens/SuspendedScreen';
import { palette } from './src/theme/palette';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { token, suspendedNotice, user } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {suspendedNotice ? (
        <Stack.Screen name="Suspended" component={SuspendedScreen} />
      ) : token && user && !user.onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : token ? (
        <Stack.Screen name="MainTabs" component={MainTabsScreen} />
      ) : showRegister ? (
        <Stack.Screen name="Register">
          {() => <RegisterScreen onGoLogin={() => setShowRegister(false)} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login">
          {() => <LoginScreen onGoRegister={() => setShowRegister(true)} />}
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
