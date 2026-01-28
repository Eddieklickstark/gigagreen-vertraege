# GIGA.GREEN Vertragsvorlagen

Admin-Tool zur Verwaltung von Vertragsvorlagen und Dokumenten für die Gemeinschaftliche Gebäudeversorgung. Die Vorlagen werden als Webflow-Embeds auf [giga.green](https://www.giga.green) angezeigt.

## Live-URLs

| | URL |
|---|---|
| **Admin** | https://gigagreen-vertraege.vercel.app/admin |
| **Vertragsvorlagen** | https://www.giga.green/vorlagen-vertraege |
| **Gemeinschaftliche Gebäudeversorgung** | https://www.giga.green/gemeinschaftliche-gebaudeversorgung |
| **Google Drive Ordner** | https://drive.google.com/drive/folders/1qoE0Exyw1wgYWtwtGrQOVLpUyNppujm8 |

## Architektur

- **Framework:** Next.js 14 (App Router)
- **Hosting:** Vercel
- **Datenspeicher:** Vercel Blob Storage (mit In-Memory-Fallback)
- **Datei-Upload:** Google Drive API v3 (Service Account, Resumable Upload)
- **Embed:** Einzelnes `embed.js` mit `data-category`-Attribut

## Kategorien

Die Vorlagen sind in zwei separate Listen aufgeteilt, mit jeweils eigenem Datenspeicher:

- `vertragsvorlagen` — Vertragsvorlagen (Nutzungsvertrag Dach, Stromliefervertrag, etc.)
- `gebaeudeversorgung` — Gemeinschaftliche Gebäudeversorgung

## Webflow Embed-Codes

**Vertragsvorlagen:**
```html
<script src="https://gigagreen-vertraege.vercel.app/embed.js" data-category="vertragsvorlagen"></script>
```

**Gemeinschaftliche Gebäudeversorgung:**
```html
<script src="https://gigagreen-vertraege.vercel.app/embed.js" data-category="gebaeudeversorgung"></script>
```

## Environment Variables (Vercel)

| Variable | Beschreibung |
|---|---|
| `ADMIN_USERNAME` | Login-Benutzername |
| `ADMIN_PASSWORD` | Login-Passwort |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Service Account JSON für Drive-Upload |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Storage Token (optional) |

## Projektstruktur

```
app/
  admin/page.js          — Admin-UI (Login, Tabs, Upload, CRUD)
  api/
    auth/route.js        — Auth-Endpoint (Basic Auth)
    upload/route.js      — Resumable Upload zu Google Drive
    vertraege/route.js   — CRUD API für Vorlagen (GET/POST/DELETE)
  layout.js              — Root Layout
  page.js                — Startseite (Redirect)
lib/
  auth.js                — Auth-Helper
  data.js                — Datenspeicher (Blob + Memory, pro Kategorie)
public/
  embed.js               — Webflow Embed-Script
  favicon.png
  apple-touch-icon.png
```

## Kontakt

Bei Fragen: eddie@klickstark.de
