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
