'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [vertraege, setVertraege] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [newVertrag, setNewVertrag] = useState({ name: '', driveLink: '' });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const getAuthHeader = () => {
    return 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
  };

  const loadVertraege = async () => {
    try {
      const response = await fetch('/api/vertraege');
      if (!response.ok) throw new Error('Fehler beim Laden');
      const data = await response.json();
      setVertraege(data);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Verträge');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/vertraege', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ name: '__test__', driveLink: '__test__' })
      });

      if (response.status === 401) {
        setError('Ungültige Anmeldedaten');
        return;
      }

      setIsAuthenticated(true);
      setError(null);
      loadVertraege();
    } catch (err) {
      setError('Anmeldung fehlgeschlagen');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newVertrag.name.trim() || !newVertrag.driveLink.trim()) return;

    setAdding(true);
    try {
      const response = await fetch('/api/vertraege', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(newVertrag)
      });

      if (!response.ok) throw new Error('Fehler beim Hinzufügen');

      setNewVertrag({ name: '', driveLink: '' });
      loadVertraege();
    } catch (err) {
      setError('Fehler beim Hinzufügen');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Diesen Vertrag wirklich löschen?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/vertraege?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader()
        }
      });

      if (!response.ok) throw new Error('Fehler beim Löschen');
      loadVertraege();
    } catch (err) {
      setError('Fehler beim Löschen');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    loadVertraege();
  }, []);

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.loginCard}>
          <div style={styles.logoArea}>
            <div style={styles.logoCircle}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={styles.logoIcon}>
                <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z"/>
              </svg>
            </div>
          </div>
          <h1 style={styles.loginTitle}>GigaGreen Admin</h1>
          <p style={styles.loginSubtitle}>Vertragsvorlagen verwalten</p>

          <form onSubmit={handleLogin} style={styles.loginForm}>
            <input
              type="text"
              placeholder="Benutzername"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Passwort"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              style={styles.input}
              required
            />
            {error && <p style={styles.errorText}>{error}</p>}
            <button type="submit" style={styles.primaryButton}>
              Anmelden
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div style={styles.container}>
      <div style={styles.dashboard}>
        <header style={styles.header}>
          <h1 style={styles.title}>Vertragsvorlagen</h1>
          <p style={styles.subtitle}>GigaGreen Admin-Bereich</p>
        </header>

        {/* Neue Vorlage hinzufügen */}
        <div style={styles.addCard}>
          <h2 style={styles.cardTitle}>Neue Vorlage hinzufügen</h2>
          <form onSubmit={handleAdd} style={styles.addForm}>
            <div style={styles.formRow}>
              <input
                type="text"
                placeholder="Name der Vorlage"
                value={newVertrag.name}
                onChange={(e) => setNewVertrag({ ...newVertrag, name: e.target.value })}
                style={styles.inputFlex}
                required
              />
              <input
                type="url"
                placeholder="Google Drive Link"
                value={newVertrag.driveLink}
                onChange={(e) => setNewVertrag({ ...newVertrag, driveLink: e.target.value })}
                style={styles.inputFlex}
                required
              />
              <button type="submit" style={styles.addButton} disabled={adding}>
                {adding ? '...' : '+ Hinzufügen'}
              </button>
            </div>
          </form>
        </div>

        {/* Liste der Vorlagen */}
        <div style={styles.listCard}>
          <h2 style={styles.cardTitle}>Aktuelle Vorlagen ({vertraege.filter(v => !v.name.startsWith('__')).length})</h2>

          {loading ? (
            <p style={styles.loadingText}>Laden...</p>
          ) : error ? (
            <p style={styles.errorText}>{error}</p>
          ) : (
            <div style={styles.list}>
              {vertraege.filter(v => !v.name.startsWith('__')).map((vertrag) => (
                <div key={vertrag.id} style={styles.listItem}>
                  <div style={styles.itemInfo}>
                    <div style={styles.itemIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={styles.docIcon}>
                        <path d="M20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22ZM19 20V4H5V20H19ZM7 6H11V10H7V6ZM7 12H17V14H7V12ZM7 16H17V18H7V16ZM13 7H17V9H13V7Z" />
                      </svg>
                    </div>
                    <div>
                      <div style={styles.itemName}>{vertrag.name}</div>
                      <a href={vertrag.driveLink} target="_blank" rel="noopener noreferrer" style={styles.itemLink}>
                        Link öffnen ↗
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(vertrag.id)}
                    style={styles.deleteButton}
                    disabled={deleting === vertrag.id}
                  >
                    {deleting === vertrag.id ? '...' : 'Löschen'}
                  </button>
                </div>
              ))}

              {vertraege.filter(v => !v.name.startsWith('__')).length === 0 && (
                <p style={styles.emptyText}>Noch keine Vorlagen vorhanden</p>
              )}
            </div>
          )}
        </div>

        {/* Embed Info */}
        <div style={styles.embedCard}>
          <h2 style={styles.cardTitle}>Embed für Webflow</h2>
          <p style={styles.embedInfo}>
            Kopiere den Embed-Code und füge ihn in deine Webflow-Seite ein.
            Die Vorlagen werden automatisch von dieser API geladen.
          </p>
          <code style={styles.codeBlock}>
            {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js"></script>`}
          </code>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
    padding: '2rem',
    boxSizing: 'border-box',
  },
  loginCard: {
    maxWidth: '400px',
    margin: '4rem auto',
    background: '#fff',
    borderRadius: '16px',
    padding: '2.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  logoArea: {
    marginBottom: '1.5rem',
  },
  logoCircle: {
    width: '80px',
    height: '80px',
    background: '#fff86d',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    fill: '#073b2a',
  },
  loginTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#073b2a',
    margin: '0 0 0.5rem 0',
  },
  loginSubtitle: {
    fontSize: '1rem',
    color: '#6B7280',
    margin: '0 0 2rem 0',
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '2px solid #E5E7EB',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  },
  primaryButton: {
    background: '#fff86d',
    color: '#073b2a',
    border: 'none',
    borderRadius: '50px',
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    marginTop: '0.5rem',
  },
  dashboard: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#073b2a',
    margin: '0 0 0.25rem 0',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6B7280',
    margin: 0,
  },
  addCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1rem 0',
  },
  addForm: {
    width: '100%',
  },
  formRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  inputFlex: {
    flex: '1 1 200px',
    padding: '0.75rem 1rem',
    fontSize: '0.95rem',
    border: '2px solid #E5E7EB',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  addButton: {
    background: '#073b2a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1.25rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  listCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    background: '#F9FAFB',
    borderRadius: '12px',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  itemInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
  },
  itemIcon: {
    width: '48px',
    height: '48px',
    background: '#fff86d',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docIcon: {
    width: '24px',
    height: '24px',
    fill: '#073b2a',
  },
  itemName: {
    fontWeight: '600',
    color: '#111827',
    fontSize: '1rem',
  },
  itemLink: {
    fontSize: '0.85rem',
    color: '#6B7280',
    textDecoration: 'none',
  },
  deleteButton: {
    background: '#FEE2E2',
    color: '#991B1B',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  loadingText: {
    color: '#6B7280',
    textAlign: 'center',
    padding: '2rem',
  },
  errorText: {
    color: '#991B1B',
    textAlign: 'center',
    padding: '0.5rem',
    margin: 0,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    padding: '2rem',
    fontStyle: 'italic',
  },
  embedCard: {
    background: '#073b2a',
    borderRadius: '16px',
    padding: '1.5rem',
    color: '#fff',
  },
  embedInfo: {
    fontSize: '0.95rem',
    color: 'rgba(255,255,255,0.8)',
    margin: '0 0 1rem 0',
    lineHeight: 1.5,
  },
  codeBlock: {
    display: 'block',
    background: 'rgba(0,0,0,0.3)',
    padding: '1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    wordBreak: 'break-all',
    fontFamily: 'monospace',
  },
};
