# Position control

The JavaScript SDK and browser controls support firmware protocol 2.3.0 position PID
commands over both Web Serial and the WebSocket proxy. Connections still request
protocol 2.1 as the minimum, so existing controls work on older 2.1 firmware.
PID initialization on boards older than 2.3 rejects locally before sending a command.
The legacy proportional initialization methods remain available for protocol 2.2.

Initialize and tune the velocity controller first. Position control adds a
PID outer loop with separate Kp, Ki, Kd, integral limits, speed limits and tolerances. The example gains
below are starting values for testing, not hardware-specific tuning.

The **Settings → Angle units** selector offers radians or degrees for angular targets,
maximum angular speeds, tolerances and position readouts. Switching units converts
the existing values without changing the physical target or sending commands.
Degrees use deg/s for speed; platform X/Y and translation settings remain in
meters and m/s. Position gains retain their values. The SDK and firmware always use radians;
the browser converts degree inputs before sending them. Apply changed speed
limits with **Initialize position controller**.

This setting applies across all pages: motor encoder feedback, motor velocity
and position controls and graphs, platform heading, angular velocity targets and
keyboard angular speed. It saves automatically in browser local storage and is
restored after reload. Settings is available without a connected controller.
Opening Settings preserves the current page's inputs, initialization and graph
history. Keyboard driving is suspended while Settings is open; held keys are
released with a stop command. Changing units itself sends no commands.
Velocity targets are converted back to rad/s before transmission. Kp, Ki and Kd
remain unchanged in both the UI and firmware for motor and platform controllers.
Velocity gains always use radian-based tuning units, regardless of the selected
angle unit. PWM percentages and linear units are unaffected.

The **Velocity response** graph shows measured and target speed against elapsed
seconds, using the page's selected units.
Use **Live velocity graph** to pause or resume sampling. Select **Speed error**
in the legend to show the optional error trace. The graph keeps the latest 120 samples and clears
when changing motors or initializing the velocity controller.

The **Position response** graph polls after position initialization and plots
measured positions against the last acknowledged position target. It retains
120 samples, polls every 0.5 seconds after the preceding read completes, and
uses the selected angular units. Platform X/Y use a separate meter axis.
Turn off **Live position graph** to pause; **Read position** also adds a sample.
Read errors pause polling until you explicitly enable it again. Initialization,
origin reset, or controller changes clear the history. Editing a target alone
does not change the target line; **Set position** must succeed first.

## Motor

Use the **Motor Controller** tab: initialize the velocity controller, then use the
**2. Position control** card to initialize position control, set a target, read the
angle or reset the origin.

After connecting and initializing motor 0's velocity controller:

```js
await controller.initialize_motor_position_pid_controller(0, 2, 1, 0.02, 0, 0, 1);
// Parameters: motor index, Kp (1/s), max speed (rad/s), tolerance (rad),
// Ki (1/s^2), Kd (dimensionless), integral contribution limit (rad/s).
await controller.set_motor_position(0, 4 * Math.PI); // Two turns from the origin.
const angle = await controller.get_motor_position(0); // Number, radians.
await controller.reset_motor_position(0);
```

Motor angles are continuous radians, including negative and multi-turn targets.
Initialization and reset establish zero at the current encoder position. Reset
also clears the target and velocity PID history. It does not reset independent
encoder odometry. The configured encoder resolution must include any gearing.

Velocity target commands suspend motor position mode while preserving its
configuration; another position target resumes it. Stop, brake, delete, raw PWM
and velocity reinitialization require position initialization again. Platform-owned
motors reject direct motor position commands.

## Platform

Use the **Platform** tab: initialize geometry and the velocity controller, turn
off keyboard driving, then initialize the **2. Position control** card. Position
initialization starts odometry if necessary. Wait for a fresh sample before
setting a target; use **Read position** to check it.

After platform geometry and velocity controller initialization:

```js
await controller.initialize_platform_position_pid_controller(
  1, 2,          // Translation and heading gains (1/s).
  0.2, 0.5,      // Maximum translation (m/s) and rotation (rad/s).
  0.01, 0.03,    // Translation (m) and heading (rad) tolerances.
  0, 0, 0.2,    // Translation Ki, Kd and integral limit (m/s).
  0, 0, 0.5,    // Heading Ki, Kd and integral limit (rad/s).
);
// Once get_platform_odometry() returns a fresh sample:
await controller.set_platform_position(1, 0, Math.PI / 2);
const pose = await controller.get_platform_odometry(); // Existing timestamped sample.
await controller.reset_platform_position();
```

Targets are absolute `(x, y, t)` in the current odometry world frame: meters,
meters and radians. Heading uses the shortest angular path. Omni and mecanum
platforms can translate and rotate together; differential platforms steer toward
the point, then align to the final heading. These are wheel-odometry targets,
without obstacle avoidance or global localization.

Reset establishes `(0,0,0)`, clears the old target and retains position tuning.
Wait for fresh odometry before another target. Missing/stale feedback cancels
motion; recovery requires a new target. `SAMPLE_NOT_AVAILABLE` is shown in the UI
when feedback is not yet ready. No motion request is automatically retried.

Platform velocity overrides, keyboard driving, stop/brake/coast, platform
reconfiguration, and odometry start/stop/reset invalidate position setup in the
UI. Initialize position control again before sending another target. Motor
selection changes also require position setup in the newly shown card.

All new methods require finite JavaScript Numbers, integer motor indexes 0–3,
positive Kp and speed limits, and nonnegative Ki, Kd, integral limits and tolerances. All setters resolve
only after the controller acknowledges the operation. Controller errors remain
`ControllerError` instances with `code`, `command` and `messageId`.

Stop and brake controls remain available in the existing motor/platform controls.
Reset position changes the coordinate origin; use stop or brake to end motion.

Position PID state is independent of velocity PID state. Ki and Kd default to zero;
choose and tune them explicitly for your mechanism. Integral limits bound the
integral contribution to velocity, with conditional integration at speed limits.
Derivatives use a 20 ms filter and suppress the first-sample kick after a new
target. Initialization, reset, a changed target and resuming after a velocity
override clear position PID history. Repeating the same active target preserves it.
Platform translation shares gains across independent world-frame X/Y histories
on omni/mecanum bases; differential bases use distance and bearing while
approaching, then switch to final heading. Heading derivatives wrap at +/-pi.
Entering tolerance clears the corresponding PID history and requests zero speed.

## Velocity tuning after firmware 2.3.1

Motor and platform wheel velocity PID now use direct `PWM = P + I + D`,
saturation anti-windup, and a corrected derivative filter. Retune velocity gains
from earlier firmware before tuning position control. The velocity **Integral
contribution limit (% PWM)** accepts 0-100; zero disables I. Previously zero
removed the integral bound. A limit of 30 means the integral term contributes
at most +/-30 PWM percentage points, not 30 rad/s. Total PWM remains bounded
to +/-100%. Position integral limits continue to use rad/s or m/s (deg/s in
the UI when selected), and changing display units never changes the firmware's velocity PID gains.

For firmware 2.3.1 and later protocol-2 releases, both pages start with Kp=1,
Ki=1, Kd=0 and integral limit=100. This allows I to supply the full motor output
at zero speed error; total PWM remains capped at +/-100% with anti-windup.
Earlier or unidentified firmware retains the
old defaults. These are starting values that require tuning for the motor/load.
With Ki=0, a stationary motor and a 2.5 rad/s target, Kp=1 requests only 2.5%
PWM indefinitely; increasing the integral limit does nothing without Ki.
Ki=1 instead builds 2.5 PWM percentage points per second while that error
persists, until limited. Too small a limit can still prevent startup.
The UI explains when Ki or the integral limit disables integral action.
Click Initialize velocity controller to apply edited gains, then set the
velocity target again. Editing fields alone does not send motor commands.
