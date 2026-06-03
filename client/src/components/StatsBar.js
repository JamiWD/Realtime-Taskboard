import React from 'react';
import { useTasks } from '../context/TaskContext';

const STATUSES = [
  { key: 'todo', label: 'To Do', color: 'var(--todo)', icon: '○' },
  { key: 'in-progress', label: 'In Progress', color: 'var(--in-progress)', icon: '◑' },
  { key: 'review', label: 'Review', color: 'var(--review)', icon: '◕' },
  { key: 'done', label: 'Done', color: 'var(--done)', icon: '●' },
];

export default function StatsBar({ activeFilter, onFilter }) {
  const { stats } = useTasks();

  const getCount = (key) => {
    const found = stats.byStatus?.find((s) => s._id === key);
    return found ? found.count : 0;
  };

  const completion = stats.total
    ? Math.round((getCount('done') / stats.total) * 100)
    : 0;

  return (
    <div className="stats-bar">
      <div className="stats-cards">
        <button
          className={`stat-card ${activeFilter === '' ? 'active' : ''}`}
          onClick={() => onFilter('')}
        >
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">All Tasks</span>
        </button>

        {STATUSES.map((s) => (
          <button
            key={s.key}
            className={`stat-card ${activeFilter === s.key ? 'active' : ''}`}
            onClick={() => onFilter(activeFilter === s.key ? '' : s.key)}
            style={{ '--stat-color': s.color }}
          >
            <span className="stat-number" style={{ color: s.color }}>
              {getCount(s.key)}
            </span>
            <span className="stat-label">
              <span className="stat-dot" style={{ background: s.color }} />
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Overall Progress</span>
          <span className="progress-pct">{completion}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <style>{`
        .stats-bar {
          display: flex; align-items: center; gap: 24px;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          flex-wrap: wrap;
        }
        .stats-cards { display: flex; gap: 8px; }
        .stat-card {
          display: flex; flex-direction: column; gap: 2px;
          padding: 10px 16px; min-width: 80px;
          background: var(--bg-2); border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer; transition: all 0.2s;
          text-align: left;
        }
        .stat-card:hover { border-color: var(--border-light); background: var(--bg-3); }
        .stat-card.active {
          border-color: var(--stat-color, var(--accent));
          background: var(--bg-3);
          box-shadow: 0 0 12px rgba(124,106,247,0.1);
        }
        .stat-number { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; line-height: 1; color: var(--text); }
        .stat-label { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: var(--text-muted); font-weight: 500; white-space: nowrap; }
        .stat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .progress-section { flex: 1; min-width: 160px; max-width: 200px; }
        .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .progress-label { font-size: 0.75rem; color: var(--text-muted); }
        .progress-pct { font-size: 0.8rem; font-weight: 700; font-family: var(--font-display); color: var(--done); }
        .progress-track { height: 6px; background: var(--bg-4); border-radius: 99px; overflow: hidden; }
        .progress-fill {
          height: 100%; background: linear-gradient(90deg, var(--accent), var(--done));
          border-radius: 99px;
          transition: width 0.5s ease;
        }
      `}</style>
    </div>
  );
}
