import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// PROXY_ENABLED is read when the module is first evaluated, so each case stubs
// the env and re-imports the panel rather than sharing one instance.
async function renderPanel() {
  const { default: ConnectionPanel } = await import('./ConnectionPanel');
  render(<ConnectionPanel onConnect={() => {}} onDisconnect={() => {}} />);
}

describe('ConnectionPanel transports', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('offers both transports by default', async () => {
    vi.resetModules();
    await renderPanel();
    expect(screen.getByRole('button', { name: /local usb/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remote proxy/i })).toBeInTheDocument();
  });

  it('hides the proxy transport when it is compiled out', async () => {
    vi.stubEnv('VITE_ENABLE_PROXY', 'false');
    vi.resetModules();
    await renderPanel();
    expect(screen.queryByRole('button', { name: /local usb/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /remote proxy/i })).toBeNull();
    // With one transport there is nothing to choose between, so only the
    // single Connect action is offered.
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('offers a single connect action', async () => {
    vi.resetModules();
    await renderPanel();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Disconnect' })).toBeNull();
  });
});
