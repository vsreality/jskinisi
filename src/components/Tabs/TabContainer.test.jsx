import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ControllerContext } from '../../contexts/ControllerContext';
import TabContainer from './TabContainer';

function Section({ children }) {
  return <div>{children}</div>;
}

function renderTabs(isConnected) {
  const tree = (connected) => (
    <ControllerContext.Provider value={{ isConnected: connected }}>
      <TabContainer>
        <Section title="Connection" alwaysEnabled>
          connection panel
        </Section>
        <Section title="Motor">motor panel</Section>
        <Section title="GPIO">gpio panel</Section>
      </TabContainer>
    </ControllerContext.Provider>
  );
  const { rerender } = render(tree(isConnected));
  return (connected) => rerender(tree(connected));
}

const current = () =>
  within(screen.getByRole('navigation', { name: 'Sections' }))
    .getAllByRole('button')
    .find((b) => b.getAttribute('aria-current') === 'page')?.textContent;

describe('TabContainer', () => {
  it('starts on the section that works without a controller', () => {
    renderTabs(false);
    expect(current()).toBe('Connection');
    expect(screen.getByText('connection panel')).toBeInTheDocument();
  });

  it('opens the first controller section once connected', () => {
    const setConnected = renderTabs(false);
    setConnected(true);
    expect(current()).toBe('Motor');
    expect(screen.getByText('motor panel')).toBeInTheDocument();
  });

  it('reopens the section the user was last working in', () => {
    const setConnected = renderTabs(false);
    setConnected(true);
    fireEvent.click(screen.getByRole('button', { name: 'GPIO' }));
    expect(current()).toBe('GPIO');

    // The link drops: GPIO is unusable, so the Connection section takes over.
    setConnected(false);
    expect(current()).toBe('Connection');

    // ...and reconnecting hands GPIO back rather than jumping to Motor, even
    // though the user navigated to Connection by hand in between.
    fireEvent.click(screen.getByRole('button', { name: 'Connection' }));
    setConnected(true);
    expect(current()).toBe('GPIO');
  });

  it('locks the controller sections while disconnected', () => {
    renderTabs(false);
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    expect(within(nav).getByRole('button', { name: 'Connection' })).toBeEnabled();
    expect(within(nav).getByRole('button', { name: 'Motor' })).toBeDisabled();
    expect(within(nav).getByRole('button', { name: 'GPIO' })).toBeDisabled();
  });
});
