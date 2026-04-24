import Constants from 'expo-constants';

const fromEnv = process.env.EXPO_PUBLIC_DEMO_MODE;
const fromConfig = Constants.expoConfig?.extra?.demoMode;

export const DEMO_MODE = fromEnv === 'true' || fromConfig === true;
