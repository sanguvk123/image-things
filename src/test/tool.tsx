import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToolRoute } from '@/pages/ToolRoute';
import { fakeImageFile } from './canvas';

/** Render a tool page at its real route, exactly as a user would reach it. */
export function renderTool(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/${slug}`]}>
      <Routes>
        <Route path="/:slug" element={<ToolRoute />} />
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
