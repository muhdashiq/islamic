import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ReadingCard } from './ReadingCard';
import { bundledCatalog } from '../lib/catalog';
import { parseState } from '../lib/schema';
import { translator } from '../lib/i18n';
it('keeps Arabic visible and follows the saved meaning preference', () => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  const entry = bundledCatalog.entries[0]!;
  const { rerender } = render(
    <ReadingCard
      entry={entry}
      state={parseState({})}
      day="2026-11-10"
      t={translator('en')}
      onToast={vi.fn()}
    />,
  );
  expect(document.querySelector('.arabic-text')).toHaveAttribute('dir', 'rtl');
  expect(document.querySelector('.arabic-text')).toHaveTextContent(entry.arabic);
  expect(document.querySelector('.meaning-text')).not.toBeInTheDocument();
  rerender(
    <ReadingCard
      entry={entry}
      state={parseState({ defaultMeaning: true })}
      day="2026-11-10"
      t={translator('en')}
      onToast={vi.fn()}
    />,
  );
  expect(screen.getByText(entry.meaning.en!)).toHaveAttribute('lang', 'en');
  expect(document.querySelector('.arabic-text')).toHaveTextContent(entry.arabic);
  expect(screen.queryByRole('slider', { name: /Arabic/ })).not.toBeInTheDocument();
});
