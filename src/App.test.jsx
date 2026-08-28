import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the application header', () => {
    render(<App />);
    expect(screen.getByText(/kinisi motor controller/i)).toBeInTheDocument();
  });

  it('renders a tab for each controller section', () => {
    render(<App />);
    for (const tab of ['Motor', 'Platform', 'GPIO', 'Motor Controller']) {
      expect(
        screen.getByText(tab, { selector: '.k-bar-item' })
      ).toBeInTheDocument();
    }
  });

  it('starts in a disconnected state', () => {
    render(<App />);
    // Connect is enabled and Disconnect is disabled only while disconnected.
    expect(screen.getByRole('button', { name: 'Connect' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Diconnect' })).toBeDisabled();
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
});
