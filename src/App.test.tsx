import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { CATEGORY_LABELS, TOOLS } from '@/tools/registry';
import { PRIVACY_LINE } from '@/components/controls';

// BrowserRouter reads jsdom's shared history, so a test that navigates would
// otherwise leak its URL into the next test.
beforeEach(() => {
  window.history.pushState({}, '', '/');
});

describe('homepage', () => {
  test('renders the hero headline and subtitle', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /image tools that just work/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/resize, compress, convert, edit and optimize/i),
    ).toBeInTheDocument();
  });

  test('shows a grid of popular tools that link to their pages', () => {
    render(<App />);
    // Scoped to the popular section: these tools also appear in the full
    // directory below, so an unscoped query matches twice.
    const popular = within(
      screen.getByRole('region', { name: /popular tools/i }),
    );
    expect(popular.getByRole('link', { name: /compress image/i })).toHaveAttribute(
      'href',
      '/compress-image',
    );
    expect(popular.getByRole('link', { name: /resize image/i })).toHaveAttribute(
      'href',
      '/resize-image',
    );
  });

  test('lists every non-alias tool in the directory', () => {
    render(<App />);
    const directory = within(screen.getByRole('region', { name: /all tools/i }));
    const expected = TOOLS.filter((tool) => !tool.aliasOf);

    for (const tool of expected) {
      expect(
        directory.getByRole('link', { name: new RegExp(`^${tool.title}$`, 'i') }),
      ).toHaveAttribute('href', `/${tool.slug}`);
    }
  });

  test('groups the directory under category headings', () => {
    render(<App />);
    const directory = within(screen.getByRole('region', { name: /all tools/i }));

    for (const label of Object.values(CATEGORY_LABELS)) {
      expect(directory.getByRole('heading', { name: new RegExp(label, 'i') }))
        .toBeInTheDocument();
    }
  });

  test('keeps alias pages out of the directory', () => {
    // They exist for Google, where people phrase the same need differently.
    // On the site they would present one tool as several.
    render(<App />);
    const directory = within(screen.getByRole('region', { name: /all tools/i }));

    expect(
      directory.queryByRole('link', { name: /^reduce image size$/i }),
    ).not.toBeInTheDocument();
  });

  test('reassures the user about privacy without requiring signup', () => {
    render(<App />);

    // The line itself contains the no-signup promise; asserting that phrase
    // separately also matches the footer.
    expect(screen.getByText(PRIVACY_LINE)).toBeInTheDocument();
  });

  test('states the concrete privacy claim rather than a vague one', () => {
    render(<App />);

    // "Secure" is a word every site uses and none can be held to. What is
    // actually true here -- and is the differentiator -- is that the image
    // never leaves the device, so say that instead.
    expect(screen.getByText(/runs in your browser/i)).toBeInTheDocument();
    expect(screen.queryByText(/\bSecure\b/)).not.toBeInTheDocument();
  });
});

describe('tool search', () => {
  test('typing a need shows matching tools', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('combobox'), 'smaller');

    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Compress Image')).toBeInTheDocument();
    expect(within(listbox).getByText('Resize Image')).toBeInTheDocument();
  });

  test('selecting a result navigates to that tool page', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('combobox'), 'rotate');
    await user.click(within(screen.getByRole('listbox')).getByText('Rotate Image'));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Rotate Image' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('a query with no matches says so instead of showing noise', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('combobox'), 'qzxwv');

    expect(screen.getByText(/no tools match/i)).toBeInTheDocument();
  });
});
