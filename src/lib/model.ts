import type { AppState, Entry } from './schema';

export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function countFor(state: AppState, id: string, day = dayKey()): number {
  return state.days[day]?.[id] ?? 0;
}
export function setCount(state: AppState, id: string, count: number, day = dayKey()): AppState {
  return {
    ...state,
    days: { ...state.days, [day]: { ...state.days[day], [id]: Math.max(0, Math.floor(count)) } },
  };
}
export function increment(state: AppState, id: string, day = dayKey()): AppState {
  return setCount(state, id, countFor(state, id, day) + 1, day);
}
export function progress(state: AppState, entries: Entry[], day = dayKey()) {
  const complete = entries.filter((e) => countFor(state, e.id, day) >= state.target).length;
  return {
    complete,
    total: entries.length,
    percent: entries.length ? Math.round((100 * complete) / entries.length) : 0,
  };
}
export function mergeEntries(builtins: Entry[], custom: Entry[]): Entry[] {
  const ids = new Set(builtins.map((e) => e.id));
  return [
    ...builtins,
    ...custom.filter((e) => {
      if (ids.has(e.id)) return false;
      ids.add(e.id);
      return true;
    }),
  ];
}
