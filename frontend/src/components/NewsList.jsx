import React from 'react';
import { formatDate, getCategoryLabel, escapeHtml } from '../utils';

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

function NewsItemFull({ msg, isExpanded, onToggle, onEdit, onDelete, onToggleMainTopic }) {
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
          {msg.isMainTopic ? 'Poista pääaihe' : 'Aseta pääaiheeksi'}
        </button>
        <button
          type="button"
          className="btn-action btn-edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(msg.id);
          }}
        >
          Muokkaa
        </button>
        <button
          type="button"
          className="btn-action btn-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(msg.id);
          }}
        >
          Poista
        </button>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <div className="empty-state-text">Ei viestejä</div>
    </div>
  );
}

function EmptyStateMainTopics() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <div className="empty-state-text">Ei pääaiheita</div>
    </div>
  );
}

export function NewsList({
  currentFilter,
  mainTopics,
  filtered,
  expandedIds,
  toggleExpanded,
  editMessage,
  deleteMessage,
  toggleMainTopic,
}) {
  if (currentFilter === 'aloitus') {
    return (
      <>
        {mainTopics.length > 0 ? (
          <>
            <h3 className="main-topics-title">Pääaiheet</h3>
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
          <EmptyStateMainTopics />
        )}
      </>
    );
  }

  if (filtered.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="news-list">
      {filtered.map((msg) => (
        <NewsItemFull
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
