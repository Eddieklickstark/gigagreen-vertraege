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

| Variable | Erforderlich | Beschreibung |
|---|---|---|
| `ADMIN_USERNAME` | Ja | Login-Benutzername für das Admin-Panel |
| `ADMIN_PASSWORD` | Ja | Login-Passwort für das Admin-Panel |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Ja | Google Service Account JSON (als String) für Drive-Upload |
| `BLOB_READ_WRITE_TOKEN` | Ja | Vercel Blob Storage Token -- ohne diesen Token werden Daten **nicht** persistiert |

## Setup

### 1. Repository klonen

```bash
git clone https://github.com/Eddieklickstark/gigagreen-vertraege.git
cd gigagreen-vertraege
npm install
```

### 2. Vercel-Projekt verknüpfen

```bash
npx vercel link
```

### 3. Blob Store einrichten

Im Vercel Dashboard:

1. **Project** aufrufen -> **Storage** Tab
2. **Connect Database** -> **Blob** -> **Create a new Blob store**
3. Environments auswahlen (Production, Preview, Development)
4. `BLOB_READ_WRITE_TOKEN` wird automatisch als Environment Variable angelegt

Ohne diesen Token funktioniert die Datenpersistierung nicht. Vorlagen werden dann nur im Arbeitsspeicher der Serverless Function gehalten und gehen beim nachsten Cold Start verloren (ca. 15 Sekunden Inaktivitat).

### 4. Weitere Environment Variables setzen

Im Vercel Dashboard unter **Settings -> Environment Variables**:

- `ADMIN_USERNAME` und `ADMIN_PASSWORD` -- Zugangsdaten fuer das Admin-Panel
- `GOOGLE_SERVICE_ACCOUNT_KEY` -- JSON-Key des Google Service Accounts (als einzeiliger String)

### 5. Lokal entwickeln

```bash
npx vercel env pull   # Laedt Environment Variables in .env.local
npm run dev
```

### 6. Deployment

Deployment erfolgt automatisch bei Push auf `main` (Vercel Git Integration) oder manuell:

```bash
npx vercel --prod
```

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
