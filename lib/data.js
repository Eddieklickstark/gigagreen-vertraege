// In-Memory Fallback + Vercel Blob Storage
// Separate Listen für jede Kategorie

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
  const store = STORES[category];
  if (!store) throw new Error('Unbekannte Kategorie: ' + category);
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
      const data = await response.json();
      store.memory = data;
      return data;
    }
  } catch (error) {
    console.log('Using memory store:', error.message);
  }
  return store.memory;
}

export async function saveVertraege(data, category = 'vertragsvorlagen') {
  const store = getStore(category);
  store.memory = data;
  try {
    const { put, del, list } = await import('@vercel/blob');

    const { blobs } = await list({ prefix: store.blobName });
    for (const blob of blobs) {
      await del(blob.url);
    }

    await put(store.blobName, JSON.stringify(data, null, 2), {
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
