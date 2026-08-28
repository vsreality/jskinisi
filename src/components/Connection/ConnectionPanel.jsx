import { useState } from 'react';
import { KinisiClient } from '../../commands/kinisi_client';
import { PROXY_ENABLED } from '../../config';
import './ConnectionPanel.css';

// The Connection section's contents while nothing is connected: pick a
// transport, then connect. Either directly over local USB (Web Serial) or
// through the Python proxy over a WebSocket. For the proxy path it first lists
// the proxy's serial ports over HTTP, then opens the chosen port and switches
// to the binary protocol.
//
// Props:
//   onConnect(controller, transport): called with a connected controller.
//   onDisconnect():                   handed to the client, which calls it if
//                                     the link drops on its own.

// Remember the last proxy host across sessions so users don't retype it.
const PROXY_HOST_STORAGE_KEY = 'kinisi.proxyHost';

// Pulled in on demand, and only when the proxy transport is compiled in.
// PROXY_ENABLED folds to a constant at build time, so in the deploy build this
// whole binding becomes `null` and the bundler drops kinisi_ws_client along
// with it — the shipped bundle then contains no WebSocket transport at all.
const loadProxyClient = PROXY_ENABLED
    ? async () => (await import('../../commands/kinisi_ws_client')).KinisiWebSocketClient
    : null;

function loadStoredHost() {
    try {
        return window.localStorage.getItem(PROXY_HOST_STORAGE_KEY) || '';
    } catch {
        // localStorage can throw in private mode or when storage is disabled.
        return '';
    }
}

function storeHost(host) {
    try {
        const trimmed = host.trim();
        if (trimmed) {
            window.localStorage.setItem(PROXY_HOST_STORAGE_KEY, trimmed);
        }
    } catch {
        // Persistence is best-effort; ignore storage failures.
    }
}

function ConnectionPanel({ onConnect, onDisconnect }) {
    const [mode, setMode] = useState('usb'); // 'usb' | 'proxy'
    const [host, setHost] = useState(loadStoredHost);
    const [ports, setPorts] = useState(null); // null = not listed yet
    const [port, setPort] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const connectLocal = async () => {
        setBusy(true);
        setError('');
        // KinisiClient.connect() calls navigator.serial.requestPort() as its
        // first await, and this runs synchronously off the click, so the
        // browser's user-gesture activation is still valid here.
        const client = new KinisiClient(onDisconnect);
        const ok = await client.connect();
        setBusy(false);
        if (ok) {
            onConnect(client, 'local USB');
        } else {
            setError(client.lastError || 'Could not open the local serial port.');
        }
    };

    const listPorts = async () => {
        if (!host.trim()) {
            setError('Enter the proxy host (IP or name).');
            return;
        }
        setBusy(true);
        setError('');
        setPorts(null);
        setPort('');
        try {
            const ProxyClient = await loadProxyClient();
            const found = await ProxyClient.listPorts(host);
            storeHost(host);
            setPorts(found);
            setPort(found[0]?.device || '');
            if (found.length === 0) {
                setError('Proxy reachable, but it reported no serial ports.');
            }
        } catch (e) {
            setError(`Could not reach proxy: ${e.message}`);
        } finally {
            setBusy(false);
        }
    };

    const connectProxy = async () => {
        setBusy(true);
        setError('');
        try {
            const ProxyClient = await loadProxyClient();
            const client = new ProxyClient(host, onDisconnect);
            const connected = await client.connect();
            if (!connected) {
                throw new Error(client.lastError || 'WebSocket connection failed.');
            }
            const opened = await client.open(port);
            if (!opened.ok) {
                await client.disconnect();
                throw new Error(
                    opened.error
                        ? `Proxy could not open ${port}: ${opened.error}`
                        : `Proxy could not open ${port}.`
                );
            }
            storeHost(host);
            onConnect(client, `the proxy at ${host}`);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const usb = mode === 'usb';
    const chooseMode = (next) => {
        setMode(next);
        setError('');
    };

    return (
        <div className="connection-panel">
            {PROXY_ENABLED && (
                <div className="conn-field">
                    <span className="conn-label" id="connTransportLabel">
                        Transport
                    </span>
                    <div
                        className="conn-segmented"
                        role="group"
                        aria-labelledby="connTransportLabel"
                    >
                        <button
                            type="button"
                            className="conn-segment"
                            aria-pressed={usb}
                            disabled={busy}
                            onClick={() => chooseMode('usb')}
                        >
                            Local USB
                        </button>
                        <button
                            type="button"
                            className="conn-segment"
                            aria-pressed={!usb}
                            disabled={busy}
                            onClick={() => chooseMode('proxy')}
                        >
                            Remote proxy
                        </button>
                    </div>
                </div>
            )}

            {usb ? (
                <p className="conn-hint">
                    Connects over Web Serial. The browser will ask which USB
                    device to use.
                </p>
            ) : (
                <>
                    <div className="conn-field">
                        <label className="conn-label" htmlFor="connProxyHost">
                            Proxy host
                        </label>
                        <div className="conn-row">
                            <input
                                className="conn-input"
                                id="connProxyHost"
                                type="text"
                                placeholder="e.g. raspberrypi.local or 127.0.0.1:8765"
                                value={host}
                                disabled={busy}
                                onChange={(e) => setHost(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && listPorts()}
                            />
                            <button
                                type="button"
                                className="k-button"
                                disabled={busy}
                                onClick={listPorts}
                            >
                                List ports
                            </button>
                        </div>
                    </div>

                    {ports && ports.length > 0 && (
                        <div className="conn-field">
                            <label className="conn-label" htmlFor="connProxyPort">
                                Serial port
                            </label>
                            <select
                                className="conn-input"
                                id="connProxyPort"
                                value={port}
                                disabled={busy}
                                onChange={(e) => setPort(e.target.value)}
                            >
                                {ports.map((p) => (
                                    <option key={p.device} value={p.device}>
                                        {p.description && p.description !== 'n/a'
                                            ? `${p.device} — ${p.description}`
                                            : p.device}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!port && (
                        <p className="conn-hint">
                            List the proxy&apos;s serial ports, then pick the one
                            the controller is on.
                        </p>
                    )}
                </>
            )}

            <button
                className="k-button k-button-primary"
                id="buttonConnectController"
                // The proxy path needs a port picked first; the USB path gets
                // its device from the browser's own chooser.
                disabled={busy || (!usb && !port)}
                onClick={usb ? connectLocal : connectProxy}
            >
                {busy ? 'Connecting…' : 'Connect'}
            </button>

            {error && (
                <p className="conn-error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

export default ConnectionPanel;
