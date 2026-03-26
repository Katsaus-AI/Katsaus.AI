/**
 * News list component and message item renderers.
 * 
 * This file contains:
 * - NewsItemMainTopic: Simplified message view for "aloitus" (start page)
 * - NewsItemFull: Full message view with admin controls
 * - NewsList: Main container that switches between view modes
 * - Empty state components
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, getCategoryLabel, escapeHtml } from '../utils';

/**
 * News item component for "aloitus" (start page) view.
 * 
 * Displays one featured message per category with simplified layout:
 * - No admin controls (edit/delete buttons)
 * - No main topic badge
 * - No deadline display
 * - Click to expand/collapse content
 * 
 * This component provides a clean overview of the most important
 * message from each category.
 * 
 * Accessibility:
 * - role="button": Indicates interactive element for screen readers
 * - tabIndex={0}: Makes element keyboard-focusable
 * - onKeyDown: Supports Enter/Space keyboard activation
 * - onClick: Mouse/touch interaction
 * 
 * @param {Object} props
 * @param {Object} props.msg - Message object
 * @param {boolean} props.isExpanded - Whether content is visible
 * @param {Function} props.onToggle - Callback to toggle expansion: (id, isActionClick) => void
 */
function NewsItemMainTopic({ msg, isExpanded, onToggle }) {
  return (
    <li
      className={`news-item main-topic-item ${isExpanded ? 'expanded' : ''}`}
      data-id={msg.id}
      onClick={() => onToggle(msg.id, false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(msg.id, false);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="news-header">
        <div className="news-title">{escapeHtml(msg.title)}</div>
        <div className="news-right">
          <span className={`news-category ${msg.category}`}>{getCategoryLabel(msg.category)}</span>
          <div className="news-meta">{formatDate(msg.created)}</div>
        </div>
      </div>
      <div className="news-content">{escapeHtml(msg.content)}</div>
    </li>
  );
}

function NewsItemFull({ msg, isExpanded, onToggle, onEdit, onDelete, onToggleMainTopic, t }) {
  return (
    <li
      className={`news-item ${msg.isMainTopic ? 'is-main-topic' : ''} ${isExpanded ? 'expanded' : ''}`}
      data-id={msg.id}
      onClick={(e) => {
        if (e.target.closest('.news-actions')) return;
        onToggle(msg.id, false);
      }}
      onKeyDown={(e) => {
        if (e.target.closest('.news-actions')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(msg.id, false);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="news-header">
        <div className="news-title">
          {msg.isMainTopic && <span className="main-topic-badge">★</span>}
          {escapeHtml(msg.title)}
        </div>
        <div className="news-right">
          <span className={`news-category ${msg.category}`}>{getCategoryLabel(msg.category)}</span>
          {msg.deadline && (
            <div className="news-deadline-highlight">
              <span>{t('news.deadline', { deadline: msg.deadline })}</span>
            </div>
          )}
          <div className="news-meta">{formatDate(msg.created)}</div>
        </div>
      </div>
      <div className="news-content">{escapeHtml(msg.content)}</div>
      <div className="news-actions">
        <button
          type="button"
          className="btn-action btn-main-topic"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMainTopic(msg.id);
          }}
        >
          {msg.isMainTopic ? t('news.removeMainTopic') : t('news.setMainTopic')}
        </button>
        <button
          type="button"
          className="btn-action btn-edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(msg.id);
          }}
        >
          {t('news.edit')}
        </button>
        <button
          type="button"
          className="btn-action btn-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(msg.id);
          }}
        >
          {t('news.delete')}
        </button>
      </div>
    </li>
  );
}

function EmptyState({ t }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <div className="empty-state-text">{t('news.noMessages')}</div>
    </div>
  );
}

function EmptyStateMainTopics({ t }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <div className="empty-state-text">{t('news.noMainTopics')}</div>
    </div>
  );
}

/**
 * Main news list container component.
 * 
 * Renders different views based on current filter:
 * 
 * 1. "aloitus" (start page):
 *    - Shows one main topic per category
 *    - Uses NewsItemMainTopic component (simplified view)
 *    - Displays "Pääaiheet" heading
 *    - Shows EmptyStateMainTopics if no messages exist
 * 
 * 2. Specific category or "all":
 *    - Shows all filtered messages
 *    - Uses NewsItemFull component (full view with admin controls)
 *    - Messages are sorted by creation date (newest first)
 *    - Shows EmptyState if no messages match filter
 * 
 * View switching logic:
 * - currentFilter === 'aloitus' → main topics view
 * - currentFilter === 'all' or category → full list view
 * 
 * Props:
 * @param {Object} props
 * @param {string} props.currentFilter - Active filter ('aloitus', 'all', or category name)
 * @param {Array} props.mainTopics - One featured message per category (for "aloitus" view)
 * @param {Array} props.filtered - Filtered and sorted messages (for category/all views)
 * @param {Set} props.expandedIds - Set of expanded message IDs (for O(1) lookup)
 * @param {Function} props.toggleExpanded - Toggle message expansion
 * @param {Function} props.editMessage - Open edit modal for message
 * @param {Function} props.deleteMessage - Delete message with confirmation
 * @param {Function} props.toggleMainTopic - Toggle main topic status
 * @param {Function} props.onReorder - (Future) Drag-and-drop reordering callback
 * 
 * Future enhancement:
 * onReorder prop is reserved for drag-and-drop functionality.
 * When implemented, users will be able to manually reorder messages
 * within a category by dragging items.
 */
export function NewsList({
  currentFilter,
  mainTopics,
  filtered,
  expandedIds,
  toggleExpanded,
  editMessage,
  deleteMessage,
  toggleMainTopic,
  onReorder,
}) {
  const { t } = useTranslation();
  if (currentFilter === 'aloitus') {
    return (
      <>
        {mainTopics.length > 0 ? (
          <>
            <h3 className="main-topics-title">{t('news.mainTopicsTitle')}</h3>
            <ul className="news-list main-topics-list">
              {mainTopics.map((msg) => (
                <NewsItemMainTopic
                  key={msg.id}
                  msg={msg}
                  isExpanded={expandedIds.has(msg.id)}
                  onToggle={toggleExpanded}
                />
              ))}
            </ul>
          </>
        ) : (
          <EmptyStateMainTopics t={t} />
        )}
      </>
    );
  }

  if (filtered.length === 0) {
    return <EmptyState t={t} />;
  }

  return (
    <ul className="news-list">
      {filtered.map((msg) => (
        <NewsItemFull
          t={t}
          key={msg.id}
          msg={msg}
          isExpanded={expandedIds.has(msg.id)}
          onToggle={toggleExpanded}
          onEdit={editMessage}
          onDelete={deleteMessage}
          onToggleMainTopic={toggleMainTopic}
        />
      ))}
    </ul>
  );
}
