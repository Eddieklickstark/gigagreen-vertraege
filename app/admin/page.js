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
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader()
        }
      });

      if (response.status === 401) {
        setError('Ungültige Anmeldedaten');
        return;
      }

      if (!response.ok) {
        setError('Anmeldung fehlgeschlagen');
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
      <>
        <style>{responsiveStyles}</style>
        <div className="admin-container">
          <div className="login-card">
            <div className="logo-area">
              <div className="logo-circle">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="logo-icon">
                  <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z"/>
                </svg>
              </div>
            </div>
            <h1 className="login-title">GigaGreen Admin</h1>
            <p className="login-subtitle">Vertragsvorlagen verwalten</p>

            <form onSubmit={handleLogin} className="login-form">
              <input
                type="text"
                placeholder="Benutzername"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="admin-input"
                required
              />
              <input
                type="password"
                placeholder="Passwort"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="admin-input"
                required
              />
              {error && <p className="error-text">{error}</p>}
              <button type="submit" className="primary-button">
                Anmelden
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // Admin Dashboard
  return (
    <>
      <style>{responsiveStyles}</style>
      <div className="admin-container">
        <div className="dashboard">
          <header className="admin-header">
            <h1 className="admin-title">Vertragsvorlagen</h1>
            <p className="admin-subtitle">GigaGreen Admin-Bereich</p>
          </header>

          <div className="card">
            <h2 className="card-title">Neue Vorlage hinzufügen</h2>
            <form onSubmit={handleAdd}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Name der Vorlage"
                  value={newVertrag.name}
                  onChange={(e) => setNewVertrag({ ...newVertrag, name: e.target.value })}
                  className="admin-input input-flex"
                  required
                />
                <input
                  type="url"
                  placeholder="Google Drive Link"
                  value={newVertrag.driveLink}
                  onChange={(e) => setNewVertrag({ ...newVertrag, driveLink: e.target.value })}
                  className="admin-input input-flex"
                  required
                />
                <button type="submit" className="add-button" disabled={adding}>
                  {adding ? '...' : '+ Hinzufügen'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2 className="card-title">Aktuelle Vorlagen ({vertraege.filter(v => !v.name.startsWith('__')).length})</h2>

            {loading ? (
              <p className="loading-text">Laden...</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : (
              <div className="list">
                {vertraege.filter(v => !v.name.startsWith('__')).map((vertrag) => (
                  <div key={vertrag.id} className="list-item">
                    <div className="item-info">
                      <div className="item-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="doc-icon">
                          <path d="M20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22ZM19 20V4H5V20H19ZM7 6H11V10H7V6ZM7 12H17V14H7V12ZM7 16H17V18H7V16ZM13 7H17V9H13V7Z" />
                        </svg>
                      </div>
                      <div>
                        <div className="item-name">{vertrag.name}</div>
                        <a href={vertrag.driveLink} target="_blank" rel="noopener noreferrer" className="item-link">
                          Link öffnen ↗
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(vertrag.id)}
                      className="delete-button"
                      disabled={deleting === vertrag.id}
                    >
                      {deleting === vertrag.id ? '...' : 'Löschen'}
                    </button>
                  </div>
                ))}

                {vertraege.filter(v => !v.name.startsWith('__')).length === 0 && (
                  <p className="empty-text">Noch keine Vorlagen vorhanden</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const responsiveStyles = `
  .admin-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    padding: 2rem;
    box-sizing: border-box;
  }

  .login-card {
    max-width: 400px;
    margin: 4rem auto;
    background: #fff;
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    text-align: center;
  }

  .logo-area { margin-bottom: 1.5rem; }

  .logo-circle {
    width: 80px;
    height: 80px;
    background: #fff86d;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    fill: #073b2a;
  }

  .login-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #073b2a;
    margin: 0 0 0.5rem 0;
  }

  .login-subtitle {
    font-size: 1rem;
    color: #6B7280;
    margin: 0 0 2rem 0;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .admin-input {
    padding: 0.875rem 1rem;
    font-size: 1rem;
    border: 2px solid #E5E7EB;
    border-radius: 10px;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
    box-sizing: border-box;
  }

  .admin-input:focus {
    border-color: #073b2a;
  }

  .primary-button {
    background: #fff86d;
    color: #073b2a;
    border: none;
    border-radius: 50px;
    padding: 1rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    margin-top: 0.5rem;
  }

  .primary-button:hover {
    background: #fff200;
  }

  .dashboard {
    max-width: 900px;
    margin: 0 auto;
  }

  .admin-header { margin-bottom: 2rem; }

  .admin-title {
    font-size: 2rem;
    font-weight: 700;
    color: #073b2a;
    margin: 0 0 0.25rem 0;
  }

  .admin-subtitle {
    font-size: 1rem;
    color: #6B7280;
    margin: 0;
  }

  .card {
    background: #fff;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }

  .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  .form-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .input-flex {
    flex: 1 1 200px;
  }

  .add-button {
    background: #073b2a;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    white-space: nowrap;
  }

  .add-button:hover {
    background: #0a5c42;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: #F9FAFB;
    border-radius: 12px;
    gap: 1rem;
  }

  .item-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
  }

  .item-icon {
    width: 48px;
    height: 48px;
    background: #fff86d;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .doc-icon {
    width: 24px;
    height: 24px;
    fill: #073b2a;
  }

  .item-name {
    font-weight: 600;
    color: #111827;
    font-size: 1rem;
    word-break: break-word;
  }

  .item-link {
    font-size: 0.85rem;
    color: #6B7280;
    text-decoration: none;
  }

  .item-link:hover {
    color: #073b2a;
  }

  .delete-button {
    background: #FEE2E2;
    color: #991B1B;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    flex-shrink: 0;
  }

  .delete-button:hover {
    background: #FECACA;
  }

  .loading-text {
    color: #6B7280;
    text-align: center;
    padding: 2rem;
  }

  .error-text {
    color: #991B1B;
    text-align: center;
    padding: 0.5rem;
    margin: 0;
  }

  .empty-text {
    color: #6B7280;
    text-align: center;
    padding: 2rem;
    font-style: italic;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .admin-container {
      padding: 1rem;
    }

    .login-card {
      margin: 2rem auto;
      padding: 1.5rem;
    }

    .admin-title {
      font-size: 1.5rem;
    }

    .form-row {
      flex-direction: column;
    }

    .input-flex {
      flex: none;
      width: 100%;
    }

    .add-button {
      width: 100%;
      padding: 0.875rem;
    }

    .list-item {
      flex-direction: column;
      align-items: flex-start;
      padding: 1rem;
    }

    .delete-button {
      width: 100%;
      text-align: center;
      padding: 0.75rem;
    }

    .card {
      padding: 1.25rem;
    }
  }

  @media (max-width: 480px) {
    .admin-container {
      padding: 0.75rem;
    }

    .login-card {
      margin: 1rem auto;
      padding: 1.25rem;
    }

    .login-title {
      font-size: 1.4rem;
    }

    .item-icon {
      width: 40px;
      height: 40px;
    }

    .doc-icon {
      width: 20px;
      height: 20px;
    }

    .item-name {
      font-size: 0.95rem;
    }
  }
`;
