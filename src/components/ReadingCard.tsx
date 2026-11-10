import {
  Bookmark,
  Check,
  CheckCheck,
  ExternalLink,
  Minus,
  Plus,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import type { AppState, Entry, Language } from '../lib/schema';
import type { Translate } from '../lib/i18n';
import { countFor, increment, setCount } from '../lib/model';
import { updateState } from '../lib/store';
import { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { useVerseAudio } from '../hooks/useVerseAudio';
import { arabicWords } from '../lib/audio';
interface Props {
  entry: Entry;
  state: AppState;
  day: string;
  t: Translate;
  onToast: (message: string, action?: () => void) => void;
}
export function ReadingCard({ entry, state, day, t, onToast }: Props) {
  const [meaning, setMeaning] = useState(state.defaultMeaning);
  const custom = entry.id.startsWith('custom-');
  const audio = useVerseAudio(entry.recitation, state);
  const words = arabicWords(entry.arabic);
  const segment = entry.recitation?.segments[audio.activeSegment];
  const count = countFor(state, entry.id, day);
  const isSaved = state.bookmarks.includes(entry.id);
  function changeSize(delta: number) {
    updateState((s) => ({ ...s, fontSize: Math.max(22, Math.min(64, s.fontSize + delta)) }));
  }
  function bookmark() {
    updateState((s) => ({
      ...s,
      bookmarks: s.bookmarks.includes(entry.id)
        ? s.bookmarks.filter((id) => id !== entry.id)
        : [...s.bookmarks, entry.id],
    }));
  }
  function reset() {
    updateState((s) => setCount(s, entry.id, 0, day));
    onToast(t('resetDone'), () => updateState((s) => setCount(s, entry.id, count, day)));
  }
  const meaningText = entry.meaning[state.lang as Language];
  return (
    <article className="reading-card" aria-labelledby="reading-title">
      <div className="reading-title-row">
        <div>
          <span className="eyebrow">
            <BookOpen size={13} />
            {custom ? t('personal') : t('dailyRemembrance')}
          </span>
          <h2 id="reading-title">{entry.title[state.lang] || entry.title.en}</h2>
          <p className="subtitle">{custom ? t('personal') : t('verseSubtitle')}</p>
        </div>
        <button
          className={`icon-button bookmark ${isSaved ? 'is-saved' : ''}`}
          aria-label={t(isSaved ? 'unbookmark' : 'bookmark')}
          aria-pressed={isSaved}
          onClick={bookmark}
        >
          <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="reading-toolbar">
        <div className="segmented" role="group" aria-label={t('reading')}>
          <button
            aria-pressed={!meaning}
            className={!meaning ? 'selected' : ''}
            onClick={() => setMeaning(false)}
          >
            {t('arabic')}
          </button>
          <button
            aria-pressed={meaning}
            className={meaning ? 'selected' : ''}
            onClick={() => setMeaning(true)}
          >
            {t('meaning')}
          </button>
        </div>
        <div className="font-controls">
          <button
            className="icon-button"
            aria-label={t('smaller')}
            disabled={state.fontSize <= 22}
            onClick={() => changeSize(-2)}
          >
            <span className="font-a small">A</span>
            <Minus size={9} />
          </button>
          <span className="font-divider" />
          <button
            className="icon-button"
            aria-label={t('larger')}
            disabled={state.fontSize >= 64}
            onClick={() => changeSize(2)}
          >
            <span className="font-a">A</span>
            <Plus size={9} />
          </button>
        </div>
      </div>
      {entry.recitation && (
        <AudioPlayer
          audio={audio}
          recitation={entry.recitation}
          title={entry.title[state.lang] || entry.title.en}
          state={state}
          t={t}
        />
      )}
      {meaning && entry.recitation && audio.playing && (
        <p className="audio-meaning-hint">{t('audioArabicHint')}</p>
      )}
      <div className="verse-body">
        {!meaning && !custom && (
          <div className="bismillah" dir="rtl" lang="ar">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}
        <div
          className={meaning ? 'meaning-text' : 'arabic-text'}
          lang={meaning ? state.lang : 'ar'}
          dir={meaning ? (state.lang === 'ar' ? 'rtl' : 'ltr') : 'rtl'}
          style={{
            fontSize: meaning
              ? `${Math.max(17, Math.round(state.fontSize * 0.6))}px`
              : `${state.fontSize}px`,
          }}
        >
          {meaning
            ? meaningText || t('noMeaning')
            : entry.recitation
              ? words.map((word, index) => (
                  <span key={index}>
                    <span
                      className={`verse-word ${segment && index >= segment[0] && index < segment[1] ? 'is-current' : ''}`}
                      aria-current={
                        segment && index >= segment[0] && index < segment[1] ? 'true' : undefined
                      }
                      data-word={index}
                    >
                      {word}
                    </span>
                    {index < words.length - 1 ? ' ' : ''}
                  </span>
                ))
              : entry.arabic}
        </div>
        {meaning ? (
          <p className="meaning-note">{t('meaningNote')}</p>
        ) : (
          !custom && (
            <div className="verse-flourish" aria-hidden="true">
              <span />
              <span className="verse-number">٢٥٥</span>
              <span />
            </div>
          )
        )}
      </div>
      {!custom && (
        <div className="source-row">
          <span>{t('source')}</span>
          <a href="https://quran.com/2/255" target="_blank" rel="noreferrer">
            {t('reference')}
            <ExternalLink size={11} />
          </a>
        </div>
      )}
      <div className="recitation-bar">
        <div className="counter">
          <span className="eyebrow">{t('yourProgress')}</span>
          <div>
            <span className="count" aria-live="polite" aria-atomic="true">
              <strong>{count}</strong>
              <span> / {state.target}</span>
            </span>
            <button
              className="icon-button"
              aria-label={t('reset')}
              disabled={count === 0}
              onClick={reset}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
        <button
          className={`button primary recite-button ${count >= state.target ? 'recited' : ''}`}
          onClick={() => updateState((s) => increment(s, entry.id, day))}
        >
          {count >= state.target ? <CheckCheck size={18} /> : <Check size={18} />}
          <span>{t(count >= state.target ? 'recited' : 'markRecited')}</span>
        </button>
      </div>
    </article>
  );
}
