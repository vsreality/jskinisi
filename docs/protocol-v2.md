# JavaScript API v2

`KinisiClient.connect()` opens Web Serial and returns `true` only after the board
identity, initial clock synchronization, and READY are received. Failures return
`false` and set `lastError`. The WebSocket client retains its two-stage API:
`connect()` opens the proxy socket; `open(serialPort)` opens the serial device and
completes the same board handshake before returning `{ok: true}`.

`boardInfo` contains board model, hardware revision, protocol version and the
firmware build identity. `ready` and `clockMode` expose session readiness. The UI
shows the board version after connecting. Keep command-specific documentation in
the firmware's generated `commands.md`; local methods are generated from the
checked-in `tools/commands.json` snapshot.

## Clock synchronization

JavaScript identifies itself as SDK type 2, version 2.0.0. By default it advertises
wall-clock capability only. The controller initiates each timing exchange; the
client answers `TIME_SYNC_REQUEST` with receive/send Unix microseconds. A single
continuous reader services initial and periodic exchanges, including when the UI
is idle. The firmware defaults to 30 seconds; `set_time_sync_interval(ms)` and
`get_time_status()` retain that firmware-controlled behavior.

The default host clock anchors `Date.now()` to `performance.now()` at client
construction, so browser wall-clock adjustments cannot make a timing exchange
jump backwards. It inherits the host's wall-clock accuracy. Optional `nowUnixUs`
must return Unix microseconds as a `bigint`; use it for a separately managed
clock. Browser scheduling, timer precision and proxy latency limit accuracy.

Select uptime explicitly if the host cannot provide wall time:

```js
const usb = new KinisiClient(onDisconnect, { wallClock: false });
const proxy = new KinisiWebSocketClient(host, onDisconnect, 8765, { wallClock: false });
```

Uptime mode still requires INIT/READY and skips all time-sync exchanges. No
subscriptions or heartbeat watchdog are introduced by this update.

## Messages, errors and samples

All requests carry a message ID, increasing from 1 to 65535 and wrapping to 1.
Pending requests reserve their IDs, and timed-out IDs remain retired until
reconnect. Replies match command and ID; controller-initiated sync uses a separate
ID namespace. Multiple requests can be pending, and replies may arrive out of
order. Complete outgoing frames are serialized and never interleaved.

Setters now resolve only after an ACK. Controller ERROR responses reject with
`ControllerError`, carrying `code`, `command`, and `messageId`. Timing-response
errors are stored separately in `lastSyncError`. Incomplete/malformed frames and
transport loss cancel pending work and close the connection. Individual request
timeouts do not resend commands: a timed-out operation may already have executed.
A lost readiness error requires reconnecting before further user requests.

Both odometry getters return sample objects. Encoder samples contain `angle`;
platform samples contain `x`, `y`, `t`. Both include `timestamp_us`, `clock_mode`
and `clock_quality`. The timestamp is captured when the controller measures the
sample, not when JavaScript requests it.

**64-bit integer fields are `bigint`**, including timestamps and sync age. Use
`.toString()` for display or JSON serialization; convert to `Number` only after
checking the required range and precision. Binary64 measurements remain JavaScript
Numbers. Decoders respect typed-array offsets and reject payload-size mismatches.

Options shared by both constructors:

| Option | Default | Purpose |
| --- | --- | --- |
| `wallClock` | `true` | Advertise valid wall time; otherwise select uptime |
| `requestTimeoutMs` | `2000` | Request and transport-write deadline |
| `initTimeoutMs` | `5000` | Initial handshake / proxy-control deadline |
| `frameTimeoutMs` | `2000` | Deadline for an incomplete received frame |
| `nowUnixUs` | anchored host clock | Function returning Unix-us `bigint` |

The proxy keeps the existing WRITE/READ opcode protocol. The reader asks first
for a frame's length, then for its remaining bytes. It sends sync replies before
starting another blocking proxy READ. Use a serial read timeout shorter than the
client's request deadline. The proxy serializes READ and WRITE, so an idle READ
can delay the next command by that timeout. For interactive control, start the
proxy with `--serial-timeout 0.05`; its existing default is one second. Direct Web Serial
holds one reader/writer pair until disconnect and cancels I/O before releasing it.

## Development checks

Run `npm test`, `npm run lint`, `npm run build`, and `npm run build:deploy`.
The Vitest suite tests fragmented/coalesced frames, READY gating, sync while idle,
response reordering, ID wraparound, errors, timeouts, typed codecs, browser stream
cleanup, proxy opcodes, and UI command failures. These fixtures do not simulate
physical motor or encoder behavior.
