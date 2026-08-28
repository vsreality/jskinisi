import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// PROXY_ENABLED is read when the module is first evaluated, so each case stubs
// the env and re-imports the dialog rather than sharing one instance.
async function renderDialog() {
  const { default: ConnectionDialog } = await import('./ConnectionDialog');
  render(
    <ConnectionDialog onConnect={() => {}} onClose={() => {}} onDisconnect={() => {}} />
  );
}

describe('ConnectionDialog transports', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('offers both transports by default', async () => {
    vi.resetModules();
    await renderDialog();
    expect(screen.getByRole('button', { name: /local usb/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remote proxy/i })).toBeInTheDocument();
  });

  it('hides the proxy transport when it is compiled out', async () => {
    vi.stubEnv('VITE_ENABLE_PROXY', 'false');
    vi.resetModules();
    await renderDialog();
    expect(screen.getByRole('button', { name: /local usb/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remote proxy/i })).toBeNull();
  });
});
