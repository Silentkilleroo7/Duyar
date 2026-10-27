import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminWebDashboard from './admin-panel';
import { registerServiceWorker } from './serviceWorkerRegistration';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Check for standalone Admin Web Dashboard URL or storage toggle
const isAdminRoute = 
  typeof window !== 'undefined' && (
    window.location.pathname === '/admin' ||
    window.location.pathname.startsWith('/admin/') ||
    window.location.search.includes('admin=true') ||
    window.location.search.includes('admin=1') ||
    window.location.hash === '#admin' ||
    localStorage.getItem('duyar_admin_portal_active') === 'true'
  );

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isAdminRoute ? (
      <AdminWebDashboard 
        onBackToApp={() => {
          localStorage.removeItem('duyar_admin_portal_active');
          const u = new URL(window.location.href);
          u.searchParams.delete('admin');
          if (u.pathname === '/admin' || u.pathname.startsWith('/admin/')) {
            window.location.href = '/';
          } else {
            window.history.pushState({}, '', u.pathname + u.search);
            window.location.reload();
          }
        }} 
      />
    ) : (
      <App />
    )}
  </React.StrictMode>
);

// Register PWA Service Worker for Offline Support, Background Sync, Periodic Sync, and Push Notifications
registerServiceWorker();
