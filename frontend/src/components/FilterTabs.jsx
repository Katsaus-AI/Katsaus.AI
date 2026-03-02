import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCategoryLabel, CATEGORIES } from '../utils';

const FILTERS = ['aloitus', 'all', ...CATEGORIES];

function filterLabel(f, t) {
  if (f === 'aloitus') return t('filters.home');
  if (f === 'all') return t('filters.all');
  return getCategoryLabel(f);
}

export function FilterTabs({ currentFilter, onFilterChange }) {
  const { t } = useTranslation();
  return (
    <div className="filter-tabs">
      {FILTERS.map((f) => (
        <button
          key={f}
          type="button"
          className={`filter-tab ${currentFilter === f ? 'active' : ''}`}
          data-filter={f}
          onClick={() => onFilterChange(f)}
        >
          {filterLabel(f, t)}
        </button>
      ))}
    </div>
  );
}
