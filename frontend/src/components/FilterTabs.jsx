import { useTranslation } from 'react-i18next';
import { getCategoryLabel } from '../utils';

const FILTER_NUMBERS = {
  'aloitus': '100',
  'all': '150',
  'uutisia': '200',
  'tutkimus': '300',
  'yritysyhteistyö': '400',
  'opintohallinto': '500',
  'hr': '600',
  'johto': '700',
  'tuotekehitys': '800',
  'it-tuki': '900',
  'turvallisuus': '990',
};

function filterLabel(f, t) {
  if (f === 'aloitus') return t('filters.home');
  if (f === 'all') return t('filters.all');
  return getCategoryLabel(f);
}

export function FilterTabs({ currentFilter, categories = [], onFilterChange }) {
  const { t } = useTranslation();
  const filters = ['aloitus', 'all', ...categories];

  return (
    <div className="filter-tabs">
      {filters.map((f, index) => (
        <button
          key={f}
          type="button"
          className={`filter-tab ${currentFilter === f ? 'active' : ''}`}
          data-filter={f}
          onClick={() => onFilterChange(f)}
        >
          <span className="filter-tab-number">{FILTER_NUMBERS[f] || String(200 + index * 10)}</span> {filterLabel(f, t).toUpperCase()}
        </button>
      ))}
    </div>
  );
}
