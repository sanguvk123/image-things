import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { Dropzone } from './Dropzone';

/**
 * The upload area's states and semantics.
 *
 * Dropzone.test.tsx already covers the three ways a file gets in (picker,
 * drop, paste) and that non-images are not loaded. This file covers what the
 * user is told while doing it: whether the control can be reached without a
 * mouse, whether rejection is explained rather than silent, and whether the
 * area can be made unavailable while work is running.
 */

function transferWith(files: File[]) {
  return {
    files,
    items: files.map((file) => ({ kind: 'file', type: file.type })),
    types: ['Files'],
  };
}

const png = () => new File([new Uint8Array(8)], 'shot.png', { type: 'image/png' });
const pdf = () =>
  new File([new Uint8Array(8)], 'contract.pdf', { type: 'application/pdf' });

describe('reaching the upload control without a mouse', () => {
  test('the file input is labelled, so a screen reader can announce it', () => {
    render(<Dropzone onFiles={() => {}} />);
    expect(screen.getByLabelText('Choose image')).toBeInTheDocument();
  });

  test('tabbing reaches a real control that opens the picker', async () => {
    const user = userEvent.setup();
    render(<Dropzone onFiles={() => {}} />);

    const button = screen.getByRole('button', { name: /choose image/i });
    await user.tab();
    expect(button).toHaveFocus();
  });

  test('the drop surface is not itself a fake button', () => {
    // Drag and drop must not be the only way in, and a div with a click
    // handler is worse than useless to a keyboard user: it is invisible to
    // them while looking interactive to everyone else. The real control is
    // the button; the surface stays a surface.
    render(<Dropzone onFiles={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
  });
});

describe('rejecting a file the tool cannot open', () => {
  test('says so, rather than appearing to do nothing', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);

    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: transferWith([pdf()]),
    });

    expect(onFiles).not.toHaveBeenCalled();
    // Silence here is the bug: the user drops a file, nothing happens, and
    // there is no way to tell whether the drop missed or the file was wrong.
    expect(screen.getByRole('alert')).toHaveTextContent(/image/i);
  });

  test('names the file it turned away', () => {
    render(<Dropzone onFiles={() => {}} />);

    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: transferWith([pdf()]),
    });

    expect(screen.getByRole('alert')).toHaveTextContent('contract.pdf');
  });

  test('the complaint clears once an acceptable file arrives', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);
    const zone = screen.getByTestId('dropzone');

    fireEvent.drop(zone, { dataTransfer: transferWith([pdf()]) });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.drop(zone, { dataTransfer: transferWith([png()]) });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onFiles).toHaveBeenCalled();
  });
});

describe('while the tool is busy', () => {
  test('the upload control is disabled rather than merely ignored', () => {
    render(<Dropzone onFiles={() => {}} disabled />);
    expect(screen.getByRole('button', { name: /choose image/i })).toBeDisabled();
    expect(screen.getByLabelText('Choose image')).toBeDisabled();
  });

  test('dropping onto a disabled zone does nothing', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} disabled />);

    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: transferWith([png()]),
    });

    expect(onFiles).not.toHaveBeenCalled();
  });
});
