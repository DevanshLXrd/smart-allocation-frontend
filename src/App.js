// App.js — root component, handles navigation and global toast
import React, { useState, useCallback } from 'react';
import Dashboard      from './pages/Dashboard';
import CreateRequest  from './pages/CreateRequest';
import Resources      from './pages/Resources';
import Allocations    from './pages/Allocations';

const PAGES = ['Dashboard', 'Create Request', 'Resources', 'Allocations'];

export default function App() {
  const [page, setPage]   = useState(0);
  const [toast, setToast] = useState(null);

  // Show a toast notification for `duration` ms
  const notify = useCallback((title, body, duration = 3200) => {
    setToast({ title, body });
    setTimeout(() => setToast(null), duration);
  }, []);

  const pageProps = { notify, goPage: setPage };

  return (
    <>
      {/* ── Top navigation bar ── */}
      <div className="topbar">
        <div className="logo">
          <div className="logo-dot" />
          Resource Allocation System
        </div>
        <nav>
          {PAGES.map((p, i) => (
            <button
              key={p}
              className={i === page ? 'active' : ''}
              onClick={() => setPage(i)}
            >
              {p}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Page content ── */}
      <div className="page">
        {page === 0 && <Dashboard      {...pageProps} />}
        {page === 1 && <CreateRequest  {...pageProps} />}
        {page === 2 && <Resources      {...pageProps} />}
        {page === 3 && <Allocations    {...pageProps} />}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="toast">
          <div className="toast-title">{toast.title}</div>
          <div className="toast-body">{toast.body}</div>
        </div>
      )}
    </>
  );
}
