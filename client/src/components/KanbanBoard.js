import React, { useState, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import TaskCard from './TaskCard';
import toast from 'react-hot-toast';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'var(--todo)', icon: '○' },
  { key: 'in-progress', label: 'In Progress', color: 'var(--in-progress)', icon: '◑' },
  { key: 'review', label: 'Review', color: 'var(--review)', icon: '◕' },
  { key: 'done', label: 'Done', color: 'var(--done)', icon: '●' },
];

export default function KanbanBoard({ tasks, onTaskClick, statusFilter }) {
  const { updateTask } = useTasks();
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const dragTaskRef = useRef(null);

  const filtered = statusFilter
    ? tasks.filter((t) => t.status === statusFilter)
    : tasks;

  const getColumnTasks = (status) =>
    filtered.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  // ── Drag Handlers ──
  const handleDragStart = (e, task) => {
    dragTaskRef.current = task;
    setDraggedId(task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
    dragTaskRef.current = null;
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const task = dragTaskRef.current;
    if (!task || task.status === newStatus) return;

    try {
      await updateTask(task._id, { status: newStatus });
      toast.success(`Moved to ${newStatus.replace('-', ' ')}`, { icon: '↗️' });
    } catch {
      toast.error('Failed to move task');
    }
    setDraggedId(null);
    setDragOverCol(null);
  };

  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => {
        const colTasks = getColumnTasks(col.key);
        const isDragTarget = dragOverCol === col.key;

        return (
          <div
            key={col.key}
            className={`kanban-col ${isDragTarget ? 'drag-target' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            {/* Column header */}
            <div className="col-header">
              <div className="col-title-group">
                <span className="col-dot" style={{ background: col.color }} />
                <span className="col-title">{col.label}</span>
                <span className="col-count">{colTasks.length}</span>
              </div>
            </div>

            {/* Drop zone indicator */}
            {isDragTarget && dragTaskRef.current?.status !== col.key && (
              <div className="drop-indicator" style={{ borderColor: col.color }}>
                Drop here
              </div>
            )}

            {/* Tasks */}
            <div className="col-tasks">
              {colTasks.length === 0 && !isDragTarget && (
                <div className="col-empty">
                  <span style={{ opacity: 0.3 }}>{col.icon}</span>
                  <span>No tasks</span>
                </div>
              )}
              {colTasks.map((task) => (
                <div
                  key={task._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  className={`draggable-task ${draggedId === task._id ? 'dragging' : ''}`}
                >
                  <TaskCard task={task} onClick={onTaskClick} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <style>{`
        .kanban-board {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding: 20px 24px;
          overflow-x: auto;
          min-height: 0;
          flex: 1;
          align-items: start;
        }
        @media (max-width: 900px) { .kanban-board { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .kanban-board { grid-template-columns: 1fr; } }

        .kanban-col {
          display: flex; flex-direction: column; gap: 10px;
          background: var(--bg-2); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 14px;
          min-height: 200px;
          transition: border-color 0.2s, background 0.2s;
        }
        .kanban-col.drag-target {
          border-color: var(--accent);
          background: var(--bg-3);
          box-shadow: 0 0 20px var(--accent-glow);
        }

        .col-header { margin-bottom: 4px; }
        .col-title-group { display: flex; align-items: center; gap: 8px; }
        .col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .col-title { font-family: var(--font-display); font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
        .col-count {
          background: var(--bg-4); color: var(--text-dim);
          font-size: 0.72rem; font-weight: 700;
          padding: 1px 7px; border-radius: 99px;
          font-family: var(--font-display);
        }

        .col-tasks { display: flex; flex-direction: column; gap: 8px; }
        .col-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; padding: 24px; font-size: 1.5rem;
          color: var(--text-dim); font-size: 0.8rem;
        }

        .draggable-task { cursor: grab; }
        .draggable-task:active { cursor: grabbing; }
        .draggable-task.dragging { opacity: 0.4; transform: scale(0.98); }

        .drop-indicator {
          border: 2px dashed;
          border-radius: var(--radius-sm);
          padding: 16px;
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-dim);
          animation: pulse 1s infinite;
        }
      `}</style>
    </div>
  );
}
