# Heartbeat and streamed odometry

SDK 2.1 requires protocol 2.1 firmware. Serial and WebSocket sessions enable a 500 ms watchdog after INIT/READY. PING is sent after 100 ms without outgoing traffic; normal commands and time-sync replies postpone it. Pass `heartbeatTimeoutMs: null` in session options to opt out, or call `set_heartbeat_config(false, 500)` after connecting. Changing the timeout adjusts the idle interval to one fifth of that value.

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
