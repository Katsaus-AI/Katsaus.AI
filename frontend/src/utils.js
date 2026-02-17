const THEME_STORAGE_KEY = 'infoahky_theme';
const MESSAGES_STORAGE_KEY = 'infoahky_messages';
const INFOBOX_STORAGE_KEY = 'infoahky_infobox_text';

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

export function getStoredInfoBoxText() {
  return localStorage.getItem(INFOBOX_STORAGE_KEY) || '';
}

export function setStoredInfoBoxText(text) {
  localStorage.setItem(INFOBOX_STORAGE_KEY, text);
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
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) {
      const mins = Math.floor(diff / 60000);
      return mins < 1 ? 'Juuri nyt' : `${mins} min sitten`;
    }
    return `${hours} h sitten`;
  }
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' });
}

const CATEGORY_LABELS = {
  uutisia: 'Uutisia',
  tutkimus: 'Tutkimus',
  yritysyhteistyö: 'Yritysyhteistyö',
  opintohallinto: 'Opintohallinto',
  hr: 'HR',
  johto: 'Johto',
  tuotekehitys: 'Tuotekehitys',
  'it-tuki': 'IT-tuki',
  turvallisuus: 'Turvallisuus',
};
export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

export function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export const DEFAULT_INFOBOX_TEXT =
  'Tervetuloa organisaation tiedotuskanavalle. Tältä sivulta löydät ajankohtaiset uutiset ja tärkeimmät tiedotteet eri kategorioista. Pysy ajan tasalla!';

export const CATEGORIES = ['uutisia', 'tutkimus', 'yritysyhteistyö', 'opintohallinto', 'hr'];
