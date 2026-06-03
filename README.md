# ⚡ TaskBoard — Real-Time Collaborative Task Manager

> A production-grade MERN Stack application demonstrating real-time collaboration, JWT authentication, RESTful APIs, and WebSocket-driven live updates.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue) ![Socket.io](https://img.shields.io/badge/Real--Time-Socket.io-black) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### Real-Time Collaboration
- **Live presence** — see who's online with animated avatar stack
- **Instant sync** — task create/update/delete broadcasts to all clients via Socket.io
- **Viewing indicators** — know when another user is viewing the same task
- **Live activity feed** — every change is timestamped and attributed

### Task Management
- **Kanban board** with drag-and-drop between columns
- **4 statuses**: To Do → In Progress → Review → Done
- **4 priority levels**: Low / Medium / High / Critical (with visual priority stripes)
- **Assignees, due dates, tags, descriptions**
- **Comments** on tasks with real-time sync
- **Full activity log** per task

### Auth & Security
- JWT-based authentication (7-day expiry)
- bcrypt password hashing (12 salt rounds)
- Protected routes on both client and server
- Input validation via express-validator

### Developer Experience
- Search tasks in real-time (client-side + MongoDB text index)
- Filter by status
- Progress bar tracking overall completion
- Responsive — works on mobile, tablet, desktop

---

## 🗂 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Context API |
| **Styling** | Pure CSS (no UI library) with CSS variables |
| **HTTP Client** | Axios with JWT interceptors |
| **Real-Time** | Socket.io (client + server) |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose ODM |
| **Auth** | JWT + bcryptjs |
| **Validation** | express-validator |
| **Dev Tools** | nodemon, concurrently |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/realtime-taskboard.git
cd realtime-taskboard
```

### 2. Install all dependencies
```bash
npm run install-all
```

### 3. Configure environment
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskboard
JWT_SECRET=choose_a_long_random_secret_here
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Start development servers
```bash
npm run dev
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### 5. Test real-time features
Open **two browser tabs** (or two different browsers) and log in with different accounts. Any task creation, update, or deletion will instantly appear in both tabs. 🎉

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + receive JWT |
| GET | `/api/auth/me` | Get current user (auth required) |
| GET | `/api/auth/users` | List all users (auth required) |

### Tasks (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks (filter: status, priority, search) |
| GET | `/api/tasks/stats` | Aggregated stats by status/priority |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |
| PATCH | `/api/tasks/reorder` | Bulk reorder (for drag-and-drop) |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `user:join` | `{ userId, userName, color }` | Announce presence |
| `task:viewing` | `{ taskId, userName, color }` | User opens a task |
| `task:stop-viewing` | `{ taskId }` | User closes task |
| `task:typing` | `{ taskId, userName }` | User is typing a comment |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `task:created` | Full task object | New task broadcast |
| `task:updated` | Full task object | Update broadcast |
| `task:deleted` | `{ _id }` | Deletion broadcast |
| `tasks:reordered` | Array of `{ _id, order, status }` | Drag-drop reorder |
| `users:online` | Array of user objects | Presence update |

---

## 📁 Project Structure

```
realtime-taskboard/
├── server/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── models/
│   │   ├── User.js            # User schema + bcrypt hooks
│   │   └── Task.js            # Task schema + comments/activity
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   └── tasks.js           # Task CRUD + comments
│   ├── index.js               # Express app + Socket.io server
│   └── .env.example
│
├── client/
│   └── src/
│       ├── context/
│       │   ├── AuthContext.js # Global auth state
│       │   └── TaskContext.js # Tasks + socket listeners
│       ├── components/
│       │   ├── Navbar.js      # Top bar with presence
│       │   ├── StatsBar.js    # Stats + progress
│       │   ├── KanbanBoard.js # Drag-and-drop columns
│       │   ├── TaskCard.js    # Individual task card
│       │   ├── TaskModal.js   # Create/edit + comments/activity
│       │   └── ProtectedRoute.js
│       ├── pages/
│       │   ├── Dashboard.js   # Main app view
│       │   └── AuthPage.js    # Login / Register
│       ├── api.js             # Axios instance + interceptors
│       ├── socket.js          # Socket.io singleton
│       └── index.css          # Design system
│
└── package.json               # Root scripts with concurrently
```

---

## 🌐 Deployment

### MongoDB Atlas (recommended for production)
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get the connection URI
3. Set `MONGO_URI` in your `.env`

### Deploy to Render / Railway / Fly.io
1. Build the React app: `npm run build`
2. Serve `client/build` as static files from Express
3. Set environment variables in your hosting dashboard

Add this to `server/index.js` for production static serving:
```js
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../client/build/index.html'))
  );
}
```

---

## 🎓 Built For

University of Technology — Master's Application Portfolio  
Demonstrating full-stack MERN development with real-time WebSocket architecture.

---

## 📄 License

MIT © 2024
