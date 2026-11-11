import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { translator } from '../lib/i18n';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Moon,
  Sun,
  BookOpen,
  Bell,
  RotateCcw,
} from 'lucide-react';
import { useAppState, updateState } from '../lib/store';
import { dayKey } from '../lib/model';
import { CONTENT_VERSION } from '../lib/tracker-content';
import { libraryId } from '../lib/recitation-ids';
import type { Entry } from '../lib/schema';
import {
  resume,
  sessions,
  sessionProgress,
  trackerCount,
  writeTrackerCount,
  type Session,
  type SessionItem,
} from '../lib/tracker';
import { Dialog } from './Dialog';

const QuranReader = lazy(() =>
  import('./QuranReader').then((module) => ({ default: module.QuranReader })),
);

export function Tracker({ day, entries }: { day: string; entries: Entry[] }) {
  const libraryById = Object.fromEntries(entries.map((entry) => [entry.id, entry]));
  const state = useAppState();
  const { tracker } = state;
  const ml = state.lang === 'ml';
  const text = (en: string, mal: string) => (ml ? mal : en);
  const all = sessions(tracker.formula);
  const [selected, setSelected] = useState<{ session: string; item: string } | null>(null);
  const [panel, setPanel] = useState<'history' | 'preferences' | null>(null);
  const [focus, setFocus] = useState(false);
  const [confirm, setConfirm] = useState<null | 'counter' | 'today' | 'history' | 'all'>(null);
  const [permission, setPermission] = useState(
    'Notification' in window ? (Notification.permission as string) : 'unsupported',
  );
  const tapTime = useRef(-Infinity);
  const heading = useRef<HTMLHeadingElement>(null);
  const session = all.find((s) => s.id === selected?.session);
  const item = session?.items.find((i) => i.id === selected?.item);
  const content = item && libraryById[item.recitationId ?? libraryId(item.id)];
  const count = session && item ? trackerCount(tracker, session, item, day) : 0;
  const next = resume(tracker, day);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
    tapTime.current = -Infinity;
  }, [selected?.session, selected?.item]);
  useEffect(() => {
    setSelected(null);
  }, [day]);
  function open(s: Session, i?: SessionItem) {
    const target =
      i ?? s.items.find((i) => trackerCount(tracker, s, i, day) < i.target) ?? s.items[0]!;
    setSelected({ session: s.id, item: target.id });
    updateState((old) => ({
      ...old,
      tracker: { ...old.tracker, last: { session: s.id, item: target.id } },
    }));
  }
  function changeCount(value: number) {
    if (session && item)
      updateState((old) => writeTrackerCount(old, session, item, dayKey(), value));
  }
  function tap() {
    if (!session || !item || count >= item.target) return;
    const now = performance.now();
    if (now - tapTime.current < 250) return;
    tapTime.current = now;
    updateState((old) =>
      writeTrackerCount(
        old,
        session,
        item,
        dayKey(),
        trackerCount(old.tracker, session, item, dayKey()) + 1,
      ),
    );
    if (tracker.haptics) navigator.vibrate?.(15);
  }
  function destroy() {
    if (confirm === 'counter') changeCount(0);
    if (confirm === 'today')
      updateState((s) => ({
        ...s,
        tracker: {
          ...s.tracker,
          counts: Object.fromEntries(
            Object.entries(s.tracker.counts).map(([date, counts]) => [
              date,
              date === day
                ? Object.fromEntries(
                    Object.entries(counts).filter(([key]) => key.startsWith('weekly:')),
                  )
                : counts,
            ]),
          ),
          last: null,
        },
      }));
    if (confirm === 'history')
      updateState((s) => ({ ...s, tracker: { ...s.tracker, counts: {}, last: null } }));
    if (confirm === 'all') {
      updateState((s) => ({
        ...s,
        tracker: {
          ...s.tracker,
          ...{
            counts: {},
            last: null,
            reminders: {},
            notified: [],
            transliteration: false,
            language: 'en',
            haptics: false,
            formula: '33+tawhid',
          },
        },
      }));
      setSelected(null);
    }
    setConfirm(null);
  }
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            format: 'adkar-tracker',
            version: 1,
            contentVersion: CONTENT_VERSION,
            exportedAt: new Date().toISOString(),
            tracker,
            bookmarks: state.bookmarks.filter((id) => libraryById[id]),
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adkar-${day}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const bookmarked = content && state.bookmarks.includes(content.id);
  return (
    <section
      className={`tracker ${focus ? 'tracker-focus' : ''}`}
      lang={ml ? 'ml' : 'en'}
      dir="ltr"
    >
      <div className="tracker-heading">
        <div>
          <span className="eyebrow">
            {text('A quiet moment, every day', 'ഓരോ ദിവസവും ഒരു ശാന്ത നിമിഷം')}
          </span>
          <h1 ref={heading} tabIndex={-1}>
            {session
              ? ml
                ? session.titleMl
                : session.title
              : text('Today’s recitations', 'ഇന്നത്തെ പാരായണങ്ങൾ')}
          </h1>
          <p>
            {new Intl.DateTimeFormat(ml ? 'ml-IN' : 'en', { dateStyle: 'full' }).format(
              new Date(`${day}T12:00:00`),
            )}
          </p>
        </div>
        <div className="tracker-actions">
          <button
            className="button secondary"
            onClick={() => {
              setPanel(panel === 'history' ? null : 'history');
              setSelected(null);
            }}
          >
            {text('History', 'ചരിത്രം')}
          </button>
          <button
            className="icon-button"
            aria-label={text('Tracker preferences', 'ട്രാക്കർ ക്രമീകരണങ്ങൾ')}
            onClick={() => {
              setPanel(panel === 'preferences' ? null : 'preferences');
              setSelected(null);
            }}
          >
            <Bell size={20} />
          </button>
        </div>
      </div>
      {panel === 'preferences' ? (
        <div className="settings-surface tracker-panel">
          <h2>{text('Reading & reminders', 'വായനയും ഓർമ്മപ്പെടുത്തലുകളും')}</h2>
          <label className="setting-row">
            {text('After-Salah counting formula', 'നമസ്കാര ശേഷമുള്ള എണ്ണൽ രീതി')}
            <select
              value={tracker.formula}
              onChange={(e) =>
                updateState((s) => ({
                  ...s,
                  tracker: { ...s.tracker, formula: e.target.value as typeof tracker.formula },
                }))
              }
            >
              <option value="33+tawhid">33 / 33 / 33 + Tawhid · Muslim 597a</option>
              <option value="34">33 / 33 / 34 · Muslim 596a</option>
            </select>
          </label>
          <label className="setting-row">
            {text('Haptic feedback (where supported)', 'വൈബ്രേഷൻ (ലഭ്യമായ ഉപകരണങ്ങളിൽ)')}
            <input
              type="checkbox"
              checked={tracker.haptics}
              onChange={(e) =>
                updateState((s) => ({ ...s, tracker: { ...s.tracker, haptics: e.target.checked } }))
              }
            />
          </label>
          <p>
            {text(
              'Optional device-time reminders while Adkar is open. Browsers cannot reliably schedule local notifications when this PWA is closed. These are personal times, not calculated prayer times.',
              'അദ്കാർ തുറന്നിരിക്കുമ്പോൾ മാത്രം ഉപകരണ സമയത്തിലുള്ള ഓർമ്മപ്പെടുത്തലുകൾ. ആപ്പ് അടച്ചിരിക്കുമ്പോൾ ബ്രൗസറിൽ ഇവ ഉറപ്പാക്കാനാവില്ല. ഇവ നമസ്കാര സമയ കണക്കുകൂട്ടലുകളല്ല.',
            )}
          </p>
          <button
            className="button secondary"
            disabled={
              permission === 'unsupported' || permission === 'denied' || permission === 'granted'
            }
            onClick={async () => {
              try {
                setPermission(await Notification.requestPermission());
              } catch {
                setPermission('unsupported');
              }
            }}
          >
            {text('Enable notifications', 'അറിയിപ്പുകൾ അനുവദിക്കുക')} · {permission}
          </button>
          {all.map((s) => (
            <label className="setting-row" key={s.id}>
              <span>
                <input
                  type="checkbox"
                  aria-label={ml ? s.titleMl : s.title}
                  checked={tracker.reminders[s.id]?.enabled ?? false}
                  onChange={(e) =>
                    updateState((old) => ({
                      ...old,
                      tracker: {
                        ...old.tracker,
                        reminders: {
                          ...old.tracker.reminders,
                          [s.id]: {
                            time: old.tracker.reminders[s.id]?.time ?? '08:00',
                            enabled: e.target.checked,
                          },
                        },
                      },
                    }))
                  }
                />{' '}
                {ml ? s.titleMl : s.title}
              </span>
              <input
                aria-label={`${s.title} reminder time`}
                type="time"
                value={tracker.reminders[s.id]?.time ?? '08:00'}
                onChange={(e) => {
                  if (e.target.value)
                    updateState((old) => ({
                      ...old,
                      tracker: {
                        ...old.tracker,
                        reminders: {
                          ...old.tracker.reminders,
                          [s.id]: {
                            enabled: old.tracker.reminders[s.id]?.enabled ?? false,
                            time: e.target.value,
                          },
                        },
                      },
                    }));
                }}
              />
            </label>
          ))}
          <h2>{text('Your private data', 'നിങ്ങളുടെ സ്വകാര്യ വിവരങ്ങൾ')}</h2>
          <p>
            {text(
              'Saved only on this device. Export includes your religious activity; keep it private. Clearing tracker data does not remove your original library or downloaded audio.',
              'ഈ ഉപകരണത്തിൽ മാത്രം സൂക്ഷിക്കുന്നു. എക്സ്പോർട്ടിൽ നിങ്ങളുടെ ആരാധനാ പ്രവർത്തനങ്ങൾ ഉൾപ്പെടുന്നു; സ്വകാര്യമായി സൂക്ഷിക്കുക.',
            )}
          </p>
          <div className="tracker-actions">
            <button className="button secondary" onClick={exportData}>
              {text('Export data', 'വിവരങ്ങൾ എക്സ്പോർട്ട് ചെയ്യുക')}
            </button>
            <button className="button secondary" onClick={() => setConfirm('today')}>
              {text('Reset today', 'ഇന്നത്തെ പുരോഗതി മായ്ക്കുക')}
            </button>
            <button className="button secondary" onClick={() => setConfirm('history')}>
              {text('Delete history', 'ചരിത്രം മായ്ക്കുക')}
            </button>
            <button className="button destructive" onClick={() => setConfirm('all')}>
              {text('Clear all tracker data', 'ട്രാക്കറിലെ എല്ലാം മായ്ക്കുക')}
            </button>
          </div>
        </div>
      ) : panel === 'history' ? (
        <div className="settings-surface tracker-panel">
          <h2>{text('Your moments of remembrance', 'നിങ്ങളുടെ ദിക്റിന്റെ നിമിഷങ്ങൾ')}</h2>
          <p>
            {text(
              'A private record, at your own pace. Weekly Quran readings are recorded separately, by the Monday starting each week.',
              'നിങ്ങളുടെ വേഗത്തിൽ, ഒരു സ്വകാര്യ രേഖ. ഖുർആൻ പാരായണം ആഴ്ചയുടെ തിങ്കളാഴ്ച തീയതിയിൽ വേർതിരിച്ച് സൂക്ഷിക്കുന്നു.',
            )}
          </p>
          {[7, 30].map((days) => {
            const dates = Array.from({ length: days }, (_, index) => {
              const d = new Date(`${day}T12:00:00`);
              d.setDate(d.getDate() - index);
              return dayKey(d);
            });
            const active = dates.filter((date) =>
              Object.entries(tracker.counts[date] ?? {}).some(
                ([key, n]) => !key.startsWith('weekly:') && n > 0,
              ),
            ).length;
            return (
              <p key={days}>
                {text(
                  `Last ${days} days: ${active} days with recitation`,
                  `കഴിഞ്ഞ ${days} ദിവസങ്ങളിൽ ${active} ദിവസം പാരായണം`,
                )}
              </p>
            );
          })}
          {Object.entries(tracker.counts)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, counts]) => (
              <details key={date}>
                <summary>
                  {date} · {Object.values(counts).filter((n) => n > 0).length}{' '}
                  {text('saved counters', 'സംരക്ഷിച്ച എണ്ണലുകൾ')}
                </summary>
                {Object.entries(counts)
                  .filter(([, n]) => n > 0)
                  .map(([key, n]) => (
                    <p key={key}>
                      {(() => {
                        const parts = key.split(':');
                        const savedSession = all.find((s) => s.id === parts[0]);
                        const savedItem = libraryById[libraryId(parts.at(-1)!)];
                        return `${savedSession ? (ml ? savedSession.titleMl : savedSession.title) : text('Past session', 'മുൻ വിഭാഗം')} · ${savedItem ? savedItem.title[state.lang] || savedItem.title.en : text('Recitation', 'പാരായണം')}`;
                      })()}{' '}
                      · {n}
                    </p>
                  ))}
              </details>
            ))}
          {Object.keys(tracker.counts).length === 0 && (
            <p>{text('Your history will appear here.', 'നിങ്ങളുടെ ചരിത്രം ഇവിടെ കാണാം.')}</p>
          )}
        </div>
      ) : session && item && content ? (
        <>
          <div className="tracker-actions">
            <button
              className="text-button"
              onClick={() => {
                setSelected(null);
                setFocus(false);
              }}
            >
              <ArrowLeft size={17} />
              {text('All sessions', 'എല്ലാ വിഭാഗങ്ങളും')}
            </button>
            <button className="text-button" aria-pressed={focus} onClick={() => setFocus(!focus)}>
              {text(
                focus ? 'Exit reading mode' : 'Reading mode',
                focus ? 'വായനാ മോഡ് അവസാനിപ്പിക്കുക' : 'വായനാ മോഡ്',
              )}
            </button>
          </div>
          <article className="reading-card tracker-reader">
            <div className="reading-title-row">
              <div>
                <span className="eyebrow">
                  {session.items.findIndex((i) => i.id === item.id) + 1} / {session.items.length} ·{' '}
                  {text('Recitations', 'പാരായണങ്ങൾ')}
                </span>
                <h2>{content.title[state.lang] || content.title.en}</h2>
                <p>{session.time}</p>
              </div>
              <button
                className="icon-button"
                aria-label={text('Bookmark recitation', 'പാരായണം ബുക്ക്മാർക്ക് ചെയ്യുക')}
                aria-pressed={!!bookmarked}
                onClick={() =>
                  updateState((s) => ({
                    ...s,
                    bookmarks: bookmarked
                      ? s.bookmarks.filter((id) => id !== content.id)
                      : [...s.bookmarks, content.id],
                  }))
                }
              >
                <Bookmark fill={bookmarked ? 'currentColor' : 'none'} size={20} />
              </button>
            </div>
            <div className={`tracker-reading-body ${content.quran ? 'has-quran' : ''}`}>
              {content.quran && content.verses?.length ? (
                <Suspense
                  fallback={
                    <p role="status">{text('Opening recitation…', 'പാരായണം തുറക്കുന്നു…')}</p>
                  }
                >
                  <QuranReader
                    key={content.id}
                    entry={content}
                    state={state}
                    t={translator(state.lang)}
                  />
                </Suspense>
              ) : (
                <p className="arabic-text" lang="ar" dir="rtl" style={{ fontSize: state.fontSize }}>
                  {content.arabic}
                </p>
              )}
              {tracker.transliteration && content.transliteration && (
                <p lang={tracker.language}>{content.transliteration[tracker.language]}</p>
              )}
            </div>
            <div className="tracker-counter">
              <span role="status" aria-live="polite">
                {count} / {item.target} {count === item.target && '✓'}
              </span>
              <progress
                aria-label={text('Repetition progress', 'ആവർത്തന പുരോഗതി')}
                value={count}
                max={item.target}
              />
              <button className="button primary" disabled={count >= item.target} onClick={tap}>
                {count >= item.target ? <Check size={20} /> : <BookOpen size={20} />}{' '}
                {text(
                  count >= item.target ? 'Completed' : 'Tap to count',
                  count >= item.target ? 'പൂർത്തിയായി' : 'എണ്ണാൻ തൊടുക',
                )}
              </button>
              <div className="tracker-actions">
                <button
                  className="text-button"
                  disabled={count === 0}
                  onClick={() => setConfirm('counter')}
                >
                  <RotateCcw size={15} />
                  {text('Reset', 'പുനഃക്രമീകരിക്കുക')}
                </button>
                <button
                  className="text-button"
                  disabled={count >= item.target}
                  onClick={() => changeCount(item.target)}
                >
                  {text('Mark completed', 'പൂർത്തിയാക്കിയതായി അടയാളപ്പെടുത്തുക')}
                </button>
              </div>
            </div>
            <div className="tracker-actions tracker-pagination">
              <button
                className="button secondary"
                disabled={session.items[0]?.id === item.id}
                onClick={() =>
                  open(session, session.items[session.items.findIndex((i) => i.id === item.id) - 1])
                }
              >
                <ArrowLeft size={17} />
                {text('Previous', 'മുമ്പത്തെ')}
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  const index = session.items.findIndex((i) => i.id === item.id);
                  if (index < session.items.length - 1) open(session, session.items[index + 1]);
                  else {
                    setSelected(null);
                    setFocus(false);
                  }
                }}
              >
                {text(
                  session.items.at(-1)?.id === item.id ? 'Finish session' : 'Next',
                  session.items.at(-1)?.id === item.id ? 'വിഭാഗം അവസാനിപ്പിക്കുക' : 'അടുത്തത്',
                )}
                <ArrowRight size={17} />
              </button>
            </div>
          </article>
        </>
      ) : (
        <>
          <div className="tracker-welcome">
            <Sun size={27} strokeWidth={1.3} />
            <div>
              <h2>{text('Make room for remembrance', 'ദിക്റിനായി സമയം കണ്ടെത്താം')}</h2>
              <p>
                {text(
                  'Begin where you are. Your place is saved on this device.',
                  'നിങ്ങൾക്ക് കഴിയുന്നിടത്ത് തുടങ്ങൂ. പുരോഗതി ഈ ഉപകരണത്തിൽ സൂക്ഷിക്കുന്നു.',
                )}
              </p>
            </div>
            {next && (
              <button className="button primary" onClick={() => open(next.session, next.item)}>
                {text('Continue recitation', 'പാരായണം തുടരുക')}
                <ArrowRight size={18} />
              </button>
            )}
          </div>
          <div className="tracker-grid">
            {all.map((s) => {
              const p = sessionProgress(tracker, s, day);
              const Icon = s.id === 'bedtime' ? Moon : s.weekly ? BookOpen : Sun;
              return (
                <button className="tracker-session" key={s.id} onClick={() => open(s)}>
                  <Icon size={24} strokeWidth={1.4} />
                  <h2>{ml ? s.titleMl : s.title}</h2>
                  <span>
                    {s.weekly
                      ? text('This week · personal reading plan', 'ഈ ആഴ്ച · വ്യക്തിഗത പാരായണം')
                      : s.time}
                  </span>
                  <progress aria-label={`${s.title} progress`} value={p.completed} max={p.total} />
                  <strong>
                    {p.completed} / {p.total} · {p.percent}%
                  </strong>
                </button>
              );
            })}
          </div>
          {state.bookmarks.some((id) =>
            all.some((s) => s.items.some((i) => i.recitationId === id)),
          ) && (
            <div className="settings-surface tracker-panel">
              <h2>{text('Bookmarked recitations', 'ബുക്ക്മാർക്ക് ചെയ്ത പാരായണങ്ങൾ')}</h2>
              {state.bookmarks
                .filter((id) => all.some((s) => s.items.some((i) => i.recitationId === id)))
                .map((id) => {
                  const rid = id;
                  const s = all.find((s) => s.items.some((i) => i.recitationId === rid));
                  return (
                    s && (
                      <button
                        className="button secondary"
                        key={id}
                        onClick={() =>
                          open(
                            s,
                            s.items.find((i) => i.recitationId === rid),
                          )
                        }
                      >
                        {libraryById[rid]?.title[state.lang] || libraryById[rid]?.title.en}
                      </button>
                    )
                  );
                })}
            </div>
          )}
        </>
      )}
      <Dialog
        open={!!confirm}
        title={text('Reset saved progress?', 'സംരക്ഷിച്ച പുരോഗതി മായ്ക്കണോ?')}
        closeLabel={text('Close', 'അടയ്ക്കുക')}
        onClose={() => setConfirm(null)}
      >
        <p className="sheet-description">
          {text(
            'This removes the selected tracker data from this device. Export your data first if you want to keep a copy.',
            'തിരഞ്ഞെടുത്ത വിവരങ്ങൾ ഈ ഉപകരണത്തിൽ നിന്ന് മായ്ക്കും. പകർപ്പ് വേണമെങ്കിൽ ആദ്യം എക്സ്പോർട്ട് ചെയ്യുക.',
          )}
        </p>
        <div className="sheet-actions">
          <button className="button secondary" onClick={() => setConfirm(null)}>
            {text('Cancel', 'റദ്ദാക്കുക')}
          </button>
          <button className="button destructive" onClick={destroy}>
            {text('Reset', 'മായ്ക്കുക')}
          </button>
        </div>
      </Dialog>
    </section>
  );
}
