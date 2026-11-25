# Encoder and IMU experiment

This opt-in experiment requires a READY protocol 2.19+ session and exact model 1
hardware 0.4.0 with `capabilities.fusion_experiment: true`. Missing capabilities,
older firmware and unknown revisions are unavailable. Existing control defaults
are unchanged: reset selects legacy encoder feedback. The experiment is volatile
and is not included in `SAVE_CONFIGURATION`.

The experiment modes are `LEGACY_ENCODER` (0), `ENCODER_CORRECTION` (1) and
`FUSED` (2). Modes 1 and 2 use the same chassis correction for comparison;
mode 0 retains the release path. This is not a general odometry-source selector
and has no IMU-only mode. Comparative accuracy and physical performance remain
unmeasured until separately reported.

On protocol 2.23+ an applied [shared IMU mount](protocol-v2.md#shared-imu-mounting) supplies the board orientation and displacement to U601 for fused tracking. Verify the installation, confirm stationarity and pass zero for the legacy yaw when enabling the producer.

For legacy geometry the caller must declare a rigid, level mount, component side up, with the IMU
at the chassis reference point. Tilted or offset installations are unsupported.
Chassis axes are +X forward, +Y left, +Z up. `mounting_yaw_rad` is the angle of
board +X expressed in chassis XY, counterclockwise about chassis +Z, in [-pi, pi].
The transform is `Rz(yaw) * (-sensor_x, -sensor_y, sensor_z)`. Gravity cannot
establish mounting yaw. Supply it from the known installation; do not infer it
from a stationary reading.

Configure only with motion stopped and every commanded target and motor output
zero; initialized controllers at idle zero targets are allowed. Firmware rejects
any observed configured encoder movement in the preceding 100 ms, or a counter
change since a fresh sample. Stopped cold setup may ACK in WAITING. An ACK
confirms configuration, not healthy sensing or permission to resume an old target.
Both experimental modes require 100 ms of observed unchanged configured counters
for initial rest arming before accepting a motion target; fused bias calibration
may run within that window. Once armed, ordinary target updates remain accepted
while moving; each update does not require a new stationary window.

After an ordinary sensor fault, the source can requalify automatically. Wait for
healthy feedback, then issue a fresh target through the normal platform API.
On outage recovery, firmware reapplies the last fused-from-encoder world transform
to the current encoder pose. Reconfiguration is only needed for a deliberate mode
or mounting change; it does not replace the healthy-feedback and fresh-target
requirements. Board idle, driver inhibit, stop and watchdog behavior retain
precedence. No SDK read, reconnect or experiment setter sends a motion target.

The physical IMU producer waits 2 ms between passes; this is not a guaranteed
2 ms acquisition cadence. Pairing accepts only
acquisition windows entirely preceding the encoder timestamp, with each window
at most 5 ms wide, worst-case accel/gyro skew at most 15 ms, and age at most 35 ms.
These software acceptance limits do not establish physical timing or accuracy.

Diagnostics are explicit snapshots. Reads never set targets or change
configuration, but may enforce an expired feedback deadline, clear the live
target and coast. `GET_FUSION_STATUS` returns mode, health,
fault, flags, sequence, monotonic `timestamp_us`, and accel/gyro/encoder ages in
microseconds. An age of UINT32_MAX means unavailable. `GET_FUSION_VECTOR(kind)`
returns sequence plus x/y/z for encoder pose, encoder body twist, fused pose,
fused body twist or bias. Pose is relative metres/metres/radians; twist is
m/s, m/s, rad/s; bias is accel-X/accel-Y in m/s² and gyro-Z in rad/s.
Unavailable vectors return `SAMPLE_NOT_AVAILABLE`. Only associate a vector with
a status timestamp/health when their sequences match. Separate reads can cross
an update; retain both sequences and report that mismatch rather than presenting
a coherent snapshot. Logical health is not a physical accuracy guarantee.

`FusionFlag` values are ESTIMATE_VALID=1, BIAS_READY=2,
FRESH_TARGET_REQUIRED=4 and CORRECTION_ACTIVE=8. Health is DISABLED=0,
WAITING=1, HEALTHY=2 or FAULT=3. Fault labels distinguish mount, encoder, IMU,
freshness, timestamps, saturation, bias, discontinuity and inhibit conditions.
Read state after errors and retry only by explicit operator action.

## JavaScript and web client

```js
import { FusionMode, FusionVectorKind } from './commands/kinisi_commands.js';

if (controller.supportsFusionExperiment()) {
  // Only after verifying stopped outputs/targets and the required mounting.
  await controller.set_fusion_experiment(FusionMode.FUSED, 0);
  const status = await controller.get_fusion_status();
  const pose = await controller.get_fusion_vector(FusionVectorKind.FUSED_POSE);
  const sameSnapshot = status.sequence === pose.sequence;
}
```

Timestamps remain BigInt. Invalid selectors/yaw reject without I/O; typed
`ControllerError` preserves device faults. Configuration does not imply that
the following vector is available.

The Platform page has an experiment panel with explicit mounting acknowledgement
and legacy yaw when applicable, separate comparator/fusion actions, and a legacy-path action. It sends
no targets, controller starts or setup commands. Diagnostics show mode, health,
fault, ages, flags, sequences and relative estimates. Missing vectors and
sequence mismatches stay visible. Read failures clear the previous success;
reconnect ignores old in-flight responses and never reapplies a mode. Use
**Read fusion diagnostics** to refresh the displayed snapshot.
