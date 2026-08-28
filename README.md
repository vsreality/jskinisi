JavaScript For Kinisi Contoller
============
This is a JavaScript library for the Kinisi Controller with web client for testing controller functionality from a web browser.
The library is located in the `./src/commands` directory and the web client is located in the `./src` directory.
The web client is a React application built with [Vite](https://vite.dev/); use the scripts below to run it.\
Description of the commands can be found in [Kinisi Motion Controller framework documentation](https://raw.githubusercontent.com/szolotykh/kinisi-motor-controller-firmware/command-script/commands.md)

## Run Controller client
```
npm install
npm run dev
```
The dev server listens on http://localhost:3000.

## Other scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reloading |
| `npm run build` | Produce a production bundle in `./build` |
| `npm run build:deploy` | Production bundle for the public site, Web Serial only |
| `npm run preview` | Serve the production bundle locally |
| `npm test` | Run the Vitest suite once |
| `npm run lint` | Run ESLint |

Web Serial requires a secure context, so the client must be served over
`https://` or from `localhost`.

## Transports and the deploy build
The client can reach the controller two ways: **Local USB** over Web Serial, and
a **remote proxy** over a WebSocket to `kinisi-serial-proxy`. `npm run dev` and
`npm run build` include both.

`npm run build:deploy` builds the same app with the proxy transport compiled
out, leaving Web Serial as the only option. That is what the public site ships,
because the two do not mix well over HTTPS: the proxy speaks plain `ws://`, so
connecting to it from an `https://` page is mixed content. Chrome permits it for
private network addresses but then marks the page "Not secure" — and that flag
sticks to the origin for the rest of the browser session, surviving a reload and
even a new tab. Dropping the transport avoids it entirely and lets the
Content-Security-Policy tighten `connect-src` from `'self' http: https: ws: wss:`
down to `'self'`.

The switch is the `VITE_ENABLE_PROXY` variable, read in `src/config.js` and in
`vite.config.js`. It defaults to enabled; `.env.deploy` sets it to `false` and
`--mode deploy` loads that file. The build then drops the WebSocket client
module from the output rather than merely hiding the button.

Use the proxy when the browser cannot see the controller directly — for example
when the board is plugged into a Raspberry Pi. Serve the client from that same
host over `http://localhost` and both transports work with no mixed content.

## Updating command file
To update the command file, run the following command:
```
cd ./tools
pip install -r requirements.txt
python update-commands.py --branch=main
```
Where branch parameter is optional.\
The script will generate a new file called `kinisi_commands.js` in the `./src/commands` directory.

## Links
- [Kinisi Motion Controller firmware](https://github.com/szolotykh/kinisi-motor-controller-firmware)
- [Kinisi Motion Controller hardware](https://github.com/szolotykh/kinisi-motor-controller-board)
- [JavaScipt package for kinisi motor controller](https://github.com/szolotykh/jskinisi)
- [Python package for kinisi motor controller](https://github.com/szolotykh/pykinisi)