// Vercel Blob Storage with in-memory cache
// Separate stores per category

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
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: store.blobName });

    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
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
    const { put, del, list } = await import('@vercel/blob');

    // Write new blob FIRST, then delete old ones (atomic-safe order)
    const newBlob = await put(store.blobName, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json'
    });

    // Now delete old blobs (skip the one we just created)
    const { blobs } = await list({ prefix: store.blobName });
    for (const blob of blobs) {
      if (blob.url !== newBlob.url) {
        await del(blob.url);
      }
    }
  } catch (error) {
    console.error('Blob save failed for', category, ':', error.message);
    throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');
  }
  return data;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export { VALID_CATEGORIES };
