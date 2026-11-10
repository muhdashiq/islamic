import { Component, type ReactNode } from 'react';
import { translator } from '../lib/i18n';
import { parseState } from '../lib/schema';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error('Adkar could not render:', error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    let language = parseState({}).lang;
    try {
      language = parseState(JSON.parse(localStorage.getItem('adkar-state') ?? '{}')).lang;
    } catch {
      /* Use English. */
    }
    const t = translator(language);
    return (
      <main className="error-page">
        <span className="error-flower">✧</span>
        <h1>{t('errorTitle')}</h1>
        <p>{t('errorHelp')}</p>
        <button className="button primary" onClick={() => location.reload()}>
          {t('reload')}
        </button>
      </main>
    );
  }
}
