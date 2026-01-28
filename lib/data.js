// In-Memory Fallback + Vercel Blob Storage
// Die Daten werden in einem JSON-Blob gespeichert

const BLOB_NAME = 'vertraege.json';

// Initiale Daten (werden verwendet wenn noch kein Blob existiert)
const initialData = [
  {
    id: '1',
    name: 'Nutzungsvertrag Dach',
    driveLink: 'https://drive.google.com/uc?export=download&id=1jsxasejayvBmdL4R6Kl3S8rw_xRR6cCO',
    category: 'vertragsvorlagen',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Stromliefervertrag',
    driveLink: 'https://drive.google.com/uc?export=download&id=1g3ikQHGLR9Morxj0v-XFezfen4YMSN11',
    category: 'vertragsvorlagen',
    createdAt: new Date().toISOString()
  }
];

// In-Memory Store als Fallback
let memoryStore = [...initialData];

export async function getVertraege() {
  try {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: BLOB_NAME });

    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
      const data = await response.json();
      memoryStore = data;
      return data;
    }
  } catch (error) {
    console.log('Using memory store:', error.message);
  }
  return memoryStore;
}

export async function saveVertraege(data) {
  memoryStore = data;
  try {
    const { put, del, list } = await import('@vercel/blob');

    // Alte Blobs löschen
    const { blobs } = await list({ prefix: BLOB_NAME });
    for (const blob of blobs) {
      await del(blob.url);
    }

    // Neuen Blob speichern
    await put(BLOB_NAME, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json'
    });
  } catch (error) {
    console.log('Blob save failed, using memory:', error.message);
  }
  return data;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
