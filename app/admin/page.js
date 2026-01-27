'use client';

import { useState, useEffect, useRef } from 'react';

export default function AdminPage() {
  const [vertraege, setVertraege] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [newVertrag, setNewVertrag] = useState({ name: '', driveLink: '' });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setUploadStatus(`"${file.name}" wird hochgeladen...`);

    try {
      // Step 1: Get resumable upload URL from our server (small JSON request)
      const initResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
        }),
      });

      if (!initResponse.ok) {
        let errMsg = 'Upload-Initialisierung fehlgeschlagen';
        try {
          const data = await initResponse.json();
          errMsg = data.error || errMsg;
        } catch {
          errMsg = `Fehler (Status ${initResponse.status})`;
        }
        throw new Error(errMsg);
      }

      const { uploadUrl } = await initResponse.json();

      // Step 2: Upload file directly to Google Drive (bypasses Vercel size limit)
      setUploadStatus(`"${file.name}" wird zu Google Drive hochgeladen...`);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Length': file.size.toString(),
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Google Drive Upload fehlgeschlagen (${uploadResponse.status})`);
      }

      const driveFile = await uploadResponse.json();
      const fileId = driveFile.id;
      const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

      // Auto-fill the name (without extension) and link
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setNewVertrag({
        name: nameWithoutExt,
        driveLink: downloadLink,
      });
      setUploadStatus(`"${file.name}" erfolgreich hochgeladen`);

      setTimeout(() => setUploadStatus(''), 4000);
    } catch (err) {
      setUploadStatus(`Fehler: ${err.message}`);
      setTimeout(() => setUploadStatus(''), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
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
      setUploadStatus('');
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
        <style suppressHydrationWarning>{responsiveStyles}</style>
        <div className="admin-container">
          <div className="login-card">
            <div className="logo-area">
              <div className="logo-circle">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="logo-icon">
                  <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z"/>
                </svg>
              </div>
            </div>
            <h1 className="login-title">GIGA.GREEN Admin</h1>
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
      <style suppressHydrationWarning>{responsiveStyles}</style>
      <div className="admin-container">
        <div className="dashboard">
          <header className="admin-header">
            <h1 className="admin-title">Vertragsvorlagen</h1>
            <p className="admin-subtitle">GIGA.GREEN Admin-Bereich</p>
          </header>

          <div className="card">
            <h2 className="card-title">Neue Vorlage hinzufügen</h2>

            {/* Drag & Drop Upload Zone */}
            <div
              className={`dropzone ${dragActive ? 'dropzone-active' : ''} ${uploading ? 'dropzone-uploading' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc,.pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              {uploading ? (
                <div className="dropzone-content">
                  <div className="spinner" />
                  <p className="dropzone-text">{uploadStatus}</p>
                </div>
              ) : uploadStatus && !uploadStatus.startsWith('Fehler') ? (
                <div className="dropzone-content">
                  <div className="dropzone-icon dropzone-icon-success">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                      <path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z"/>
                    </svg>
                  </div>
                  <p className="dropzone-text success-text">{uploadStatus}</p>
                  <p className="dropzone-hint">Name und Link wurden automatisch ausgefüllt</p>
                </div>
              ) : (
                <div className="dropzone-content">
                  <div className="dropzone-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                      <path d="M12 12.5858L16.2426 16.8284L14.8284 18.2426L13 16.4142V22H11V16.4142L9.17157 18.2426L7.75736 16.8284L12 12.5858ZM12 2C15.5934 2 18.5544 4.70761 18.9541 8.19395C21.2858 8.83154 23 10.9656 23 13.5C23 16.3688 20.8036 18.7246 18.0006 18.9776L18 17C19.6569 17 21 15.6569 21 14C21 12.3431 19.6569 11 18 11H17V10C17 7.23858 14.7614 5 12 5C9.23858 5 7 7.23858 7 10V11H6C4.34315 11 3 12.3431 3 14C3 15.6569 4.34315 17 6 17L6.00039 18.9776C3.19696 18.7252 1 16.3692 1 13.5C1 10.9656 2.71424 8.83154 5.04648 8.19411C5.44561 4.70761 8.40661 2 12 2Z"/>
                    </svg>
                  </div>
                  <p className="dropzone-text">
                    {dragActive ? 'Datei hier ablegen' : 'Datei hierhin ziehen oder klicken'}
                  </p>
                  <p className="dropzone-hint">DOCX, DOC oder PDF — wird direkt in Google Drive hochgeladen</p>
                </div>
              )}
              {uploadStatus && uploadStatus.startsWith('Fehler') && (
                <p className="dropzone-error">{uploadStatus}</p>
              )}
            </div>

            <div className="divider">
              <span className="divider-text">Dann Name prüfen und hinzufügen</span>
            </div>

            <form onSubmit={handleAdd}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="z.B. Nutzungsvertrag Dach"
                  value={newVertrag.name}
                  onChange={(e) => setNewVertrag({ ...newVertrag, name: e.target.value })}
                  className="admin-input input-flex"
                  required
                />
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={newVertrag.driveLink}
                  onChange={(e) => setNewVertrag({ ...newVertrag, driveLink: e.target.value })}
                  className="admin-input input-flex"
                  required
                />
                <button type="submit" className="add-button" disabled={adding || !newVertrag.driveLink}>
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
  /* CI Colors: Dunkelgrün #073b2a, Neongelb #f1f86d, Hellgrau #f8f8f8, Font: Figtree */

  .admin-container {
    min-height: 100vh;
    background: #f8f8f8;
    padding: 2rem;
    box-sizing: border-box;
    font-family: 'Figtree', sans-serif;
  }

  .login-card {
    max-width: 400px;
    margin: 4rem auto;
    background: #fff;
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 4px 24px rgba(7, 59, 42, 0.08);
    text-align: center;
  }

  .logo-area { margin-bottom: 1.5rem; }

  .logo-circle {
    width: 80px;
    height: 80px;
    background: #f1f86d;
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
    font-family: 'Figtree', sans-serif;
    box-sizing: border-box;
  }

  .admin-input:focus {
    border-color: #073b2a;
  }

  .primary-button {
    background: #f1f86d;
    color: #073b2a;
    border: none;
    border-radius: 50px;
    padding: 1rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Figtree', sans-serif;
    margin-top: 0.5rem;
  }

  .primary-button:hover {
    background: #e8ef00;
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
    box-shadow: 0 2px 12px rgba(7, 59, 42, 0.04);
  }

  .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #073b2a;
    margin: 0 0 1rem 0;
  }

  /* Drag & Drop Zone */
  .dropzone {
    border: 2px dashed #D1D5DB;
    border-radius: 12px;
    padding: 2rem 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #f8f8f8;
  }

  .dropzone:hover {
    border-color: #073b2a;
    background: #f0fdf4;
  }

  .dropzone-active {
    border-color: #f1f86d;
    background: #fefff0;
    border-style: solid;
  }

  .dropzone-uploading {
    cursor: wait;
    border-color: #073b2a;
    background: #f0fdf4;
  }

  .dropzone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .dropzone-icon {
    width: 48px;
    height: 48px;
    background: #f1f86d;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #073b2a;
  }

  .dropzone-icon-success {
    background: #073b2a;
    color: #f1f86d;
  }

  .dropzone-text {
    font-size: 1rem;
    font-weight: 600;
    color: #073b2a;
    margin: 0;
  }

  .success-text {
    color: #073b2a;
  }

  .dropzone-hint {
    font-size: 0.85rem;
    color: #6B7280;
    margin: 0;
  }

  .dropzone-error {
    font-size: 0.85rem;
    color: #991B1B;
    margin: 0.5rem 0 0 0;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #E5E7EB;
    border-top-color: #073b2a;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.25rem 0;
  }

  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #E5E7EB;
  }

  .divider-text {
    font-size: 0.8rem;
    color: #6B7280;
    font-weight: 500;
    white-space: nowrap;
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
    font-family: 'Figtree', sans-serif;
    white-space: nowrap;
  }

  .add-button:hover:not(:disabled) {
    background: #0a5c42;
  }

  .add-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    background: #f8f8f8;
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
    background: #f1f86d;
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
    color: #073b2a;
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
    font-family: 'Figtree', sans-serif;
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

    .dropzone {
      padding: 1.5rem 1rem;
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
