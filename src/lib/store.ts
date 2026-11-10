import { useSyncExternalStore } from 'react';
import { parseState, type AppState } from './schema';

const KEY = 'adkar-state';
function load(): AppState {
  try {
    return parseState(JSON.parse(localStorage.getItem(KEY) ?? '{}'));
  } catch {
    return parseState({});
  }
}
let state = load();
let saveFailed = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
function emit() {
  for (const listener of listeners) listener();
}
export function updateState(update: (previous: AppState) => AppState): void {
  state = update(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    saveFailed = false;
  } catch {
    saveFailed = true;
  }
  emit();
}
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state);
}
export function useSaveFailed(): boolean {
  return useSyncExternalStore(subscribe, () => saveFailed);
}
window.addEventListener('storage', (event) => {
  if (event.key === KEY || event.key === null) {
    state = load();
    saveFailed = false;
    emit();
  }
});
