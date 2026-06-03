require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ────────────────────────────────────────────────
// Socket.io — Real-Time Presence & Collaboration
// ────────────────────────────────────────────────
const onlineUsers = new Map(); // socketId -> { userId, userName, color, avatar }

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins — announce presence
  socket.on('user:join', async ({ userId, userName, color, avatar }) => {
    onlineUsers.set(socket.id, { userId, userName, color, avatar, socketId: socket.id });
    io.emit('users:online', Array.from(onlineUsers.values()));
    console.log(`👤 ${userName} came online`);

    // Update DB
    try {
      const User = require('./models/User');
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    } catch (e) {}
  });

  // User is typing on a task
  socket.on('task:typing', ({ taskId, userName }) => {
    socket.broadcast.emit('task:typing', { taskId, userName });
  });

  // User stops typing
  socket.on('task:stop-typing', ({ taskId }) => {
    socket.broadcast.emit('task:stop-typing', { taskId });
  });

  // User viewing a task (live cursor presence)
  socket.on('task:viewing', ({ taskId, userName, color }) => {
    socket.broadcast.emit('task:viewing', { taskId, userName, color, socketId: socket.id });
  });

  socket.on('task:stop-viewing', ({ taskId }) => {
    socket.broadcast.emit('task:stop-viewing', { taskId, socketId: socket.id });
  });

  // Disconnect — remove from online list
  socket.on('disconnect', async () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      io.emit('users:online', Array.from(onlineUsers.values()));
      console.log(`👤 ${user.userName} went offline`);
      try {
        const User = require('./models/User');
        await User.findByIdAndUpdate(user.userId, { isOnline: false, lastSeen: new Date() });
      } catch (e) {}
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
