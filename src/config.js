// Build-time feature flags.
//
// Vite replaces `import.meta.env.VITE_*` with a string literal at build time,
// so the comparisons below fold to a constant and the bundler drops the dead
// branches (and the modules they were the only reference to).

// Whether the WebSocket serial-proxy transport is offered in the connect
// dialog. Enabled unless explicitly turned off, so `npm run dev` and
// `npm run build` keep the proxy available for local use.
//
// The public deployment turns it off (`npm run build:deploy`): the site is
// served over HTTPS, and reaching a LAN proxy over plain `ws://` is mixed
// content, which makes Chrome mark the page "Not secure" for the rest of the
// browser session. With the proxy compiled out, the deployed build talks to
// hardware only through Web Serial and stays on a fully secure origin.
export const PROXY_ENABLED = import.meta.env.VITE_ENABLE_PROXY !== 'false';
