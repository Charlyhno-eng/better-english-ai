import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router';

export function AppHeader({ configured }: { configured?: boolean }) {
  const [savedKey, setSavedKey] = useState<boolean | null>(null);
  useEffect(() => {
    if (configured !== undefined) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/setup', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (typeof data === 'object' && data !== null && 'glm_configured' in data && typeof data.glm_configured === 'boolean') setSavedKey(data.glm_configured);
      } catch { /* An unavailable backend does not imply a missing key. */ }
    }
    void load();
    return () => controller.abort();
  }, [configured]);
  const missingKey = (configured ?? savedKey) === false;
  return <header className="app-header">
    <Link className="wordmark" to="/">
      <img className="wordmark-logo" src="/better-english-AI-logo.png" alt="" />
      <span className="wordmark-name">Better English <span>AI</span></span>
    </Link>
    <nav className="app-nav" aria-label="Main navigation">
      <NavLink to="/" end>Conversation</NavLink>
      <NavLink to="/writing">Writing</NavLink>
      <NavLink to="/pronunciation">Pronunciation</NavLink>
    </nav>
    <div className="settings-control">
      <NavLink className="settings-link" to="/setup" aria-label="Settings" title="Settings"
        aria-describedby={missingKey ? 'setup-warning' : undefined}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9.5 3-.6 2.3-2 .9-2.1-.7-2.5 4.3 1.6 1.6v2.2l-1.6 1.6 2.5 4.3 2.1-.7 2 .9.6 2.3h5l.6-2.3 2-.9 2.1.7 2.5-4.3-1.6-1.6v-2.2l1.6-1.6-2.5-4.3-2.1.7-2-.9-.6-2.3z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </NavLink>
      {missingKey && <Link id="setup-warning" className="setup-warning" to="/setup">Add API key</Link>}
    </div>
  </header>;
}
