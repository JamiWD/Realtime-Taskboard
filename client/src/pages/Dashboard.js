import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import Navbar from '../components/Navbar';
import StatsBar from '../components/StatsBar';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import { getSocket } from '../socket';

export default function Dashboard() {
  const { tasks, loading, fetchTasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState(null);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveIndicator, setLiveIndicator] = useState(false);

  // Flash live indicator when a socket event fires
  useEffect(() => {
    const socket = getSocket();
    const flash = () => {
      setLiveIndicator(true);
      setTimeout(() => setLiveIndicator(false), 1200);
    };
    socket.on('task:created', flash);
    socket.on('task:updated', flash);
    socket.on('task:deleted', flash);
    return () => {
      socket.off('task:created', flash);
      socket.off('task:updated', flash);
      socket.off('task:deleted', flash);
    };
  }, []);

  // Filter tasks by search query
  const visibleTasks = searchQuery
    ? tasks.filter((t) => {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.includes(q))
        );
      })
    : tasks;

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setCreating(false);
  };

  // Sync selectedTask with live updates from socket
  useEffect(() => {
    if (selectedTask) {
      const fresh = tasks.find((t) => t._id === selectedTask._id);
      if (fresh) setSelectedTask(fresh);
    }
  }, [tasks, selectedTask?._id]);

  return (
    <div className="dashboard">
      <Navbar
        onNewTask={() => setCreating(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <StatsBar activeFilter={statusFilter} onFilter={setStatusFilter} />

      {/* Live indicator banner */}
      {liveIndicator && (
        <div className="live-banner">
          <span className="live-dot animate-pulse" />
          Real-time update received
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <div className="dashboard-loading">
          <div className="loader" />
          <span>Loading tasks…</span>
        </div>
      ) : (
        <KanbanBoard
          tasks={visibleTasks}
          onTaskClick={handleTaskClick}
          statusFilter={statusFilter}
        />
      )}

      {/* Modals */}
      {selectedTask && (
        <TaskModal task={selectedTask} onClose={handleCloseModal} />
      )}
      {creating && (
        <TaskModal task={null} onClose={handleCloseModal} onCreate />
      )}

      <style>{`
        .dashboard {
          display: flex; flex-direction: column;
          min-height: 100vh;
        }
        .dashboard-loading {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; flex: 1; color: var(--text-muted); font-size: 0.9rem;
          padding: 60px;
        }
        .live-banner {
          display: flex; align-items: center; gap: 8px;
          background: rgba(124,106,247,0.08);
          border-bottom: 1px solid rgba(124,106,247,0.2);
          padding: 8px 24px;
          font-size: 0.8rem; color: var(--accent);
          animation: slideUp 0.2s ease, fadeOut 0.3s 0.9s forwards;
        }
        @keyframes fadeOut { to { opacity: 0; } }
        .live-dot {
          width: 6px; height: 6px; background: var(--accent); border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
