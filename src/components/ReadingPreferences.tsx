import { Minus, Plus } from 'lucide-react';
import type { AppState } from '../lib/schema';
import type { Translate } from '../lib/i18n';
import { updateState } from '../lib/store';
interface Props {
  state: AppState;
  t: Translate;
}
export function ReadingPreferences({ state, t }: Props) {
  function resize(value: number) {
    updateState((s) => ({ ...s, fontSize: Math.max(22, Math.min(64, value)) }));
  }
  return (
    <section className="settings-group reading-preferences" aria-labelledby="comfort-heading">
      <h2 id="comfort-heading">{t('readingComfort')}</h2>
      <div className="settings-surface reading-preference-surface">
        <h3>{t('appTextSize')}</h3>
        <p className="setting-help">{t('appTextHelp')}</p>
        <div className="text-size-options" role="group" aria-label={t('appTextSize')}>
          {(
            [
              { value: 'standard', label: 'standardText' },
              { value: 'large', label: 'largeText' },
              { value: 'extra-large', label: 'extraLargeText' },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              className={state.interfaceSize === option.value ? 'selected' : ''}
              aria-pressed={state.interfaceSize === option.value}
              onClick={() => updateState((s) => ({ ...s, interfaceSize: option.value }))}
            >
              {t(option.label)}
            </button>
          ))}
        </div>
        <p className="interface-preview">{t('intro')}</p>
        <div className="reading-size-heading">
          <label htmlFor="reading-size">{t('textSize')}</label>
          <output htmlFor="reading-size">{state.fontSize}</output>
        </div>
        <div className="reading-size-control" dir="ltr">
          <button
            className="icon-button"
            aria-label={t('smaller')}
            disabled={state.fontSize <= 22}
            onClick={() => resize(state.fontSize - 2)}
          >
            <Minus size={20} />
          </button>
          <input
            id="reading-size"
            type="range"
            min={22}
            max={64}
            step={1}
            value={state.fontSize}
            onChange={(event) => resize(Number(event.target.value))}
          />
          <button
            className="icon-button"
            aria-label={t('larger')}
            disabled={state.fontSize >= 64}
            onClick={() => resize(state.fontSize + 2)}
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="reading-preview" aria-label={t('readingPreview')}>
          <span className="preview-caption">{t('readingPreview')}</span>
          <p lang="ar" dir="rtl" style={{ fontSize: `${state.fontSize}px` }}>
            اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ
          </p>
        </div>
        <p className="setting-help">{t('readingSaved')}</p>
      </div>
    </section>
  );
}
