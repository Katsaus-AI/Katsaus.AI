import { useState, useEffect, useCallback } from 'react';
import i18n from '../i18n';
import {
  getStoredTheme,
  setStoredTheme,
  getStoredMessages,
  setStoredMessages,
  getStoredInfoBoxText,
  setStoredInfoBoxText,
  generateId,
  parseDate,
  getDefaultInfoBoxText,
  CATEGORIES,
} from '../utils';

/**
 * Applies the selected theme to the DOM by:
 * 1. Setting data-theme attribute on body element for CSS targeting
 * 2. Enabling/disabling theme-specific CSS link elements
 * 
 * @param {string} theme - Theme identifier ('default', 'light', 'teletext', 'youth', 'business')
 */
function applyThemeToDom(theme) {
  document.body.dataset.theme = theme;
  const ids = ['theme-default', 'theme-light', 'theme-teletext', 'theme-youth', 'theme-business'];
  const map = { default: 0, light: 1, teletext: 2, youth: 3, business: 4 };
  ids.forEach((id, i) => {
    const link = document.getElementById(id);
    if (link) link.disabled = map[theme] !== i;
  });
}

/**
 * Centralized state management hook for the entire Katsaus.AI application.
 * 
 * This hook manages all application state including:
 * - Messages (news items): CRUD operations with localStorage persistence
 * - Filters: Category-based filtering and "aloitus" (start page) view
 * - Themes: Visual theme selection with DOM manipulation
 * - View modes: Fullscreen, viewing mode, and admin mode
 * - Modals: Message editing and info box editing
 * - UI state: Expanded items, theme selector visibility, date/time display
 * 
 * Data flow:
 * 1. On mount, fetches messages from /uutiset.json (scraped news data)
 * 2. Falls back to localStorage if fetch fails
 * 3. All message changes are automatically persisted to localStorage
 * 4. Theme changes are applied to DOM and persisted to localStorage
 * 
 * @returns {Object} Application state and action handlers
 * @returns {string} returns.theme - Current theme identifier
 * @returns {Function} returns.setTheme - Update theme and persist to localStorage
 * @returns {Array} returns.messages - All news messages
 * @returns {Function} returns.setMessages - Update messages array
 * @returns {string} returns.currentFilter - Active filter ('aloitus', 'all', or category name)
 * @returns {Function} returns.setCurrentFilter - Change active filter
 * @returns {string} returns.infoBoxText - Info box content (HTML string)
 * @returns {boolean} returns.messageModalOpen - Message modal visibility state
 * @returns {boolean} returns.infoboxModalOpen - Info box modal visibility state
 * @returns {Function} returns.openMessageModal - Open message modal for create/edit
 * @returns {Function} returns.closeMessageModal - Close message modal
 * @returns {Function} returns.setInfoboxModalOpen - Toggle info box modal
 * @returns {string|null} returns.editingId - ID of message being edited (null for new message)
 * @returns {Object|null} returns.editingMessage - Full message object being edited
 * @returns {Function} returns.handleMessageSubmit - Form submit handler for message create/edit
 * @returns {Function} returns.handleInfoboxSubmit - Form submit handler for info box edit
 * @returns {boolean} returns.viewingMode - Viewing mode state (hides admin controls)
 * @returns {boolean} returns.fullscreenMode - Fullscreen mode state
 * @returns {boolean} returns.adminMode - Admin mode state (shows edit controls)
 * @returns {Function} returns.toggleViewingMode - Toggle viewing mode
 * @returns {Function} returns.toggleFullscreen - Toggle fullscreen mode (also triggers browser fullscreen)
 * @returns {Function} returns.toggleAdminMode - Toggle admin mode
 * @returns {Set} returns.expandedIds - Set of expanded message IDs
 * @returns {Function} returns.toggleExpanded - Toggle individual message expansion
 * @returns {Function} returns.editMessage - Open edit modal for specific message
 * @returns {Function} returns.deleteMessage - Delete message with confirmation
 * @returns {Function} returns.toggleMainTopic - Set message as main topic for its category
 * @returns {Object} returns.dateTime - Current time and date {time: string, date: string}
 * @returns {Object} returns.categoryCounts - Message count per category {category: count}
 * @returns {Array} returns.filtered - Messages filtered by current filter, sorted by date
 * @returns {Array} returns.mainTopics - One main topic per category for "aloitus" view
 * @returns {boolean} returns.themeSelectorVisible - Theme selector visibility state
 * @returns {Function} returns.toggleThemeSelector - Toggle theme selector visibility
 */
export function useAppState() {
  const [messages, setMessages] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('aloitus');
  const [infoBoxText, setInfoBoxText] = useState(() => getStoredInfoBoxText() || getDefaultInfoBoxText());
  const [theme, setThemeState] = useState(getStoredTheme);
  const [editingId, setEditingId] = useState(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [infoboxModalOpen, setInfoboxModalOpen] = useState(false);
  const [viewingMode, setViewingMode] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [dateTime, setDateTime] = useState({ time: '', date: '' });
  const [themeSelectorVisible, setThemeSelectorVisible] = useState(false);

  // ============================================
  // THEME MANAGEMENT
  // ============================================
  
  /**
   * Updates theme state, persists to localStorage, and applies to DOM.
   * Wrapped in useCallback to prevent unnecessary re-renders.
   */
  const setTheme = useCallback((t) => {
    setThemeState(t);
    setStoredTheme(t);
    applyThemeToDom(t);
  }, []);

  // Apply theme to DOM on initial mount and when theme changes
  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  // ============================================
  // VIEW MODE EFFECTS
  // ============================================
  
  // Apply CSS class for viewing mode (hides admin controls via CSS)
  useEffect(() => {
    document.body.classList.toggle('viewing-mode', viewingMode);
    return () => document.body.classList.remove('viewing-mode');
  }, [viewingMode]);

  // Apply CSS class for fullscreen mode
  useEffect(() => {
    document.body.classList.toggle('fullscreen-mode', fullscreenMode);
    return () => document.body.classList.remove('fullscreen-mode');
  }, [fullscreenMode]);

  /**
   * Sync fullscreen state with browser's fullscreen API.
   * 
   * When user exits browser fullscreen (e.g., pressing ESC):
   * 1. Reset fullscreenMode state
   * 2. Collapse all expanded messages
   * 
   * This ensures app state stays in sync with browser state.
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenMode(false);
        setExpandedIds(new Set());
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Apply CSS class for admin mode (shows edit/delete buttons via CSS)
  useEffect(() => {
    document.body.classList.toggle('admin-mode', adminMode);
    return () => document.body.classList.remove('admin-mode');
  }, [adminMode]);

  // ============================================
  // DATA FETCHING AND PERSISTENCE
  // ============================================
  
  /**
   * Fetch news messages from scraped data on mount.
   * 
   * Data flow:
   * 1. Try to fetch from /uutiset.json (scraped by Python script)
   * 2. If fetch succeeds: map to internal message format, set first item as main topic
   * 3. If fetch fails: fall back to localStorage
   * 4. Store fetched messages to localStorage for offline access
   * 
   * The random time in parseDate() helps differentiate messages from the same day
   * when sorting by creation date.
   */
  useEffect(() => {
    let cancelled = false;
    fetch('/uutiset.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) {
          if (!cancelled) setMessages(getStoredMessages());
          return;
        }
        const mapped = data.map((item, index) => ({
          id: generateId(),
          title: item.Title,
          content: item.Description,
          category: item.Category || 'uutisia',
          created: parseDate(item.Date), // Adds random time to differentiate same-day messages
          updated: parseDate(item.Date),
          isMainTopic: index === 0, // First message is default main topic
        }));
        setMessages(mapped);
        setStoredMessages(mapped);
      })
      .catch(() => {
        if (!cancelled) setMessages(getStoredMessages());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setStoredMessages(messages);
  }, [messages]);

  useEffect(() => {
    setStoredInfoBoxText(infoBoxText);
  }, [infoBoxText]);

  // ============================================
  // DATE/TIME DISPLAY
  // ============================================
  
  /**
   * Update current time and date display every minute.
   * Uses Finnish locale formatting for display in header.
   */
  useEffect(() => {
    const locale = i18n.language === 'fi' ? 'fi-FI' : 'en-GB';
    const update = () => {
      const now = new Date();
      setDateTime({
        time: now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'numeric' }),
      });
    };
    update();
    const id = setInterval(update, 60000); // Update every 60 seconds
    return () => clearInterval(id);
  }, [i18n.language]);

  useEffect(() => {
    const handleLanguageChange = () => {
      setInfoBoxText(getDefaultInfoBoxText());
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, []);

  // ============================================
  // INFO BOX HANDLERS
  // ============================================
  
  /**
   * Save info box text and persist to localStorage.
   */
  const saveInfoBox = useCallback((text) => {
    setInfoBoxText(text);
  }, []);

  // ============================================
  // MODAL HANDLERS
  // ============================================
  
  /**
   * Open message modal for creating a new message or editing an existing one.
   * @param {Object|null} message - Message to edit, or null for new message
   */
  const openMessageModal = useCallback((message = null) => {
    setEditingId(message ? message.id : null);
    setMessageModalOpen(true);
  }, []);

  /**
   * Close message modal and reset editing state.
   */
  const closeMessageModal = useCallback(() => {
    setMessageModalOpen(false);
    setEditingId(null);
  }, []);

  /**
   * Global keyboard handler for closing modals with ESC key.
   */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (messageModalOpen) closeMessageModal();
        else if (infoboxModalOpen) setInfoboxModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [messageModalOpen, infoboxModalOpen, closeMessageModal]);

  // ============================================
  // MESSAGE CRUD OPERATIONS
  // ============================================
  
  /**
   * Handle message form submission (create or update).
   * 
   * If editingId exists: updates existing message's title, content, category, deadline
   * If editingId is null: creates new message with generated ID and current timestamps
   * 
   * @param {Event} e - Form submit event
   */
  const handleMessageSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const form = e.target;
      const title = form.messageTitle?.value?.trim();
      const content = form.messageContent?.value?.trim();
      const category = form.messageCategory?.value;
      const deadline = form.messageDeadline?.value || null;
      if (!title || !content) return;
      if (editingId) {
        // Update existing message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingId
              ? { ...m, title, content, category, deadline, updated: new Date().toISOString() }
              : m
          )
        );
      } else {
        // Create new message
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            title,
            content,
            category,
            deadline,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        ]);
      }
      form.reset();
      closeMessageModal();
    },
    [editingId, closeMessageModal]
  );

  /**
   * Handle info box form submission.
   * 
   * @param {Event} e - Form submit event
   */
  const handleInfoboxSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const text = e.target.infoboxText?.value?.trim();
      if (text) saveInfoBox(text);
      setInfoboxModalOpen(false);
    },
    [saveInfoBox]
  );

  /**
   * Open edit modal for a specific message.
   * 
   * @param {string} id - Message ID to edit
   */
  const editMessage = useCallback(
    (id) => {
      const msg = messages.find((m) => m.id === id);
      if (msg) openMessageModal(msg);
    },
    [messages, openMessageModal]
  );

  /**
   * Delete a message after user confirmation.
   * Also removes the message from expandedIds set.
   * 
   * @param {string} id - Message ID to delete
   */
  const deleteMessage = useCallback((id) => {
    if (window.confirm(i18n.t('confirm.deleteMessage'))) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  /**
   * Toggle main topic status for a message.
   * 
   * When a message is set as main topic:
   * 1. It becomes the featured message for its category on "aloitus" page
   * 2. All other messages in the same category lose main topic status
   * 
   * Business logic: Only one main topic per category is allowed.
   * 
   * @param {string} id - Message ID to toggle
   */
  const toggleMainTopic = useCallback((id) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.category === msg.category) return { ...m, isMainTopic: m.id === id };
        return m;
      })
    );
  }, [messages]);

  // ============================================
  // UI INTERACTION HANDLERS
  // ============================================
  
  /**
   * Toggle expansion state of a message.
   * 
   * Uses a Set for O(1) lookup performance instead of Array.
   * 
   * @param {string} id - Message ID to toggle
   * @param {boolean} isActionClick - If true, prevents toggling (e.g., clicking edit/delete buttons)
   */
  const toggleExpanded = useCallback((id, isActionClick) => {
    if (isActionClick) return; // Don't toggle when clicking action buttons
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /**
   * Toggle viewing mode (presentation mode that hides admin controls).
   */
  const toggleViewingMode = useCallback(() => {
    setViewingMode((v) => !v);
  }, []);

  /**
   * Toggle fullscreen mode with browser fullscreen API integration.
   * 
   * When entering fullscreen:
   * 1. Expand all messages for better readability
   * 2. Request browser fullscreen mode
   * 
   * When exiting fullscreen:
   * 1. Collapse all messages
   * 2. Exit browser fullscreen mode
   * 
   * Note: Browser fullscreen can also be exited with ESC key,
   * which is handled by fullscreenchange event listener.
   */
  const toggleFullscreen = useCallback(() => {
    setFullscreenMode((f) => {
      const next = !f;
      if (next) {
        // Entering fullscreen: expand all messages
        setExpandedIds(() => new Set(messages.map((m) => m.id)));
        // Request browser fullscreen
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.error('Fullscreen-tilaan siirtyminen epäonnistui:', err);
          });
        }
      } else {
        // Exiting fullscreen: collapse all messages
        setExpandedIds(new Set());
        // Exit browser fullscreen
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch((err) => {
            console.error('Fullscreen-tilasta poistuminen epäonnistui:', err);
          });
        }
      }
      return next;
    });
  }, [messages.length]);

  /**
   * Toggle theme selector visibility.
   */
  const toggleThemeSelector = useCallback(() => {
    setThemeSelectorVisible((v) => !v);
  }, []);

  /**
   * Toggle admin mode (shows edit/delete controls).
   */
  const toggleAdminMode = useCallback(() => {
    setAdminMode((a) => !a);
  }, []);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  /**
   * Count messages per category for stats display.
   * Result: { uutisia: 5, tutkimus: 3, ... }
   */
  const categoryCounts = messages.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});

  /**
   * Filter and sort messages based on current filter.
   * 
   * Filtering:
   * - 'all' or 'aloitus': show all messages
   * - specific category: show only messages in that category
   * 
   * Sorting: newest first (by created date)
   */
  let filtered = [...messages];
  if (currentFilter !== 'all' && currentFilter !== 'aloitus') {
    filtered = filtered.filter((m) => m.category === currentFilter);
  }
  filtered.sort((a, b) => new Date(b.created) - new Date(a.created));

  /**
   * Select one main topic per category for "aloitus" (start page) view.
   * 
   * Selection logic per category:
   * 1. If a message has isMainTopic=true, use that
   * 2. Otherwise, use the newest message in the category
   * 
   * This ensures each category always has a representative on the start page,
   * even if no main topic is explicitly set.
   */
  const mainTopics =
    currentFilter === 'aloitus'
      ? CATEGORIES.map((cat) => {
          const main = messages.find((m) => m.category === cat && m.isMainTopic);
          if (main) return main;
          const inCat = messages.filter((m) => m.category === cat);
          inCat.sort((a, b) => new Date(b.created) - new Date(a.created));
          return inCat[0] || null;
        }).filter(Boolean)
      : [];

  // Find the message being edited (for modal pre-fill)
  const editingMessage = editingId ? messages.find((m) => m.id === editingId) : null;

  return {
    theme,
    setTheme,
    messages,
    setMessages,
    currentFilter,
    setCurrentFilter,
    infoBoxText,
    messageModalOpen,
    infoboxModalOpen,
    openMessageModal,
    closeMessageModal,
    setInfoboxModalOpen,
    editingId,
    editingMessage,
    handleMessageSubmit,
    handleInfoboxSubmit,
    viewingMode,
    fullscreenMode,
    adminMode,
    toggleViewingMode,
    toggleFullscreen,
    toggleAdminMode,
    expandedIds,
    toggleExpanded,
    editMessage,
    deleteMessage,
    toggleMainTopic,
    dateTime,
    categoryCounts,
    filtered,
    mainTopics,
    themeSelectorVisible,
    toggleThemeSelector,
  };
}
