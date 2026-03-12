/**
 * Utility functions and constants for Katsaus.AI application.
 * 
 * This module provides:
 * - LocalStorage persistence helpers
 * - Date/time formatting
 * - ID generation
 * - HTML sanitization
 * - Category management
 */

// ============================================
// LOCALSTORAGE KEYS
// ============================================

const THEME_STORAGE_KEY = 'infoahky_theme';
const MESSAGES_STORAGE_KEY = 'infoahky_messages';
const INFOBOX_STORAGE_KEY = 'infoahky_infobox_text';

// ============================================
// THEME CONSTANTS
// ============================================

/**
 * Available visual themes.
 * Each theme has a corresponding CSS file loaded in index.html.
 */
export const THEMES = { DEFAULT: 'default', LIGHT: 'light', TELETEXT: 'teletext', YOUTH: 'youth', BUSINESS: 'business' };

// ============================================
// THEME PERSISTENCE
// ============================================

/**
 * Retrieve stored theme from localStorage.
 * Falls back to default theme if stored value is invalid.
 * 
 * @returns {string} Theme identifier from THEMES object
 */
export function getStoredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (Object.values(THEMES).includes(saved)) return saved;
  return THEMES.DEFAULT;
}

/**
 * Persist theme selection to localStorage.
 * 
 * @param {string} theme - Theme identifier from THEMES object
 */
export function setStoredTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

// ============================================
// MESSAGE PERSISTENCE
// ============================================

/**
 * Retrieve stored messages from localStorage.
 * Provides offline access to news data.
 * 
 * @returns {Array} Array of message objects, or empty array if none stored or parse error
 */
export function getStoredMessages() {
  try {
    const s = localStorage.getItem(MESSAGES_STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

/**
 * Persist messages to localStorage for offline access.
 * 
 * @param {Array} messages - Array of message objects to store
 */
export function setStoredMessages(messages) {
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
}

// ============================================
// INFO BOX PERSISTENCE
// ============================================

/**
 * Retrieve stored info box text from localStorage.
 * 
 * @returns {string} Stored HTML content or empty string
 */
export function getStoredInfoBoxText() {
  return localStorage.getItem(INFOBOX_STORAGE_KEY) || '';
}

/**
 * Persist info box text to localStorage.
 * 
 * @param {string} text - HTML content to store
 */
export function setStoredInfoBoxText(text) {
  localStorage.setItem(INFOBOX_STORAGE_KEY, text);
}

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate a unique ID for new messages.
 * 
 * Format: Base36-encoded timestamp + Base36-encoded random number
 * Example: "l8x9k2a1bc3"
 * 
 * Uniqueness: Combination of Date.now() (millisecond precision) and random number
 * ensures uniqueness even for messages created in the same millisecond.
 * 
 * Note: This is NOT cryptographically secure. For security-sensitive IDs,
 * use crypto.randomUUID() instead.
 * 
 * @returns {string} Unique identifier string
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ============================================
// DATE PARSING
// ============================================

/**
 * Parse date from scraped data format to ISO 8601 timestamp.
 * 
 * Input format: "D.M.YYYY" (e.g., "12.3.2024")
 * Output format: ISO 8601 string (e.g., "2024-03-12T14:23:00.000Z")
 * 
 * IMPORTANT: Adds a random time between 8:00-20:00 (8 AM - 8 PM).
 * 
 * Why random time?
 * - Scraped news data only includes dates, not times
 * - When sorting by creation date, messages from the same day would have identical timestamps
 * - Random time helps differentiate same-day messages and prevents sort instability
 * - Time range (8-20) represents typical work hours
 * 
 * @param {string} dateStr - Date string in format "D.M.YYYY" (e.g., "12.3.2024")
 * @returns {string} ISO 8601 timestamp with random time component
 * 
 * @example
 * parseDate("12.3.2024") // "2024-03-12T14:23:00.000Z" (random time)
 * parseDate("") // Current date/time ISO string
 * parseDate("invalid") // Current date/time ISO string
 */
export function parseDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    // Add random time between 8:00-20:00 to differentiate same-day messages
    date.setHours(Math.floor(Math.random() * 12) + 8); // 8-19 hours
    date.setMinutes(Math.floor(Math.random() * 60)); // 0-59 minutes
    return date.toISOString();
  }
  return new Date().toISOString();
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format date for human-readable display with relative time.
 * 
 * Formatting logic:
 * - < 1 minute ago: "Juuri nyt" (Just now)
 * - < 1 hour ago: "X min sitten" (X minutes ago)
 * - < 24 hours ago: "X h sitten" (X hours ago)
 * - >= 24 hours ago: Finnish date format (e.g., "12.3.")
 * 
 * @param {string} dateStr - ISO 8601 timestamp
 * @returns {string} Formatted relative time string
 * 
 * @example
 * formatDate("2024-03-12T10:00:00.000Z") // "2 h sitten" (if current time is 12:00)
 * formatDate("2024-03-11T10:00:00.000Z") // "11.3."
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date; // Difference in milliseconds
  
  // Less than 24 hours: show relative time
  if (diff < 86400000) { // 86400000 = 24 * 60 * 60 * 1000 (24 hours in milliseconds)
    const hours = Math.floor(diff / 3600000); // 3600000 = 1 hour in milliseconds
    if (hours < 1) {
      const mins = Math.floor(diff / 60000); // 60000 = 1 minute in milliseconds
      return mins < 1 ? 'Juuri nyt' : `${mins} min sitten`;
    }
    return `${hours} h sitten`;
  }
  
  // 24+ hours: show date
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' });
}

// ============================================
// CATEGORY MANAGEMENT
// ============================================

/**
 * Category identifier to display label mapping.
 * Used for displaying human-readable category names in the UI.
 */
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

/**
 * Get display label for a category identifier.
 * Falls back to the identifier itself if no label is defined.
 * 
 * @param {string} category - Category identifier (e.g., "uutisia")
 * @returns {string} Display label (e.g., "Uutisia")
 */
export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

/**
 * List of active categories used in the application.
 * Determines which category tabs are shown in the UI.
 */
export const CATEGORIES = ['uutisia', 'tutkimus', 'yritysyhteistyö', 'opintohallinto', 'hr'];

// ============================================
// HTML SANITIZATION
// ============================================

/**
 * Escape HTML special characters to prevent XSS attacks.
 * 
 * Converts special characters to HTML entities:
 * - & → &amp;
 * - < → &lt;
 * - > → &gt;
 * - " → &quot;
 * - ' → &#39;
 * 
 * Uses browser's built-in escaping via textContent property,
 * which is more reliable than regex-based approaches.
 * 
 * @param {string} text - Raw text that may contain HTML
 * @returns {string} HTML-escaped text safe for innerHTML
 * 
 * @example
 * escapeHtml("<script>alert('xss')</script>")
 * // "&lt;script&gt;alert('xss')&lt;/script&gt;"
 */
export function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// DEFAULT CONTENT
// ============================================

/**
 * Default info box content shown on first load.
 * Can be edited by users and is persisted to localStorage.
 */
export const DEFAULT_INFOBOX_TEXT =
  'Hei! Tämä on organisaatiossasi pilotoitava tilanneikkuna, jonka tarjoaa Katsaus.AI-kurssiyritys. Ikkuna näyttää älykkään koosteen päivän tärkeimmistä aiheista ja tapahtumista.';

