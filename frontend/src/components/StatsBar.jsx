import React from 'react';
import { getCategoryLabel } from '../utils';
import { CATEGORIES } from '../utils';

export function StatsBar({ categoryCounts, totalCount }) {
  return (
    <div className="stats-bar">
      {CATEGORIES.map((cat) => (
        <div key={cat} className="stat-item">
          <div className="stat-value">{categoryCounts[cat] || 0}</div>
          <div className="stat-label">{getCategoryLabel(cat)}</div>
        </div>
      ))}
      <div className="stat-item">
        <div className="stat-value">{totalCount}</div>
        <div className="stat-label">Yhteensä</div>
      </div>
    </div>
  );
}
