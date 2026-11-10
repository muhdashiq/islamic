import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ReadingCard } from './ReadingCard';
import { bundledCatalog } from '../lib/catalog';
import { parseState } from '../lib/schema';
import { translator } from '../lib/i18n';
it('exposes Arabic and localized meaning through accessible controls', async () => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  const entry = bundledCatalog.entries[0]!;
  render(
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
  await userEvent.click(screen.getByRole('button', { name: /^Meaning$/ }));
  expect(screen.getByText(entry.meaning.en!)).toHaveAttribute('lang', 'en');
  expect(screen.getByRole('button', { name: /^Meaning$/ })).toHaveAttribute('aria-pressed', 'true');
});
