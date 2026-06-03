import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TaskProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-3)',
                color: 'var(--text)',
                border: '1px solid var(--border-light)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg)' } },
              error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg)' } },
            }}
          />
        </TaskProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
