import { useState } from 'react';
import { KinisiClient } from '../../commands/kinisi_client';
import { PROXY_ENABLED } from '../../config';
import './ConnectionDialog.css';

// Modal that walks the user through connecting to the controller, either
// directly over local USB (Web Serial) or through the Python proxy over a
// WebSocket. For the proxy path it first lists the proxy's serial ports over
// HTTP, then opens the chosen port and switches to the binary protocol.
//
// Props:
//   onConnect(controller): called with a connected controller on success.
//   onClose():             called to dismiss the dialog.

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

function ConnectionDialog({ onConnect, onClose, onDisconnect }) {
    // Steps: 'mode' -> choose transport, 'proxy' -> host + port selection.
    const [step, setStep] = useState('mode');
    const [host, setHost] = useState(loadStoredHost);
    const [ports, setPorts] = useState(null); // null = not listed yet
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const connectLocal = async () => {
        setBusy(true);
        setError('');
        // KinisiClient.connect() calls navigator.serial.requestPort() as its
        // first await, so the browser's user-gesture activation from this click
        // is still valid here.
        const client = new KinisiClient(onDisconnect);
        const ok = await client.connect();
        setBusy(false);
        if (ok) {
            onConnect(client);
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
        try {
            const ProxyClient = await loadProxyClient();
            const found = await ProxyClient.listPorts(host);
            storeHost(host);
            setPorts(found);
            if (found.length === 0) {
                setError('Proxy reachable, but it reported no serial ports.');
            }
        } catch (e) {
            setError(`Could not reach proxy: ${e.message}`);
        } finally {
            setBusy(false);
        }
    };

    const connectProxyPort = async (device) => {
        setBusy(true);
        setError('');
        try {
            const ProxyClient = await loadProxyClient();
            const client = new ProxyClient(host, onDisconnect);
            const connected = await client.connect();
            if (!connected) {
                throw new Error(client.lastError || 'WebSocket connection failed.');
            }
            const opened = await client.open(device);
            if (!opened.ok) {
                await client.disconnect();
                throw new Error(
                    opened.error
                        ? `Proxy could not open ${device}: ${opened.error}`
                        : `Proxy could not open ${device}.`
                );
            }
            onConnect(client);
            storeHost(host);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="k-modal connection-modal">
            <div className="k-modal-content k-card-4 k-round connection-modal-content">
                <header className="k-container k-blue">
                    <span
                        className="k-button k-display-topright"
                        onClick={onClose}
                    >
                        &times;
                    </span>
                    <h3>Connect to controller</h3>
                </header>

                <div className="k-container k-padding">
                    {step === 'mode' && (
                        <div className="connection-mode-choice">
                            <button
                                className={
                                    PROXY_ENABLED
                                        ? 'k-button k-green k-block k-margin-bottom'
                                        : 'k-button k-green k-block'
                                }
                                disabled={busy}
                                onClick={connectLocal}
                            >
                                Local USB (Web Serial)
                            </button>
                            {PROXY_ENABLED && (
                                <button
                                    className="k-button k-blue k-block"
                                    disabled={busy}
                                    onClick={() => { setError(''); setStep('proxy'); }}
                                >
                                    Remote proxy (WebSocket)
                                </button>
                            )}
                        </div>
                    )}

                    {PROXY_ENABLED && step === 'proxy' && (
                        <div className="connection-proxy">
                            <label className="k-text-grey">Proxy host</label>
                            <div className="connection-host-row">
                                <input
                                    className="k-input k-border k-round"
                                    type="text"
                                    placeholder="e.g. raspberrypi.local or 127.0.0.1:8765"
                                    value={host}
                                    disabled={busy}
                                    onChange={(e) => setHost(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && listPorts()}
                                />
                                <button
                                    className="k-button k-blue k-round"
                                    disabled={busy}
                                    onClick={listPorts}
                                >
                                    List ports
                                </button>
                            </div>

                            {ports && ports.length > 0 && (
                                <div className="connection-ports">
                                    <label className="k-text-grey">Serial ports</label>
                                    <ul className="k-ul k-border k-round">
                                        {ports.map((p) => (
                                            <li
                                                key={p.device}
                                                className="k-hover-light-grey connection-port-item"
                                                onClick={() => !busy && connectProxyPort(p.device)}
                                            >
                                                <span className="connection-port-device">
                                                    {p.device}
                                                </span>
                                                {p.description && p.description !== 'n/a' && (
                                                    <span className="k-text-grey connection-port-desc">
                                                        {p.description}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                className="k-button k-light-grey k-round k-margin-top"
                                disabled={busy}
                                onClick={() => { setError(''); setPorts(null); setStep('mode'); }}
                            >
                                Back
                            </button>
                        </div>
                    )}

                    {busy && <p className="k-text-blue">Working…</p>}
                    {error && <p className="k-text-red">{error}</p>}
                </div>
            </div>
        </div>
    );
}

export default ConnectionDialog;
