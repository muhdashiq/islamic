import { ArrowLeft, Check, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import type { AppState, Entry } from '../lib/schema';
import type { Translate } from '../lib/i18n';
import { progress } from '../lib/model';
import { ReadingCard } from './ReadingCard';
interface Props {
  state: AppState;
  entries: Entry[];
  entry: Entry;
  day: string;
  t: Translate;
  onToast: (message: string, action?: () => void) => void;
  onBack: () => void;
}
export function Today({ state, entries, entry, day, t, onToast, onBack }: Props) {
  const p = progress(state, entries, day);
  const date = new Intl.DateTimeFormat(state.lang === 'ml' ? 'ml-IN' : state.lang, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${day}T12:00:00`));
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow date-label">
            <span className="gold-line" />
            {date}
          </div>
          <h1>{t('greeting')}</h1>
          <p>{t('intro')}</p>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div />
          <Leaf size={36} strokeWidth={1} />
          <span className="orbit-spark">✧</span>
        </div>
      </div>
      {entry.id !== 'ayatul-kursi' && (
        <button className="text-button back-button" onClick={onBack}>
          <ArrowLeft size={15} />
          {t('back')}
        </button>
      )}
      <div className="today-grid">
        <ReadingCard
          key={`${entry.id}-${state.defaultMeaning}`}
          entry={entry}
          state={state}
          day={day}
          t={t}
          onToast={onToast}
        />
        <section className="progress-card" aria-label={t('todayProgress')}>
          <span className="eyebrow progress-eyebrow">{t('todayProgress')}</span>
          <div
            className="progress-ring"
            role="progressbar"
            aria-valuenow={p.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('todayProgress')}
          >
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle className="ring-track" cx="60" cy="60" r="52" />
              <circle
                className="ring-fill"
                cx="60"
                cy="60"
                r="52"
                strokeDasharray="326.726"
                strokeDashoffset={326.726 * (1 - p.percent / 100)}
              />
            </svg>
            <div>
              <strong>
                {p.percent}
                <small>%</small>
              </strong>
              <span>{t('complete')}</span>
            </div>
          </div>
          <div className="progress-copy">
            <h2>{t(p.percent === 100 ? 'done' : 'step')}</h2>
            <p>{t(p.percent === 100 ? 'doneCopy' : 'waiting')}</p>
          </div>
          <div className="progress-total">
            <span>{t('completed')}</span>
            <strong>
              {p.complete}
              <span> / {p.total}</span>
              {p.percent === 100 && <Check size={13} />}
            </strong>
          </div>
        </section>
        <aside className="quote-card">
          <Sparkles size={20} strokeWidth={1.3} />
          <blockquote>{t('quote')}</blockquote>
          <span className="eyebrow">{t('quoteSource')}</span>
          <div className="quote-orbit" aria-hidden="true" />
        </aside>
        <p className="privacy-note">
          <ShieldCheck size={15} />
          <span>{t('savedLocal')}</span>
        </p>
      </div>
      <p className="gentle-note">
        <span>✧</span>
        {t('bottomNote')}
        <span>✧</span>
      </p>
    </>
  );
}
