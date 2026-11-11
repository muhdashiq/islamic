import { useState } from 'react';
import { BookOpen, Bookmark, Check, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import type { AppState, Entry } from '../lib/schema';
import type { Translate } from '../lib/i18n';
import { countFor } from '../lib/model';
import { libraryCategories } from '../lib/library';
interface Props {
  entries: Entry[];
  state: AppState;
  day: string;
  t: Translate;
  onOpen: (id: string) => void;
  onAdd: () => void;
  onDelete: (entry: Entry) => void;
}
export function Library({ entries, state, day, t, onOpen, onAdd, onDelete }: Props) {
  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [category, setCategory] = useState('all');
  const selectedCategory = libraryCategories.find((item) => item.id === category);
  const results = entries.filter(
    (entry) =>
      (!savedOnly || state.bookmarks.includes(entry.id)) &&
      (!selectedCategory || selectedCategory.entryIds.has(entry.id)) &&
      Object.values(entry.title).some((title) =>
        title?.toLocaleLowerCase(state.lang).includes(query.trim().toLocaleLowerCase(state.lang)),
      ),
  );
  return (
    <>
      <div className="page-heading library-heading">
        <div>
          <span className="eyebrow">
            <span className="gold-line" />
            {t('collection')}
          </span>
          <h1>{t('library')}</h1>
          <p>{t('libraryIntro')}</p>
        </div>
        <button className="button primary" onClick={onAdd}>
          <Plus size={18} />
          {t('add')}
        </button>
      </div>
      <div className="library-tools">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">{t('search')}</span>
          <input
            type="search"
            placeholder={t('search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="segmented" role="group" aria-label={t('library')}>
          <button
            className={!savedOnly ? 'selected' : ''}
            aria-pressed={!savedOnly}
            onClick={() => setSavedOnly(false)}
          >
            {t('all')}
          </button>
          <button
            className={savedOnly ? 'selected' : ''}
            aria-pressed={savedOnly}
            onClick={() => setSavedOnly(true)}
          >
            <Bookmark size={13} />
            {t('bookmarked')}
          </button>
        </div>
      </div>
      <div className="library-category-filter">
        <label className="native-select">
          <span>{state.lang === 'ml' ? 'വിഭാഗം' : 'Category'}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">
              {state.lang === 'ml' ? 'എല്ലാ വിഭാഗങ്ങളും' : 'All categories'}
            </option>
            {libraryCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {state.lang === 'ml' ? item.titleMl : item.title}
              </option>
            ))}
          </select>
        </label>
        <span className="setting-help" role="status">
          {results.length} {state.lang === 'ml' ? 'പാരായണങ്ങൾ' : 'recitations'}
        </span>
      </div>
      {results.length ? (
        <div className="library-list">
          {results.map((entry) => {
            const personal = state.custom.some((custom) => custom.id === entry.id);
            const done = countFor(state, entry.id, day) >= state.target;
            return (
              <article className="library-entry" key={entry.id}>
                <button className="entry-open" onClick={() => onOpen(entry.id)}>
                  <span className={`entry-icon ${done ? 'entry-complete' : ''}`}>
                    {done ? <Check size={22} /> : <BookOpen size={22} strokeWidth={1.4} />}
                  </span>
                  <span className="entry-info">
                    <span className="eyebrow">
                      {personal
                        ? t('personal')
                        : entry.kind === 'dua'
                          ? state.lang === 'ml'
                            ? 'ദുആ'
                            : 'Supplication'
                          : entry.kind === 'dhikr'
                            ? state.lang === 'ml'
                              ? 'ദിക്ർ'
                              : 'Remembrance'
                            : t('builtIn')}
                    </span>
                    <span className="entry-title">{entry.title[state.lang] || entry.title.en}</span>
                    <span className="entry-meta">
                      {entry.reference || t('personal')}
                      <span className="meta-dot">·</span>
                      {countFor(state, entry.id, day)} / {state.target}
                    </span>
                    <span className="entry-categories">
                      {libraryCategories
                        .filter((category) => category.entryIds.has(entry.id))
                        .map((category) =>
                          state.lang === 'ml' ? category.titleMl : category.title,
                        )
                        .join(' · ')}
                    </span>
                  </span>
                  {state.bookmarks.includes(entry.id) && (
                    <Bookmark
                      size={15}
                      className="entry-saved"
                      fill="currentColor"
                      aria-label={t('savedBadge')}
                    />
                  )}
                  <ChevronRight size={18} className="chevron" />
                </button>
                {personal && (
                  <button
                    className="icon-button delete-button"
                    aria-label={`${t('remove')} ${entry.title[state.lang] || entry.title.en}`}
                    onClick={() => onDelete(entry)}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          {savedOnly ? (
            <Bookmark size={32} strokeWidth={1.2} />
          ) : (
            <Search size={32} strokeWidth={1.2} />
          )}
          <h2>{t(savedOnly && !query ? 'noSaved' : 'noResults')}</h2>
          <p>{t(savedOnly && !query ? 'noSavedHelp' : 'noResultsHelp')}</p>
          <button className="button secondary" onClick={onAdd}>
            <Plus size={16} />
            {t('add')}
          </button>
        </div>
      )}
      <p className="library-note">
        <SparkleDot />
        {t('libraryNote')}
      </p>
    </>
  );
}
function SparkleDot() {
  return <span aria-hidden="true">✧</span>;
}
