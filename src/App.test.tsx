import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

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
    const grid = screen.getByRole('link', { name: /compress image/i });
    expect(grid).toHaveAttribute('href', '/compress-image');
    expect(screen.getByRole('link', { name: /resize image/i })).toHaveAttribute(
      'href',
      '/resize-image',
    );
  });

  test('reassures the user about privacy without requiring signup', () => {
    render(<App />);
    expect(screen.getByText(/private • secure • no signup/i)).toBeInTheDocument();
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
