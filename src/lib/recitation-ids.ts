// Keep the original Library ID so saved progress and offline audio remain valid.
export function libraryId(id: string): string {
  return id === 'kursi' ? 'ayatul-kursi' : id;
}
export function bookmarkId(id: string): string {
  return id.startsWith('tracker:') ? libraryId(id.slice(8)) : id;
}
