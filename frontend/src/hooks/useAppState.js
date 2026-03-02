import { useState, useEffect, useCallback } from 'react';
import {
  getStoredTheme,
  setStoredTheme,
  getStoredMessages,
  setStoredMessages,
  getStoredInfoBoxText,
  setStoredInfoBoxText,
  generateId,
  parseDate,
  DEFAULT_INFOBOX_TEXT,
  CATEGORIES,
} from '../utils';

function applyThemeToDom(theme) {
  document.body.dataset.theme = theme;
  const ids = ['theme-light', 'theme-teletext', 'theme-youth', 'theme-business'];
  const map = { light: 0, teletext: 1, youth: 2, business: 3 };
  ids.forEach((id, i) => {
    const link = document.getElementById(id);
    if (link) link.disabled = map[theme] !== i;
  });
}

export function useAppState() {
  const [messages, setMessages] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('aloitus');
  const [infoBoxText, setInfoBoxText] = useState(DEFAULT_INFOBOX_TEXT);
  const [theme, setThemeState] = useState(getStoredTheme);
  const [editingId, setEditingId] = useState(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [infoboxModalOpen, setInfoboxModalOpen] = useState(false);
  const [viewingMode, setViewingMode] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [dateTime, setDateTime] = useState({ time: '', date: '' });

  const setTheme = useCallback((t) => {
    setThemeState(t);
    setStoredTheme(t);
    applyThemeToDom(t);
  }, []);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('viewing-mode', viewingMode);
    return () => document.body.classList.remove('viewing-mode');
  }, [viewingMode]);

  useEffect(() => {
    document.body.classList.toggle('fullscreen-mode', fullscreenMode);
    return () => document.body.classList.remove('fullscreen-mode');
  }, [fullscreenMode]);

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
          created: parseDate(item.Date),
          updated: parseDate(item.Date),
          isMainTopic: index === 0,
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
    setInfoBoxText(getStoredInfoBoxText() || DEFAULT_INFOBOX_TEXT);
  }, []);

  useEffect(() => {
    setStoredMessages(messages);
  }, [messages]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDateTime({
        time: now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' }),
      });
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  const saveInfoBox = useCallback((text) => {
    setInfoBoxText(text);
    setStoredInfoBoxText(text);
  }, []);

  const openMessageModal = useCallback((message = null) => {
    setEditingId(message ? message.id : null);
    setMessageModalOpen(true);
  }, []);

  const closeMessageModal = useCallback(() => {
    setMessageModalOpen(false);
    setEditingId(null);
  }, []);

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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingId
              ? { ...m, title, content, category, deadline, updated: new Date().toISOString() }
              : m
          )
        );
      } else {
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

  const handleInfoboxSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const text = e.target.infoboxText?.value?.trim();
      if (text) saveInfoBox(text);
      setInfoboxModalOpen(false);
    },
    [saveInfoBox]
  );

  const editMessage = useCallback(
    (id) => {
      const msg = messages.find((m) => m.id === id);
      if (msg) openMessageModal(msg);
    },
    [messages, openMessageModal]
  );

  const deleteMessage = useCallback((id) => {
    if (window.confirm('Haluatko poistaa tämän viestin?')) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

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

  const toggleExpanded = useCallback((id, isActionClick) => {
    if (isActionClick) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleViewingMode = useCallback(() => {
    setViewingMode((v) => !v);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setFullscreenMode((f) => {
      const next = !f;
      if (next) setExpandedIds(() => new Set(messages.map((m) => m.id)));
      else setExpandedIds(new Set());
      return next;
    });
  }, [messages.length]);

  const categoryCounts = messages.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});

  let filtered = [...messages];
  if (currentFilter !== 'all' && currentFilter !== 'aloitus') {
    filtered = filtered.filter((m) => m.category === currentFilter);
  }
  filtered.sort((a, b) => new Date(b.created) - new Date(a.created));

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

  const editingMessage = editingId ? messages.find((m) => m.id === editingId) : null;

  return {
    theme,
    setTheme,
    messages,
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
    toggleViewingMode,
    toggleFullscreen,
    expandedIds,
    toggleExpanded,
    editMessage,
    deleteMessage,
    toggleMainTopic,
    dateTime,
    categoryCounts,
    filtered,
    mainTopics,
  };
}
