import axios from 'axios';
import Constants from 'expo-constants';
import { DEMO_MODE } from '../config/demo';

const EMULATOR_FALLBACK = 'http://10.0.2.2:3000';

const fromEnv = process.env.EXPO_PUBLIC_API_URL;
const fromConfig = Constants.expoConfig?.extra?.apiUrl as string | undefined;
const apiUrl = fromEnv || fromConfig || EMULATOR_FALLBACK;

if (__DEV__ && !DEMO_MODE && !fromEnv && !fromConfig) {
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
  const trimmed = String(pathOrUrl).trim();
  if (!trimmed) return '';

  const normalized = trimmed.replace(/\\/g, '/');

  if (normalized.startsWith('//')) {
    return `https:${normalized}`;
  }

  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('file://') ||
    normalized.startsWith('content://') ||
    normalized.startsWith('data:')
  ) {
    return normalized;
  }

  const base = api.defaults.baseURL || '';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const uploadIndex = normalized.indexOf('/uploads/');
  const uploadPath = uploadIndex >= 0 ? normalized.slice(uploadIndex) : normalized;
  const normalizedPath = uploadPath.startsWith('/') ? uploadPath : `/${uploadPath}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function withToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
