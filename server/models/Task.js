const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 500 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: String,
  },
  { timestamps: true }
);

const ActivitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    field: String,
    oldValue: String,
    newValue: String,
  },
  { timestamps: true }
);

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assigneeName: { type: String, default: null },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creatorName: { type: String },
    dueDate: { type: Date, default: null },
    tags: [{ type: String, trim: true, maxlength: 30 }],
    comments: [CommentSchema],
    activity: [ActivitySchema],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index for search
TaskSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Task', TaskSchema);
