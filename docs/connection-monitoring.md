# Heartbeat and telemetry subscriptions

The SDK requires at least protocol 2.1 firmware; generic subscriptions require 2.6. Serial and WebSocket sessions enable a 500 ms watchdog after INIT/READY. PING is sent after 100 ms without outgoing traffic; normal commands and time-sync replies postpone it. Pass `heartbeatTimeoutMs: null` in session options to opt out, or call `set_heartbeat_config(false, 500)` after connecting. Changing the timeout adjusts the idle interval to one fifth of that value.

## Generic subscriptions

`Topic` is generated from the shared protocol schema. Use the same method for
encoder odometry, platform odometry, temperature and IMU measurements:

```js
import { Topic } from './src/commands/kinisi_session.js';

// The client is connected and heartbeat monitoring is enabled.
if (client.supportsTopic(Topic.IMU, 0)) {
  const subscription = await client.subscribe(
    { topic: Topic.IMU, index: 0, intervalMs: 100 },
    sample => console.log(sample.timestamp_us, sample.acceleration_x),
  );

  // Later: stop delivery. Sensor measurement and odometry calculation are separate.
  await subscription.unsubscribe();
}
```

| Topic | Index | Callback sample | Minimum interval |
| --- | --- | --- | --- |
| `Topic.ENCODER_ODOMETRY` | Encoder index | `EncoderOdometrySample`: timestamp, clock metadata, angle in radians | Twice the calculation period |
| `Topic.PLATFORM_ODOMETRY` | 0 | `PlatformOdometrySample`: timestamp, clock metadata, x/y in metres and theta in radians | Twice the calculation period |
| `Topic.TEMPERATURE` | Sensor index | `TemperatureSample`: timestamp, clock metadata, celsius | 250 ms |
| `Topic.IMU` | Sensor index | `ImuTelemetrySample`: timestamp, clock metadata, acceleration in m/s² and angular velocity in rad/s | 10 ms |
| `Topic.MOTOR_CURRENT` | Motor index (0–3) | `MotorCurrentSample`: timestamp, clock metadata, `amps` | 20 ms |

Motor current requires protocol 2.7 and a motor with current sensing. Both the
pull and subscription return a nonnegative filtered high-side current estimate;
PWM affects the measurement. It is not signed winding or battery current.
Reading does not enable the motor. ADC saturation returns `SAMPLE_OUT_OF_RANGE`;
read failures pause an existing stream until recovery.

```js
if (controller.supportsMotorCurrent(0)) {
  console.log(await controller.get_motor_current(0)); // amperes
  const stream = await controller.subscribe(
    { topic: Topic.MOTOR_CURRENT, index: 0, intervalMs: 100 },
    sample => console.log(sample.amps, sample.timestamp_us),
  );
  // Keep the handle while receiving samples, then stop it when finished.
  await stream.unsubscribe();
}
```

Intervals are integer milliseconds, at most 3,600,000. The default index is zero.
Initialize and start odometry before subscribing to it. `supportsTopic()` checks
the bundled board profile and protocol version; firmware checks runtime state.
For an unknown board profile it returns false, but an explicit subscription can
still be sent for firmware validation. There is no automatic fallback to polling
or legacy commands on older firmware; GET and the legacy methods remain usable.

Each topic/index has one subscription per connection. Subscribing again replaces
it after the board acknowledges the request. An old handle cannot unsubscribe a
newer replacement. Unsubscribe is idempotent; `subscription.active` indicates
whether the handle still owns the subscription. Disconnect, reinitialization and
heartbeat disable clear subscriptions; applications must subscribe again.
If a subscribe ACK times out, the SDK cancels that source before reporting the
timeout. If an unsubscribe ACK times out, it closes the session so the board's
watchdog can clear the stream and stop motion. A failed replacement with an
ordinary controller error leaves the previous subscription intact.

Samples are immutable and `timestamp_us` is a BigInt. Odometry timestamps describe
the original calculation sample. Sensor timestamps describe completion of the
register read, not the conversion instant; accelerometer and gyroscope samples
are not synchronized. Delivery is best effort and keeps no measurement history.
Callbacks can be asynchronous and can issue commands. While a callback runs,
only the latest waiting sample is retained. Callback failures are recorded in
`client.lastTelemetryError` without closing the connection. Sensor read errors
pause delivery until recovery; no stale sample is emitted after a failed read.

The web client's live-update controls use this API. Switching tabs or resources
unsubscribes from the old stream, including when the subscribe ACK arrives after
the view has closed. Older firmware keeps its manual read controls.

Motor-current readings and live updates appear in the **Motor** tab for the
selected motor. Changing the motor clears its reading and stops its stream.

## Legacy odometry subscriptions

**Retired since protocol 2.6.0; supported throughout 2.x and eligible for removal
in 3.0.0.** The generated SDK marks `subscribe_odometry()` and
`unsubscribe_odometry()` as deprecated, and the legacy `getSubscriptionSample()`
cache helper has the same guidance. Use `subscribe()` with
`Topic.ENCODER_ODOMETRY` or `Topic.PLATFORM_ODOMETRY`, then
`subscription.unsubscribe()`. For firmware older than 2.6, the legacy API below
remains available. GET, START, STOP and RESET methods remain active.

```js
await client.initialize_encoder(0, 1425.1, false);
await client.start_encoder_odometry(0);
await client.subscribe_odometry(0, 100);

// Read from the application's update loop; null until an event arrives.
const sample = client.getSubscriptionSample(0);
if (sample) console.log(sample.timestamp_us, sample.angle);

await client.unsubscribe_odometry(0);
```

Sources 0–3 select encoders; source 4 selects platform odometry. Events are decoded independently of pending command replies and retained in a bounded latest-sample cache. `timestamp_us` remains a BigInt. GET commands continue to work. The subscription interval must be at least twice the calculation period (100 ms with the default 50 ms calculation period).

Keep the browser active while controlling motion. Browser suspension or timer throttling can prevent heartbeat delivery, in which case firmware stops the motors. Reconnecting does not restore motor output automatically. A heartbeat is a connection check; it does not impose an expiry on individual motor commands.

## WebSocket proxy

Use a short serial read timeout so an idle READ cannot delay queued writes. Start the proxy with `--serial-timeout 0.05` (50 ms); a one-second read timeout is unsuitable for the default 500 ms watchdog. The local proxy now uses 50 ms by default. Network and scheduling delays also count toward the controller's timeout.

## Motor faults

Fault reporting requires protocol 2.8 and fitted hardware. Read `status_valid`
before interpreting diagnostic flags; an asleep or unavailable driver must not
be shown as healthy. Reads do not wake the driver, initialize the motor, clear
latched faults, or change the outputs. Missing motor power cannot be distinguished
from communication or driver failure by an unavailable response alone. Existing
motor reinitialization clears latched driver faults. Fault subscriptions have a
100 ms minimum interval and report snapshots, not a fault-event history.

```javascript
if (controller.supportsMotorFaults(0)) {
  const status = await controller.get_motor_faults(0);
  console.log(status.status_valid ? status.overcurrent : 'Diagnostics unavailable');
  const subscription = await controller.subscribe(
    { topic: Topic.MOTOR_FAULTS, index: 0, intervalMs: 250 },
    sample => console.log(sample.status_valid, sample.fault_active));
  // When finished: await subscription.unsubscribe();
}
```

See the [firmware fault reference](https://github.com/szolotykh/kinisi-motor-controller-firmware/blob/main/docs/motor-faults.md) for every diagnostic field and hardware limitations.


## Subscription delivery modes

`PERIODIC` (0) sends the latest sample at each interval. `ON_CHANGE` (1)
sends an initial snapshot, then another when the encoded value fields change.
Timestamp and clock metadata are excluded from the comparison. Fault appearance,
clearance, sleep, and diagnostic validity changes are included in the value fields.
Numeric measurements use exact encoded comparisons, with no deadband.

The interval controls how often firmware checks for changes; topic minimums still
apply. Faults can be checked every 100 ms. This is sampled detection, not an
interrupt-driven guarantee. A quiet change subscription remains active, and the
connection heartbeat runs independently. Hardware protection remains independent
of telemetry delivery.

Each connection keeps its own baseline. Replacing a subscription requests a fresh
initial snapshot. Failed reads pause delivery; the next successful read sends a
snapshot even if the value matches the previous one. A failed transmit does not
advance the baseline. Slow transports receive the latest state and can skip
intermediate transitions; subscriptions are not a fault history. On I2C, the
master must continue servicing `poll()` to retrieve queued samples.

Delivery modes require protocol 2.9. The SDK keeps the original `SUBSCRIBE`
request for periodic mode, so existing applications and older compatible firmware
keep working. Other modes use `SUBSCRIBE_WITH_MODE` (0x83), with the same topic,
index and uint32 interval followed by a uint8 mode. Events and unsubscribe keep
their existing formats. Unsupported modes are rejected before transmission.

```js
import { Topic, SubscriptionMode } from '../src/commands/kinisi_commands.js';

const faults = await controller.subscribe({
  topic: Topic.MOTOR_FAULTS, index: 0, intervalMs: 100,
  mode: SubscriptionMode.ON_CHANGE,
}, sample => console.log(sample));
await faults.unsubscribe();
```

The web client's motor faults section defaults to On change on compatible firmware;
older fault-capable firmware uses periodic updates. Other telemetry controls default
to Periodic. Select a delivery mode before starting live updates. Quiet change
subscriptions show “Listening for changes” after their initial snapshot.


## Clearing motor faults

`clear_motor_faults(motor_index)` requires protocol 2.10 and returns fresh
motor-fault status. Firmware stops the motor and its active controller, clears
latched flags, and leaves the output disabled with zero PWM. Read and record
diagnostics first when investigating an issue. Existing active conditions may
still be reported after the clear; inspect the response before restarting.

The motor must already be initialized and its driver awake. Platform-owned motors
are rejected with `MOTOR_OWNED`; initialization is checked next. SPI or verification
failures return `INTERNAL_ERROR` and leave the motor stopped once execution has
begun. No automatic initialization, wake-up, retry, or motor restart is performed.
The existing per-motor `fault_reporting` profile flag identifies the supported
driver hardware, while protocol 2.10 identifies command availability.

See [firmware fault reporting](https://github.com/szolotykh/kinisi-motor-controller-firmware/blob/main/docs/motor-faults.md)
for register behavior and the meaning of each returned flag.

```js
const status = await controller.clear_motor_faults(0);
console.log(status);
```

The Motor tab provides **Clear faults** beside **Read faults** on compatible
firmware. Clearing shows the returned diagnostics and never sends a speed command.

### Web client fault history

The **Motor** tab records the latest 100 received diagnostic changes across motors,
newest first. Each entry shows the motor, connection number, local receipt time,
diagnostic status, and whether it came from **Read faults**, live updates, or a
**Clear faults** response. The first reading establishes a baseline, including a
healthy, asleep, or unavailable state. Repeated identical states are omitted;
timestamp changes alone do not add an entry. Warnings are recorded even when
the global fault flag is clear. A later healthy reading does not remove earlier
faults, and unavailable diagnostics are not treated as recovery.

History survives motor and tab changes and disconnects while the page remains
open. After a disconnect it is also visible on the **Connection** page. Reconnecting
labels subsequent readings with a new connection number, keeping boards' readings
distinct. **Clear history** removes only the displayed log; it sends no command
to the board. Reloading or closing the page discards the log. **Clear faults**
affects the driver and preserves the history.

To capture changes, start live updates in the selected motor's faults section.
Switching motors or leaving the Motor tab stops that stream. History contains only
received samples: it cannot recover earlier faults, faults while not monitoring,
or transitions missed between samples. Times indicate receipt by the browser,
not the exact time a fault occurred. Failed read commands display an error and
do not add a diagnostic state.

## Trigger and delivery settings

`SUBSCRIBE_CONFIGURED` (protocol 2.12) separates when to read from what to send.
It sends an initial snapshot, then applies these settings:

| Setting | Values | Meaning |
| --- | --- | --- |
| `trigger` | `PERIODIC` (0), `ON_EVENT` (1) | Read on the polling schedule or on a source notification. |
| `delivery` | `ALL` (0), `ON_CHANGE` (1) | Send every triggered update, or only changed value fields. |
| `poll_interval_ms` | Integer milliseconds | Required for periodic triggering; zero for event triggering. Topic minimums apply. |
| `max_silence_ms` | Integer milliseconds | For ON_CHANGE, send a fresh snapshot after this long without a successful send, even if unchanged. Zero disables refresh. |

Nonzero intervals must meet the topic minimum and cannot exceed 3,600,000 ms.
ALL requires zero maximum silence. Timestamp and clock metadata do not count as
value changes. Odometry retains its acquisition timestamp; refresh does not start
or restart calculation. Heartbeat monitoring remains independent and required.

Only MOTOR_FAULTS currently supports ON_EVENT. The fault GPIO interrupt records a
notification; the command task reads diagnostics and sends them as soon as it can.
A 100 ms background check catches additional diagnostic changes while the fault
pin is already asserted, and recovery conditions without an interrupt. Driver
initialization enables thermal-warning reporting on the fault pin while preserving
protection settings. Current-regulation reporting on that pin remains unchanged.

ON_EVENT + ALL sends each observed notification batch, including unchanged values,
and changes found by reconciliation. An unchanged background check is not an event.
ON_EVENT + ON_CHANGE filters repeated values and can refresh after maximum silence.
The firmware stores latest state, not a lossless event queue: bursts can coalesce,
transient conditions may be missed, and bus/task delays affect delivery. Failed
reads do not resend old data. Backpressure does not acknowledge a change until sent.
Maximum silence is a best-effort reporting deadline, not a connection watchdog or
a guarantee during failed reads, unavailable measurements, or a blocked transport.

The request payload is `uint8 topic_id`, `uint8 index`, `uint32 poll_interval_ms`,
`uint8 trigger`, `uint8 delivery`, `uint32 max_silence_ms`, in that order. Events,
unsubscribe, session cleanup and capacity limits remain shared with the existing
subscription commands. Existing interval/mode APIs retain their wire behavior.
Configured subscriptions require 2.12 and are rejected locally on older firmware.

On I2C, the board cannot initiate transfers. Continue calling Arduino `poll()`;
event subscriptions request service every 10 ms (divided among active streams).
USB receives notifications without client polling. Hardware protection acts
independently of subscription and transport timing.

```js
import { Topic, SubscriptionTrigger, SubscriptionDelivery } from './src/commands/kinisi_commands.js';

const subscription = await controller.subscribe({
  topic: Topic.MOTOR_FAULTS, index: 0,
  trigger: SubscriptionTrigger.ON_EVENT,
  delivery: SubscriptionDelivery.ON_CHANGE,
  maxSilenceMs: 5000,
}, sample => console.log(sample));
// Later: await subscription.unsubscribe();
```

For periodic triggering, supply `pollIntervalMs`. Do not mix these settings with
legacy `intervalMs`/`mode` options. The web Motor tab defaults fault updates to
ON_EVENT + ON_CHANGE with 5000 ms maximum silence on compatible firmware and
uses existing modes on older firmware. History records received state changes;
unchanged refreshes do not add identical entries.
