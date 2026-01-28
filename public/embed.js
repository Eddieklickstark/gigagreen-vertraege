(function() {
  'use strict';

  // API URL und Kategorie aus dem Script-Tag lesen
  const SCRIPT_TAG = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.includes('embed.js')) {
        return scripts[i];
      }
    }
    return null;
  })();

  const CATEGORY = SCRIPT_TAG ? (SCRIPT_TAG.getAttribute('data-category') || 'vertragsvorlagen') : 'vertragsvorlagen';

  const API_URL = (function() {
    if (!SCRIPT_TAG || !SCRIPT_TAG.src) return '/api/vertraege?category=' + CATEGORY;
    var url = new URL(SCRIPT_TAG.src);
    return url.origin + '/api/vertraege?category=' + encodeURIComponent(CATEGORY);
  })();

  // Styles einfügen (1:1 wie Original)
  const style = document.createElement('style');
  style.textContent = `
    #vertrag-list-container {
      font-family: 'Figtree', sans-serif;
    }
    #vertrag-list-container .vertrag-box {
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 15px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      transition: all 0.2s ease;
    }
    #vertrag-list-container .vertrag-box:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      transform: translateY(-1px);
    }
    #vertrag-list-container .vertrag-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    #vertrag-list-container .vertrag-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }
    #vertrag-list-container .icon-circle {
      background: #f1f86d;
      border-radius: 50%;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #vertrag-list-container .icon-svg {
      width: 40px;
      height: 40px;
      fill: #073b2a;
    }
    #vertrag-list-container .vertrag-title {
      font-weight: 600;
      font-size: 1.3rem;
      color: #111827;
    }
    #vertrag-list-container .download-button {
      background-color: #f1f86d;
      color: #111827;
      border: none;
      border-radius: 50px;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Figtree', sans-serif;
    }
    #vertrag-list-container .download-button:hover {
      background-color: #e8ef00;
      transform: translateY(-1px);
    }
    #vertrag-list-container .download-button:active {
      transform: translateY(1px);
    }
    #vertrag-list-container .download-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    #vertrag-list-container .error-message {
      padding: 2rem;
      text-align: center;
      color: #991B1B;
    }
    @media (max-width: 768px) {
      #vertrag-list-container .vertrag-box {
        padding: 1.25rem;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      #vertrag-list-container .vertrag-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
      }
      #vertrag-list-container .vertrag-info {
        width: 100%;
      }
      #vertrag-list-container .button-container {
        width: 100%;
      }
      #vertrag-list-container .download-button {
        width: 100%;
        padding: 1rem;
        font-size: 1rem;
        text-align: center;
        border-radius: 40px;
        font-weight: 700;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
    }
    @media (max-width: 480px) {
      #vertrag-list-container .icon-circle {
        width: 50px;
        height: 50px;
      }
      #vertrag-list-container .icon-svg {
        width: 24px;
        height: 24px;
      }
      #vertrag-list-container .vertrag-info {
        gap: 0.75rem;
      }
      #vertrag-list-container .vertrag-title {
        font-size: 1.1rem;
        line-height: 1.3;
      }
      #vertrag-list-container .download-button {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }
    }
  `;
  document.head.appendChild(style);

  // Container erstellen falls nicht vorhanden
  function ensureContainer() {
    let container = document.getElementById('vertrag-list-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vertrag-list-container';
      document.currentScript.parentNode.insertBefore(container, document.currentScript.nextSibling);
    }

    if (!document.getElementById('vertrag-list')) {
      const list = document.createElement('div');
      list.id = 'vertrag-list';
      container.appendChild(list);
    }

    if (!document.getElementById('timestamp')) {
      const timestamp = document.createElement('p');
      timestamp.id = 'timestamp';
      timestamp.style.cssText = 'font-size: 0.9rem; color: #6B7280; font-style: italic; margin-top: 2rem;';
      container.appendChild(timestamp);
    }

    return container;
  }

  // Google Drive Link konvertieren
  function convertToDirectDownloadLink(url) {
    let fileId = '';
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) fileId = match[1];
    } else if (url.includes('drive.google.com/open')) {
      const match = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) fileId = match[1];
    } else if (url.includes('drive.google.com/uc')) {
      const match = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) fileId = match[1];
    }
    return fileId
      ? 'https://drive.google.com/uc?export=download&confirm=t&id=' + fileId
      : url;
  }

  // Download Handler
  function setupDownloadButtons() {
    const container = document.getElementById('vertrag-list');
    if (!container) return;

    let iframe = document.getElementById('vertrag-download-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'vertrag-download-iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }

    container.addEventListener('click', function(event) {
      const target = event.target.closest('.download-button');
      if (!target) return;
      event.preventDefault();

      const url = target.getAttribute('data-url');
      const filename = target.getAttribute('data-filename');
      const source = target.getAttribute('data-source');

      if (url && filename) {
        const original = target.textContent;
        target.disabled = true;
        target.textContent = 'Wird heruntergeladen...';

        if (source === 'google') {
          iframe.src = url;
          setTimeout(function() {
            target.textContent = original;
            target.disabled = false;
          }, 1000);
        } else {
          fetch(url)
            .then(function(response) {
              if (!response.ok) throw new Error('Netzwerkfehler: ' + response.status);
              return response.blob();
            })
            .then(function(blob) {
              const blobUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 1000);
            })
            .catch(function(err) {
              console.error('Download-Fehler:', err);
              alert('Download fehlgeschlagen. Bitte erneut versuchen.');
            })
            .finally(function() {
              setTimeout(function() {
                target.textContent = original;
                target.disabled = false;
              }, 1000);
            });
        }
      }
    });
  }

  // Hauptfunktion: Verträge laden
  function loadVertraege() {
    ensureContainer();

    const container = document.getElementById('vertrag-list');
    const timestamp = document.getElementById('timestamp');
    if (!container || !timestamp) return;

    container.innerHTML = '<div style="text-align: center; padding: 2rem;">Vertragsvorlagen werden geladen...</div>';

    fetch(API_URL)
      .then(function(response) {
        if (!response.ok) throw new Error('Fehler beim Laden der Daten');
        return response.json();
      })
      .then(function(data) {
        container.innerHTML = '';
        let count = 0;

        data.forEach(function(entry) {
          const name = entry.name ? entry.name.trim() : '';
          const docx = entry.driveLink ? entry.driveLink.trim() : '';

          // Testeinträge ignorieren
          if (name && docx && !name.startsWith('__')) {
            count++;
            const isGoogleDrive = docx.includes('drive.google.com');
            const downloadUrl = isGoogleDrive ? convertToDirectDownloadLink(docx) : docx;

            const box = document.createElement('div');
            box.className = 'vertrag-box';
            box.innerHTML =
              '<div class="vertrag-container">' +
                '<div class="vertrag-info">' +
                  '<div class="icon-circle">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg">' +
                      '<path d="M20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22ZM19 20V4H5V20H19ZM7 6H11V10H7V6ZM7 12H17V14H7V12ZM7 16H17V18H7V16ZM13 7H17V9H13V7Z" />' +
                    '</svg>' +
                  '</div>' +
                  '<div class="vertrag-title">' + name + '</div>' +
                '</div>' +
                '<div class="button-container">' +
                  '<button class="download-button" data-url="' + downloadUrl + '" data-filename="' + name + '.docx" data-source="' + (isGoogleDrive ? 'google' : 'webflow') + '">' +
                    'herunterladen' +
                  '</button>' +
                '</div>' +
              '</div>';
            container.appendChild(box);
          }
        });

        const now = new Date();
        const locale = 'de-DE';
        timestamp.textContent = count > 0
          ? 'Letzte Aktualisierung: ' + now.toLocaleDateString(locale)
          : 'Keine Vertragsvorlagen verfügbar.';

        setupDownloadButtons();
      })
      .catch(function(error) {
        console.error('Fehler:', error);
        container.innerHTML = '<div class="error-message">Es ist ein Fehler beim Laden der Vertragsvorlagen aufgetreten. Bitte versuchen Sie es später erneut.</div>';
        timestamp.textContent = '';
      });
  }

  // Bei DOM-Ready starten
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadVertraege);
  } else {
    loadVertraege();
  }
})();
