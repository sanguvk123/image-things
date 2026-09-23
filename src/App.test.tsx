import { render, screen } from '@testing-library/react';
import { App } from './App';

test('renders the product headline', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /image tools that just work/i }),
  ).toBeInTheDocument();
});
