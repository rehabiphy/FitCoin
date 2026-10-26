import { useCallback, useEffect, useRef, useState } from 'react';
import { API_LABEL, api, getSession, logout, setExpiredHandler } from './api.js';
import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import HabitCoins from './pages/HabitCoins.jsx';
import Premium from './pages/Premium.jsx';
import Members from './pages/Members.jsx';

const PAGES = [
  { id: 'overview', label: 'Overview', icon: '◎' },
  { id: 'coins', label: 'Habit coins', icon: '◉' },
  { id: 'premium', label: 'Premium', icon: '♛' },
  { id: 'members', label: 'Members', icon: '☺' },
];

function Toast({ toast }) {
  if (!toast) {
    return null;
  }
  return <div className={`toast ${toast.ok ? 'ok' : 'err'}`}>{toast.text}</div>;
}

export default function App() {
  const [user, setUser] = useState(() => getSession()?.user || null);
  const [page, setPage] = useState('overview');
  const [configData, setConfigData] = useState(null); // { config, defaults, habits, meta }
  const [configError, setConfigError] = useState(null);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);

  const notify = useCallback((text, ok = true) => {
    setToast({ text, ok });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    setExpiredHandler(() => setUser(null));
  }, []);

  // Confirm the saved session is still an admin one
  useEffect(() => {
    if (!getSession()) {
      return;
    }
    api
      .me()
      .then(({ user: u }) => {
        if (u.role !== 'admin') {
          logout();
          setUser(null);
        }
      })
      .catch(err => {
        if (err.status === 401) {
          setUser(null);
        }
      });
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      setConfigData(await api.config());
      setConfigError(null);
    } catch (err) {
      setConfigError(err.message);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user, loadConfig]);

  /** Saves the full config with one part changed; returns true on success. */
  const saveConfig = useCallback(
    async changes => {
      try {
        const next = { ...configData.config, ...changes };
        const { config, meta } = await api.saveConfig(next);
        setConfigData(d => ({ ...d, config, meta }));
        notify('Saved — the app picks this up within a few seconds.');
        return true;
      } catch (err) {
        notify(err.message, false);
        return false;
      }
    },
    [configData, notify],
  );

  if (!user) {
    return <Login onSignedIn={setUser} />;
  }

  const shared = { configData, configError, reloadConfig: loadConfig, saveConfig, notify, goTo: setPage };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div>
            Fitcoin
            <small>Admin</small>
          </div>
          <span className={`badge ${API_LABEL === 'Live' ? 'gold' : 'mint'}`} style={{ marginLeft: 'auto' }} title="Which API this panel is editing">
            {API_LABEL}
          </span>
        </div>
        {PAGES.map(p => (
          <button key={p.id} className={`nav-btn ${page === p.id ? 'active' : ''}`} onClick={() => setPage(p.id)}>
            <span aria-hidden="true">{p.icon}</span>
            {p.label}
          </button>
        ))}
        <div className="sidebar-foot">
          <div className="small">
            <div>{user.name}</div>
            <div className="muted">{user.email}</div>
          </div>
          <button
            className="btn sm"
            onClick={() => {
              logout();
              setUser(null);
            }}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        {page === 'overview' && <Overview {...shared} />}
        {page === 'coins' && <HabitCoins {...shared} />}
        {page === 'premium' && <Premium {...shared} />}
        {page === 'members' && <Members {...shared} />}
      </main>
      <Toast toast={toast} />
    </div>
  );
}
