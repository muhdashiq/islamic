const DATABASE = 'adkar-media';
const STORE = 'recordings';
const MAX_BYTES = 15 * 1024 * 1024;

async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Audio storage is blocked'));
  });
}
export async function readRecording(url: string): Promise<Blob | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readonly');
      const request = transaction.objectStore(STORE).get(url);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}
async function write(url: string, blob: Blob | null): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      if (blob) store.put(blob, url);
      else store.delete(url);
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}
export const saveRecording = (url: string, blob: Blob) => write(url, blob);
export const removeRecording = (url: string) => write(url, null);

/** Download the entire recording before committing: a partial file is never marked saved. */
export async function downloadRecording(
  url: string,
  signal: AbortSignal,
  onProgress: (value: number | null) => void,
): Promise<Blob> {
  const response = await fetch(url, { signal, mode: 'cors', credentials: 'omit' });
  if (!response.ok || response.status === 206) throw new Error('Audio download failed');
  const type = response.headers.get('content-type') || '';
  if (!type.startsWith('audio/')) throw new Error('Invalid audio response');
  const length = Number(response.headers.get('content-length')) || 0;
  if (length > MAX_BYTES) throw new Error('Audio file is too large');
  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    if (!blob.size || blob.size > MAX_BYTES) throw new Error('Invalid audio size');
    return blob;
  }
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BYTES) throw new Error('Audio file is too large');
      chunks.push(new Uint8Array(value));
      onProgress(length ? Math.min(100, Math.round((received / length) * 100)) : null);
    }
    if (!received || (length && received !== length)) throw new Error('Incomplete audio download');
    return new Blob(chunks, { type });
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}
