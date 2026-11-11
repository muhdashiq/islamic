import type { AppState, Language } from '../lib/schema';
import { languageNames } from '../lib/i18n';
import { updateState } from '../lib/store';
import { Dialog } from './Dialog';

const copy = {
  en: {
    title: 'Welcome to Adkar',
    description: 'Choose your language. You can change it anytime in Settings.',
    language: 'Language',
    continue: 'Continue',
    close: 'Use this language',
  },
  ml: {
    title: 'അദ്കാറിലേക്ക് സ്വാഗതം',
    description: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക. ക്രമീകരണങ്ങളിൽ എപ്പോൾ വേണമെങ്കിലും മാറ്റാം.',
    language: 'ഭാഷ',
    continue: 'തുടരുക',
    close: 'ഈ ഭാഷ ഉപയോഗിക്കുക',
  },
  hi: {
    title: 'अज़कार में आपका स्वागत है',
    description: 'अपनी भाषा चुनें। इसे सेटिंग्स में कभी भी बदल सकते हैं।',
    language: 'भाषा',
    continue: 'आगे बढ़ें',
    close: 'इस भाषा का उपयोग करें',
  },
  ar: {
    title: 'مرحبًا بك في أذكار',
    description: 'اختر لغتك. يمكنك تغييرها في أي وقت من الإعدادات.',
    language: 'اللغة',
    continue: 'متابعة',
    close: 'استخدام هذه اللغة',
  },
};
export function Onboarding({ state }: { state: AppState }) {
  const t = copy[state.lang];
  function complete() {
    updateState((s) => ({ ...s, onboardingComplete: true }));
  }
  return (
    <Dialog
      open={!state.onboardingComplete}
      title={t.title}
      closeLabel={t.close}
      onClose={complete}
    >
      <p className="sheet-description">{t.description}</p>
      <label className="onboarding-language" htmlFor="onboarding-language">
        <span>{t.language}</span>
        <select
          id="onboarding-language"
          value={state.lang}
          onChange={(event) => updateState((s) => ({ ...s, lang: event.target.value as Language }))}
        >
          {Object.entries(languageNames).map(([key, label]) => (
            <option key={key} value={key} lang={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button className="button primary full-width" onClick={complete}>
        {t.continue}
      </button>
    </Dialog>
  );
}
