import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../socket';
import api from '../api';
import toast from 'react-hot-toast';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function TaskModal({ task, onClose, onCreate = false }) {
  const { updateTask, createTask, addComment } = useTasks();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee: task?.assignee?._id || '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    tags: task?.tags || [],
  });
  const [tagInput, setTagInput] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [viewingUsers, setViewingUsers] = useState([]);
  const commentRef = useRef(null);

  useEffect(() => {
    api.get('/auth/users').then(({ data }) => setUsers(data));

    // Emit viewing presence
    const socket = getSocket();
    if (task?._id) {
      socket.emit('task:viewing', { taskId: task._id, userName: user.name, color: user.color });

      const onViewing = ({ taskId, userName, color, socketId }) => {
        if (taskId === task._id && userName !== user.name) {
          setViewingUsers((prev) => {
            if (prev.find((v) => v.socketId === socketId)) return prev;
            return [...prev, { userName, color, socketId }];
          });
        }
      };
      const onStopViewing = ({ taskId, socketId }) => {
        if (taskId === task._id) {
          setViewingUsers((prev) => prev.filter((v) => v.socketId !== socketId));
        }
      };
      socket.on('task:viewing', onViewing);
      socket.on('task:stop-viewing', onStopViewing);

      return () => {
        socket.emit('task:stop-viewing', { taskId: task._id });
        socket.off('task:viewing', onViewing);
        socket.off('task:stop-viewing', onStopViewing);
      };
    }
  }, [task?._id, user.name, user.color]);

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSubmitting(true);
    try {
      const payload = { ...form, tags: form.tags };
      if (onCreate) {
        await createTask(payload);
        toast.success('Task created!');
      } else {
        await updateTask(task._id, payload);
        toast.success('Task updated!');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment(task._id, comment);
      setComment('');
      toast.success('Comment added!');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleTagAdd = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (!form.tags.includes(newTag) && form.tags.length < 8) {
        setForm({ ...form, tags: [...form.tags, newTag] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });

  const activityIcons = { created: '🌱', updated: '✏️', commented: '💬' };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal task-modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
              {onCreate ? 'Create New Task' : 'Edit Task'}
            </h3>
            {viewingUsers.length > 0 && (
              <div className="viewing-users">
                {viewingUsers.map((v) => (
                  <span key={v.socketId} style={{ color: v.color }}>
                    👀 {v.userName} is viewing
                  </span>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Tabs (only for existing tasks) */}
        {!onCreate && (
          <div className="task-modal-tabs">
            {['details', 'comments', 'activity'].map((tab) => (
              <button
                key={tab}
                className={`task-modal-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'comments' && task?.comments?.length
                  ? `Comments (${task.comments.length})`
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}

        <div className="modal-body">
          {/* Details Tab */}
          {(onCreate || activeTab === 'details') && (
            <>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-input"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Add more context…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="task-modal-grid">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select
                    className="form-select"
                    value={form.assignee}
                    onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">Tags (press Enter to add)</label>
                <div className="tags-input-wrapper">
                  {form.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                      <button onClick={() => removeTag(t)}>×</button>
                    </span>
                  ))}
                  <input
                    className="tags-input"
                    placeholder="e.g. frontend, bug…"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagAdd}
                  />
                </div>
              </div>
            </>
          )}

          {/* Comments Tab */}
          {!onCreate && activeTab === 'comments' && (
            <div className="comments-section">
              <div className="comments-list">
                {task?.comments?.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon">💬</div>
                    <p>No comments yet. Start the conversation!</p>
                  </div>
                )}
                {task?.comments?.map((c) => (
                  <div key={c._id} className="comment">
                    <div
                      className="avatar avatar-sm"
                      style={{ background: users.find((u) => u.name === c.authorName)?.color || '#7c6af7' }}
                    >
                      {c.authorName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <span className="comment-author">{c.authorName}</span>
                        <span className="comment-time">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="comment-input-row" ref={commentRef}>
                <textarea
                  className="form-textarea"
                  placeholder="Write a comment…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleComment(); }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleComment} disabled={!comment.trim()}>
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {!onCreate && activeTab === 'activity' && (
            <div className="activity-section">
              {task?.activity?.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <p>No activity recorded yet.</p>
                </div>
              )}
              {[...(task?.activity || [])].reverse().map((a, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-icon">{activityIcons[a.action] || '•'}</span>
                  <div className="activity-body">
                    <span className="activity-user">{a.userName}</span>{' '}
                    <span className="activity-action">
                      {a.action === 'updated' && a.field
                        ? `changed ${a.field} from "${a.oldValue || 'empty'}" → "${a.newValue}"`
                        : a.action === 'commented'
                        ? `commented: "${a.newValue?.slice(0, 60)}${a.newValue?.length > 60 ? '…' : ''}"`
                        : a.action}
                    </span>
                    <span className="activity-time">
                      {a.createdAt && format(new Date(a.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {(onCreate || activeTab === 'details') && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
              {submitting ? <span className="loader" /> : null}
              {onCreate ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .task-modal { max-width: 600px; }
        .viewing-users { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
        .viewing-users span { font-size: 0.75rem; }
        .task-modal-tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 24px; }
        .task-modal-tab {
          padding: 12px 16px; background: none; border: none;
          color: var(--text-muted); font-family: var(--font-body);
          font-size: 0.85rem; cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: all 0.15s;
        }
        .task-modal-tab.active { color: var(--text); border-bottom-color: var(--accent); }
        .task-modal-tab:hover:not(.active) { color: var(--text); }
        .task-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tags-input-wrapper {
          display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
          background: var(--bg-3); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 8px 12px;
          min-height: 42px;
          transition: border-color 0.2s;
        }
        .tags-input-wrapper:focus-within { border-color: var(--accent); }
        .tags-input {
          background: none; border: none; outline: none;
          color: var(--text); font-size: 0.875rem;
          font-family: var(--font-body); flex: 1; min-width: 80px;
        }
        .tags-input::placeholder { color: var(--text-dim); }

        .comments-section { display: flex; flex-direction: column; gap: 16px; }
        .comments-list { display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto; }
        .comment { display: flex; gap: 10px; align-items: flex-start; }
        .comment-body { flex: 1; }
        .comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .comment-author { font-size: 0.82rem; font-weight: 600; color: var(--text); }
        .comment-time { font-size: 0.72rem; color: var(--text-dim); }
        .comment-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
        .comment-input-row { display: flex; flex-direction: column; gap: 8px; }

        .activity-section { display: flex; flex-direction: column; gap: 2px; max-height: 320px; overflow-y: auto; }
        .activity-item { display: flex; gap: 10px; align-items: flex-start; padding: 8px; border-radius: var(--radius-sm); }
        .activity-item:hover { background: var(--bg-3); }
        .activity-icon { font-size: 0.9rem; flex-shrink: 0; margin-top: 2px; }
        .activity-body { font-size: 0.8rem; line-height: 1.5; color: var(--text-muted); }
        .activity-user { font-weight: 600; color: var(--text); }
        .activity-action { color: var(--text-muted); }
        .activity-time { display: block; font-size: 0.72rem; color: var(--text-dim); margin-top: 2px; }
      `}</style>
    </div>
  );
}
