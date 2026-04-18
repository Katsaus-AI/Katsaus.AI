import { useTranslation } from 'react-i18next';
import { getCategoryCode, getCategoryLabel, normalizeCategory } from '../utils';

function filterLabel(f, t) {
  if (f === 'aloitus') return t('filters.home');
  if (f === 'all') return t('filters.all');
  return getCategoryLabel(f);
}

export function FilterTabs({ currentFilter, categories = [], onFilterChange }) {
  const { t } = useTranslation();
  const filters = ['aloitus', 'all', ...categories.map((category) => normalizeCategory(category))];

  return (
    <div className="filter-tabs">
      {filters.map((f) => (
        <button
          key={f}
          type="button"
          className={`filter-tab ${currentFilter === f ? 'active' : ''}`}
          data-filter={f}
          onClick={() => onFilterChange(f)}
        >
          <span className="filter-tab-number">{getCategoryCode(f)}</span> {filterLabel(f, t).toUpperCase()}
        </button>
      ))}
    </div>
  );
}
