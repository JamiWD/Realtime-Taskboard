import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { getSocket } from '../socket';
import toast from 'react-hot-toast';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ byStatus: [], byPriority: [], total: 0 });

  const fetchTasks = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/tasks?${params}`);
      setTasks(data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks/stats');
      setStats(data);
    } catch {}
  }, []);

  const createTask = async (taskData) => {
    const { data } = await api.post('/tasks', taskData);
    return data;
  };

  const updateTask = async (id, updates) => {
    const { data } = await api.put(`/tasks/${id}`, updates);
    return data;
  };

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
  };

  const addComment = async (taskId, text) => {
    const { data } = await api.post(`/tasks/${taskId}/comments`, { text });
    return data;
  };

  const reorderTasks = async (reorderData) => {
    await api.patch('/tasks/reorder', { tasks: reorderData });
  };

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  // ── Real-time socket listeners ──
  useEffect(() => {
    const socket = getSocket();

    const onTaskCreated = (task) => {
      setTasks((prev) => {
        if (prev.find((t) => t._id === task._id)) return prev;
        toast.success(`New task: "${task.title}"`);
        return [task, ...prev];
      });
      fetchStats();
    };

    const onTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
      fetchStats();
    };

    const onTaskDeleted = ({ _id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== _id));
      toast('Task removed', { icon: '🗑️' });
      fetchStats();
    };

    const onTasksReordered = (reordered) => {
      setTasks((prev) => {
        const updated = [...prev];
        reordered.forEach(({ _id, order, status }) => {
          const idx = updated.findIndex((t) => t._id === _id);
          if (idx !== -1) updated[idx] = { ...updated[idx], order, status };
        });
        return updated;
      });
    };

    const onUsersOnline = (users) => setOnlineUsers(users);

    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('tasks:reordered', onTasksReordered);
    socket.on('users:online', onUsersOnline);

    return () => {
      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('tasks:reordered', onTasksReordered);
      socket.off('users:online', onUsersOnline);
    };
  }, [fetchStats]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        onlineUsers,
        loading,
        stats,
        fetchTasks,
        fetchStats,
        createTask,
        updateTask,
        deleteTask,
        addComment,
        reorderTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
