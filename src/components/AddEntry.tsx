import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Dialog } from './Dialog';
import { entrySchema, type Language, type Entry } from '../lib/schema';
import { languageNames, type Translate } from '../lib/i18n';
interface Props {
  open: boolean;
  language: Language;
  t: Translate;
  onClose: () => void;
  onSave: (entry: Entry) => void;
}
export function AddEntry({ open, language, t, onClose, onSave }: Props) {
  const [error, setError] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const candidate = entrySchema.safeParse({
      id: `custom-${crypto.randomUUID()}`,
      title: { en: title, [language]: title },
      arabic: data.get('arabic'),
      meaning: { [language]: String(data.get('meaning') || '').trim() },
    });
    if (!candidate.success) {
      setError(true);
      return;
    }
    onSave(candidate.data);
    form.reset();
    setError(false);
  }
  return (
    <Dialog open={open} title={t('add')} closeLabel={t('close')} onClose={onClose}>
      <p className="sheet-description">{t('addHelp')}</p>
      <form onSubmit={submit} className="add-form">
        <label>
          <span>{t('titleLabel')}</span>
          <input name="title" required maxLength={120} autoComplete="off" autoFocus />
        </label>
        <label>
          <span>{t('arabicText')}</span>
          <textarea name="arabic" required maxLength={12000} dir="rtl" lang="ar" rows={4} />
        </label>
        <label>
          <span>{t('meaningOptional')}</span>
          <textarea
            name="meaning"
            maxLength={12000}
            rows={3}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            lang={language}
          />
          <small>
            {t('selectedLanguage')}: {languageNames[language]}
          </small>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {t('required')}
          </p>
        )}
        <div className="sheet-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="button primary" type="submit">
            <Plus size={17} />
            {t('save')}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
