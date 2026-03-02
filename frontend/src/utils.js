import i18n from './i18n';

const THEME_STORAGE_KEY = 'infoahky_theme';
const MESSAGES_STORAGE_KEY = 'infoahky_messages';

export const THEMES = { LIGHT: 'light', TELETEXT: 'teletext', YOUTH: 'youth', BUSINESS: 'business' };

export function getStoredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (Object.values(THEMES).includes(saved)) return saved;
  return THEMES.LIGHT;
}

export function setStoredTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function getStoredMessages() {
  try {
    const s = localStorage.getItem(MESSAGES_STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function setStoredMessages(messages) {
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function parseDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    date.setHours(Math.floor(Math.random() * 12) + 8);
    date.setMinutes(Math.floor(Math.random() * 60));
    return date.toISOString();
  }
  return new Date().toISOString();
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const locale = i18n.language === 'fi' ? 'fi-FI' : 'en-GB';
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) {
      const mins = Math.floor(diff / 60000);
      return mins < 1 ? i18n.t('time.justNow') : i18n.t('time.minutesAgo', { count: mins });
    }
    return i18n.t('time.hoursAgo', { count: hours });
  }
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'numeric' });
}

const CATEGORY_I18N_KEYS = {
  uutisia: 'categories.news',
  tutkimus: 'categories.research',
  yritysyhteistyö: 'categories.corporateCooperation',
  opintohallinto: 'categories.academicAdmin',
  hr: 'categories.hr',
  johto: 'categories.management',
  tuotekehitys: 'categories.productDevelopment',
  'it-tuki': 'categories.itSupport',
  turvallisuus: 'categories.security',
};

export function getCategoryLabel(category) {
  const i18nKey = CATEGORY_I18N_KEYS[category];
  if (!i18nKey) return category;
  const translated = i18n.t(i18nKey);
  return translated !== i18nKey ? translated : category;
}

export function getCategoryI18nKey(category) {
  return CATEGORY_I18N_KEYS[category] || null;
}

export function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function getDefaultInfoBoxText() {
  return i18n.t('infobox.defaultText');
}

export const CATEGORIES = ['uutisia', 'tutkimus', 'yritysyhteistyö', 'opintohallinto', 'hr'];
