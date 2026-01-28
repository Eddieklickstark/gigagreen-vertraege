// Vercel Blob Storage with in-memory cache
// Separate stores per category

import { put, list } from '@vercel/blob';

const VALID_CATEGORIES = ['vertragsvorlagen', 'gebaeudeversorgung'];

const STORES = {
  vertragsvorlagen: {
    blobName: 'vertragsvorlagen.json',
    initialData: [
      {
        id: '1',
        name: 'Nutzungsvertrag Dach',
        driveLink: 'https://drive.google.com/uc?export=download&id=1jsxasejayvBmdL4R6Kl3S8rw_xRR6cCO',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Stromliefervertrag',
        driveLink: 'https://drive.google.com/uc?export=download&id=1g3ikQHGLR9Morxj0v-XFezfen4YMSN11',
        createdAt: new Date().toISOString()
      }
    ],
    memory: null,
  },
  gebaeudeversorgung: {
    blobName: 'gebaeudeversorgung.json',
    initialData: [],
    memory: null,
  },
};

function getStore(category) {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error('Unbekannte Kategorie: ' + category);
  }
  const store = STORES[category];
  if (store.memory === null) store.memory = [...store.initialData];
  return store;
}

export async function getVertraege(category = 'vertragsvorlagen') {
  const store = getStore(category);
  try {
    const { blobs } = await list({ prefix: store.blobName });

    if (blobs.length > 0) {
      // Prefer exact pathname match over prefix match (cleans up old random-suffix blobs)
      const exactBlob = blobs.find(b => b.pathname === store.blobName) || blobs[0];
      const response = await fetch(exactBlob.url);
      if (!response.ok) {
        throw new Error(`Blob fetch failed: ${response.status}`);
      }
      const data = await response.json();
      store.memory = data;
      return data;
    }
  } catch (error) {
    console.error('Blob read failed for', category, ':', error.message);
  }
  return store.memory;
}

export async function saveVertraege(data, category = 'vertragsvorlagen') {
  const store = getStore(category);
  store.memory = data;
  try {
    // addRandomSuffix: false ensures the blob path is exactly store.blobName,
    // so list({ prefix }) can find it and put() overwrites in place.
    await put(store.blobName, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (error) {
    console.error('Blob save failed for', category, ':', error.message, error.stack);
    throw new Error('Blob-Fehler: ' + error.message);
  }
  return data;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export { VALID_CATEGORIES };
