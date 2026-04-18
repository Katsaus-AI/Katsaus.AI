import i18n from './i18n';

const THEME_STORAGE_KEY = 'infoahky_theme';
const MESSAGES_STORAGE_KEY = 'infoahky_messages';
const INFOBOX_STORAGE_KEY = 'infoahky_infobox';

export const THEMES = { DEFAULT: 'default', LIGHT: 'light', TELETEXT: 'teletext', YOUTH: 'youth', BUSINESS: 'business' };

export function getStoredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (Object.values(THEMES).includes(saved)) return saved;
  return THEMES.DEFAULT;
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
  jyu: 'categories.jyu',
  atlassian: 'categories.atlassian',
  aalto: 'categories.aalto',
  helsinki: 'categories.helsinki',
  tampere: 'categories.tampere',
  turku: 'categories.turku',
  oulu: 'categories.oulu',
  uef: 'categories.uef',
  lut: 'categories.lut',
  'abo-akademi': 'categories.aboAkademi',
  hanken: 'categories.hanken',
  lapland: 'categories.lapland',
  vaasa: 'categories.vaasa',
  uniarts: 'categories.uniarts',
  yle: 'categories.yle',
  bbc: 'categories.bbc',
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

const CATEGORY_ALIASES = {
  'abo akademi': 'abo-akademi',
  'abo_academi': 'abo-akademi',
  'aboakademi': 'abo-akademi',
  it: 'it-tuki',
  'it tuki': 'it-tuki',
  'it_tuki': 'it-tuki',
};

const CATEGORY_CODES = {
  aloitus: '100',
  all: '150',
  uutisia: '200',
  tutkimus: '300',
  yritysyhteistyö: '400',
  opintohallinto: '500',
  hr: '600',
  johto: '700',
  tuotekehitys: '800',
  'it-tuki': '900',
  turvallisuus: '990',
  jyu: '210',
  atlassian: '220',
  aalto: '230',
  helsinki: '240',
  tampere: '250',
  turku: '260',
  oulu: '270',
  uef: '280',
  lut: '290',
  'abo-akademi': '310',
  hanken: '320',
  lapland: '330',
  vaasa: '340',
  uniarts: '350',
  yle: '360',
  bbc: '370',
};

export function normalizeCategory(category) {
  const raw = String(category || '').trim().toLowerCase();
  if (!raw) return 'uutisia';
  return CATEGORY_ALIASES[raw] || raw;
}

export function getCategoryCode(category) {
  const normalized = normalizeCategory(category);
  if (CATEGORY_CODES[normalized]) return CATEGORY_CODES[normalized];

  // Stable fallback code for unknown categories.
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) % 900;
  }
  return String(100 + hash).padStart(3, '0');
}

export function getCategoryLabel(category) {
  const normalized = normalizeCategory(category);
  const i18nKey = CATEGORY_I18N_KEYS[normalized];
  if (!i18nKey) return category;
  const translated = i18n.t(i18nKey);
  return translated !== i18nKey ? translated : normalized;
}

export function getCategoryI18nKey(category) {
  return CATEGORY_I18N_KEYS[normalizeCategory(category)] || null;
}

export const CATEGORIES = ['uutisia', 'tutkimus', 'yritysyhteistyö', 'opintohallinto', 'hr', 'johto', 'tuotekehitys', 'it-tuki', 'turvallisuus'];

export function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function renderMarkdown(text) {
  if (text == null) return '';
  let escaped = escapeHtml(text);
  // Replace **bold** with <strong>bold</strong>
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return escaped;
}

export function getDefaultInfoBoxText() {
  return i18n.t('infobox.defaultText');
}

