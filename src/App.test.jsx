import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the application header', () => {
    render(<App />);
    // Scoped to the title element: the footer also mentions the product name.
    expect(
      screen.getByText(/kinisi motor controller/i, { selector: '.app-title' })
    ).toBeInTheDocument();
  });

  it('renders a sidebar entry for each controller section', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    for (const section of [
      'Connection',
      'Motor',
      'Platform',
      'GPIO',
      'Motor Controller',
    ]) {
      expect(
        within(nav).getByRole('button', { name: section })
      ).toBeInTheDocument();
    }
    // Connection is where a disconnected app starts.
    expect(
      within(nav).getByRole('button', { name: 'Connection' })
    ).toHaveAttribute('aria-current', 'page');
  });

  it('locks the controller sections until something is connected', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    // Connection must stay reachable, or there would be no way to connect.
    expect(within(nav).getByRole('button', { name: 'Connection' })).toBeEnabled();
    for (const section of ['Motor', 'Platform', 'GPIO', 'Motor Controller']) {
      expect(within(nav).getByRole('button', { name: section })).toBeDisabled();
    }
  });

  it('offers one connection action and reports the state in the header', () => {
    render(<App />);
    // A single action rather than a Connect/Disconnect pair: only one of them
    // is ever meaningful.
    expect(screen.getByRole('button', { name: 'Connect' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Disconnect' })).toBeNull();
    // The status is announced, so it carries a live region role.
    expect(screen.getByRole('status')).toHaveTextContent('Not connected');
    expect(document.querySelector('.app-header .connection-status')).not.toBeNull();
  });

  it('links to the source repository', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: /source code on github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/vsreality/jskinisi');
    expect(link).toHaveAttribute('target', '_blank');
    // Without noopener the opened tab gets a handle on this one via
    // window.opener.
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('links back to the main website', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: 'VsReality' });
    expect(link).toHaveAttribute('href', 'https://vsreality.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders the footer navigation links', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute(
      'href',
      'https://vsreality.com/docs/kinisi-motor-controller/commands'
    );
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/vsreality/jskinisi'
    );
  });
});
