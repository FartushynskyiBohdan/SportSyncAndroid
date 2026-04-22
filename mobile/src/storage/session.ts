import AsyncStorage from '@react-native-async-storage/async-storage';
import { SuspensionNotice, User } from '../types/auth';

const TOKEN_KEY = 'sportsync_token';
const USER_KEY = 'sportsync_user';
const SUSPENSION_KEY = 'sportsync_suspension';

export async function readSession() {
  const [token, rawUser, rawSuspension] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
    AsyncStorage.getItem(SUSPENSION_KEY),
  ]);

  return {
    token,
    user: rawUser ? (JSON.parse(rawUser) as User) : null,
    suspensionNotice: rawSuspension ? (JSON.parse(rawSuspension) as SuspensionNotice) : null,
  };
}

export async function persistSession(token: string, user: User) {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, token),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    AsyncStorage.removeItem(SUSPENSION_KEY),
  ]);
}

export async function persistUser(user: User) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function persistSuspension(notice: SuspensionNotice) {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
    AsyncStorage.setItem(SUSPENSION_KEY, JSON.stringify(notice)),
  ]);
}

export async function clearSession() {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
    AsyncStorage.removeItem(SUSPENSION_KEY),
  ]);
}
