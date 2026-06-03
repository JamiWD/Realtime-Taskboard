import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import toast from 'react-hot-toast';

function AvatarBubble({ name, color, size = '' }) {
  return (
    <div
      className={`avatar ${size}`}
      style={{ background: color || '#7c6af7' }}
      title={name}
    >
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Navbar({ onNewTask, searchQuery, setSearchQuery }) {
  const { user, logout } = useAuth();
  const { onlineUsers, stats } = useTasks();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast('Signed out', { icon: '👋' });
  };

  return (
    <nav className="navbar">
      {/* Left: brand */}
      <div className="navbar-brand flex items-center gap-3">
        <span className="navbar-logo">⚡</span>
        <div>
          <h2 className="navbar-title">TaskBoard</h2>
          <span className="navbar-subtitle">{stats.total} tasks</span>
        </div>
      </div>

      {/* Center: search */}
      <div className="navbar-search">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Search tasks…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* Right: presence + actions */}
      <div className="navbar-right flex items-center gap-3">
        {/* Online users */}
        {onlineUsers.length > 0 && (
          <div className="online-users flex items-center gap-2">
            <div className="online-dot pulse" />
            <div className="avatar-stack">
              {onlineUsers.slice(0, 5).map((u) => (
                <AvatarBubble key={u.socketId} name={u.userName} color={u.color} />
              ))}
              {onlineUsers.length > 5 && (
                <div className="avatar" style={{ background: 'var(--bg-4)', color: 'var(--text-muted)', border: '2px solid var(--border)' }}>
                  +{onlineUsers.length - 5}
                </div>
              )}
            </div>
            <span className="online-label">{onlineUsers.length} online</span>
          </div>
        )}

        <button className="btn btn-primary btn-sm" onClick={onNewTask}>
          + New Task
        </button>

        {/* User menu */}
        <div className="user-menu-wrapper">
          <button className="user-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <AvatarBubble name={user?.name} color={user?.color} />
          </button>

          {menuOpen && (
            <div className="user-menu" onClick={() => setMenuOpen(false)}>
              <div className="user-menu-header">
                <AvatarBubble name={user?.name} color={user?.color} size="avatar-lg" />
                <div>
                  <p className="user-menu-name">{user?.name}</p>
                  <p className="user-menu-email">{user?.email}</p>
                </div>
              </div>
              <div className="divider" />
              <button className="user-menu-item danger" onClick={handleLogout}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; gap: 16px;
          padding: 12px 24px;
          background: rgba(10, 11, 15, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
        }
        .navbar-logo { font-size: 1.4rem; }
        .navbar-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; line-height: 1.1; }
        .navbar-subtitle { font-size: 0.72rem; color: var(--text-dim); }
        .navbar-search {
          flex: 1; max-width: 360px; position: relative;
          display: flex; align-items: center;
        }
        .search-icon { position: absolute; left: 12px; font-size: 0.85rem; pointer-events: none; }
        .search-input {
          width: 100%; background: var(--bg-3); border: 1px solid var(--border);
          border-radius: var(--radius-sm); color: var(--text);
          font-family: var(--font-body); font-size: 0.875rem;
          padding: 8px 36px;
          outline: none; transition: border-color 0.2s;
        }
        .search-input:focus { border-color: var(--accent); }
        .search-input::placeholder { color: var(--text-dim); }
        .search-clear {
          position: absolute; right: 10px;
          background: none; border: none; cursor: pointer;
          color: var(--text-dim); font-size: 0.75rem;
        }
        .online-users { gap: 8px; }
        .avatar-stack { display: flex; }
        .avatar-stack .avatar { margin-left: -8px; }
        .avatar-stack .avatar:first-child { margin-left: 0; }
        .online-label { font-size: 0.78rem; color: var(--success); font-weight: 500; }
        .navbar-right { margin-left: auto; }

        .user-menu-wrapper { position: relative; }
        .user-menu-btn { background: none; border: none; cursor: pointer; display: flex; }
        .user-menu {
          position: absolute; right: 0; top: calc(100% + 8px);
          background: var(--bg-2); border: 1px solid var(--border-light);
          border-radius: var(--radius); min-width: 220px;
          box-shadow: var(--shadow-lg);
          animation: slideInRight 0.15s ease;
          overflow: hidden;
        }
        .user-menu-header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; }
        .user-menu-name { font-weight: 600; font-size: 0.9rem; }
        .user-menu-email { font-size: 0.75rem; color: var(--text-muted); }
        .user-menu-item {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 12px 16px;
          background: none; border: none; cursor: pointer;
          font-family: var(--font-body); font-size: 0.875rem;
          color: var(--text-muted); text-align: left;
          transition: background 0.15s;
        }
        .user-menu-item:hover { background: var(--bg-3); color: var(--text); }
        .user-menu-item.danger:hover { color: var(--danger); }

        @media (max-width: 640px) {
          .online-users { display: none; }
          .navbar-search { max-width: 180px; }
        }
      `}</style>
    </nav>
  );
}
