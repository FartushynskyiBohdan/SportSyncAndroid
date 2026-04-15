export const AUTH_TOKEN_KEY = 'authToken';
export const USER_ROLE_KEY = 'userRole';
export const USER_ID_KEY = 'userId';

export function setAuthData(token: string, role: string, userId?: number) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_ROLE_KEY, role);
  if (userId !== undefined) {
    localStorage.setItem(USER_ID_KEY, String(userId));
  }
}

export function clearAuthData() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getUserRole() {
  return localStorage.getItem(USER_ROLE_KEY);
}

export function isAdmin() {
  return getUserRole() === 'admin';
}

export function isLoggedIn() {
  return Boolean(getAuthToken());
}
