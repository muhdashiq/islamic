import { useState } from 'react';
import { version } from '../../package.json';
import { ReadingPreferences } from './ReadingPreferences';
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  Globe2,
  Monitor,
  Moon,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sun,
  WifiOff,
} from 'lucide-react';
import type { AppState, Language, Theme } from '../lib/schema';
import { updateState } from '../lib/store';
import { languageNames, type Translate, type TranslationKey } from '../lib/i18n';
import type { UpdateStatus } from '../hooks/useCatalog';
import type { OfflineStatus } from '../hooks/usePwa';
interface Props {
  state: AppState;
  t: Translate;
  offline: OfflineStatus;
  installed: boolean;
  canInstall: boolean;
  onInstall: () => Promise<void>;
  updateStatus: UpdateStatus;
  onUpdate: () => Promise<void>;
}
export function Settings({
  state,
  t,
  offline,
  installed,
  canInstall,
  onInstall,
  updateStatus,
  onUpdate,
}: Props) {
  const [goal, setGoal] = useState(String(state.target));
  const [installHelp, setInstallHelp] = useState(false);
  const appearance: { key: Theme; icon: typeof Sun }[] = [
    { key: 'system', icon: Monitor },
    { key: 'light', icon: Sun },
    { key: 'dark', icon: Moon },
  ];
  const statusKey: Partial<Record<UpdateStatus, TranslationKey>> = {
    checking: 'checkingApp',
    success: 'latest',
    offline: 'offlineUpdate',
    error: 'updateFailed',
  };
  function commitGoal() {
    const target = Math.max(1, Math.min(1000, Math.floor(Number(goal) || 1)));
    setGoal(String(target));
    updateState((s) => ({ ...s, target }));
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <span className="gold-line" />
            {t('preferences')}
          </span>
          <h1>{t('settings')}</h1>
          <p>{t('settingsIntro')}</p>
        </div>
      </div>
      <div className="settings-layout">
        <div>
          <ReadingPreferences state={state} t={t} />
          <section className="settings-group" aria-labelledby="appearance-heading">
            <h2 id="appearance-heading">{t('appearance')}</h2>
            <div className="settings-surface appearance-surface">
              <div className="theme-options" role="group" aria-label={t('appearance')}>
                {appearance.map(({ key, icon: Icon }) => (
                  <button
                    className={`theme-option ${state.theme === key ? 'chosen' : ''}`}
                    aria-pressed={state.theme === key}
                    key={key}
                    onClick={() => updateState((s) => ({ ...s, theme: key }))}
                  >
                    <span className={`theme-preview preview-${key}`} aria-hidden="true">
                      <span className="preview-sidebar" />
                      <span className="preview-lines">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span className="preview-orb" />
                    </span>
                    <span className="theme-option-label">
                      <Icon size={14} />
                      {t(key)}
                      {state.theme === key && <Check size={14} />}
                    </span>
                  </button>
                ))}
              </div>
              <p className="setting-help">{t('systemHelp')}</p>
            </div>
          </section>
          <section className="settings-group" aria-labelledby="reading-heading">
            <h2 id="reading-heading">{t('reading')}</h2>
            <div className="settings-surface">
              <label className="setting-row">
                <span className="setting-label">
                  <Globe2 size={19} />
                  <span>{t('language')}</span>
                </span>
                <span className="native-select">
                  <select
                    id="app-language"
                    aria-label={t('language')}
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
                  <ChevronDown size={13} />
                </span>
              </label>
              <label className="setting-row">
                <span>
                  <span className="setting-title">{t('target')}</span>
                  <span className="setting-help">{t('goalHelp')}</span>
                </span>
                <input
                  className="goal-input"
                  aria-label={t('target')}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  onBlur={commitGoal}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                />
              </label>
              <label className="setting-row">
                <span>
                  <span className="setting-title">{t('showMeaning')}</span>
                  <span className="setting-help">
                    {state.lang === 'ml'
                      ? 'ലൈബ്രറിയിലെ പാരായണങ്ങൾക്ക് മാത്രം ബാധകം.'
                      : 'Applies to Library readings only.'}
                  </span>
                </span>
                <span className="switch">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={state.defaultMeaning}
                    onChange={(event) =>
                      updateState((s) => ({ ...s, defaultMeaning: event.target.checked }))
                    }
                  />
                  <span aria-hidden="true" />
                </span>
              </label>
              <label className="setting-row">
                <span>
                  <span className="setting-title">
                    {state.lang === 'ml' ? 'ഉച്ചാരണ സഹായത്തിന്റെ ഭാഷ' : 'Pronunciation language'}
                  </span>
                  <span className="setting-help">
                    {state.lang === 'ml'
                      ? 'ലഭ്യമായ അദ്കാർ ഉച്ചാരണ സഹായത്തിനുള്ള ഭാഷ.'
                      : 'For available Adhkar pronunciation guides.'}
                  </span>
                </span>
                <span className="native-select">
                  <select
                    aria-label={
                      state.lang === 'ml' ? 'ഉച്ചാരണ സഹായത്തിന്റെ ഭാഷ' : 'Pronunciation language'
                    }
                    value={state.tracker.language}
                    onChange={(event) =>
                      updateState((s) => ({
                        ...s,
                        tracker: { ...s.tracker, language: event.target.value as 'en' | 'ml' },
                      }))
                    }
                  >
                    <option value="en">English</option>
                    <option value="ml">മലയാളം</option>
                  </select>
                  <ChevronDown size={13} />
                </span>
              </label>
              <label className="setting-row">
                <span>
                  <span className="setting-title">
                    {state.lang === 'ml' ? 'ഉച്ചാരണ സഹായം കാണിക്കുക' : 'Show pronunciation guide'}
                  </span>
                  <span className="setting-help">
                    {state.lang === 'ml'
                      ? 'ലഭ്യമായ പാരായണങ്ങളിൽ മാത്രം കാണിക്കും.'
                      : 'Appears only for recitations with an available guide.'}
                  </span>
                </span>
                <span className="switch">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={state.tracker.transliteration}
                    onChange={(event) =>
                      updateState((s) => ({
                        ...s,
                        tracker: { ...s.tracker, transliteration: event.target.checked },
                      }))
                    }
                  />
                  <span aria-hidden="true" />
                </span>
              </label>
            </div>
          </section>
          <section className="settings-group" aria-labelledby="offline-heading">
            <h2 id="offline-heading">{t('appOffline')}</h2>
            <div className="settings-surface">
              <div className="setting-row">
                <span className="setting-label">
                  <WifiOff size={19} />
                  <span>
                    <span className="setting-title">
                      {t(
                        offline === 'ready'
                          ? 'ready'
                          : offline === 'preparing'
                            ? 'preparing'
                            : 'offlineUnavailable',
                      )}
                    </span>
                    <span className="setting-help">{t('offlineHelp')}</span>
                  </span>
                </span>
                <span className={`status-indicator ${offline === 'ready' ? 'is-ready' : ''}`} />
              </div>
              <div className="setting-row update-row">
                <div>
                  <span className="setting-title">{t('updates')}</span>
                  <p className="setting-help">{t('updatesHelp')}</p>
                </div>
                <button
                  className="button secondary"
                  disabled={updateStatus === 'checking'}
                  onClick={() => void onUpdate()}
                >
                  <RefreshCw size={15} className={updateStatus === 'checking' ? 'spinning' : ''} />
                  {t('checkUpdate')}
                </button>
                {statusKey[updateStatus] && (
                  <p
                    className={`update-status ${updateStatus === 'error' ? 'form-error' : ''}`}
                    role="status"
                  >
                    {t(statusKey[updateStatus])}
                  </p>
                )}
              </div>
              <div className="setting-row install-row">
                <span className="setting-label">
                  <Smartphone size={20} />
                  <span>{t(installed ? 'installDone' : 'install')}</span>
                </span>
                {installed ? (
                  <Check size={18} className="accent-text" />
                ) : (
                  <button
                    className="icon-button"
                    aria-label={t('install')}
                    onClick={() => (canInstall ? void onInstall() : setInstallHelp(!installHelp))}
                  >
                    <ArrowDownToLine size={19} />
                  </button>
                )}
                {installHelp && <p className="setting-help install-help">{t('installHelp')}</p>}
              </div>
            </div>
          </section>
          <p className="setting-help">
            {state.lang === 'ml' ? 'ഖുർആൻ അറബി: ' : 'Quran Arabic: '}
            <a href="https://tanzil.net" target="_blank" rel="noreferrer">
              Tanzil Project
            </a>
            {' · '}
            <a href={`${import.meta.env.BASE_URL}licenses/tanzil.txt`}>
              {state.lang === 'ml' ? 'പകർപ്പവകാശവും അനുമതിയും' : 'Copyright & license'}
            </a>
          </p>
          <p className="version">
            ADKAR <span>·</span> {t('version')} {version}
          </p>
        </div>
        <aside className="settings-aside">
          <div className="privacy-card">
            <ShieldCheck size={24} strokeWidth={1.3} />
            <span className="eyebrow">{t('privacy')}</span>
            <h2>{t('localOnly')}</h2>
            <p>{t('savedLocal')}</p>
            <div className="privacy-card-art" aria-hidden="true">
              ✧
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
