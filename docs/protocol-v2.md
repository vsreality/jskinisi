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

## Motor current limits

Current-limit configuration requires protocol 2.11 and fitted hardware. The public
profile supplies numeric `supported_thresholds_ma` and `can_disable`; options are
hardware metadata, while the support helper also checks firmware availability.
Unknown/unsupported motors have no options. Values use integer milliamps and SDKs
reject settings outside the known profile before sending. Firmware validates them
independently. No board-specific enum is required.

```js
const options = controller.getMotorCurrentLimitOptions(0);
if (controller.supportsMotorCurrentLimit(0)) {
  await controller.initialize_motor(0, false);
  const applied = await controller.set_motor_current_limit(0, true, 5400);
  const actual = await controller.get_motor_current_limit(0);
  console.log(options.supported_thresholds_ma, applied, actual);
}
```

Both GET and SET require an initialized, awake motor. SET stops the motor and its
controller, verifies the applied setting, and leaves the motor stopped even on
I/O failure. Platform-owned motors reject SET; release ownership first. GET does
not change motor state. Settings are volatile: motor initialization reapplies
board defaults, and driver power loss requires reinitialization. Disabling current
regulation leaves overcurrent protection unchanged.

An unknown board profile does not advertise support; explicit requests with a
compatible protocol can still reach firmware. No custom profiles are loaded.
See [firmware current-limit behavior](https://github.com/szolotykh/kinisi-motor-controller-firmware/blob/main/docs/motor-current-limit.md)
for errors, persistence, register behavior, and wire sizes.


## Motor PWM frequency

PWM frequency is one setting for all motors. It requires protocol 2.13 and a ready
connection; motors need not be initialized. Supported enum values are `KHZ_10`,
`KHZ_20`, `KHZ_25`, `KHZ_50`, and `KHZ_100`, represented in hertz on the wire.
Use the selected board profile's `pwm_frequency.supported_hz` to populate choices.
The default is available as `pwm_frequency.default_hz`.

Applying a frequency stops every motor and motor/platform controller and leaves
them stopped. It preserves duty-cycle resolution, motor direction configuration,
and driver current-limit settings. Restart motion explicitly. The selected frequency
survives motor initialization and disconnect/reconnect. Reboot restores the default,
unless v0.4 firmware restores an explicitly saved configuration (protocol 2.14+).
GET reads the board's active frequency selection without changing outputs.
Unsupported values are rejected; they are never silently rounded.

```js
import { PwmFrequency } from './src/commands/kinisi_session.js';

if (controller.supportsPwmFrequency()) {
  const options = controller.getPwmFrequencyOptions();
  const appliedHz = await controller.set_pwm_frequency(PwmFrequency.KHZ_25);
  const currentHz = await controller.get_pwm_frequency();
}
```

The Motor tab has a **PWM frequency - all motors** control. Read the board setting,
choose a supported frequency, and apply it. The displayed setting is cleared after
a failed request or a new connection.

Unknown boards have no advertised options; explicit commands on compatible firmware
still reach the board for validation. Older firmware is rejected locally before I/O.

## Save and restore board configuration

Configuration persistence requires a ready connection, protocol 2.14 or newer
within major 2, and the exact bundled Kinisi v0.4 (`model: 1`, revision `0.4.0`)
profile. `controller.supportsConfigurationPersistence()` checks all three. Unlike
some read-only sensor commands, explicit persistence commands are also rejected
locally for unknown board identities; the SDK never guesses storage support.

```js
import { ConfigurationField } from './src/commands/configuration.js';

if (controller.supportsConfigurationPersistence()) {
  // Configure the platform/encoders/directions and apply PWM frequency first.
  await controller.save_configuration(); // resolves only after the board's ACK
  const platformType = await controller.get_configuration_field(
    ConfigurationField.PLATFORM_TYPE, 0);
  const encoderResolution = await controller.get_configuration_field(
    ConfigurationField.ENCODER_RESOLUTION, 0);
}
```

Save stores the running platform geometry, encoder configuration, motor and
encoder directions, and board-wide PWM frequency in onboard FRAM. It saves the
applied board state, not browser settings, form edits, motion targets, odometry
origin or PID-controller state. Driver current-limit settings remain subject to
their startup defaults. A successful ACK confirms a durable, verified save;
controller errors and connection timeouts reject the promise. After a timeout,
the save outcome is unknown: reconnect and explicitly save again before relying
on it. A subsequent boot restores valid saved setup with outputs stopped.

The Platform page reads the running setup when opened on a supported, ready
board. It fills the platform form without sending initialization, save or motion
commands. This also makes restored setup usable after reconnecting. Velocity,
position and odometry controls still need their own explicit initialization.
**Read running setup** refreshes the form and discards unapplied edits; it does
not prove that the same values are saved in FRAM. If active encoders use different
resolutions, the common form field shows channel 0 and the page explains that
Initialize would apply it to every platform encoder. Save preserves the running
per-channel values.

Use **Save configuration** after applying the intended platform/encoder/direction
and PWM settings. The button waits for acknowledgement, prevents duplicate clicks,
and reports storage, missing-platform and connection failures. No automatic save
or reinitialization occurs on connection, page navigation or form edits.

`get_configuration_field(field, index)` returns a scalar number. Platform type
is 0 (unconfigured), 1 (differential), 2 (omni), or 3 (mecanum). Fields 1–3 use
index 0 and report wheel diameter, track/length, and width/radius in meters for
every platform. Readback preserves the values passed to initialization: a 90 mm
omni wheel uses `0.09` meters. Fields 4–6 report each channel's encoder resolution, encoder-reversed
flag and motor-reversed flag; flags are 0 or 1. Use `get_pwm_frequency()` for the
running switching frequency. `readRunningConfiguration(controller)` from
`configuration.js` reads a validated snapshot including all four channel slots.
An encoder resolution of zero denotes an uninitialized encoder and is valid for
open-loop platform setup; it does not prevent saving. Separately configured
channels outside the active platform are included in the readback. Velocity and
position control and odometry stay unavailable until every platform wheel has an
initialized encoder. Applying Initialize clears the previous save confirmation
and refreshes running setup; save again to persist the new applied configuration.
The individual scalar requests are not an atomic transaction, so avoid changing
setup concurrently from another client while reading.

## Manual driver sleep

Driver sleep requires READY and an exact bundled board profile advertising
`power.driver_sleep: true`. Model 1 v0.3.0 and Nano v0.3.1 require protocol 2.17
or newer within major version 2; v0.4.0 retains support from protocol 2.15.
v0.1, v0.2, unknown hardware and earlier firmware are rejected before I/O.

```js
if (controller.supportsDriverSleep()) {
  await controller.set_driver_sleep(1); // Sleep all drivers; wait for ACK.
  const sleeping = await controller.get_driver_sleep(); // 0 or 1
  await controller.set_driver_sleep(0); // Explicit wake; outputs remain stopped.
}
```

`set_driver_sleep` accepts only numeric `0` or `1`. Sleep stops motion and
controllers across connections. Wake does not resume targets or restart controllers.
On v0.4 it verifies retained settings on previously initialized channels; a failed
wake leaves the inhibit active and may be retried after checking motor power and
driver faults. Repeating a confirmed state is safe. Motion requests
while inhibited fail with typed `ControllerError` code `ErrorCode.DRIVERS_ASLEEP`
(19); ordinary telemetry and subscriptions retain their session behavior.

`get_driver_sleep` reports the board-wide inhibit, not each driver's individual
power state: an uninitialized driver may still be asleep when it returns zero.
On v0.3.0 and Nano v0.3.1, the DRV8870 implementation holds both inputs low,
coasting the motors and preventing further drive commands. Sleep entry takes up
to 1.5 ms according to the chip timing specification. Explicit wake clears only
the software inhibit: both inputs remain low until a fresh drive or explicit
short-brake request. Short brake sets both inputs high, and coast returns them
low. Motor and platform brake requests are blocked while inhibited; stale queued
brake requests cannot actuate the bridge after another connection releases it.
On the first fresh drive or short brake, a qualifying high input must last at
least 5 μs, followed by up to 50 μs for the chip to wake. The command ACK and `get_driver_sleep() == 0` do not
confirm physical wake, a drive response time, or measured power savings. These
boards have no sleep pin or SPI sleep-state verification. PWM, direction and
initialization settings remain available, and normal telemetry/session behavior
continues while inhibited.

The inhibit survives reconnects but clears at boot. Save configuration does not
persist it; saved platform/encoder/direction/PWM setup is unchanged by this API.

In the web client's **Motor → Driver sleep — all motors** panel, state is read on
entry and reconnect, and refreshed every two seconds while connected. No
automatic sleep or wake occurs. Manual actions wait for ACK and then read the
current state; failed requests show recovery guidance rather than a success
claim. The panel remains available without initializing an individual motor,
including when a restored platform owns every channel. Other connections can
change the state after any read; use **Read driver state** for a fresh snapshot.

## Communication-preserving board idle

Board idle requires READY, protocol major 2, and an exact known profile advertising
`power.board_idle: true`. Model 1 v0.3.0 and Nano v0.3.1 require protocol 2.18 or
later; v0.4.0 retains support from protocol 2.16. v0.3/Nano at protocol 2.17 and
v0.4 at protocol 2.15 retain driver sleep without receiving board-idle requests.
v0.1, v0.2 and unknown revisions remain unsupported.

```js
if (controller.supportsBoardIdle()) {
  await controller.set_board_idle(1); // ACK confirms entry; numeric 0/1 only.
  const idle = await controller.get_board_idle(); // Scalar 0 or 1.
  await controller.set_board_idle(0); // Explicit board wake; no motion resumes.
}
```

Entry stops controllers and motion, inhibits the drivers, and pauses autonomous
subscription samples. Existing subscriptions stay registered. USB and I²C remain
available for explicit reads, heartbeat and time synchronization. New subscription
requests and independent driver-sleep changes are rejected while idle with typed
`ControllerError` code `ErrorCode.BOARD_IDLE` (20). An explicit board wake preserves
driver sleep if it was requested before idle. Otherwise, v0.4 verifies the retained
driver settings; v0.3/Nano clears the software inhibit and keeps both DRV8870
inputs low until a fresh drive or explicit short-brake request. Neither case
resumes motion. Restart controllers and issue fresh
motion commands when ready. Failed transitions retain idle and motion inhibition;
read current state and explicitly retry. There is no implicit wake on reconnect.

Idle preserves the existing USB session and does not disconnect or re-enumerate
the device. The CPU may use shallow sleep between scheduled work; heartbeat,
clock synchronization, explicit reads and USB/I²C service continue. Querying
idle state never clears it or resumes motion. Normal session timeout and physical
disconnect rules still apply. Firmware scheduling support does not establish a
measured reduction in power consumption or a guaranteed wake latency.

Board idle is volatile and does not change saved configuration. Reset clears the
idle request and follows the usual stopped boot/restore behavior. Read driver
sleep separately to inspect the effective motor inhibit, including board idle.

The web client's Motor page has separate **Board idle** and **Driver sleep**
controls. Both use one shared reader, refreshed every two seconds while connected
and after manual transitions. Readbacks are snapshots, so another connection may
change state between reads. No polling operation enters or leaves idle. A failed
or mismatched readback never produces a success claim.

Telemetry UI keeps subscription handles while idle and labels automatic samples
as paused rather than live. Unknown power state also suppresses live status; after
wake or recovery from an unverified power state, it rearms the retained stream
once with the same settings and waits for a new sample before reporting
live/listening again. This also handles a quiet on-change/event stream whose first
wake event arrived before power readback. The SDK handle's `refresh()` method
rearms that subscription without replacing its callback or ownership; pre-ACK
events are discarded. A failed refresh offers stop/start retry. Explicit
sensor reads remain available as snapshots. SDK idle readback, transition attempts
and `BOARD_IDLE` errors clear cached legacy odometry and queued latest samples without
unsubscribing. External idle changes become visible on the next shared state read;
the existing no-recent-samples checks continue to apply between reads.

## Encoder and IMU experiment

Exact v0.4.0 boards with protocol 2.19 can opt into the volatile comparison
experiment. Legacy encoder control remains the default. See [mounting, health,
compact diagnostics and examples](fusion-experiment.md).

## IMU-only relative tracking

See [IMU-only relative tracking](imu-tracking.md) for the protocol 2.20 opt-in,
stationary sensor-axis mounting declaration, bounded horizon and diagnostics.

## Tracking source selector

A ready model 1 board with hardware 0.4.0 and protocol 2.21+ can report encoder,
IMU-only or passive fused tracking. Encoder is the default. Call
`set_feedback_source(source)` only while stopped and disarmed, with the motors
coasting and a quiet encoder observation. `SOURCE_SWITCH_UNSAFE` leaves the previous
preference in place. Selection never starts a producer, commands motion or enables
a control loop. Prepare the required producer explicitly.

- Encoder and passive fused tracking require initialized platform odometry.
- The passive observer additionally needs an explicit `set_feedback_fusion_mount(yaw)`
  declaration for a rigid, centered, level board with +Z up. Yaw is the angle of
  board +X in chassis XY, counterclockwise about chassis +Z, in radians. Read
  `get_feedback_fusion_mount()` to confirm it. Mount declarations are volatile.
- IMU-only tracking requires the stationary mounting declaration and cold calibration
  described above. Its one-second diagnostic window begins at the producer origin.
  Re-selecting a source does not extend the window.

The board reports `requested`, `active`, `valid`, `reason` and the native
`source_detail`. Loss or expiry gives active NONE. Discard old estimates on source
loss, a change in `origin_id`, or reconnect. Pose uses metres and continuous radians
relative to the selector origin. Twist uses chassis forward/left metres per second
and counterclockwise radians per second. The producer supplies `sequence` and the
board-monotonic acquisition `timestamp_us`. `age_us` is the board's measured sample
age, with `UINT32_MAX` for unavailable. Read current status after reconnect.

Only explicit `save_configuration()` persists the requested preference with the
rest of the running setup. Reboot requires a fresh mount or calibration as applicable.
Restored preference is observable in selector status after reboot. Tracking data,
origin and controller targets are volatile.

Use `await controller.readFeedbackSourceSnapshot()` for a verified status, pose
and twist. An invalid status returns null vectors. If an episode or sequence changes
during all three read attempts, the promise rejects. A failed write requires explicit
readback before deciding whether to retry.
