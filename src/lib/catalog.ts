import bundled from '../../public/content.json';
import { catalogSchema, type Catalog } from './schema';
const KEY = 'adkar-catalog';
export const bundledCatalog = catalogSchema.parse(bundled);
export function loadCatalog(): Catalog {
  try {
    const cached = catalogSchema.parse(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
    return cached.version > bundledCatalog.version ? cached : bundledCatalog;
  } catch {
    return bundledCatalog;
  }
}
let pending: Promise<Catalog> | null = null;
export function fetchCatalog(): Promise<Catalog> {
  if (pending) return pending;
  pending = (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}content.json`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    const candidate = catalogSchema.parse(await response.json());
    const current = loadCatalog();
    const next = candidate.version >= current.version ? candidate : current;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* The bundled catalog still works if storage is unavailable. */
    }
    return next;
  })().finally(() => {
    pending = null;
  });
  return pending;
}
