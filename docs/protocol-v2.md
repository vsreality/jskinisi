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

## Protocol versioning and compatibility

The communication protocol uses `major.minor.patch`:

- **Major:** breaking changes to existing framing, request/response layouts,
  units or command meaning. The client and firmware must support the same
  protocol major. This client supports major 2 and rejects other majors.
- **Minor:** compatible additions. Existing commands retain their IDs, payloads
  and documented meanings. New commands require the firmware minor that
  introduced them; the client must check this before sending.
- **Patch:** compatible fixes that preserve the documented interface and
  behavior. Patch differences do not block connection.

An incompatible replacement within the same major must use a new command ID
while retaining the original command. Changing or removing the original command
requires a new protocol major.

Commands may be marked **retired** in the shared schema, with the retirement
protocol version, replacement command and earliest removal major. They remain
callable with unchanged wire behavior throughout the current major. Generated
SDK methods use the standard `@deprecated` annotation for editor guidance.
Retirement produces no runtime warning or rejection. Legacy odometry
subscriptions and events are retired from protocol `2.6.0`; they remain supported
in `2.x` and are eligible for removal in `3.0.0`. Use the generic subscription API
with 2.6+ firmware; the legacy API remains available for older firmware.

INIT declares the client's supported protocol major and its minimum required
minor. The board reports the protocol it implements. Compatibility requires
matching majors and a board minor at least as high as the client's required
minor; INIT does not translate between major versions or select an older wire
format. This client requires protocol `2.1` for baseline functionality. It also
connects to firmware `2.2` through `2.6`, gating newer commands individually.
Temperature reads require `2.4`; IMU reads require `2.5`; generic subscriptions require `2.6`.

These checks use communication protocol versions. The JavaScript package
version, board hardware revision and firmware build ID are independent. Sensor
presence and other hardware resources are checked separately from protocol
support. The firmware documentation defines the
[shared versioning policy](https://github.com/szolotykh/kinisi-motor-controller-firmware/blob/main/docs/initialization.md#protocol-versioning-and-compatibility).

## Bundled board profiles

Both transport clients automatically select a bundled hardware profile from the
board model and complete revision reported in INIT. The profile is independent
of protocol and JavaScript package versions and is cleared on disconnect.

```js
// After a successful connection:
const profile = controller.boardProfile; // null for an unknown board identity
if (profile) {
  console.log(profile.resources.motors, profile.resources.encoders);
}
if (controller.supportsSensor('imu', 0)) {
  const sample = await controller.get_imu(0);
  console.log(sample.acceleration_z);
}
```

`boardProfile` contains the board identity, resource counts, per-motor hardware
current-sense/current-limit flags and sensor IDs/features. These immutable
profiles omit all MCU, pin, bus, timer, address and motor control-mode details.
Current flags indicate fitted hardware; they do not establish firmware command
availability. Current ADC reads and adjustable-current commands remain
unimplemented in the firmware.

`supportsSensor('temperature' | 'imu', index = 0)` combines hardware presence and
firmware protocol support. The exported helpers in `src/commands/board_profile.js`
provide `getBoardProfile(info)`, `hasBoardSensor(info, kind, index)` for physical
presence, and `supportsBoardSensor(info, kind, index)` for combined support.
Protocol-only helpers remain available but do not establish sensor presence.

An unknown board returns no profile and `supportsSensor` returns false. It can
still connect and use protocol-compatible commands. The UI asks for a client
update rather than assuming another revision's hardware. Low-level sensor
requests for unknown boards rely on firmware availability checks; requests for
known absent sensors fail locally before I/O with `ProtocolError`.

The source bundle is generated from the firmware's board JSON. Update the SDK
snapshot and generated module together:

```sh
python tools/update-board-profiles.py --profiles ../kinisi-motor-controller-firmware/include/board_profiles.json
python tools/update-board-profiles.py --profiles ../kinisi-motor-controller-firmware/include/board_profiles.json --check
```

An explicit firmware `--branch` may be imported instead of a local `--profiles`
file. Imports validate all metadata before replacing either output. The bundled
JSON snapshot is in `tools/board_profiles.json`; the generated native JavaScript
module is `src/commands/board_profiles.js`, so runtime lookup needs no network,
custom file or JSON-module loader. Custom profiles are not supported.

## Clock synchronization

JavaScript identifies itself as SDK type 2, version 2.6.0. It requests protocol 2.1
as the minimum; [position commands](position-control.md) require the board to
report protocol 2.2 or newer. Position PID initialization (0x10 and 0x4E) requires 2.3 or newer. By default it advertises
wall-clock and subscription capabilities. The controller initiates each timing exchange; the
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

Uptime mode still requires INIT/READY and skips all time-sync exchanges.
[Heartbeat and subscriptions](connection-monitoring.md) operate independently of time sync.

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

## Board temperature

Both Web Serial and WebSocket clients expose the same method after connecting:

```js
const celsius = await controller.get_temperature(0);
console.log(`${celsius.toFixed(2)} °C`);
```

Sensor 0 is the TMP102 on v0.4. The method sends `GET_TEMPERATURE` (`0x50`)
with one unsigned-byte sensor index and decodes an eight-byte, little-endian
double into a JavaScript Number. Indices must be integers from 0 to 255; the
board determines which indices exist. Firmware initializes the sensor at startup.

The command requires protocol 2.4 or newer. Older firmware can still connect
and use its existing controls; temperature requests fail locally without sending
an unsupported command. Protocol support alone does not imply a fitted sensor.
`ControllerError.code` distinguishes `ErrorCode.SENSOR_NOT_AVAILABLE` (16),
`ErrorCode.SAMPLE_NOT_AVAILABLE` (10, retry after startup/recovery), and
`ErrorCode.INTERNAL_ERROR` (6, sensor communication/configuration failure).
Malformed payload lengths and non-finite temperatures are rejected.

On the web client's **Sensors** tab, **Read temperature** requests sensor 0
and displays the result in °C. Connect to the board to enable the tab. Temperature
controls appear when the selected profile has the sensor and the board reports
protocol 2.4 or newer. A fitted sensor with older firmware shows an update message;
boards without temperature hardware have no temperature controls. Readings are
requested manually; failures clear the previous displayed
value. The sensor updates at 4 Hz, so repeated reads can return the same sample.

## IMU

After connecting to firmware with protocol 2.5 or newer:

```js
const sample = await controller.get_imu(0);
console.log(sample.acceleration_x, sample.acceleration_y, sample.acceleration_z); // m/s²
console.log(sample.angular_velocity_x, sample.angular_velocity_y, sample.angular_velocity_z); // rad/s
```

`GET_IMU` (`0x51`) sends one unsigned-byte sensor index and decodes six
little-endian doubles (48 bytes) in the order shown above. Indices must be
integers from 0 to 255. Sensor 0 is the BMI088 on v0.4; the board determines
availability. Both Web Serial and WebSocket proxy clients use this API.

Firmware initializes the sensor automatically at 100 Hz, with ±6 g acceleration
and ±500 degrees/s angular velocity ranges. Readings use native sensor axes;
acceleration includes gravity. Each three-axis sample is coherent, but acceleration
and angular velocity are not time-synchronized. No calibration, axis remapping,
orientation or gravity subtraction is applied. Faster reads may repeat samples.

Older firmware still connects and supports existing controls. IMU requests fail
locally before sending on protocol versions below 2.5. Protocol support alone
does not establish hardware availability. Errors use `ControllerError.code`:
`SENSOR_NOT_AVAILABLE` (16), `SAMPLE_NOT_AVAILABLE` (10, retry after sensor startup
or recovery), or `INTERNAL_ERROR` (6, communication/identity/configuration failure).
Malformed lengths and non-finite values are rejected.

In **Sensors → Read IMU**, each click requests sensor 0 and displays all six axes
with their units. Failures clear the previous values and allow retry. Controls
appear only for a profile with an IMU; fitted hardware with older firmware shows
an update message. These are manually requested snapshots.

## Development checks

Run `npm test`, `npm run lint`, `npm run build`, and `npm run build:deploy`.
The Vitest suite tests fragmented/coalesced frames, READY gating, sync while idle,
response reordering, ID wraparound, errors, timeouts, typed codecs, browser stream
cleanup, proxy opcodes, and UI command failures. These fixtures do not simulate
physical motor or encoder behavior.
