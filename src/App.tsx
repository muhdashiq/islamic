import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Flower2,
  Leaf,
  Plus,
  Settings2,
  ShieldCheck,
  Sun,
  WifiOff,
} from 'lucide-react';
import { useAppState, updateState, useSaveFailed } from './lib/store';
import { languageNames, translator } from './lib/i18n';
import type { Entry, Language } from './lib/schema';
import { mergeEntries } from './lib/model';
import { useTheme } from './hooks/useTheme';
import { useDay } from './hooks/useDay';
import { usePwa } from './hooks/usePwa';
import { useCatalog } from './hooks/useCatalog';
import { Today } from './components/Today';
import { Library } from './components/Library';
import { Settings } from './components/Settings';
import { AddEntry } from './components/AddEntry';
import { Dialog } from './components/Dialog';
import { Toast, useToast } from './components/Toast';

type View = 'today' | 'library' | 'settings';
const tabs = [
  { key: 'today', icon: Sun },
  { key: 'library', icon: BookOpen },
  { key: 'settings', icon: Settings2 },
] as const;
function readView(): View {
  const key = location.hash.slice(1);
  return tabs.some((tab) => tab.key === key) ? (key as View) : 'today';
}
export default function App() {
  const state = useAppState();
  const saveFailed = useSaveFailed();
  const t = useMemo(() => translator(state.lang), [state.lang]);
  useTheme(state.theme);
  useEffect(() => {
    document.documentElement.dataset.textSize = state.interfaceSize;
  }, [state.interfaceSize]);
  const day = useDay();
  const pwa = usePwa();
  const { catalog, status, refresh } = useCatalog(pwa.online, pwa.update);
  const entries = useMemo(
    () => mergeEntries(catalog.entries, state.custom),
    [catalog, state.custom],
  );
  const [view, setView] = useState<View>(readView);
  const [selectedId, setSelectedId] = useState('ayatul-kursi');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [help, setHelp] = useState(false);
  const { message, show, dismiss } = useToast();
  const mainRef = useRef<HTMLElement>(null);
  const previousView = useRef(view);
  const entry = entries.find((item) => item.id === selectedId) ?? entries[0]!;
  useEffect(() => {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  }, [state.lang]);
  useEffect(() => {
    const change = () => setView(readView());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    document.title = `${t(view)} · Adkar`;
    if (view !== previousView.current) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      mainRef.current?.focus({ preventScroll: true });
      previousView.current = view;
    }
  }, [view, t]);
  function navigate(next: View) {
    if (view !== next) {
      location.hash = next;
      setView(next);
    }
  }
  function openEntry(id: string) {
    setSelectedId(id);
    navigate('today');
  }
  function saveEntry(entry: Entry) {
    updateState((s) => ({ ...s, custom: [...s.custom, entry] }));
    setAdding(false);
    show(t('saved'));
  }
  function removeEntry() {
    if (!deleting) return;
    const removed = deleting;
    const wasBookmarked = state.bookmarks.includes(removed.id);
    updateState((s) => ({
      ...s,
      custom: s.custom.filter((item) => item.id !== removed.id),
      bookmarks: s.bookmarks.filter((id) => id !== removed.id),
    }));
    setDeleting(null);
    show(t('deleted'), () =>
      updateState((s) => ({
        ...s,
        custom: s.custom.some((item) => item.id === removed.id) ? s.custom : [...s.custom, removed],
        bookmarks: wasBookmarked ? [...new Set([...s.bookmarks, removed.id])] : s.bookmarks,
      })),
    );
  }
  const offlineText = t(
    pwa.offline === 'ready'
      ? 'ready'
      : pwa.offline === 'unavailable'
        ? 'offlineUnavailable'
        : 'preparing',
  );
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
          mainRef.current?.scrollIntoView();
        }}
      >
        {t('skip')}
      </a>
      <div className="app-shell">
        <aside className="sidebar">
          <a href="#today" className="brand" aria-label="Adkar" onClick={() => navigate('today')}>
            <span className="brand-icon">
              <Flower2 size={27} strokeWidth={1.2} />
            </span>
            <span>
              adkar<span className="brand-caption">A LITTLE, EVERY DAY</span>
            </span>
          </a>
          <span className="eyebrow nav-heading">{t('yourSpace')}</span>
          <nav className="main-nav" aria-label={t('yourSpace')}>
            {tabs.map(({ key, icon: Icon }) => (
              <a
                href={`#${key}`}
                key={key}
                className={`nav-item ${view === key ? 'active' : ''}`}
                aria-current={view === key ? 'page' : undefined}
                onClick={() => navigate(key)}
              >
                <Icon size={19} strokeWidth={view === key ? 1.8 : 1.5} />
                <span>{t(key)}</span>
                {key === 'library' && <small>{entries.length.toString().padStart(2, '0')}</small>}
                {view === key && <span className="nav-active-dot" />}
              </a>
            ))}
          </nav>
          <button
            className="sidebar-add"
            onClick={() => {
              navigate('library');
              setAdding(true);
            }}
          >
            <Plus size={16} />
            {t('add')}
          </button>
          <div className="sidebar-bottom">
            <div className="sidebar-leaf">
              <span />
              <Leaf size={32} strokeWidth={1} />
              <span />
            </div>
            <p>{t('bottomNote')}</p>
            <span className="sidebar-offline">
              <span className={`status-indicator ${pwa.offline === 'ready' ? 'is-ready' : ''}`} />
              {offlineText}
            </span>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <span className="header-caption">{t('dailyCompanion')}</span>
            <a className="mobile-brand" href="#today" onClick={() => navigate('today')}>
              <Flower2 size={24} strokeWidth={1.2} />
              adkar
            </a>
            <div className="topbar-actions">
              <span className="network-status">
                {pwa.online ? (
                  <span className="status-indicator is-ready" />
                ) : (
                  <WifiOff size={12} />
                )}
                <span>{t(pwa.online ? 'online' : 'offline')}</span>
              </span>
              <label className="native-select language-picker">
                <span className="sr-only">{t('language')}</span>
                <select
                  value={state.lang}
                  onChange={(event) =>
                    updateState((s) => ({ ...s, lang: event.target.value as Language }))
                  }
                >
                  {Object.entries(languageNames).map(([key, label]) => (
                    <option key={key} value={key} lang={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} />
              </label>
              <button
                className="icon-button help-button"
                aria-label={t('appOffline')}
                onClick={() => setHelp(true)}
              >
                <CircleHelp size={18} />
              </button>
            </div>
          </header>
          <main id="main" ref={mainRef} tabIndex={-1}>
            {saveFailed && (
              <div className="storage-warning" role="alert">
                {t('storageError')}
              </div>
            )}
            {view === 'today' && (
              <Today
                state={state}
                entries={entries}
                entry={entry}
                day={day}
                t={t}
                onToast={show}
                onBack={() => navigate('library')}
              />
            )}
            {view === 'library' && (
              <Library
                entries={entries}
                state={state}
                day={day}
                t={t}
                onOpen={openEntry}
                onAdd={() => setAdding(true)}
                onDelete={setDeleting}
              />
            )}
            {view === 'settings' && (
              <Settings
                state={state}
                t={t}
                offline={pwa.offline}
                installed={pwa.installed}
                canInstall={pwa.canInstall}
                onInstall={pwa.install}
                updateStatus={status}
                onUpdate={() => refresh(true)}
              />
            )}
          </main>
          <footer>
            <span>
              <Flower2 size={12} />
              adkar<span>·</span>
              {t('bottomNote')}
            </span>
            <span>
              <ShieldCheck size={12} />
              {t('localOnly')}
            </span>
          </footer>
        </div>
      </div>
      <AddEntry
        key={state.lang}
        open={adding}
        language={state.lang}
        t={t}
        onClose={() => setAdding(false)}
        onSave={saveEntry}
      />
      <Dialog
        open={!!deleting}
        title={t('deleteTitle')}
        closeLabel={t('close')}
        onClose={() => setDeleting(null)}
      >
        <p className="sheet-description">{t('deleteHelp')}</p>
        <div className="sheet-actions">
          <button className="button secondary" onClick={() => setDeleting(null)}>
            {t('cancel')}
          </button>
          <button className="button destructive" onClick={removeEntry}>
            {t('remove')}
          </button>
        </div>
      </Dialog>
      <Dialog
        open={help}
        title={offlineText}
        closeLabel={t('close')}
        onClose={() => setHelp(false)}
      >
        <div className="help-icon">
          <WifiOff size={24} />
        </div>
        <p className="sheet-description">
          {t(pwa.offline === 'unavailable' ? 'offlineUnavailableHelp' : 'offlineHelp')}
        </p>
        <p className="sheet-description">{t('installHelp')}</p>
        <button className="button primary full-width" onClick={() => setHelp(false)}>
          <Check size={17} />
          {t('close')}
        </button>
      </Dialog>
      <Toast message={message} undoLabel={t('undo')} dismiss={dismiss} />
    </>
  );
}
