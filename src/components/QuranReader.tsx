import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppState, Entry } from '../lib/schema';
import type { Translate } from '../lib/i18n';
import { quranPlaylist } from '../lib/quran-audio';
import { useVerseAudio } from '../hooks/useVerseAudio';
import { AudioPlayer } from './AudioPlayer';

type Verse = ReturnType<typeof quranPlaylist>[number];
const QuranVerse = memo(function QuranVerse({
  verse,
  active,
  segment,
}: {
  verse: Verse;
  active: boolean;
  segment?: number[];
}) {
  return (
    <span className={`quran-verse ${active ? 'is-playing-verse' : ''}`} data-verse={verse.key}>
      {verse.words.map((word, index) => (
        <span key={index}>
          <span
            className={`verse-word ${segment && index >= segment[0]! && index < segment[1]! ? 'is-current' : ''}`}
            data-word={index}
            aria-current={
              segment && index >= segment[0]! && index < segment[1]! ? 'true' : undefined
            }
          >
            {word}
          </span>{' '}
        </span>
      ))}
      <bdi className="quran-verse-marker">
        <span aria-hidden="true">
          ﴿
          {new Intl.NumberFormat('ar-u-nu-arab', { useGrouping: false }).format(
            Number(verse.key.split(':')[1]),
          )}
          ﴾
        </span>
        <span className="sr-only" lang="en">
          Ayah {verse.key}
        </span>
      </bdi>{' '}
    </span>
  );
});
export function QuranReader({ entry, state, t }: { entry: Entry; state: AppState; t: Translate }) {
  const verses = useMemo(() => quranPlaylist(entry), [entry]);
  const [index, setIndex] = useState(0);
  const autoPlay = useRef(false);
  const active = verses[index] ?? verses[0]!;
  const audio = useVerseAudio(active.recording, state, () => {
    if (index < verses.length - 1) {
      autoPlay.current = true;
      setIndex(index + 1);
    }
  });
  const audioToggle = audio.toggle;
  useEffect(() => {
    if (
      autoPlay.current &&
      audio.loadedId === active.recording.id &&
      audio.storage !== 'checking'
    ) {
      autoPlay.current = false;
      audioToggle();
    }
  }, [active.key, active.recording.id, audio.loadedId, audio.storage, audioToggle]);
  const passage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!audio.playing) return;
    const word = passage.current?.querySelector(`[data-verse="${active.key}"] .is-current`);
    if (!word) return;
    const box = word.getBoundingClientRect();
    if (box.top < 80 || box.bottom > window.innerHeight - 110)
      word.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, [active.key, audio.activeSegment, audio.playing]);
  function selectVerse(next: number) {
    if (next === index) return;
    // Native pause changes synchronously; React's play/pause state can lag a click.
    autoPlay.current = audio.audioRef.current ? !audio.audioRef.current.paused : false;
    audio.audioRef.current?.pause();
    setIndex(next);
  }
  const title = entry.title[state.lang] || entry.title.en;
  const currentSegment =
    audio.loadedId === active.recording.id
      ? active.recording.segments[audio.activeSegment]
      : undefined;
  return (
    <section className="quran-reader" aria-label={title}>
      <AudioPlayer
        audio={audio}
        pending={autoPlay.current}
        recitation={active.recording}
        title={`${title} · ${active.key}`}
        state={state}
        t={t}
      />
      {verses.length > 1 && (
        <div className="quran-playlist-controls">
          <button
            className="icon-button"
            aria-label={state.lang === 'ml' ? 'മുമ്പത്തെ ആയത്ത്' : 'Previous ayah'}
            disabled={index === 0}
            onClick={() => selectVerse(index - 1)}
          >
            <ChevronLeft size={19} />
          </button>
          <label>
            <span className="sr-only">
              {state.lang === 'ml' ? 'ആയത്ത് തിരഞ്ഞെടുക്കുക' : 'Select ayah'}
            </span>
            <select value={index} onChange={(event) => selectVerse(Number(event.target.value))}>
              {verses.map((verse, i) => (
                <option key={verse.key} value={i}>
                  {state.lang === 'ml' ? 'ആയത്ത്' : 'Ayah'} {verse.key}
                </option>
              ))}
            </select>
          </label>
          <button
            className="icon-button"
            aria-label={state.lang === 'ml' ? 'അടുത്ത ആയത്ത്' : 'Next ayah'}
            disabled={index === verses.length - 1}
            onClick={() => selectVerse(index + 1)}
          >
            <ChevronRight size={19} />
          </button>
          <span className="setting-help">
            {state.lang === 'ml' ? 'ആയത്തുകൾ തുടർച്ചയായി പ്ലേ ചെയ്യും' : 'Plays Ayahs in order'} ·{' '}
            {index + 1}/{verses.length}
          </span>
        </div>
      )}
      {verses[0]?.basmalah && (
        <p className="quran-basmalah" lang="ar" dir="rtl" style={{ fontSize: state.fontSize }}>
          {verses[0].basmalah}
        </p>
      )}
      <div
        ref={passage}
        className="quran-passage arabic-text"
        lang="ar"
        dir="rtl"
        style={{ fontSize: state.fontSize }}
      >
        {verses.map((verse) => (
          <QuranVerse
            key={verse.key}
            verse={verse}
            active={
              active.key === verse.key && audio.playing && audio.loadedId === active.recording.id
            }
            segment={active.key === verse.key ? currentSegment : undefined}
          />
        ))}
      </div>
    </section>
  );
}
