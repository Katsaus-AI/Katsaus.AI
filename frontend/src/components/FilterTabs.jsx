import React from 'react';
import { getCategoryLabel, CATEGORIES } from '../utils';

const FILTERS = ['aloitus', 'all', ...CATEGORIES];

function filterLabel(f) {
  if (f === 'aloitus') return 'Aloitus';
  if (f === 'all') return 'Kaikki';
  return getCategoryLabel(f);
}

export function FilterTabs({ currentFilter, onFilterChange }) {
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
          {filterLabel(f)}
        </button>
      ))}
    </div>
  );
}
