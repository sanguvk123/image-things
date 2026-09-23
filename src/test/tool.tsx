import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToolRoute } from '@/pages/ToolRoute';
import { EAGER_PAGES } from '@/pages/pages.eager';
import { fakeImageFile } from './canvas';

/**
 * Render a tool page at its real route, exactly as a user would reach it.
 *
 * Uses the eager page map so the component is present on the first render.
 * These tests are about what each tool does, not about chunk loading, and
 * making every one of them await a Suspense boundary would add noise to
 * hundreds of assertions to test something they are not about. The lazy map
 * and the eager map are proven equivalent in pages.test.tsx.
 */
export function renderTool(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/${slug}`]}>
      <Routes>
        <Route path="/:slug" element={<ToolRoute pages={EAGER_PAGES} />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Put an image into the tool the way a user does: through the file picker. */
export async function choosePhoto(
  user: ReturnType<typeof userEvent.setup>,
  file: File = fakeImageFile('photo.jpg', 2_800_000),
) {
  await user.upload(screen.getByLabelText('Choose image'), file);
  return file;
}
