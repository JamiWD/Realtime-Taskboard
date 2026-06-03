const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// Helper to emit socket events
const emitTaskEvent = (io, event, data) => {
  if (io) io.emit(event, data);
};

// @route  GET /api/tasks
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority, search, assignee } = req.query;
    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (search) query.$text = { $search: search };

    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar color')
      .populate('creator', 'name email avatar color')
      .sort({ order: 1, createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route  GET /api/tasks/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const priorityStats = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    const total = await Task.countDocuments();
    res.json({ byStatus: stats, byPriority: priorityStats, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  POST /api/tasks
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const count = await Task.countDocuments({ status: req.body.status || 'todo' });
      const task = await Task.create({
        ...req.body,
        creator: req.user._id,
        creatorName: req.user.name,
        order: count,
        activity: [{ action: 'created', user: req.user._id, userName: req.user.name }],
      });

      const populated = await Task.findById(task._id)
        .populate('assignee', 'name email avatar color')
        .populate('creator', 'name email avatar color');

      const io = req.app.get('io');
      emitTaskEvent(io, 'task:created', populated);

      res.status(201).json(populated);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// @route  PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const activityEntries = [];
    const trackFields = ['title', 'status', 'priority', 'assignee', 'description', 'dueDate'];
    for (const field of trackFields) {
      if (req.body[field] !== undefined) {
        const oldVal = task[field]?.toString() || '';
        const newVal = req.body[field]?.toString() || '';
        if (oldVal !== newVal) {
          activityEntries.push({
            action: 'updated',
            user: req.user._id,
            userName: req.user.name,
            field,
            oldValue: oldVal,
            newValue: newVal,
          });
        }
      }
    }

    if (req.body.assignee) {
      const User = require('../models/User');
      const assigneeUser = await User.findById(req.body.assignee);
      req.body.assigneeName = assigneeUser ? assigneeUser.name : null;
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, $push: { activity: { $each: activityEntries } } },
      { new: true, runValidators: true }
    )
      .populate('assignee', 'name email avatar color')
      .populate('creator', 'name email avatar color');

    const io = req.app.get('io');
    emitTaskEvent(io, 'task:updated', updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route  DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const io = req.app.get('io');
    emitTaskEvent(io, 'task:deleted', { _id: req.params.id });

    res.json({ message: 'Task deleted', _id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route  POST /api/tasks/:id/comments
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ message: 'Comment cannot be empty' });

    const comment = {
      text: text.trim(),
      author: req.user._id,
      authorName: req.user.name,
    };

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: comment,
          activity: { action: 'commented', user: req.user._id, userName: req.user.name, newValue: text.trim() },
        },
      },
      { new: true }
    ).populate('assignee', 'name email avatar color');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const io = req.app.get('io');
    emitTaskEvent(io, 'task:updated', task);

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route  PATCH /api/tasks/reorder
router.patch('/reorder', protect, async (req, res) => {
  try {
    const { tasks } = req.body; // [{ _id, order, status }]
    const ops = tasks.map(({ _id, order, status }) => ({
      updateOne: { filter: { _id }, update: { order, status } },
    }));
    await Task.bulkWrite(ops);

    const io = req.app.get('io');
    emitTaskEvent(io, 'tasks:reordered', tasks);

    res.json({ message: 'Reordered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
