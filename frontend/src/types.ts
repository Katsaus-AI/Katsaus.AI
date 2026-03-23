/**
 * TypeScript type definitions for Katsaus.AI application.
 * 
 * This file provides type safety and documentation for core data structures.
 * While the app is currently JavaScript, these types serve as documentation
 * and can be used for gradual TypeScript migration.
 */

// ============================================
// CATEGORY TYPES
// ============================================

/**
 * Available news categories.
 * 
 * Categories determine:
 * - Message filtering and grouping
 * - Tab navigation in FilterTabs component
 * - Main topic selection for "aloitus" page
 */
export type Category =
  | 'uutisia'           // General news
  | 'tutkimus'          // Research
  | 'yritysyhteistyö'   // Business collaboration
  | 'opintohallinto'    // Study administration
  | 'hr'                // Human resources
  | 'johto'             // Management (legacy, may not be in active use)
  | 'tuotekehitys'      // Product development (legacy)
  | 'it-tuki'           // IT support (legacy)
  | 'turvallisuus';     // Security (legacy)

/**
 * Active categories currently in use.
 * Subset of Category type that determines which tabs are shown in UI.
 */
export type ActiveCategory = Extract<Category, 'uutisia' | 'tutkimus' | 'yritysyhteistyö' | 'opintohallinto' | 'hr'>;

// ============================================
// THEME TYPES
// ============================================

/**
 * Visual theme identifiers.
 * 
 * Each theme has a corresponding CSS file in /css/ directory:
 * - default: css/style-teletext.css (classic teletext look)
 * - light: css/style-light.css (light background variant)
 * - teletext: css/style-teletext.css (explicit teletext)
 * - youth: css/style-youth.css (modern, colorful design)
 * - business: css/style-business.css (professional corporate look)
 */
export type Theme = 'default' | 'light' | 'teletext' | 'youth' | 'business';

// ============================================
// FILTER TYPES
// ============================================

/**
 * Filter modes for message display.
 * 
 * - 'aloitus': Start page showing one main topic per category
 * - 'all': Show all messages across all categories
 * - Category: Show messages from specific category only
 */
export type FilterMode = 'aloitus' | 'all' | Category;

// ============================================
// MESSAGE TYPES
// ============================================

/**
 * News message object.
 * 
 * Represents a single news item or announcement in the system.
 * 
 * Data flow:
 * 1. Created from scraped data (/uutiset.json) or manual entry
 * 2. Stored in React state (useAppState hook)
 * 3. Persisted to localStorage for offline access
 * 
 * @property id - Unique identifier (generated via generateId() utility)
 * @property title - Message headline (max 100 chars in UI)
 * @property content - Message body/description (max 500 chars in UI)
 * @property category - Category classification
 * @property created - ISO 8601 timestamp of message creation
 * @property updated - ISO 8601 timestamp of last update
 * @property deadline - Optional deadline in YYYY-MM-DD format
 * @property isMainTopic - Whether this is the featured message for its category on "aloitus" page
 */
export interface Message {
  id: string;
  title: string;
  content: string;
  category: Category;
  created: string;        // ISO 8601 format (e.g., "2024-03-12T14:23:00.000Z")
  updated: string;        // ISO 8601 format
  deadline?: string;      // YYYY-MM-DD format (e.g., "2024-12-31")
  isMainTopic?: boolean;  // Default: false
}

/**
 * Scraped article data structure (from /uutiset.json).
 * 
 * This is the raw format from the Python scraper before transformation to Message.
 * 
 * @property Title - Article headline
 * @property Date - Publication date in format "D.M.YYYY"
 * @property Description - Article summary
 * @property Link - Full URL to original article
 * @property Image - URL to cover image
 * @property Category - Optional category classification
 */
export interface ScrapedArticle {
  Title: string;
  Date: string;           // Format: "D.M.YYYY" (e.g., "12.3.2024")
  Description: string;
  Link: string;
  Image: string;
  Category?: string;
}

// ============================================
// UI STATE TYPES
// ============================================

/**
 * Date/time display object for header.
 * 
 * Updates every minute via setInterval in useAppState.
 */
export interface DateTime {
  time: string;  // Format: "HH:MM" (e.g., "14:30")
  date: string;  // Format: Finnish short date (e.g., "pe 12.3")
}

/**
 * Category message counts for stats display.
 * 
 * Example: { uutisia: 5, tutkimus: 3, hr: 2 }
 */
export type CategoryCounts = Record<string, number>;

// ============================================
// VIEW MODE TYPES
// ============================================

/**
 * Application view modes affecting UI display.
 */
export interface ViewModes {
  /**
   * Viewing mode: Hides admin controls for presentation.
   * Toggled via eye icon in header.
   */
  viewingMode: boolean;
  
  /**
   * Fullscreen mode: Expands all messages and enters browser fullscreen.
   * Toggled via fullscreen icon in header.
   */
  fullscreenMode: boolean;
  
  /**
   * Admin mode: Shows edit/delete buttons for messages.
   * Toggled via gear icon in header.
   */
  adminMode: boolean;
}

// ============================================
// MODAL STATE TYPES
// ============================================

/**
 * Modal visibility and state.
 */
export interface ModalState {
  /**
   * Message create/edit modal visibility.
   */
  messageModalOpen: boolean;
  
  /**
   * Info box edit modal visibility.
   */
  infoboxModalOpen: boolean;
  
  /**
   * ID of message being edited (null = creating new message).
   */
  editingId: string | null;
}

// ============================================
// LOCALSTORAGE TYPES
// ============================================

/**
 * Keys used for localStorage persistence.
 * Defined in utils.js but documented here for reference.
 */
export const STORAGE_KEYS = {
  THEME: 'infoahky_theme',
  MESSAGES: 'infoahky_messages',
  INFOBOX: 'infoahky_infobox_text',
} as const;

// ============================================
// FIRESTORE TYPES
// ============================================

/**
 * Company document structure in Firestore.
 * 
 * Collection: 'companies'
 * Used in Header component to fetch organization name.
 */
export interface CompanyDocument {
  company_name: string;
  // Add other fields as needed
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

/**
 * Common props passed to message item components.
 */
export interface MessageItemProps {
  message: Message;
  isExpanded: boolean;
  onToggle: (id: string, isActionClick: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleMainTopic?: (id: string) => void;
}

/**
 * Props for FilterTabs component.
 */
export interface FilterTabsProps {
  currentFilter: FilterMode;
  onFilterChange: (filter: FilterMode) => void;
  categoryCounts: CategoryCounts;
}

/**
 * Props for ThemeSelector component.
 */
export interface ThemeSelectorProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Helper type to extract keys from an object type.
 */
export type Keys<T> = keyof T;

/**
 * Helper type to make specific properties optional.
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Helper type to make specific properties required.
 */
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
