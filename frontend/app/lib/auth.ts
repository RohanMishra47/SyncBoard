const USER_STORAGE_KEY = "syncboard_user_id";
const USER_NAME_KEY = "syncboard_user_name";

export function saveUser(userId: string, userName: string) {
  localStorage.setItem(USER_STORAGE_KEY, userId);
  localStorage.setItem(USER_NAME_KEY, userName);
}

export function getSavedUserId(): string | null {
  return localStorage.getItem(USER_STORAGE_KEY);
}

export function getSavedUserName(): string | null {
  return localStorage.getItem(USER_NAME_KEY);
}

export function clearUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}
