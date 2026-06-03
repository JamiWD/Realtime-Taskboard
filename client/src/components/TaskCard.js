import React, { useState } from 'react';
import { format } from 'date-fns';
import { useTasks } from '../context/TaskContext';
import toast from 'react-hot-toast';

const PRIORITY_ICONS = { low: '↓', medium: '→', high: '↑', critical: '⚡' };

function Avatar({ name, color }) {
  return (
    <div className="avatar avatar-sm" style={{ background: color || '#7c6af7' }} title={name}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

export default function TaskCard({ task, onClick }) {
  const { deleteTask, updateTask } = useTasks();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      await deleteTask(task._id);
    } catch {
      toast.error('Failed to delete task');
      setDeleting(false);
    }
  };

  const handleStatusCycle = async (e) => {
    e.stopPropagation();
    const cycle = { todo: 'in-progress', 'in-progress': 'review', review: 'done', done: 'todo' };
    try {
      await updateTask(task._id, { status: cycle[task.status] });
    } catch {
      toast.error('Update failed');
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const commentCount = task.comments?.length || 0;

  return (
    <div
      className={`task-card ${task.status === 'done' ? 'done' : ''}`}
      onClick={() => onClick(task)}
    >
      {/* Priority stripe */}
      <div className={`priority-stripe priority-${task.priority}`} />

      <div className="task-card-content">
        {/* Header row */}
        <div className="task-card-header">
          <div className="task-badges">
            <span className={`badge badge-${task.priority}`}>
              {PRIORITY_ICONS[task.priority]} {task.priority}
            </span>
          </div>
          <button
            className="task-delete-btn"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
          >
            {deleting ? '…' : '×'}
          </button>
        </div>

        {/* Title */}
        <h4 className="task-title">{task.title}</h4>

        {/* Description */}
        {task.description && (
          <p className="task-desc">{task.description}</p>
        )}

        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="task-tags">
            {task.tags.slice(0, 3).map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
            {task.tags.length > 3 && (
              <span className="tag">+{task.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="task-card-footer">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <Avatar name={task.assignee.name} color={task.assignee.color} />
            ) : (
              <div className="avatar avatar-sm unassigned" title="Unassigned">?</div>
            )}
            {commentCount > 0 && (
              <span className="task-meta-chip">💬 {commentCount}</span>
            )}
            {isOverdue && (
              <span className="task-meta-chip overdue">⚠️ Overdue</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={`task-due ${isOverdue ? 'overdue-text' : ''}`}>
                📅 {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
            <button
              className={`status-cycle-btn status-${task.status}`}
              onClick={handleStatusCycle}
              title="Advance status"
            >
              ↻
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .task-card {
          position: relative;
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          overflow: hidden;
          transition: all 0.18s ease;
          animation: slideInRight 0.2s ease;
        }
        .task-card:hover {
          border-color: var(--border-light);
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }
        .task-card.done { opacity: 0.6; }
        .task-card.done .task-title { text-decoration: line-through; color: var(--text-muted); }

        .priority-stripe {
          height: 3px;
          background: var(--bg-4);
        }
        .priority-stripe.priority-low { background: var(--low); }
        .priority-stripe.priority-medium { background: var(--medium); }
        .priority-stripe.priority-high { background: var(--high); }
        .priority-stripe.priority-critical { background: var(--critical); box-shadow: 0 0 8px var(--critical); }

        .task-card-content { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .task-card-header { display: flex; align-items: center; justify-content: space-between; }
        .task-badges { display: flex; gap: 4px; flex-wrap: wrap; }

        .task-delete-btn {
          width: 22px; height: 22px;
          background: none; border: none; border-radius: 4px;
          color: var(--text-dim); cursor: pointer; font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; opacity: 0;
        }
        .task-card:hover .task-delete-btn { opacity: 1; }
        .task-delete-btn:hover { background: rgba(239,68,68,0.15); color: var(--danger); }

        .task-title {
          font-size: 0.9rem; font-weight: 600; line-height: 1.4;
          color: var(--text);
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .task-desc {
          font-size: 0.8rem; color: var(--text-muted);
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          line-height: 1.5;
        }
        .task-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .task-card-footer { display: flex; align-items: center; justify-content: space-between; }
        .unassigned { background: var(--bg-4); color: var(--text-dim); border: 1px dashed var(--border); }
        .task-meta-chip {
          font-size: 0.72rem; color: var(--text-muted);
          background: var(--bg-3); padding: 2px 6px;
          border-radius: 99px;
        }
        .task-meta-chip.overdue { color: var(--danger); background: rgba(239,68,68,0.1); }
        .task-due { font-size: 0.72rem; color: var(--text-dim); }
        .overdue-text { color: var(--danger); }

        .status-cycle-btn {
          width: 24px; height: 24px;
          background: none; border: 1px solid var(--border);
          border-radius: 50%; font-size: 0.8rem;
          cursor: pointer; color: var(--text-dim);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .status-cycle-btn:hover {
          background: var(--bg-3);
          color: var(--text);
          transform: rotate(90deg);
        }
        .status-cycle-btn.status-done { border-color: var(--done); color: var(--done); }
      `}</style>
    </div>
  );
}
