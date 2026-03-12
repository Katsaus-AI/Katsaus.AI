import React from 'react';
import { getCategoryLabel, CATEGORIES } from '../utils';

const FILTERS = ['aloitus', 'all', ...CATEGORIES];

const FILTER_NUMBERS = {
  'aloitus': '100',
  'all': '150',
  'uutisia': '200',
  'tutkimus': '300',
  'yritysyhteistyö': '400',
  'opintohallinto': '500',
  'hr': '600',
};

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
          <span className="filter-tab-number">{FILTER_NUMBERS[f]}</span> {filterLabel(f).toUpperCase()}
        </button>
      ))}
    </div>
  );
}
