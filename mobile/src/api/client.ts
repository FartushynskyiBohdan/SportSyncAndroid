import axios from 'axios';
import Constants from 'expo-constants';

const EMULATOR_FALLBACK = 'http://10.0.2.2:3000';

const fromEnv = process.env.EXPO_PUBLIC_API_URL;
const fromConfig = Constants.expoConfig?.extra?.apiUrl as string | undefined;
const apiUrl = fromEnv || fromConfig || EMULATOR_FALLBACK;

if (__DEV__ && !fromEnv && !fromConfig) {
  console.warn(
    '[SportSync] No API URL configured. Using Android emulator fallback (' +
      EMULATOR_FALLBACK +
      '). Physical devices will fail — set EXPO_PUBLIC_API_URL in mobile/.env'
  );
}

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
});

export function buildMediaUrl(pathOrUrl: string) {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const base = api.defaults.baseURL || '';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function withToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
