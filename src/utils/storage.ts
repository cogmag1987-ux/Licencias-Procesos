import { Analyst, License, NotificationLog, UserSession } from '../types';
import { INITIAL_ANALYSTS, INITIAL_LICENSES, INITIAL_NOTIFICATIONS } from '../data/initialData';

const STORAGE_KEYS = {
  ANALYSTS: 'dgsisan_analysts_v1',
  LICENSES: 'dgsisan_licenses_v2',
  NOTIFICATIONS: 'dgsisan_notifications_v1',
  CURRENT_USER: 'dgsisan_current_user_v1',
};

export function getStoredAnalysts(): Analyst[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ANALYSTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ANALYSTS, JSON.stringify(INITIAL_ANALYSTS));
      return INITIAL_ANALYSTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading analysts from storage', e);
    return INITIAL_ANALYSTS;
  }
}

export function saveStoredAnalysts(analysts: Analyst[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ANALYSTS, JSON.stringify(analysts));
  } catch (e) {
    console.error('Error saving analysts to storage', e);
  }
}

export function getStoredLicenses(): License[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LICENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(INITIAL_LICENSES));
      return INITIAL_LICENSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading licenses from storage', e);
    return INITIAL_LICENSES;
  }
}

export function saveStoredLicenses(licenses: License[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(licenses));
  } catch (e) {
    console.error('Error saving licenses to storage', e);
  }
}

export function getStoredNotifications(): NotificationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading notifications from storage', e);
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(notifications: NotificationLog[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  } catch (e) {
    console.error('Error saving notifications to storage', e);
  }
}

export function getStoredUserSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveStoredUserSession(session: UserSession | null) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (e) {
    console.error('Error storing user session', e);
  }
}

export function resetAllToDefault() {
  localStorage.removeItem(STORAGE_KEYS.ANALYSTS);
  localStorage.removeItem(STORAGE_KEYS.LICENSES);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  window.location.reload();
}
