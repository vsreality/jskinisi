// Generated from tools/commands.json by tools/sdkgenerator.py. Do not edit.
export const SDK_VERSION = Object.freeze([2, 6, 0]);
export const PROTOCOL_VERSION = Object.freeze([2, 26, 0]);
export const GET_TEMPERATURE = 0x50;
export const GET_IMU = 0x51;
export const GET_MOTOR_CURRENT = 0x52;
export const GET_MOTOR_FAULTS = 0x53;
export const INITIALIZE_MOTOR = 0x01;
export const SET_MOTOR_SPEED = 0x02;
export const STOP_MOTOR = 0x03;
export const BRAKE_MOTOR = 0x04;
export const INITIALIZE_MOTOR_CONTROLLER = 0x05;
export const SET_MOTOR_TARGET_SPEED = 0x06;
export const RESET_MOTOR_CONTROLLER = 0x07;
export const GET_MOTOR_CONTROLLER_STATE = 0x08;
export const DELETE_MOTOR_CONTROLLER = 0x09;
export const SET_CONTROLLER_FREQUENCY = 0x0A;
export const GET_CONTROLLER_FREQUENCY = 0x0B;
export const INITIALIZE_ENCODER = 0x11;
export const GET_ENCODER_VALUE = 0x12;
export const START_ENCODER_ODOMETRY = 0x13;
export const RESET_ENCODER_ODOMETRY = 0x14;
export const STOP_ENCODER_ODOMETRY = 0x15;
export const GET_ENCODER_ODOMETRY = 0x16;
export const SET_ODOMETRY_FREQUENCY = 0x17;
export const GET_ODOMETRY_FREQUENCY = 0x18;
export const INITIALIZE_GPIO_PIN = 0x20;
export const SET_GPIO_PIN_STATE = 0x21;
export const GET_GPIO_PIN_STATE = 0x22;
export const TOGGLE_GPIO_PIN_STATE = 0x23;
export const SET_STATUS_LED_STATE = 0x25;
export const TOGGLE_STATUS_LED_STATE = 0x26;
export const INITIALIZE_MECANUM_PLATFORM = 0x30;
export const INITIALIZE_OMNI_PLATFORM = 0x31;
export const INITIALIZE_DIFFERENTIAL_PLATFORM = 0x32;
export const SET_PLATFORM_VELOCITY = 0x40;
export const START_PLATFORM_CONTROLLER = 0x41;
export const SET_PLATFORM_TARGET_VELOCITY = 0x42;
export const GET_PLATFORM_CURRENT_VELOCITY = 0x43;
export const STOP_PLATFORM_CONTROLLER = 0x44;
export const START_PLATFORM_ODOMETRY = 0x45;
export const RESET_PLATFORM_ODOMETRY = 0x46;
export const STOP_PLATFORM_ODOMETRY = 0x47;
export const GET_PLATFORM_ODOMETRY = 0x48;
export const BRAKE_PLATFORM = 0x49;
export const COAST_PLATFORM = 0x4A;
export const INIT = 0x70;
export const ERROR = 0x7F;
export const TIME_SYNC_REQUEST = 0x71;
export const TIME_SYNC_RESPONSE = 0x72;
export const READY = 0x73;
export const SET_TIME_SYNC_INTERVAL = 0x74;
export const GET_TIME_STATUS = 0x75;
export const PING = 0x76;
export const SET_HEARTBEAT_CONFIG = 0x77;
export const GET_HEARTBEAT_CONFIG = 0x78;
/** @deprecated Retired since protocol 2.6.0. Use SUBSCRIBE. Kept for compatibility; eligible for removal in protocol 3.0.0. */
export const SUBSCRIBE_ODOMETRY = 0x79;
/** @deprecated Retired since protocol 2.6.0. Use UNSUBSCRIBE. Kept for compatibility; eligible for removal in protocol 3.0.0. */
export const UNSUBSCRIBE_ODOMETRY = 0x7a;
/** @deprecated Retired since protocol 2.6.0. Use TELEMETRY_EVENT. Kept for compatibility; eligible for removal in protocol 3.0.0. */
export const ENCODER_ODOMETRY_EVENT = 0x7b;
/** @deprecated Retired since protocol 2.6.0. Use TELEMETRY_EVENT. Kept for compatibility; eligible for removal in protocol 3.0.0. */
export const PLATFORM_ODOMETRY_EVENT = 0x7c;
export const POLL_TELEMETRY = 0x7d;
export const INITIALIZE_MOTOR_POSITION_CONTROLLER = 0x0C;
export const RESET_MOTOR_POSITION = 0x0D;
export const SET_MOTOR_POSITION = 0x0E;
export const GET_MOTOR_POSITION = 0x0F;
export const INITIALIZE_PLATFORM_POSITION_CONTROLLER = 0x4B;
export const RESET_PLATFORM_POSITION = 0x4C;
export const SET_PLATFORM_POSITION = 0x4D;
export const INITIALIZE_MOTOR_POSITION_PID_CONTROLLER = 0x10;
export const INITIALIZE_PLATFORM_POSITION_PID_CONTROLLER = 0x4E;
export const SUBSCRIBE = 0x80;
export const UNSUBSCRIBE = 0x81;
export const TELEMETRY_EVENT = 0x82;
export const SUBSCRIBE_WITH_MODE = 0x83;
export const CLEAR_MOTOR_FAULTS = 0x54;
export const GET_MOTOR_CURRENT_LIMIT = 0x55;
export const SET_MOTOR_CURRENT_LIMIT = 0x56;
export const SUBSCRIBE_CONFIGURED = 0x84;
export const GET_PWM_FREQUENCY = 0x57;
export const SET_PWM_FREQUENCY = 0x58;
export const SAVE_CONFIGURATION = 0x59;
export const GET_CONFIGURATION_FIELD = 0x5A;
export const SET_DRIVER_SLEEP = 0x5B;
export const GET_DRIVER_SLEEP = 0x5C;
export const SET_BOARD_IDLE = 0x5D;
export const GET_BOARD_IDLE = 0x5E;
export const SET_FUSION_EXPERIMENT = 0x5f;
export const GET_FUSION_STATUS = 0x60;
export const GET_FUSION_VECTOR = 0x61;
export const GET_FUSION_CONFIGURATION = 0x62;
export const SET_IMU_TRACKING = 0x63;
export const GET_IMU_TRACKING_STATUS = 0x64;
export const GET_IMU_TRACKING_VECTOR = 0x65;
export const GET_IMU_TRACKING_CONFIGURATION = 0x66;
export const SET_FEEDBACK_SOURCE = 0x67;
export const GET_FEEDBACK_SOURCE_STATUS = 0x68;
export const GET_FEEDBACK_SOURCE_VECTOR = 0x69;
export const SET_FEEDBACK_FUSION_MOUNT = 0x6a;
export const GET_FEEDBACK_FUSION_MOUNT = 0x6b;
export const GET_FEEDBACK_SOURCE_HEALTH = 0x6c;
export const GET_FEEDBACK_IMU_CHANNELS = 0x6d;
export const SET_IMU_MOUNT = 0x6e;
export const GET_IMU_MOUNT = 0x6f;
export const SET_BOARD_MOUNT = 0x85;
export const GET_BOARD_MOUNT = 0x86;
export const INITIALIZE_MECANUM_PLATFORM_ORIENTED = 0x87;
export const INITIALIZE_OMNI_PLATFORM_ORIENTED = 0x88;
export const ErrorCode = Object.freeze({
  INCOMPATIBLE_PROTOCOL: 1,
  INVALID_ARGUMENT: 2,
  UNKNOWN_COMMAND: 3,
  INVALID_LENGTH: 4,
  MOTOR_OWNED: 5,
  INTERNAL_ERROR: 6,
  CLOCK_NOT_READY: 7,
  TIME_SYNC_FAILED: 8,
  ODOMETRY_NOT_INITIALIZED: 9,
  SAMPLE_NOT_AVAILABLE: 10,
  ENCODER_NOT_INITIALIZED: 11,
  PLATFORM_NOT_INITIALIZED: 12,
  MOTOR_NOT_INITIALIZED: 13,
  CONTROLLER_NOT_INITIALIZED: 14,
  INIT_REQUIRED: 15,
  SENSOR_NOT_AVAILABLE: 16,
  SUBSCRIPTION_LIMIT: 17,
  SAMPLE_OUT_OF_RANGE: 18,
  DRIVERS_ASLEEP: 19,
  BOARD_IDLE: 20,
  SOURCE_SWITCH_UNSAFE: 21,
});
export const ErrorDescriptions = Object.freeze({
  1: "The requested protocol version is incompatible with this firmware.",
  2: "A field is invalid, out of range, or inconsistent with the pending request.",
  3: "The received command ID is not accepted by the controller.",
  4: "The complete message has an invalid header or payload length.",
  5: "The motor belongs to a platform; use the corresponding platform command.",
  6: "The controller could not execute or encode the operation. During motor initialization, possible causes include missing motor power, a driver communication failure, or a faulty driver.",
  7: "Initial clock setup is incomplete; wait for READY. Uptime mode also supports READY.",
  8: "Initial time sync exhausted its attempts without a valid sample.",
  9: "Odometry is not running; start odometry before requesting a measurement.",
  10: "The requested measurement is not ready yet, including after initialization or reset; retry after an update.",
  11: "Initialize the encoder before reading it or starting encoder odometry.",
  12: "Initialize a platform before performing this operation.",
  13: "Initialize the motor before setting its speed.",
  14: "Start or initialize the closed-loop controller before setting its target.",
  15: "Send a valid INIT request before performing this connection-dependent operation.",
  16: "The selected sensor is not defined on this board.",
  17: "This connection has no free subscription slots; unsubscribe an existing source first.",
  18: "The sensor reading is saturated; no valid measurement can be returned.",
  19: "Driver sleep is active. Explicitly wake the drivers before requesting this operation.",
  20: "Board idle is active. Explicitly wake the board before changing driver sleep or starting a subscription.",
  21: "Stop all motor outputs, disarm all controllers and wait for stationary wheel observations before changing the tracking preference.",
});
/** A response for a different producer cannot describe the requested source. */
export class FeedbackSourceMismatchError extends Error {
  constructor(requested, received) {
    super(`Expected health for feedback source ${requested}, received ${received}`);
    this.name = 'FeedbackSourceMismatchError';
    this.requested = requested;
    this.received = received;
  }
}
/** Preserve uint64/int64 precision instead of silently accepting rounded Numbers. */
function exactBigInt(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new TypeError('64-bit values require a bigint or a safe integer');
  return BigInt(value);
}
/** Decode exactly one payload, respecting typed-array offsets. */
function payloadView(buffer, size) {
  if (!buffer || buffer.byteLength !== size) throw new Error(`Expected ${size} payload bytes, received ${buffer?.byteLength ?? 0}`);
  return ArrayBuffer.isView(buffer)
    ? new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new DataView(buffer);
}
export const SubscriptionTrigger = Object.freeze({
  PERIODIC: 0,
  ON_EVENT: 1,
});
export const SubscriptionDelivery = Object.freeze({
  ALL: 0,
  ON_CHANGE: 1,
});
export const PwmFrequency = Object.freeze({
  KHZ_10: 10000,
  KHZ_20: 20000,
  KHZ_25: 25000,
  KHZ_50: 50000,
  KHZ_100: 100000,
});
export const MecanumRollerOrientation = Object.freeze({
  STANDARD: 0,
  MIRRORED: 1,
});
export const OmniWheelOrientation = Object.freeze({
  REAR: 0,
  FRONT: 1,
});
export const FusionMode = Object.freeze({
  LEGACY_ENCODER: 0,
  ENCODER_CORRECTION: 1,
  FUSED: 2,
});
export const FusionHealth = Object.freeze({
  DISABLED: 0,
  WAITING: 1,
  HEALTHY: 2,
  FAULT: 3,
});
export const FusionFault = Object.freeze({
  NONE: 0,
  MOUNT_INVALID: 1,
  ENCODER_UNAVAILABLE: 2,
  IMU_UNAVAILABLE: 3,
  STALE: 4,
  TIMESTAMP: 5,
  SATURATION: 6,
  BIAS_NOT_READY: 7,
  DISCONTINUITY: 8,
  INHIBITED: 9,
});
export const FusionFlag = Object.freeze({
  ESTIMATE_VALID: 1,
  BIAS_READY: 2,
  FRESH_TARGET_REQUIRED: 4,
  CORRECTION_ACTIVE: 8,
});
export const FusionVectorKind = Object.freeze({
  ENCODER_POSE: 0,
  ENCODER_TWIST: 1,
  FUSED_POSE: 2,
  FUSED_TWIST: 3,
  BIAS: 4,
});
export const ImuTrackingAction = Object.freeze({
  START: 0,
  STOP: 1,
  RESET: 2,
  RECALIBRATE: 3,
});
export const ImuTrackingState = Object.freeze({
  STOPPED: 0,
  CALIBRATING: 1,
  TRACKING: 2,
  FAULT: 3,
  EXPIRED: 4,
});
export const ImuTrackingFault = Object.freeze({
  NONE: 0,
  NOT_STATIONARY: 1,
  IMU_UNAVAILABLE: 2,
  STALE: 3,
  TIMESTAMP: 4,
  SATURATION: 5,
  BIAS_NOT_READY: 6,
  WINDOW_EXPIRED: 7,
  INHIBITED: 8,
  MOUNT_INVALID: 9,
});
export const ImuTrackingFlag = Object.freeze({
  ESTIMATE_VALID: 1,
  BIAS_READY: 2,
  RESTART_REQUIRED: 4,
  MOUNT_CONFIRMED: 8,
});
export const ImuTrackingVectorKind = Object.freeze({
  POSE: 0,
  TWIST: 1,
  BIAS: 2,
});
export const FeedbackSource = Object.freeze({
  ENCODER: 0,
  IMU_ONLY: 1,
  FUSED: 2,
  NONE: 255,
});
export const FeedbackSourceReason = Object.freeze({
  OK: 0,
  NOT_STARTED: 1,
  CALIBRATING: 2,
  UNAVAILABLE: 3,
  STALE: 4,
  EXPIRED: 5,
  FAULT: 6,
  INHIBITED: 7,
  WAITING_SAMPLE: 8,
  MOUNT_REQUIRED: 9,
});
export const FeedbackSourceVectorKind = Object.freeze({
  POSE: 0,
  TWIST: 1,
});
export const FeedbackSourceHealthState = Object.freeze({
  HEALTHY: 0,
  SUSPECT: 1,
  UNAVAILABLE: 2,
  INDETERMINATE: 3,
});
export const FeedbackSourceHealthFlag = Object.freeze({
  PROVENANCE: 1,
  FRESH: 2,
  DISAGREEMENT: 4,
  COMPARISON_AVAILABLE: 8,
  RECOVERING: 16,
  RESTART_REQUIRED: 32,
  TIMESTAMP_FAULT: 64,
  SATURATION: 128,
});
export const SubscriptionMode = Object.freeze({
  PERIODIC: 0,
  ON_CHANGE: 1,
});

/** The state of the controller for the specified motor. */
export class MotorControllerState {
  /** Store one decoded payload. */
  constructor(motor_index, kp, ki, kd, target_speed, current_speed, error, output) {
    this.motor_index = motor_index;
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.target_speed = target_speed;
    this.current_speed = current_speed;
    this.error = error;
    this.output = output;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 57; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(MotorControllerState.getSize());
    const view = new DataView(buffer);
    view.setInt8(0, this.motor_index);
    view.setFloat64(1, this.kp, true);
    view.setFloat64(9, this.ki, true);
    view.setFloat64(17, this.kd, true);
    view.setFloat64(25, this.target_speed, true);
    view.setFloat64(33, this.current_speed, true);
    view.setFloat64(41, this.error, true);
    view.setFloat64(49, this.output, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, MotorControllerState.getSize());
    return new MotorControllerState(
      view.getInt8(0),
      view.getFloat64(1, true),
      view.getFloat64(9, true),
      view.getFloat64(17, true),
      view.getFloat64(25, true),
      view.getFloat64(33, true),
      view.getFloat64(41, true),
      view.getFloat64(49, true),
    );
  }
}

/** The velocity of the platform in meters per second. */
export class PlatformVelocity {
  /** Store one decoded payload. */
  constructor(x, y, t) {
    this.x = x;
    this.y = y;
    this.t = t;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 24; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(PlatformVelocity.getSize());
    const view = new DataView(buffer);
    view.setFloat64(0, this.x, true);
    view.setFloat64(8, this.y, true);
    view.setFloat64(16, this.t, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, PlatformVelocity.getSize());
    return new PlatformVelocity(
      view.getFloat64(0, true),
      view.getFloat64(8, true),
      view.getFloat64(16, true),
    );
  }
}

/** The odometry of the platform in meters and radians. */
export class PlatformOdometry {
  /** Store one decoded payload. */
  constructor(x, y, t) {
    this.x = x;
    this.y = y;
    this.t = t;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 24; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(PlatformOdometry.getSize());
    const view = new DataView(buffer);
    view.setFloat64(0, this.x, true);
    view.setFloat64(8, this.y, true);
    view.setFloat64(16, this.t, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, PlatformOdometry.getSize());
    return new PlatformOdometry(
      view.getFloat64(0, true),
      view.getFloat64(8, true),
      view.getFloat64(16, true),
    );
  }
}

/** Packed 15-byte INIT response; firmware build ID is a Git revision, not a semantic release version. */
export class InitResponse {
  /** Store one decoded payload. */
  constructor(board_model, board_major, board_minor, board_patch, protocol_major, protocol_minor, protocol_patch, firmware_build_high, firmware_build_low) {
    this.board_model = board_model;
    this.board_major = board_major;
    this.board_minor = board_minor;
    this.board_patch = board_patch;
    this.protocol_major = protocol_major;
    this.protocol_minor = protocol_minor;
    this.protocol_patch = protocol_patch;
    this.firmware_build_high = firmware_build_high;
    this.firmware_build_low = firmware_build_low;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 15; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(InitResponse.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.board_model);
    view.setUint8(1, this.board_major);
    view.setUint8(2, this.board_minor);
    view.setUint8(3, this.board_patch);
    view.setUint8(4, this.protocol_major);
    view.setUint8(5, this.protocol_minor);
    view.setUint8(6, this.protocol_patch);
    view.setUint32(7, this.firmware_build_high, true);
    view.setUint32(11, this.firmware_build_low, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, InitResponse.getSize());
    return new InitResponse(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
      view.getUint8(4),
      view.getUint8(5),
      view.getUint8(6),
      view.getUint32(7, true),
      view.getUint32(11, true),
    );
  }
}

/** Per-connection clock status. */
export class TimeStatus {
  /** Store one decoded payload. */
  constructor(clock_mode, clock_quality, interval_ms, last_sync_age_us) {
    this.clock_mode = clock_mode;
    this.clock_quality = clock_quality;
    this.interval_ms = interval_ms;
    this.last_sync_age_us = last_sync_age_us;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 14; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(TimeStatus.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.clock_mode);
    view.setUint8(1, this.clock_quality);
    view.setUint32(2, this.interval_ms, true);
    view.setBigUint64(6, exactBigInt(this.last_sync_age_us), true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, TimeStatus.getSize());
    return new TimeStatus(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint32(2, true),
      view.getBigUint64(6, true),
    );
  }
}

/** Odometry state with controller-captured timestamp and clock metadata. */
export class EncoderOdometrySample {
  /** Store one decoded payload. */
  constructor(timestamp_us, clock_mode, clock_quality, angle) {
    this.timestamp_us = timestamp_us;
    this.clock_mode = clock_mode;
    this.clock_quality = clock_quality;
    this.angle = angle;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 18; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(EncoderOdometrySample.getSize());
    const view = new DataView(buffer);
    view.setBigUint64(0, exactBigInt(this.timestamp_us), true);
    view.setUint8(8, this.clock_mode);
    view.setUint8(9, this.clock_quality);
    view.setFloat64(10, this.angle, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, EncoderOdometrySample.getSize());
    return new EncoderOdometrySample(
      view.getBigUint64(0, true),
      view.getUint8(8),
      view.getUint8(9),
      view.getFloat64(10, true),
    );
  }
}

/** Odometry state with controller-captured timestamp and clock metadata. */
export class PlatformOdometrySample {
  /** Store one decoded payload. */
  constructor(timestamp_us, clock_mode, clock_quality, x, y, t) {
    this.timestamp_us = timestamp_us;
    this.clock_mode = clock_mode;
    this.clock_quality = clock_quality;
    this.x = x;
    this.y = y;
    this.t = t;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 34; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(PlatformOdometrySample.getSize());
    const view = new DataView(buffer);
    view.setBigUint64(0, exactBigInt(this.timestamp_us), true);
    view.setUint8(8, this.clock_mode);
    view.setUint8(9, this.clock_quality);
    view.setFloat64(10, this.x, true);
    view.setFloat64(18, this.y, true);
    view.setFloat64(26, this.t, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, PlatformOdometrySample.getSize());
    return new PlatformOdometrySample(
      view.getBigUint64(0, true),
      view.getUint8(8),
      view.getUint8(9),
      view.getFloat64(10, true),
      view.getFloat64(18, true),
      view.getFloat64(26, true),
    );
  }
}

/** Per-connection watchdog settings. */
export class HeartbeatConfig {
  /** Store one decoded payload. */
  constructor(enabled, timeout_ms) {
    this.enabled = enabled;
    this.timeout_ms = timeout_ms;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 5; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(HeartbeatConfig.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.enabled);
    view.setUint32(1, this.timeout_ms, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, HeartbeatConfig.getSize());
    return new HeartbeatConfig(
      Boolean(view.getUint8(0)),
      view.getUint32(1, true),
    );
  }
}

/** Latest independent accelerometer and gyroscope samples in sensor axes. */
export class ImuSample {
  /** Store one decoded payload. */
  constructor(acceleration_x, acceleration_y, acceleration_z, angular_velocity_x, angular_velocity_y, angular_velocity_z) {
    this.acceleration_x = acceleration_x;
    this.acceleration_y = acceleration_y;
    this.acceleration_z = acceleration_z;
    this.angular_velocity_x = angular_velocity_x;
    this.angular_velocity_y = angular_velocity_y;
    this.angular_velocity_z = angular_velocity_z;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 48; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(ImuSample.getSize());
    const view = new DataView(buffer);
    view.setFloat64(0, this.acceleration_x, true);
    view.setFloat64(8, this.acceleration_y, true);
    view.setFloat64(16, this.acceleration_z, true);
    view.setFloat64(24, this.angular_velocity_x, true);
    view.setFloat64(32, this.angular_velocity_y, true);
    view.setFloat64(40, this.angular_velocity_z, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, ImuSample.getSize());
    return new ImuSample(
      view.getFloat64(0, true),
      view.getFloat64(8, true),
      view.getFloat64(16, true),
      view.getFloat64(24, true),
      view.getFloat64(32, true),
      view.getFloat64(40, true),
    );
  }
}

/** Timestamped temperature register reading in degrees Celsius. */
export class TemperatureSample {
  /** Store one decoded payload. */
  constructor(timestamp_us, clock_mode, clock_quality, celsius) {
    this.timestamp_us = timestamp_us;
    this.clock_mode = clock_mode;
    this.clock_quality = clock_quality;
    this.celsius = celsius;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 18; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(TemperatureSample.getSize());
    const view = new DataView(buffer);
    view.setBigUint64(0, exactBigInt(this.timestamp_us), true);
    view.setUint8(8, this.clock_mode);
    view.setUint8(9, this.clock_quality);
    view.setFloat64(10, this.celsius, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, TemperatureSample.getSize());
    return new TemperatureSample(
      view.getBigUint64(0, true),
      view.getUint8(8),
      view.getUint8(9),
      view.getFloat64(10, true),
    );
  }
}

/** Timestamped IMU register reading. Acceleration and angular velocity are not synchronized with each other. */
export class ImuTelemetrySample {
  /** Store one decoded payload. */
  constructor(timestamp_us, clock_mode, clock_quality, acceleration_x, acceleration_y, acceleration_z, angular_velocity_x, angular_velocity_y, angular_velocity_z) {
    this.timestamp_us = timestamp_us;
    this.clock_mode = clock_mode;
    this.clock_quality = clock_quality;
    this.acceleration_x = acceleration_x;
    this.acceleration_y = acceleration_y;
    this.acceleration_z = acceleration_z;
    this.angular_velocity_x = angular_velocity_x;
    this.angular_velocity_y = angular_velocity_y;
    this.angular_velocity_z = angular_velocity_z;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 58; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(ImuTelemetrySample.getSize());
    const view = new DataView(buffer);
    view.setBigUint64(0, exactBigInt(this.timestamp_us), true);
    view.setUint8(8, this.clock_mode);
    view.setUint8(9, this.clock_quality);
    view.setFloat64(10, this.acceleration_x, true);
    view.setFloat64(18, this.acceleration_y, true);
    view.setFloat64(26, this.acceleration_z, true);
    view.setFloat64(34, this.angular_velocity_x, true);
    view.setFloat64(42, this.angular_velocity_y, true);
    view.setFloat64(50, this.angular_velocity_z, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, ImuTelemetrySample.getSize());
    return new ImuTelemetrySample(
      view.getBigUint64(0, true),
      view.getUint8(8),
      view.getUint8(9),
      view.getFloat64(10, true),
      view.getFloat64(18, true),
      view.getFloat64(26, true),
      view.getFloat64(34, true),
      view.getFloat64(42, true),
      view.getFloat64(50, true),
    );
  }
}

/** Timestamped filtered motor-current estimate. */
export class MotorCurrentSample {
  /** Store one decoded payload. */
  constructor(timestamp_us, clock_mode, clock_quality, amps) {
    this.timestamp_us = timestamp_us;
    this.clock_mode = clock_mode;
    this.clock_quality = clock_quality;
    this.amps = amps;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 18; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(MotorCurrentSample.getSize());
    const view = new DataView(buffer);
    view.setBigUint64(0, exactBigInt(this.timestamp_us), true);
    view.setUint8(8, this.clock_mode);
    view.setUint8(9, this.clock_quality);
    view.setFloat64(10, this.amps, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, MotorCurrentSample.getSize());
    return new MotorCurrentSample(
      view.getBigUint64(0, true),
      view.getUint8(8),
      view.getUint8(9),
      view.getFloat64(10, true),
    );
  }
}

/** Motor-driver diagnostic status. Ignore detailed flags when status_valid is false; a clear fault input alone does not establish driver health. */
export class MotorFaultStatus {
  /** Store one decoded payload. */
  constructor(sleep_requested, status_valid, fault_active, overtemperature_warning, undervoltage, charge_pump_undervoltage, overcurrent, overtemperature_shutdown, open_load, current_regulation) {
    this.sleep_requested = sleep_requested;
    this.status_valid = status_valid;
    this.fault_active = fault_active;
    this.overtemperature_warning = overtemperature_warning;
    this.undervoltage = undervoltage;
    this.charge_pump_undervoltage = charge_pump_undervoltage;
    this.overcurrent = overcurrent;
    this.overtemperature_shutdown = overtemperature_shutdown;
    this.open_load = open_load;
    this.current_regulation = current_regulation;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 10; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(MotorFaultStatus.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.sleep_requested);
    view.setUint8(1, this.status_valid);
    view.setUint8(2, this.fault_active);
    view.setUint8(3, this.overtemperature_warning);
    view.setUint8(4, this.undervoltage);
    view.setUint8(5, this.charge_pump_undervoltage);
    view.setUint8(6, this.overcurrent);
    view.setUint8(7, this.overtemperature_shutdown);
    view.setUint8(8, this.open_load);
    view.setUint8(9, this.current_regulation);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, MotorFaultStatus.getSize());
    if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].some(offset => view.getUint8(offset) > 1)) throw new Error('Invalid motor fault flags');
    return new MotorFaultStatus(
      Boolean(view.getUint8(0)),
      Boolean(view.getUint8(1)),
      Boolean(view.getUint8(2)),
      Boolean(view.getUint8(3)),
      Boolean(view.getUint8(4)),
      Boolean(view.getUint8(5)),
      Boolean(view.getUint8(6)),
      Boolean(view.getUint8(7)),
      Boolean(view.getUint8(8)),
      Boolean(view.getUint8(9)),
    );
  }
}

/** Timestamped motor-driver diagnostic status. Timestamp marks completion of the read; faults can be latched rather than new events. */
export class MotorFaultSample {
  /** Store one decoded payload. */
  constructor(timestamp_us, clock_mode, clock_quality, sleep_requested, status_valid, fault_active, overtemperature_warning, undervoltage, charge_pump_undervoltage, overcurrent, overtemperature_shutdown, open_load, current_regulation) {
    this.timestamp_us = timestamp_us;
    this.clock_mode = clock_mode;
    this.clock_quality = clock_quality;
    this.sleep_requested = sleep_requested;
    this.status_valid = status_valid;
    this.fault_active = fault_active;
    this.overtemperature_warning = overtemperature_warning;
    this.undervoltage = undervoltage;
    this.charge_pump_undervoltage = charge_pump_undervoltage;
    this.overcurrent = overcurrent;
    this.overtemperature_shutdown = overtemperature_shutdown;
    this.open_load = open_load;
    this.current_regulation = current_regulation;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 20; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(MotorFaultSample.getSize());
    const view = new DataView(buffer);
    view.setBigUint64(0, exactBigInt(this.timestamp_us), true);
    view.setUint8(8, this.clock_mode);
    view.setUint8(9, this.clock_quality);
    view.setUint8(10, this.sleep_requested);
    view.setUint8(11, this.status_valid);
    view.setUint8(12, this.fault_active);
    view.setUint8(13, this.overtemperature_warning);
    view.setUint8(14, this.undervoltage);
    view.setUint8(15, this.charge_pump_undervoltage);
    view.setUint8(16, this.overcurrent);
    view.setUint8(17, this.overtemperature_shutdown);
    view.setUint8(18, this.open_load);
    view.setUint8(19, this.current_regulation);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, MotorFaultSample.getSize());
    if ([10, 11, 12, 13, 14, 15, 16, 17, 18, 19].some(offset => view.getUint8(offset) > 1)) throw new Error('Invalid motor fault flags');
    return new MotorFaultSample(
      view.getBigUint64(0, true),
      view.getUint8(8),
      view.getUint8(9),
      Boolean(view.getUint8(10)),
      Boolean(view.getUint8(11)),
      Boolean(view.getUint8(12)),
      Boolean(view.getUint8(13)),
      Boolean(view.getUint8(14)),
      Boolean(view.getUint8(15)),
      Boolean(view.getUint8(16)),
      Boolean(view.getUint8(17)),
      Boolean(view.getUint8(18)),
      Boolean(view.getUint8(19)),
    );
  }
}

/** Applied nominal hardware current-regulation setting. */
export class MotorCurrentLimit {
  /** Store one decoded payload. */
  constructor(enabled, threshold_ma) {
    this.enabled = enabled;
    this.threshold_ma = threshold_ma;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 3; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(MotorCurrentLimit.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.enabled);
    view.setUint16(1, this.threshold_ma, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, MotorCurrentLimit.getSize());
    if (view.getUint8(0) > 1 || view.getUint16(1, true) === 0) throw new Error('Invalid current-limit setting');
    return new MotorCurrentLimit(
      Boolean(view.getUint8(0)),
      view.getUint16(1, true),
    );
  }
}

/** Volatile v0.4 fusion experiment diagnostics; see command descriptions. */
export class FusionStatus {
  /** Store one decoded payload. */
  constructor(mode, health, fault, flags, sequence, timestamp_us, accel_age_us, gyro_age_us, encoder_age_us) {
    this.mode = mode;
    this.health = health;
    this.fault = fault;
    this.flags = flags;
    this.sequence = sequence;
    this.timestamp_us = timestamp_us;
    this.accel_age_us = accel_age_us;
    this.gyro_age_us = gyro_age_us;
    this.encoder_age_us = encoder_age_us;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 28; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(FusionStatus.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.mode);
    view.setUint8(1, this.health);
    view.setUint8(2, this.fault);
    view.setUint8(3, this.flags);
    view.setUint32(4, this.sequence, true);
    view.setBigUint64(8, exactBigInt(this.timestamp_us), true);
    view.setUint32(16, this.accel_age_us, true);
    view.setUint32(20, this.gyro_age_us, true);
    view.setUint32(24, this.encoder_age_us, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, FusionStatus.getSize());
    return new FusionStatus(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
      view.getUint32(4, true),
      view.getBigUint64(8, true),
      view.getUint32(16, true),
      view.getUint32(20, true),
      view.getUint32(24, true),
    );
  }
}

/** Volatile v0.4 fusion experiment diagnostics; see command descriptions. */
export class FusionVector {
  /** Store one decoded payload. */
  constructor(sequence, x, y, z) {
    this.sequence = sequence;
    this.x = x;
    this.y = y;
    this.z = z;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 28; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(FusionVector.getSize());
    const view = new DataView(buffer);
    view.setUint32(0, this.sequence, true);
    view.setFloat64(4, this.x, true);
    view.setFloat64(12, this.y, true);
    view.setFloat64(20, this.z, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, FusionVector.getSize());
    return new FusionVector(
      view.getUint32(0, true),
      view.getFloat64(4, true),
      view.getFloat64(12, true),
      view.getFloat64(20, true),
    );
  }
}

/** Volatile v0.4 fusion experiment diagnostics; see command descriptions. */
export class FusionConfiguration {
  /** Store one decoded payload. */
  constructor(mode, mounting_yaw_rad) {
    this.mode = mode;
    this.mounting_yaw_rad = mounting_yaw_rad;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 9; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(FusionConfiguration.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.mode);
    view.setFloat64(1, this.mounting_yaw_rad, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, FusionConfiguration.getSize());
    return new FusionConfiguration(
      view.getUint8(0),
      view.getFloat64(1, true),
    );
  }
}

/** Volatile IMU-only relative tracking diagnostics. */
export class ImuTrackingStatus {
  /** Store one decoded payload. */
  constructor(state, fault, flags, reserved, sequence, timestamp_us, elapsed_us, accel_age_us, gyro_age_us) {
    this.state = state;
    this.fault = fault;
    this.flags = flags;
    this.reserved = reserved;
    this.sequence = sequence;
    this.timestamp_us = timestamp_us;
    this.elapsed_us = elapsed_us;
    this.accel_age_us = accel_age_us;
    this.gyro_age_us = gyro_age_us;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 28; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(ImuTrackingStatus.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.state);
    view.setUint8(1, this.fault);
    view.setUint8(2, this.flags);
    view.setUint8(3, this.reserved);
    view.setUint32(4, this.sequence, true);
    view.setBigUint64(8, exactBigInt(this.timestamp_us), true);
    view.setUint32(16, this.elapsed_us, true);
    view.setUint32(20, this.accel_age_us, true);
    view.setUint32(24, this.gyro_age_us, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, ImuTrackingStatus.getSize());
    return new ImuTrackingStatus(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
      view.getUint32(4, true),
      view.getBigUint64(8, true),
      view.getUint32(16, true),
      view.getUint32(20, true),
      view.getUint32(24, true),
    );
  }
}

/** Volatile IMU-only relative tracking diagnostics. */
export class ImuTrackingVector {
  /** Store one decoded payload. */
  constructor(sequence, x, y, z) {
    this.sequence = sequence;
    this.x = x;
    this.y = y;
    this.z = z;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 28; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(ImuTrackingVector.getSize());
    const view = new DataView(buffer);
    view.setUint32(0, this.sequence, true);
    view.setFloat64(4, this.x, true);
    view.setFloat64(12, this.y, true);
    view.setFloat64(20, this.z, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, ImuTrackingVector.getSize());
    return new ImuTrackingVector(
      view.getUint32(0, true),
      view.getFloat64(4, true),
      view.getFloat64(12, true),
      view.getFloat64(20, true),
    );
  }
}

/** Volatile IMU-only relative tracking diagnostics. */
export class ImuTrackingConfiguration {
  /** Store one decoded payload. */
  constructor(mounting_yaw_rad, window_us) {
    this.mounting_yaw_rad = mounting_yaw_rad;
    this.window_us = window_us;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 12; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(ImuTrackingConfiguration.getSize());
    const view = new DataView(buffer);
    view.setFloat64(0, this.mounting_yaw_rad, true);
    view.setUint32(8, this.window_us, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, ImuTrackingConfiguration.getSize());
    return new ImuTrackingConfiguration(
      view.getFloat64(0, true),
      view.getUint32(8, true),
    );
  }
}

/** Board-wide selected tracking telemetry status. */
export class FeedbackSourceStatus {
  /** Store one decoded payload. */
  constructor(requested, active, valid, reason, sequence, timestamp_us, origin_id, source_detail, age_us, max_age_ms) {
    this.requested = requested;
    this.active = active;
    this.valid = valid;
    this.reason = reason;
    this.sequence = sequence;
    this.timestamp_us = timestamp_us;
    this.origin_id = origin_id;
    this.source_detail = source_detail;
    this.age_us = age_us;
    this.max_age_ms = max_age_ms;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 27; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(FeedbackSourceStatus.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.requested);
    view.setUint8(1, this.active);
    view.setUint8(2, this.valid);
    view.setUint8(3, this.reason);
    view.setUint32(4, this.sequence, true);
    view.setBigUint64(8, exactBigInt(this.timestamp_us), true);
    view.setUint32(16, this.origin_id, true);
    view.setUint8(20, this.source_detail);
    view.setUint32(21, this.age_us, true);
    view.setUint16(25, this.max_age_ms, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, FeedbackSourceStatus.getSize());
    return new FeedbackSourceStatus(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
      view.getUint32(4, true),
      view.getBigUint64(8, true),
      view.getUint32(16, true),
      view.getUint8(20),
      view.getUint32(21, true),
      view.getUint16(25, true),
    );
  }
}

/** Selected source vector in the selector pose frame or native body twist frame. */
export class FeedbackSourceVector {
  /** Store one decoded payload. */
  constructor(sequence, x, y, z) {
    this.sequence = sequence;
    this.x = x;
    this.y = y;
    this.z = z;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 28; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(FeedbackSourceVector.getSize());
    const view = new DataView(buffer);
    view.setUint32(0, this.sequence, true);
    view.setFloat64(4, this.x, true);
    view.setFloat64(12, this.y, true);
    view.setFloat64(20, this.z, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, FeedbackSourceVector.getSize());
    return new FeedbackSourceVector(
      view.getUint32(0, true),
      view.getFloat64(4, true),
      view.getFloat64(12, true),
      view.getFloat64(20, true),
    );
  }
}

/** Passive tracking mount, independent of chassis control. */
export class FeedbackFusionMount {
  /** Store one decoded payload. */
  constructor(confirmed, mounting_yaw_rad) {
    this.confirmed = confirmed;
    this.mounting_yaw_rad = mounting_yaw_rad;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 9; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(FeedbackFusionMount.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.confirmed);
    view.setFloat64(1, this.mounting_yaw_rad, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, FeedbackFusionMount.getSize());
    return new FeedbackFusionMount(
      view.getUint8(0),
      view.getFloat64(1, true),
    );
  }
}

/** Read producer health independently of selector and control. ENCODER is the running platform encoder batch, IMU_ONLY is physical BMI088 pair availability independent of the one-second estimate, FUSED is the passive fused estimate. Disagreement indicates conflicting observations without assigning sensor blame. HEALTHY means directly usable data. Comparability is separate. Historical provenance remains readable during failure. Reconnect reads board state. */
export class FeedbackSourceHealth {
  /** Store one decoded payload. */
  constructor(source, health, reason, detail, flags, sequence, timestamp_us, age_us, max_age_us) {
    this.source = source;
    this.health = health;
    this.reason = reason;
    this.detail = detail;
    this.flags = flags;
    this.sequence = sequence;
    this.timestamp_us = timestamp_us;
    this.age_us = age_us;
    this.max_age_us = max_age_us;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 28; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(FeedbackSourceHealth.getSize());
    const view = new DataView(buffer);
    view.setUint8(0, this.source);
    view.setUint8(1, this.health);
    view.setUint8(2, this.reason);
    view.setUint8(3, this.detail);
    view.setUint32(4, this.flags, true);
    view.setUint32(8, this.sequence, true);
    view.setBigUint64(12, exactBigInt(this.timestamp_us), true);
    view.setUint32(20, this.age_us, true);
    view.setUint32(24, this.max_age_us, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, FeedbackSourceHealth.getSize());
    return new FeedbackSourceHealth(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
      view.getUint32(4, true),
      view.getUint32(8, true),
      view.getBigUint64(12, true),
      view.getUint32(20, true),
      view.getUint32(24, true),
    );
  }
}

/** Read independent last observed accelerometer and gyro acquisition times in board uptime microseconds. A timestamp of zero and age UINT32_MAX indicate no observed acquisition. These are physical source observations, independent of the finite IMU-only tracking window. A pair must meet the 35000 us age and 15000 us skew limits. */
export class FeedbackImuChannels {
  /** Store one decoded payload. */
  constructor(accel_timestamp_us, gyro_timestamp_us, accel_age_us, gyro_age_us) {
    this.accel_timestamp_us = accel_timestamp_us;
    this.gyro_timestamp_us = gyro_timestamp_us;
    this.accel_age_us = accel_age_us;
    this.gyro_age_us = gyro_age_us;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 24; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(FeedbackImuChannels.getSize());
    const view = new DataView(buffer);
    view.setBigUint64(0, exactBigInt(this.accel_timestamp_us), true);
    view.setBigUint64(8, exactBigInt(this.gyro_timestamp_us), true);
    view.setUint32(16, this.accel_age_us, true);
    view.setUint32(20, this.gyro_age_us, true);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, FeedbackImuChannels.getSize());
    return new FeedbackImuChannels(
      view.getBigUint64(0, true),
      view.getBigUint64(8, true),
      view.getUint32(16, true),
      view.getUint32(20, true),
    );
  }
}

/** Signed board orientation and displacement to the chip in chassis axes. */
export class ImuMountConfiguration {
  /** Store one decoded payload. */
  constructor(roll_cdeg, pitch_cdeg, yaw_cdeg, x_um, y_um, z_um, configured) {
    this.roll_cdeg = roll_cdeg;
    this.pitch_cdeg = pitch_cdeg;
    this.yaw_cdeg = yaw_cdeg;
    this.x_um = x_um;
    this.y_um = y_um;
    this.z_um = z_um;
    this.configured = configured;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 19; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(ImuMountConfiguration.getSize());
    const view = new DataView(buffer);
    view.setInt16(0, this.roll_cdeg, true);
    view.setInt16(2, this.pitch_cdeg, true);
    view.setInt16(4, this.yaw_cdeg, true);
    view.setInt32(6, this.x_um, true);
    view.setInt32(10, this.y_um, true);
    view.setInt32(14, this.z_um, true);
    view.setUint8(18, this.configured);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, ImuMountConfiguration.getSize());
    if (view.getInt16(0, true) < -18000 || view.getInt16(0, true) > 18000) throw new Error('Invalid mount roll_cdeg');
    if (view.getInt16(2, true) < -9000 || view.getInt16(2, true) > 9000) throw new Error('Invalid mount pitch_cdeg');
    if (view.getInt16(4, true) < -18000 || view.getInt16(4, true) > 18000) throw new Error('Invalid mount yaw_cdeg');
    if (view.getInt32(6, true) < -10031098 || view.getInt32(6, true) > 10031098) throw new Error('Invalid mount x_um');
    if (view.getInt32(10, true) < -10031098 || view.getInt32(10, true) > 10031098) throw new Error('Invalid mount y_um');
    if (view.getInt32(14, true) < -10031098 || view.getInt32(14, true) > 10031098) throw new Error('Invalid mount z_um');
    if (view.getUint8(18) > 1) throw new Error('Invalid mount configured flag');
    return new ImuMountConfiguration(
      view.getInt16(0, true),
      view.getInt16(2, true),
      view.getInt16(4, true),
      view.getInt32(6, true),
      view.getInt32(10, true),
      view.getInt32(14, true),
      Boolean(view.getUint8(18)),
    );
  }
}

/** Applied orientation and chassis-to-PCB underside-center displacement. */
export class BoardMountConfiguration {
  /** Store one decoded payload. */
  constructor(roll_cdeg, pitch_cdeg, yaw_cdeg, x_um, y_um, z_um, configured) {
    this.roll_cdeg = roll_cdeg;
    this.pitch_cdeg = pitch_cdeg;
    this.yaw_cdeg = yaw_cdeg;
    this.x_um = x_um;
    this.y_um = y_um;
    this.z_um = z_um;
    this.configured = configured;
  }
  /** Packed wire size; independent of JavaScript values. */
  static getSize() { return 19; }
  /** Encode a payload without a message header. */
  encode() {
    const buffer = new ArrayBuffer(BoardMountConfiguration.getSize());
    const view = new DataView(buffer);
    view.setInt16(0, this.roll_cdeg, true);
    view.setInt16(2, this.pitch_cdeg, true);
    view.setInt16(4, this.yaw_cdeg, true);
    view.setInt32(6, this.x_um, true);
    view.setInt32(10, this.y_um, true);
    view.setInt32(14, this.z_um, true);
    view.setUint8(18, this.configured);
    return buffer;
  }
  /** Decode an exact response payload. uint64 values remain bigint. */
  static decode(buffer) {
    const view = payloadView(buffer, BoardMountConfiguration.getSize());
    if (view.getInt16(0, true) < -18000 || view.getInt16(0, true) > 18000) throw new Error('Invalid mount roll_cdeg');
    if (view.getInt16(2, true) < -9000 || view.getInt16(2, true) > 9000) throw new Error('Invalid mount pitch_cdeg');
    if (view.getInt16(4, true) < -18000 || view.getInt16(4, true) > 18000) throw new Error('Invalid mount yaw_cdeg');
    if (view.getInt32(6, true) < -10031098 || view.getInt32(6, true) > 10031098) throw new Error('Invalid mount x_um');
    if (view.getInt32(10, true) < -10031098 || view.getInt32(10, true) > 10031098) throw new Error('Invalid mount y_um');
    if (view.getInt32(14, true) < -10031098 || view.getInt32(14, true) > 10031098) throw new Error('Invalid mount z_um');
    if (view.getUint8(18) > 1) throw new Error('Invalid mount configured flag');
    if (!view.getUint8(18) && new Uint8Array(view.buffer, view.byteOffset, 18).some(byte => byte !== 0)) throw new Error('Unexpected unconfigured board pose');
    return new BoardMountConfiguration(
      view.getInt16(0, true),
      view.getInt16(2, true),
      view.getInt16(4, true),
      view.getInt32(6, true),
      view.getInt32(10, true),
      view.getInt32(14, true),
      Boolean(view.getUint8(18)),
    );
  }
}

/** Stable uint8 telemetry topic enum. */
export const Topic = Object.freeze({
  ENCODER_ODOMETRY: 1,
  PLATFORM_ODOMETRY: 2,
  TEMPERATURE: 3,
  IMU: 4,
  MOTOR_CURRENT: 5,
  MOTOR_FAULTS: 6,
});
export const TopicDefinitions = Object.freeze({
  1: Object.freeze({ payloadType: EncoderOdometrySample, indexMax: 3, minIntervalMs: 2, eventSupported: false }),
  2: Object.freeze({ payloadType: PlatformOdometrySample, indexMax: 0, minIntervalMs: 2, eventSupported: false }),
  3: Object.freeze({ payloadType: TemperatureSample, indexMax: 255, minIntervalMs: 250, eventSupported: false }),
  4: Object.freeze({ payloadType: ImuTelemetrySample, indexMax: 255, minIntervalMs: 10, eventSupported: false }),
  5: Object.freeze({ payloadType: MotorCurrentSample, indexMax: 3, minIntervalMs: 20, eventSupported: false }),
  6: Object.freeze({ payloadType: MotorFaultSample, indexMax: 3, minIntervalMs: 100, eventSupported: true }),
});
/** Decode a topic-selected payload. Future unknown topics can be ignored by the session. */
export function decodeTelemetryEvent(payload) {
  const data = ArrayBuffer.isView(payload)
    ? new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength) : new Uint8Array(payload);
  if (data.length < 2) throw new Error('Truncated telemetry envelope');
  const [topic, index] = data;
  const definition = TopicDefinitions[topic];
  if (!definition) return null;
  if (index > definition.indexMax) throw new Error('Invalid telemetry index');
  const sample = definition.payloadType.decode(data.subarray(2));
  if (![0, 1].includes(sample.clock_mode) || ![1, 2].includes(sample.clock_quality) ||
      Object.values(sample).some(value => typeof value === 'number' && !Number.isFinite(value)))
    throw new Error('Invalid telemetry sample');
  if (topic === Topic.MOTOR_CURRENT && sample.amps < 0) throw new Error('Invalid motor current payload');
  return { topic, index, sample };
}

/** Generated user commands; session framing belongs to KinisiSession. */
export class Commands {
  /** Implemented by a transport session. */
  async _request(_command, _payload, _responseLength) { throw new Error("No protocol session"); }

  /** Read the latest board temperature in degrees Celsius. Sensor 0 is the TMP102 on v0.4. Sampling runs at 4 Hz; faster reads may repeat a sample. Returns SAMPLE_NOT_AVAILABLE during the first 300 ms after sensor initialization or recovery, SENSOR_NOT_AVAILABLE when the board has no such sensor, and INTERNAL_ERROR on I2C or configuration failure. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, SENSOR_NOT_AVAILABLE, SAMPLE_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_temperature(sensor_index) {
    if (!Number.isInteger(sensor_index) || sensor_index < 0 || sensor_index > 255) throw new RangeError('sensor_index must be an integer from 0 to 255');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, sensor_index);
    const response = await this._request(GET_TEMPERATURE, payload, 8);
    const view = payloadView(response, 8);
    const temperature = view.getFloat64(0, true);
    if (!Number.isFinite(temperature)) throw new Error('Invalid temperature payload');
    return temperature;
  }

  /** Read the latest accelerometer and gyroscope samples in native sensor axes. Acceleration is in m/s^2 and includes gravity; angular velocity is in rad/s. BMI088 uses +/-6 g and +/-500 degrees/s at 100 Hz. Each three-axis sample is coherent, but accel and gyro are not time-synchronized. Faster requests may repeat samples. No orientation or calibration is applied. Returns SAMPLE_NOT_AVAILABLE during the 50 ms settling interval after initialization or recovery, SENSOR_NOT_AVAILABLE for an absent sensor, and INTERNAL_ERROR on SPI, identity or configuration failure. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, SENSOR_NOT_AVAILABLE, SAMPLE_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_imu(sensor_index) {
    if (!Number.isInteger(sensor_index) || sensor_index < 0 || sensor_index > 255) throw new RangeError('sensor_index must be an integer from 0 to 255');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, sensor_index);
    const response = await this._request(GET_IMU, payload, 48);
    const sample = ImuSample.decode(response);
    if (!Object.values(sample).every(Number.isFinite)) throw new Error('Invalid IMU payload');
    return sample;
  }

  /** Read the filtered motor-current estimate in amperes. The unsigned reading measures driver high-side current; PWM decay intervals and the analog filter affect it. Reading does not enable or initialize the motor. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, SENSOR_NOT_AVAILABLE, SAMPLE_OUT_OF_RANGE, INTERNAL_ERROR. */
  async get_motor_current(motor_index) {
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    const response = await this._request(GET_MOTOR_CURRENT, payload, 8);
    const view = payloadView(response, 8);
    const amps = view.getFloat64(0, true);
    if (!Number.isFinite(amps) || amps < 0) throw new Error('Invalid motor current payload');
    return amps;
  }

  /** Read motor-driver fault status without waking, initializing, enabling or clearing the driver. Detailed flags are meaningful only when status_valid is true. An unavailable SPI response cannot distinguish missing motor power from a communication or driver failure. Flags may retain latched faults until explicit motor reinitialization. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, SENSOR_NOT_AVAILABLE. */
  async get_motor_faults(motor_index) {
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    const response = await this._request(GET_MOTOR_FAULTS, payload, 10);
    return MotorFaultStatus.decode(response);
  }

  /** This command initializes a motor and prepares it for use. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels), so platform wheels are not reconfigured out from under the platform. Stops the motor velocity and position controllers before applying the command. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, INIT_REQUIRED. */
  async initialize_motor(motor_index, is_reversed) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setUint8(1, is_reversed);
    await this._request(INITIALIZE_MOTOR, payload, 0);
  }

  /** This command sets the speed of the specified motor in PWM. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels); use the platform velocity commands to drive platform wheels. Stops the motor velocity and position controllers before applying the command. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, MOTOR_NOT_INITIALIZED, INIT_REQUIRED. */
  async set_motor_speed(motor_index, pwm) {
    const payload = new ArrayBuffer(9);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setFloat64(1, pwm, true);
    await this._request(SET_MOTOR_SPEED, payload, 0);
  }

  /** Stops the motor's velocity and position controllers and lets the motor coast with the H-bridge outputs in high impedance. On dual-PWM boards both PWM control inputs are low. On V4 enable/direction boards DISABLE is high and EN duty is zero. The command ID and payload are the same for all boards; firmware selects the hardware behavior from the board configuration. A motor owned by an active platform is rejected with MOTOR_OWNED; use COAST_PLATFORM or STOP_PLATFORM_CONTROLLER for platform wheels. Re-initialize the motor controller before using target-speed control again. Use BRAKE_MOTOR for a short brake instead of coasting. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED. */
  async stop_motor(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    await this._request(STOP_MOTOR, payload, 0);
  }

  /** Stops the motor's velocity and position controllers and applies a short brake, connecting both motor terminals to the same bridge rail to resist rotation. On dual-PWM boards both PWM control inputs are high. On V4 enable/direction boards DISABLE is low and EN duty is zero; direction does not affect braking. The command ID and payload are the same for all boards; firmware selects the hardware behavior from the board configuration. Short braking does not regulate or hold a specific position. A motor owned by an active platform is rejected with MOTOR_OWNED; use BRAKE_PLATFORM for platform wheels. Re-initialize the motor controller before using target-speed control again. Use STOP_MOTOR to coast instead. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED. */
  async brake_motor(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    await this._request(BRAKE_MOTOR, payload, 0);
  }

  /** This command sets the controller for the specified motor. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels), so it cannot create a competing controller on a platform wheel. Firmware 2.3.1 uses direct P+I+D PWM output with saturation anti-windup; retune gains from earlier builds. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, INIT_REQUIRED, ENCODER_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE. */
  async initialize_motor_controller(motor_index, is_reversed, encoder_index, is_encoder_reversed, encoder_resolution, kp, ki, kd, integral_limit) {
    if (!['number', 'string'].includes(typeof kp) || String(kp).trim() === '' || !Number.isFinite(Number(kp)) || Number(kp) < 0) throw new RangeError('kp must be finite and nonnegative');
    if (!['number', 'string'].includes(typeof ki) || String(ki).trim() === '' || !Number.isFinite(Number(ki)) || Number(ki) < 0) throw new RangeError('ki must be finite and nonnegative');
    if (!['number', 'string'].includes(typeof kd) || String(kd).trim() === '' || !Number.isFinite(Number(kd)) || Number(kd) < 0) throw new RangeError('kd must be finite and nonnegative');
    if (!['number', 'string'].includes(typeof integral_limit) || String(integral_limit).trim() === '' || !Number.isFinite(Number(integral_limit)) || Number(integral_limit) < 0) throw new RangeError('integral_limit must be finite and nonnegative');
    if (Number(integral_limit) > 100) throw new RangeError('integral_limit must be 0..100 PWM percentage points');
    const payload = new ArrayBuffer(44);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setUint8(1, is_reversed);
    requestView.setUint8(2, encoder_index);
    requestView.setUint8(3, is_encoder_reversed);
    requestView.setFloat64(4, encoder_resolution, true);
    requestView.setFloat64(12, kp, true);
    requestView.setFloat64(20, ki, true);
    requestView.setFloat64(28, kd, true);
    requestView.setFloat64(36, integral_limit, true);
    await this._request(INITIALIZE_MOTOR_CONTROLLER, payload, 0);
  }

  /** This command sets the target speed for the specified motor in radians. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels); use SET_PLATFORM_TARGET_VELOCITY to drive platform wheels. Suspends position mode; a new SET_MOTOR_POSITION reactivates it. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, CONTROLLER_NOT_INITIALIZED, INIT_REQUIRED, ENCODER_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE. */
  async set_motor_target_speed(motor_index, speed) {
    const payload = new ArrayBuffer(9);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setFloat64(1, speed, true);
    await this._request(SET_MOTOR_TARGET_SPEED, payload, 0);
  }

  /** This command resets the closed-loop controller for the specified motor: it clears the accumulated PID state (integrator windup, derivative history and internal output) and re-zeros the target speed, while keeping the controller running with its existing tuning (kp/ki/kd). Use it to recover from integrator windup or to bring a motor cleanly to a stop without deleting and re-initializing the controller. No effect if no controller is running for that motor, and ignored if the motor is currently owned by an active platform (one of its wheels). Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, INIT_REQUIRED. */
  async reset_motor_controller(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    await this._request(RESET_MOTOR_CONTROLLER, payload, 0);
  }

  /** This command gets the state of the controller for the specified motor. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async get_motor_controller_state(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    const response = await this._request(GET_MOTOR_CONTROLLER_STATE, payload, 57);
    return MotorControllerState.decode(response);
  }

  /** This command deletes the controller for the specified motor. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels); use STOP_PLATFORM_CONTROLLER to stop the platform controller instead. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, INIT_REQUIRED. */
  async delete_motor_controller(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    await this._request(DELETE_MOTOR_CONTROLLER, payload, 0);
  }

  /** This command sets the global update frequency (in Hz) of the closed-loop motor controller task. All motor controllers share a single control loop, so this frequency is global and affects every currently running controller as well as any created afterwards; the PID sampling time is updated to match. The requested value is clamped to the supported range of 1 to 1000 Hz (the 1000 Hz maximum is bounded by the 1 ms RTOS tick). The value is then quantized to the 1 ms RTOS tick (period_ms = 1000 / frequency), so effective frequencies are 1000/N Hz. A value of 0 is invalid and ignored. Defaults to 10 Hz (100 ms) at start-up. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async set_controller_frequency(frequency) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint16(0, frequency, true);
    await this._request(SET_CONTROLLER_FREQUENCY, payload, 0);
  }

  /** This command retrieves the current global update frequency (in Hz) of the closed-loop motor controller task. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async get_controller_frequency() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_CONTROLLER_FREQUENCY, payload, 2);
    const view = payloadView(response, 2);
    return view.getUint16(0, true);
  }

  /** This command initializes an encoder and prepares it for use. Stops controllers using this encoder before changing its configuration. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async initialize_encoder(encoder_index, encoder_resolution, is_reversed) {
    const payload = new ArrayBuffer(10);
    const requestView = new DataView(payload);
    requestView.setUint8(0, encoder_index);
    requestView.setFloat64(1, encoder_resolution, true);
    requestView.setUint8(9, is_reversed);
    await this._request(INITIALIZE_ENCODER, payload, 0);
  }

  /** This command retrieves the current value of the encoder. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, ENCODER_NOT_INITIALIZED, INIT_REQUIRED. */
  async get_encoder_value(encoder_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, encoder_index);
    const response = await this._request(GET_ENCODER_VALUE, payload, 2);
    const view = payloadView(response, 2);
    return view.getUint16(0, true);
  }

  /** This command starts the odometry calculation for the specified encoder. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY, ENCODER_NOT_INITIALIZED. */
  async start_encoder_odometry(encoder_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, encoder_index);
    await this._request(START_ENCODER_ODOMETRY, payload, 0);
  }

  /** This command resets the odometry calculation for the specified encoder. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async reset_encoder_odometry(encoder_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, encoder_index);
    await this._request(RESET_ENCODER_ODOMETRY, payload, 0);
  }

  /** This command stops the odometry calculation for the specified encoder. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async stop_encoder_odometry(encoder_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, encoder_index);
    await this._request(STOP_ENCODER_ODOMETRY, payload, 0);
  }

  /** This command retrieves the odometry of the specified encoder. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY, ODOMETRY_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE. */
  async get_encoder_odometry(encoder_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, encoder_index);
    const response = await this._request(GET_ENCODER_ODOMETRY, payload, 18);
    return EncoderOdometrySample.decode(response);
  }

  /** This command sets the global update frequency (in Hz) of the odometry task. A single odometry task integrates all encoder and platform odometry, so this frequency is global. The requested value is clamped to the supported range of 1 to 1000 Hz (the 1000 Hz maximum is bounded by the 1 ms RTOS tick). The value is then quantized to the 1 ms RTOS tick (period_ms = 1000 / frequency), so effective frequencies are 1000/N Hz. A value of 0 is invalid and ignored. Defaults to 20 Hz (50 ms) at start-up. Rejected if the resulting calculation period exceeds half of any active subscription interval on either transport. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async set_odometry_frequency(frequency) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint16(0, frequency, true);
    await this._request(SET_ODOMETRY_FREQUENCY, payload, 0);
  }

  /** This command retrieves the current global update frequency (in Hz) of the odometry task. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async get_odometry_frequency() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_ODOMETRY_FREQUENCY, payload, 2);
    const view = payloadView(response, 2);
    return view.getUint16(0, true);
  }

  /** This command initializes a digital pin and prepares it for use. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async initialize_gpio_pin(pin_number, mode) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint8(0, pin_number);
    requestView.setUint8(1, mode);
    await this._request(INITIALIZE_GPIO_PIN, payload, 0);
  }

  /** This command sets the specified pin to a state. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async set_gpio_pin_state(pin_number, state) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint8(0, pin_number);
    requestView.setUint8(1, state);
    await this._request(SET_GPIO_PIN_STATE, payload, 0);
  }

  /** This command gets the state of the specified pin. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async get_gpio_pin_state(pin_number) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, pin_number);
    const response = await this._request(GET_GPIO_PIN_STATE, payload, 1);
    const view = payloadView(response, 1);
    return view.getUint8(0);
  }

  /** This command toggles the specified pin. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async toggle_gpio_pin_state(pin_number) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, pin_number);
    await this._request(TOGGLE_GPIO_PIN_STATE, payload, 0);
  }

  /** This command sets the status LED to a state. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async set_status_led_state(state) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, state);
    await this._request(SET_STATUS_LED_STATE, payload, 0);
  }

  /** This command toggles the status LED. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async toggle_status_led_state() {
    const payload = new ArrayBuffer(0);
    await this._request(TOGGLE_STATUS_LED_STATE, payload, 0);
  }

  /** This command initializes a mecanum (4-wheel) platform and prepares it for use. It uses motor and encoder indices 0, 1, 2 and 3 (one per wheel), which correspond to the is_reversed_0..3 and is_encoder_reversed_0..3 parameters. All four motor slots are occupied by this platform. Selects the STANDARD roller layout. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async initialize_mecanum_platform(is_reversed_0, is_reversed_1, is_reversed_2, is_reversed_3, is_encoder_reversed_0, is_encoder_reversed_1, is_encoder_reversed_2, is_encoder_reversed_3, length, width, wheels_diameter, encoder_resolution) {
    const payload = new ArrayBuffer(40);
    const requestView = new DataView(payload);
    requestView.setUint8(0, is_reversed_0);
    requestView.setUint8(1, is_reversed_1);
    requestView.setUint8(2, is_reversed_2);
    requestView.setUint8(3, is_reversed_3);
    requestView.setUint8(4, is_encoder_reversed_0);
    requestView.setUint8(5, is_encoder_reversed_1);
    requestView.setUint8(6, is_encoder_reversed_2);
    requestView.setUint8(7, is_encoder_reversed_3);
    requestView.setFloat64(8, length, true);
    requestView.setFloat64(16, width, true);
    requestView.setFloat64(24, wheels_diameter, true);
    requestView.setFloat64(32, encoder_resolution, true);
    await this._request(INITIALIZE_MECANUM_PLATFORM, payload, 0);
  }

  /** This command initializes an omni (3-wheel) platform and prepares it for use. It uses motor and encoder indices 0, 1 and 2 (one per wheel), which correspond to the is_reversed_0..2 and is_encoder_reversed_0..2 parameters. Motor index 3 is not used by this platform and stays free for other purposes. Selects the single-rear-wheel (REAR) orientation. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async initialize_omni_platform(is_reversed_0, is_reversed_1, is_reversed_2, is_encoder_reversed_0, is_encoder_reversed_1, is_encoder_reversed_2, wheels_diameter, robot_radius, encoder_resolution) {
    const payload = new ArrayBuffer(30);
    const requestView = new DataView(payload);
    requestView.setUint8(0, is_reversed_0);
    requestView.setUint8(1, is_reversed_1);
    requestView.setUint8(2, is_reversed_2);
    requestView.setUint8(3, is_encoder_reversed_0);
    requestView.setUint8(4, is_encoder_reversed_1);
    requestView.setUint8(5, is_encoder_reversed_2);
    requestView.setFloat64(6, wheels_diameter, true);
    requestView.setFloat64(14, robot_radius, true);
    requestView.setFloat64(22, encoder_resolution, true);
    await this._request(INITIALIZE_OMNI_PLATFORM, payload, 0);
  }

  /** This command initializes a differential (2-wheel) platform and prepares it for use. It uses motor and encoder index 0 for the left wheel and index 1 for the right wheel, which correspond to the is_reversed_0/1 and is_encoder_reversed_0/1 parameters. Motor indices 2 and 3 are not used by this platform and stay free for other purposes. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async initialize_differential_platform(is_reversed_0, is_reversed_1, is_encoder_reversed_0, is_encoder_reversed_1, wheel_diameter, wheel_base, encoder_resolution) {
    const payload = new ArrayBuffer(28);
    const requestView = new DataView(payload);
    requestView.setUint8(0, is_reversed_0);
    requestView.setUint8(1, is_reversed_1);
    requestView.setUint8(2, is_encoder_reversed_0);
    requestView.setUint8(3, is_encoder_reversed_1);
    requestView.setFloat64(4, wheel_diameter, true);
    requestView.setFloat64(12, wheel_base, true);
    requestView.setFloat64(20, encoder_resolution, true);
    await this._request(INITIALIZE_DIFFERENTIAL_PLATFORM, payload, 0);
  }

  /** This command sets the velocity for the platform in PWM. Stops platform velocity and position control before applying PWM. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, PLATFORM_NOT_INITIALIZED, INIT_REQUIRED. */
  async set_platform_velocity(x, y, t) {
    const payload = new ArrayBuffer(24);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, x, true);
    requestView.setFloat64(8, y, true);
    requestView.setFloat64(16, t, true);
    await this._request(SET_PLATFORM_VELOCITY, payload, 0);
  }

  /** This command sets the controller for the platform. Firmware 2.3.1 uses direct P+I+D PWM output with saturation anti-windup; retune gains from earlier builds. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, ENCODER_NOT_INITIALIZED, PLATFORM_NOT_INITIALIZED, INIT_REQUIRED, SAMPLE_NOT_AVAILABLE. */
  async start_platform_controller(kp, ki, kd, integral_limit) {
    if (!['number', 'string'].includes(typeof kp) || String(kp).trim() === '' || !Number.isFinite(Number(kp)) || Number(kp) < 0) throw new RangeError('kp must be finite and nonnegative');
    if (!['number', 'string'].includes(typeof ki) || String(ki).trim() === '' || !Number.isFinite(Number(ki)) || Number(ki) < 0) throw new RangeError('ki must be finite and nonnegative');
    if (!['number', 'string'].includes(typeof kd) || String(kd).trim() === '' || !Number.isFinite(Number(kd)) || Number(kd) < 0) throw new RangeError('kd must be finite and nonnegative');
    if (!['number', 'string'].includes(typeof integral_limit) || String(integral_limit).trim() === '' || !Number.isFinite(Number(integral_limit)) || Number(integral_limit) < 0) throw new RangeError('integral_limit must be finite and nonnegative');
    if (Number(integral_limit) > 100) throw new RangeError('integral_limit must be 0..100 PWM percentage points');
    const payload = new ArrayBuffer(32);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, kp, true);
    requestView.setFloat64(8, ki, true);
    requestView.setFloat64(16, kd, true);
    requestView.setFloat64(24, integral_limit, true);
    await this._request(START_PLATFORM_CONTROLLER, payload, 0);
  }

  /** This command set the target velocity for the platform in meters per second. Cancels platform position control; initialize it again before another pose target. With an active fusion experiment, rejects invalid or stale feedback and targets fenced by an earlier fault with SAMPLE_NOT_AVAILABLE; both experimental modes require 100 ms of observed unchanged configured counters for initial rest arming. Once armed, ordinary target updates remain accepted while moving. Wait for healthy feedback and submit a fresh target; stopped cold configuration can ACK while still WAITING. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, PLATFORM_NOT_INITIALIZED, CONTROLLER_NOT_INITIALIZED, INIT_REQUIRED, SAMPLE_NOT_AVAILABLE, ENCODER_NOT_INITIALIZED. */
  async set_platform_target_velocity(x, y, t) {
    const payload = new ArrayBuffer(24);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, x, true);
    requestView.setFloat64(8, y, true);
    requestView.setFloat64(16, t, true);
    await this._request(SET_PLATFORM_TARGET_VELOCITY, payload, 0);
  }

  /** This command gets the current velocity of the platform in meters per second. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async get_platform_current_velocity() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_PLATFORM_CURRENT_VELOCITY, payload, 24);
    return PlatformVelocity.decode(response);
  }

  /** This command stops the controller for the platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async stop_platform_controller() {
    const payload = new ArrayBuffer(0);
    await this._request(STOP_PLATFORM_CONTROLLER, payload, 0);
  }

  /** This command starts the odometry calculation for the platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY, ENCODER_NOT_INITIALIZED, PLATFORM_NOT_INITIALIZED. */
  async start_platform_odometry() {
    const payload = new ArrayBuffer(0);
    await this._request(START_PLATFORM_ODOMETRY, payload, 0);
  }

  /** This command resets the odometry calculation for the platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async reset_platform_odometry() {
    const payload = new ArrayBuffer(0);
    await this._request(RESET_PLATFORM_ODOMETRY, payload, 0);
  }

  /** This command stops the odometry calculation for the platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async stop_platform_odometry() {
    const payload = new ArrayBuffer(0);
    await this._request(STOP_PLATFORM_ODOMETRY, payload, 0);
  }

  /** This command retrieves the odometry of the platform in meters and radians. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY, ODOMETRY_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE. */
  async get_platform_odometry() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_PLATFORM_ODOMETRY, payload, 34);
    return PlatformOdometrySample.decode(response);
  }

  /** Stops the platform velocity and position controllers and applies a short brake to this platform's wheel motors using the selected board's motor control model. Other motors are not affected. The brake resists motion until a new command is issued; it does not regulate or hold a specific position. Call START_PLATFORM_CONTROLLER again to resume closed-loop platform control. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async brake_platform() {
    const payload = new ArrayBuffer(0);
    await this._request(BRAKE_PLATFORM, payload, 0);
  }

  /** This command lets all of this platform's wheel motors coast freely (high impedance) so they spin down without resistance, and stops the platform velocity controller if it is running (you must call START_PLATFORM_CONTROLLER again to resume closed-loop platform control). Motors used outside this platform are not affected. The motors spin down without resistance. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async coast_platform() {
    const payload = new ArrayBuffer(0);
    await this._request(COAST_PLATFORM, payload, 0);
  }

  /** Set independent time-sync refresh interval for this connection. Default 30000 ms. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async set_time_sync_interval(interval_ms) {
    const payload = new ArrayBuffer(4);
    const requestView = new DataView(payload);
    requestView.setUint32(0, interval_ms, true);
    await this._request(SET_TIME_SYNC_INTERVAL, payload, 0);
  }

  /** Read this connection's clock mode, quality, interval and age. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async get_time_status() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_TIME_STATUS, payload, 14);
    return TimeStatus.decode(response);
  }

  /** Refresh connection activity and receive an empty ACK. Any structurally valid client command also refreshes activity; malformed frames do not. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async ping() {
    const payload = new ArrayBuffer(0);
    await this._request(PING, payload, 0);
  }

  /** Configure this session watchdog after READY. Timeout coasts all motors, clears subscriptions and requires a new INIT before further operations. Disabling also removes this session subscriptions. INIT resets to disabled, 500 ms. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY. */
  async set_heartbeat_config(enabled, timeout_ms) {
    const payload = new ArrayBuffer(5);
    const requestView = new DataView(payload);
    requestView.setUint8(0, enabled);
    requestView.setUint32(1, timeout_ms, true);
    await this._request(SET_HEARTBEAT_CONFIG, payload, 0);
  }

  /** Read this session watchdog configuration. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
  async get_heartbeat_config() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_HEARTBEAT_CONFIG, payload, 5);
    return HeartbeatConfig.decode(response);
  }

  /** Create or replace this connection's subscription for an odometry source. Requires READY, enabled heartbeat and running odometry. The interval must be at least twice the calculation period. Stop or reset pauses delivery until a fresh sample is available. Errors: BOARD_IDLE, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY, ODOMETRY_NOT_INITIALIZED.
   * @deprecated Retired since protocol 2.6.0. Use SUBSCRIBE. Kept for compatibility; eligible for removal in protocol 3.0.0.
    */
  async subscribe_odometry(source, interval_ms) {
    const payload = new ArrayBuffer(5);
    const requestView = new DataView(payload);
    requestView.setUint8(0, source);
    requestView.setUint32(1, interval_ms, true);
    await this._request(SUBSCRIBE_ODOMETRY, payload, 0);
  }

  /** Remove this connection's subscription for an odometry source. Succeeds if already absent and leaves odometry calculation running. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED.
   * @deprecated Retired since protocol 2.6.0. Use UNSUBSCRIBE. Kept for compatibility; eligible for removal in protocol 3.0.0.
    */
  async unsubscribe_odometry(source) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, source);
    await this._request(UNSUBSCRIBE_ODOMETRY, payload, 0);
  }

  /** Allow an I2C master to read at most one due telemetry event followed by an empty ACK. Return only the ACK when no sample is available. USB clients receive events automatically. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY. */
  async poll_telemetry() {
    const payload = new ArrayBuffer(0);
    await this._request(POLL_TELEMETRY, payload, 0);
  }

  /** Initialize a bounded proportional position loop over an already running motor velocity controller. Zero is the current encoder position; initially holds zero. Stop/delete/reinitialize of velocity control discards position tuning. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, MOTOR_OWNED, ENCODER_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE. */
  async initialize_motor_position_controller(motor_index, kp, max_speed, tolerance) {
    if (typeof motor_index !== 'number' || !Number.isFinite(motor_index)) throw new TypeError('motor_index must be a finite number');
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    if (typeof kp !== 'number' || !Number.isFinite(kp)) throw new TypeError('kp must be a finite number');
    if (kp <= 0) throw new RangeError('kp must be positive');
    if (typeof max_speed !== 'number' || !Number.isFinite(max_speed)) throw new TypeError('max_speed must be a finite number');
    if (max_speed <= 0) throw new RangeError('max_speed must be positive');
    if (typeof tolerance !== 'number' || !Number.isFinite(tolerance)) throw new TypeError('tolerance must be a finite number');
    if (tolerance < 0) throw new RangeError('tolerance must be nonnegative');
    const payload = new ArrayBuffer(25);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setFloat64(1, kp, true);
    requestView.setFloat64(9, max_speed, true);
    requestView.setFloat64(17, tolerance, true);
    await this._request(INITIALIZE_MOTOR_POSITION_CONTROLLER, payload, 0);
  }

  /** Zero the motor position and target at the current encoder count, clear velocity PID history and output, and hold zero. Requires initialized position control. Does not reset independent encoder odometry. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, MOTOR_OWNED. */
  async reset_motor_position(motor_index) {
    if (typeof motor_index !== 'number' || !Number.isFinite(motor_index)) throw new TypeError('motor_index must be a finite number');
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    await this._request(RESET_MOTOR_POSITION, payload, 0);
  }

  /** Set an absolute multi-turn angle in radians relative to the last position initialization/reset. Requires initialized position and velocity controllers. Reactivates position mode after a velocity override. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, MOTOR_OWNED, ENCODER_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE. */
  async set_motor_position(motor_index, position) {
    if (typeof motor_index !== 'number' || !Number.isFinite(motor_index)) throw new TypeError('motor_index must be a finite number');
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    if (typeof position !== 'number' || !Number.isFinite(position)) throw new TypeError('position must be a finite number');
    const payload = new ArrayBuffer(9);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setFloat64(1, position, true);
    await this._request(SET_MOTOR_POSITION, payload, 0);
  }

  /** Read the latest motor position in radians in the position-controller frame. Requires initialized position control. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, MOTOR_OWNED. */
  async get_motor_position(motor_index) {
    if (typeof motor_index !== 'number' || !Number.isFinite(motor_index)) throw new TypeError('motor_index must be a finite number');
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    const response = await this._request(GET_MOTOR_POSITION, payload, 8);
    const view = payloadView(response, 8);
    return view.getFloat64(0, true);
  }

  /** Initialize bounded pose control after START_PLATFORM_CONTROLLER. Starts odometry if needed, preserves its world frame and zeros velocity targets. No motion until SET_PLATFORM_POSITION. Supports omni, mecanum and differential bases. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, PLATFORM_NOT_INITIALIZED, ENCODER_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE. */
  async initialize_platform_position_controller(linear_kp, angular_kp, max_linear_speed, max_angular_speed, position_tolerance, heading_tolerance) {
    if (typeof linear_kp !== 'number' || !Number.isFinite(linear_kp)) throw new TypeError('linear_kp must be a finite number');
    if (linear_kp <= 0) throw new RangeError('linear_kp must be positive');
    if (typeof angular_kp !== 'number' || !Number.isFinite(angular_kp)) throw new TypeError('angular_kp must be a finite number');
    if (angular_kp <= 0) throw new RangeError('angular_kp must be positive');
    if (typeof max_linear_speed !== 'number' || !Number.isFinite(max_linear_speed)) throw new TypeError('max_linear_speed must be a finite number');
    if (max_linear_speed <= 0) throw new RangeError('max_linear_speed must be positive');
    if (typeof max_angular_speed !== 'number' || !Number.isFinite(max_angular_speed)) throw new TypeError('max_angular_speed must be a finite number');
    if (max_angular_speed <= 0) throw new RangeError('max_angular_speed must be positive');
    if (typeof position_tolerance !== 'number' || !Number.isFinite(position_tolerance)) throw new TypeError('position_tolerance must be a finite number');
    if (position_tolerance < 0) throw new RangeError('position_tolerance must be nonnegative');
    if (typeof heading_tolerance !== 'number' || !Number.isFinite(heading_tolerance)) throw new TypeError('heading_tolerance must be a finite number');
    if (heading_tolerance < 0) throw new RangeError('heading_tolerance must be nonnegative');
    const payload = new ArrayBuffer(48);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, linear_kp, true);
    requestView.setFloat64(8, angular_kp, true);
    requestView.setFloat64(16, max_linear_speed, true);
    requestView.setFloat64(24, max_angular_speed, true);
    requestView.setFloat64(32, position_tolerance, true);
    requestView.setFloat64(40, heading_tolerance, true);
    await this._request(INITIALIZE_PLATFORM_POSITION_CONTROLLER, payload, 0);
  }

  /** Cancel the pose target, zero velocity targets, and reset platform odometry to (0,0,0). Keeps position tuning. Wait for a fresh odometry sample before setting another target. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, PLATFORM_NOT_INITIALIZED. */
  async reset_platform_position() {
    const payload = new ArrayBuffer(0);
    await this._request(RESET_PLATFORM_POSITION, payload, 0);
  }

  /** Set absolute (x,y,t) in the current odometry world frame: meters, meters, radians. Heading uses the shortest angular path. Requires initialized position control and fresh odometry. Differential bases approach the point before aligning final heading. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, PLATFORM_NOT_INITIALIZED, ODOMETRY_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE, ENCODER_NOT_INITIALIZED. */
  async set_platform_position(x, y, t) {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError('x must be a finite number');
    if (typeof y !== 'number' || !Number.isFinite(y)) throw new TypeError('y must be a finite number');
    if (typeof t !== 'number' || !Number.isFinite(t)) throw new TypeError('t must be a finite number');
    const payload = new ArrayBuffer(24);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, x, true);
    requestView.setFloat64(8, y, true);
    requestView.setFloat64(16, t, true);
    await this._request(SET_PLATFORM_POSITION, payload, 0);
  }

  /** Initialize a position PID over the existing velocity controller. Initialize a bounded position PID loop over an already running motor velocity controller. Zero is the current encoder position; initially holds zero. Stop/delete/reinitialize of velocity control discards position tuning. Clears position PID history. Ki and Kd may be zero to disable I and D. Integral limits bound the integral velocity contribution. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, MOTOR_OWNED, ENCODER_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE. */
  async initialize_motor_position_pid_controller(motor_index, kp, max_speed, tolerance, ki, kd, integral_limit) {
    if (typeof motor_index !== 'number' || !Number.isFinite(motor_index)) throw new TypeError('motor_index must be a finite number');
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    if (typeof kp !== 'number' || !Number.isFinite(kp)) throw new TypeError('kp must be a finite number');
    if (kp <= 0) throw new RangeError('kp must be positive');
    if (typeof max_speed !== 'number' || !Number.isFinite(max_speed)) throw new TypeError('max_speed must be a finite number');
    if (max_speed <= 0) throw new RangeError('max_speed must be positive');
    if (typeof tolerance !== 'number' || !Number.isFinite(tolerance)) throw new TypeError('tolerance must be a finite number');
    if (tolerance < 0) throw new RangeError('tolerance must be nonnegative');
    if (typeof ki !== 'number' || !Number.isFinite(ki)) throw new TypeError('ki must be a finite number');
    if (ki < 0) throw new RangeError('ki must be nonnegative');
    if (typeof kd !== 'number' || !Number.isFinite(kd)) throw new TypeError('kd must be a finite number');
    if (kd < 0) throw new RangeError('kd must be nonnegative');
    if (typeof integral_limit !== 'number' || !Number.isFinite(integral_limit)) throw new TypeError('integral_limit must be a finite number');
    if (integral_limit < 0) throw new RangeError('integral_limit must be nonnegative');
    const payload = new ArrayBuffer(49);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setFloat64(1, kp, true);
    requestView.setFloat64(9, max_speed, true);
    requestView.setFloat64(17, tolerance, true);
    requestView.setFloat64(25, ki, true);
    requestView.setFloat64(33, kd, true);
    requestView.setFloat64(41, integral_limit, true);
    await this._request(INITIALIZE_MOTOR_POSITION_PID_CONTROLLER, payload, 0);
  }

  /** Initialize a position PID over the existing velocity controller. Initialize bounded pose control after START_PLATFORM_CONTROLLER. Starts odometry if needed, preserves its world frame and zeros velocity targets. No motion until SET_PLATFORM_POSITION. Supports omni, mecanum and differential bases. Clears position PID history. Ki and Kd may be zero to disable I and D. Integral limits bound the integral velocity contribution. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, PLATFORM_NOT_INITIALIZED, ENCODER_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE. */
  async initialize_platform_position_pid_controller(linear_kp, angular_kp, max_linear_speed, max_angular_speed, position_tolerance, heading_tolerance, linear_ki, linear_kd, linear_integral_limit, angular_ki, angular_kd, angular_integral_limit) {
    if (typeof linear_kp !== 'number' || !Number.isFinite(linear_kp)) throw new TypeError('linear_kp must be a finite number');
    if (linear_kp <= 0) throw new RangeError('linear_kp must be positive');
    if (typeof angular_kp !== 'number' || !Number.isFinite(angular_kp)) throw new TypeError('angular_kp must be a finite number');
    if (angular_kp <= 0) throw new RangeError('angular_kp must be positive');
    if (typeof max_linear_speed !== 'number' || !Number.isFinite(max_linear_speed)) throw new TypeError('max_linear_speed must be a finite number');
    if (max_linear_speed <= 0) throw new RangeError('max_linear_speed must be positive');
    if (typeof max_angular_speed !== 'number' || !Number.isFinite(max_angular_speed)) throw new TypeError('max_angular_speed must be a finite number');
    if (max_angular_speed <= 0) throw new RangeError('max_angular_speed must be positive');
    if (typeof position_tolerance !== 'number' || !Number.isFinite(position_tolerance)) throw new TypeError('position_tolerance must be a finite number');
    if (position_tolerance < 0) throw new RangeError('position_tolerance must be nonnegative');
    if (typeof heading_tolerance !== 'number' || !Number.isFinite(heading_tolerance)) throw new TypeError('heading_tolerance must be a finite number');
    if (heading_tolerance < 0) throw new RangeError('heading_tolerance must be nonnegative');
    if (typeof linear_ki !== 'number' || !Number.isFinite(linear_ki)) throw new TypeError('linear_ki must be a finite number');
    if (linear_ki < 0) throw new RangeError('linear_ki must be nonnegative');
    if (typeof linear_kd !== 'number' || !Number.isFinite(linear_kd)) throw new TypeError('linear_kd must be a finite number');
    if (linear_kd < 0) throw new RangeError('linear_kd must be nonnegative');
    if (typeof linear_integral_limit !== 'number' || !Number.isFinite(linear_integral_limit)) throw new TypeError('linear_integral_limit must be a finite number');
    if (linear_integral_limit < 0) throw new RangeError('linear_integral_limit must be nonnegative');
    if (typeof angular_ki !== 'number' || !Number.isFinite(angular_ki)) throw new TypeError('angular_ki must be a finite number');
    if (angular_ki < 0) throw new RangeError('angular_ki must be nonnegative');
    if (typeof angular_kd !== 'number' || !Number.isFinite(angular_kd)) throw new TypeError('angular_kd must be a finite number');
    if (angular_kd < 0) throw new RangeError('angular_kd must be nonnegative');
    if (typeof angular_integral_limit !== 'number' || !Number.isFinite(angular_integral_limit)) throw new TypeError('angular_integral_limit must be a finite number');
    if (angular_integral_limit < 0) throw new RangeError('angular_integral_limit must be nonnegative');
    const payload = new ArrayBuffer(96);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, linear_kp, true);
    requestView.setFloat64(8, angular_kp, true);
    requestView.setFloat64(16, max_linear_speed, true);
    requestView.setFloat64(24, max_angular_speed, true);
    requestView.setFloat64(32, position_tolerance, true);
    requestView.setFloat64(40, heading_tolerance, true);
    requestView.setFloat64(48, linear_ki, true);
    requestView.setFloat64(56, linear_kd, true);
    requestView.setFloat64(64, linear_integral_limit, true);
    requestView.setFloat64(72, angular_ki, true);
    requestView.setFloat64(80, angular_kd, true);
    requestView.setFloat64(88, angular_integral_limit, true);
    await this._request(INITIALIZE_PLATFORM_POSITION_PID_CONTROLLER, payload, 0);
  }

  /** Create or replace this connection's subscription for a topic and resource. Requires READY and enabled heartbeat. Odometry must be running. The interval must meet the topic minimum and, for odometry, be at least twice the calculation period. Failed reads pause delivery until recovery. Errors: BOARD_IDLE, INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, ODOMETRY_NOT_INITIALIZED, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SUBSCRIPTION_LIMIT, SAMPLE_OUT_OF_RANGE. */
  async subscribe(topic_id, index, interval_ms) {
    if (!Number.isInteger(topic_id) || !Object.hasOwn(TopicDefinitions, topic_id)) throw new RangeError('Invalid topic');
    if (!Number.isInteger(index) || index < 0 || index > TopicDefinitions[topic_id].indexMax) throw new RangeError('Invalid topic index');
    if (!Number.isInteger(interval_ms) || interval_ms < TopicDefinitions[topic_id].minIntervalMs || interval_ms > 3600000) throw new RangeError('Invalid subscription interval');
    const payload = new ArrayBuffer(6);
    const requestView = new DataView(payload);
    requestView.setUint8(0, topic_id);
    requestView.setUint8(1, index);
    requestView.setUint32(2, interval_ms, true);
    await this._request(SUBSCRIBE, payload, 0);
  }

  /** Remove this connection's subscription for a topic and resource. Requires READY. Succeeds if already absent and leaves calculation running. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY. */
  async unsubscribe(topic_id, index) {
    if (!Number.isInteger(topic_id) || !Object.hasOwn(TopicDefinitions, topic_id)) throw new RangeError('Invalid topic');
    if (!Number.isInteger(index) || index < 0 || index > TopicDefinitions[topic_id].indexMax) throw new RangeError('Invalid topic index');
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint8(0, topic_id);
    requestView.setUint8(1, index);
    await this._request(UNSUBSCRIBE, payload, 0);
  }

  /** Create or replace this connection's subscription with a delivery mode. Requires READY and enabled heartbeat. The interval sets the sampling cadence and must meet the topic minimum; odometry also requires twice the calculation period. ON_CHANGE sends an initial snapshot and changed values, excluding timestamp and clock metadata. Failed reads pause delivery; recovery sends a fresh snapshot. Errors: BOARD_IDLE, INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, ODOMETRY_NOT_INITIALIZED, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SUBSCRIPTION_LIMIT, SAMPLE_OUT_OF_RANGE. */
  async subscribe_with_mode(topic_id, index, interval_ms, mode) {
    if (!Number.isInteger(topic_id) || !Object.hasOwn(TopicDefinitions, topic_id)) throw new RangeError('Invalid topic');
    if (!Object.values(SubscriptionMode).includes(mode)) throw new RangeError('Invalid subscription mode');
    if (!Number.isInteger(index) || index < 0 || index > TopicDefinitions[topic_id].indexMax) throw new RangeError('Invalid topic index');
    if (!Number.isInteger(interval_ms) || interval_ms < TopicDefinitions[topic_id].minIntervalMs || interval_ms > 3600000) throw new RangeError('Invalid subscription interval');
    const payload = new ArrayBuffer(7);
    const requestView = new DataView(payload);
    requestView.setUint8(0, topic_id);
    requestView.setUint8(1, index);
    requestView.setUint32(2, interval_ms, true);
    requestView.setUint8(6, mode);
    await this._request(SUBSCRIBE_WITH_MODE, payload, 0);
  }

  /** Stop the initialized motor and its controller, clear latched driver faults, and return fresh diagnostics. Requires a ready connection. The motor remains stopped. Active conditions can remain reported. Platform-owned motors are rejected. Driver configuration is preserved; sleeping drivers are not woken. A failed clear or unreadable verification returns an error. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, SENSOR_NOT_AVAILABLE, MOTOR_OWNED, MOTOR_NOT_INITIALIZED, INTERNAL_ERROR, CLOCK_NOT_READY. */
  async clear_motor_faults(motor_index) {
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    const response = await this._request(CLEAR_MOTOR_FAULTS, payload, 10);
    return MotorFaultStatus.decode(response);
  }

  /** Read the applied hardware current-regulation setting in milliamps. Requires a ready connection and an initialized, awake motor driver. Does not change motor state. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, MOTOR_NOT_INITIALIZED, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_motor_current_limit(motor_index) {
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    const response = await this._request(GET_MOTOR_CURRENT_LIMIT, payload, 3);
    return MotorCurrentLimit.decode(response);
  }

  /** Stop the motor and its controller, apply and verify hardware current regulation, and return the applied setting. Requires a ready connection and an initialized, awake driver. Only board-supported thresholds are accepted. Platform-owned motors are rejected. The motor stays stopped. Settings are volatile; motor reinitialization applies board defaults. Driver power loss requires reinitialization. Overcurrent protection is unchanged. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, MOTOR_NOT_INITIALIZED, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, MOTOR_OWNED. */
  async set_motor_current_limit(motor_index, enabled, threshold_ma) {
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    if (typeof enabled !== 'boolean' || !Number.isInteger(threshold_ma) || threshold_ma < 1 || threshold_ma > 65535) throw new RangeError('Expected enabled boolean and threshold_ma integer from 1 to 65535');
    const payload = new ArrayBuffer(4);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setUint8(1, enabled);
    requestView.setUint16(2, threshold_ma, true);
    const response = await this._request(SET_MOTOR_CURRENT_LIMIT, payload, 3);
    return MotorCurrentLimit.decode(response);
  }

  /** Create or replace a subscription with independent trigger and delivery settings. Send an initial snapshot. PERIODIC uses poll_interval_ms; ON_EVENT requires zero polling interval and an event-capable source. ON_CHANGE suppresses unchanged values, excluding timestamp and clock metadata; max_silence_ms requests fresh refreshes, or zero disables refreshes. Delivery is best effort and requires READY and heartbeat. Errors: BOARD_IDLE, INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, ODOMETRY_NOT_INITIALIZED, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SUBSCRIPTION_LIMIT, SAMPLE_OUT_OF_RANGE. */
  async subscribe_configured(topic_id, index, poll_interval_ms, trigger, delivery, max_silence_ms) {
    if (!Number.isInteger(topic_id) || !Object.hasOwn(TopicDefinitions, topic_id)) throw new RangeError('Invalid topic');
    if (!Number.isInteger(index) || index < 0 || index > TopicDefinitions[topic_id].indexMax) throw new RangeError('Invalid topic index');
    if (!Object.values(SubscriptionTrigger).includes(trigger) || !Object.values(SubscriptionDelivery).includes(delivery)) throw new RangeError('Invalid subscription settings');
    const definition = TopicDefinitions[topic_id];
    if (!Number.isInteger(poll_interval_ms) || poll_interval_ms > 3600000 || (trigger === SubscriptionTrigger.ON_EVENT ? poll_interval_ms !== 0 || !definition.eventSupported : poll_interval_ms < definition.minIntervalMs)) throw new RangeError('Invalid polling interval or trigger');
    if (!Number.isInteger(max_silence_ms) || max_silence_ms < 0 || max_silence_ms > 3600000 || (max_silence_ms !== 0 && (delivery !== SubscriptionDelivery.ON_CHANGE || max_silence_ms < definition.minIntervalMs))) throw new RangeError('Invalid maximum silence');
    const payload = new ArrayBuffer(12);
    const requestView = new DataView(payload);
    requestView.setUint8(0, topic_id);
    requestView.setUint8(1, index);
    requestView.setUint32(2, poll_interval_ms, true);
    requestView.setUint8(6, trigger);
    requestView.setUint8(7, delivery);
    requestView.setUint32(8, max_silence_ms, true);
    await this._request(SUBSCRIBE_CONFIGURED, payload, 0);
  }

  /** Read the board-wide motor PWM frequency in hertz. Does not initialize motors or change outputs. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, INTERNAL_ERROR. */
  async get_pwm_frequency() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_PWM_FREQUENCY, payload, 4);
    const view = payloadView(response, 4);
    return view.getUint32(0, true);
  }

  /** Stop all motors and motor/platform controllers, then set the board-wide PWM frequency. All motors remain stopped. The setting survives motor initialization and connection changes. At boot the board uses its default unless it restores an explicitly saved v0.4 configuration. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, INTERNAL_ERROR. */
  async set_pwm_frequency(frequency_hz) {
    if (!Object.values(PwmFrequency).includes(frequency_hz)) throw new RangeError('Invalid PWM frequency');
    const payload = new ArrayBuffer(4);
    const requestView = new DataView(payload);
    requestView.setUint32(0, frequency_hz, true);
    const response = await this._request(SET_PWM_FREQUENCY, payload, 4);
    const view = payloadView(response, 4);
    return view.getUint32(0, true);
  }

  /** Save the complete running platform setup and motor PWM frequency to onboard FRAM. Available on v0.4 with protocol 2.14 or later. ACK confirms a durable save. A subsequent boot restores the setup with outputs stopped. Protocol 2.23+ also saves the applied physical IMU mount and accepts an explicitly configured mount before platform commissioning. Errors: INVALID_LENGTH, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, PLATFORM_NOT_INITIALIZED, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async save_configuration() {
    const payload = new ArrayBuffer(0);
    await this._request(SAVE_CONFIGURATION, payload, 0);
  }

  /** Read a running configuration field. Fields 0 through 6 require v0.4. Field 7 is available on all boards with protocol 2.25 and a configured mecanum platform. Field 8 is available on all boards with protocol 2.26 and a configured Omni platform. Use GET_PWM_FREQUENCY for the board-wide switching frequency. Errors: INVALID_LENGTH, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INVALID_ARGUMENT, PLATFORM_NOT_INITIALIZED. */
  async get_configuration_field(field, index) {
    if (![field, index].every(v => Number.isInteger(v) && v >= 0 && v <= 255)) throw new RangeError('Configuration field and index must be unsigned bytes');
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint8(0, field);
    requestView.setUint8(1, index);
    const response = await this._request(GET_CONFIGURATION_FIELD, payload, 8);
    const view = payloadView(response, 8);
    return view.getFloat64(0, true);
  }

  /** Set the board-wide motor inhibit. Entry stops all controllers and blocks new motion. On v0.3 and Nano (protocol 2.17), entry holds each DRV8870 input pair low. Release keeps the inputs low until a fresh drive or explicit short brake. On v0.4 (protocol 2.15+), wake verifies retained settings for initialized drivers and leaves outputs stopped. Failed transitions retain the inhibit for explicit retry. Requires READY and a profile supporting driver sleep. Errors: DRIVERS_ASLEEP, BOARD_IDLE, INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async set_driver_sleep(sleeping) {
    if (sleeping !== 0 && sleeping !== 1) throw new RangeError('sleeping must be 0 (awake) or 1 (asleep)');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, sleeping);
    await this._request(SET_DRIVER_SLEEP, payload, 0);
  }

  /** Read the software motor inhibit across connections. It clears at boot. A zero permits commands and does not establish that each chip is awake. Requires READY and driver sleep support (v0.4 since protocol 2.15, original v0.3 and Nano since 2.17). Errors: INVALID_LENGTH, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE. */
  async get_driver_sleep() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_DRIVER_SLEEP, payload, 1);
    const view = payloadView(response, 1);
    const sleeping = view.getUint8(0);
    if (sleeping !== 0 && sleeping !== 1) throw new Error('Invalid driver sleep state');
    return sleeping;
  }

  /** Set communication-preserving board idle. Entry (1) stops control, inhibits the drivers and permits shallow CPU sleep between tasks. USB traffic, time sync, queries and heartbeat keep using the existing session. Only explicit exit (0) clears idle. Exit preserves a prior independent driver inhibit and leaves outputs stopped. On original v0.3 and Nano both DRV8870 inputs stay low until fresh drive or brake. On v0.4, previously active drivers are verified before release. A failed transition retains idle and inhibit for explicit retry. Requires READY, an idle-capable profile and protocol 2.18 on v0.3 or Nano, or 2.16 on v0.4. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, BOARD_IDLE. */
  async set_board_idle(idle) {
    if (idle !== 0 && idle !== 1) throw new RangeError('idle must be 0 (active) or 1 (idle)');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, idle);
    await this._request(SET_BOARD_IDLE, payload, 0);
  }

  /** Read the shared logical idle request without clearing it. Interrupts can resume the CPU while this request remains set. GET_DRIVER_SLEEP reports the effective driver inhibit. Idle survives reconnect and clears at reset. Requires READY and board idle support (original v0.3 and Nano since protocol 2.18, v0.4 since 2.16). Errors: INVALID_LENGTH, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE. */
  async get_board_idle() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_BOARD_IDLE, payload, 1);
    const view = payloadView(response, 1);
    const idle = view.getUint8(0);
    if (idle !== 0 && idle !== 1) throw new Error('Invalid board idle state');
    return idle;
  }

  /** Configure the volatile v0.4 experiment only while motion is stopped and all commanded targets and motor outputs are zero; initialized controllers with idle zero targets are allowed. Mode 0 retains the legacy encoder path (boot default), 1 uses encoder feedback with the common chassis correction, and 2 uses fused feedback with that same correction. No IMU-only mode. Without a configured physical mount, modes 1/2 require a rigid, level board with component side up, IMU at the chassis reference point, and mounting_yaw_rad as the angle of board +X expressed in chassis XY, counterclockwise about chassis +Z. Sensor-to-board axes are (-x,-y,+z); chassis axes are forward/left/up. Reject nonfinite or out-of-range yaw, any observed configured encoder movement in the preceding 100 ms, or a counter change since a fresh sample. Stopped cold setup may ACK in WAITING; ACK does not establish readiness. Both experimental modes require 100 ms of observed unchanged configured counters for initial rest arming before accepting a motion target; once armed, ordinary target updates remain accepted while moving; fused bias calibration may run within that window. Reconfiguration cancels old targets. Sources may requalify automatically after an ordinary sensor fault, but healthy inputs and a fresh target are required before control resumes. Does not save to FRAM or start motion. Requires READY, exact v0.4.0 fusion capability and protocol 2.19. On protocol 2.23+, a configured physical mount takes precedence over legacy yaw. Use GET_BOARD_MOUNT on 2.24+ for PCB underside-center geometry. On 2.23 use GET_IMU_MOUNT for chip-reference geometry. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, BOARD_IDLE, DRIVERS_ASLEEP, PLATFORM_NOT_INITIALIZED. */
  async set_fusion_experiment(mode, mounting_yaw_rad) {
    if (!Number.isInteger(mode) || mode < 0 || mode > 2) throw new RangeError('Invalid fusion experiment mode');
    if (typeof mounting_yaw_rad !== 'number' || !Number.isFinite(mounting_yaw_rad) || Math.abs(mounting_yaw_rad) > Math.PI) throw new RangeError('Mounting yaw must be finite radians within [-pi, pi]');
    const payload = new ArrayBuffer(9);
    const requestView = new DataView(payload);
    requestView.setUint8(0, mode);
    requestView.setFloat64(1, mounting_yaw_rad, true);
    await this._request(SET_FUSION_EXPERIMENT, payload, 0);
  }

  /** Read experiment mode, health, fault, flags and timestamped sample ages without setting targets or changing configuration. A read may enforce an expired feedback deadline, clear the live target and coast. Health/fault/flag values use the FusionHealth/FusionFault/FusionFlag catalogs. Timestamp uses the monotonic board clock; unavailable ages are UINT32_MAX. The physical IMU producer waits 2 ms between passes, without guaranteeing a 2 ms acquisition cadence, and pairs only acquisition windows entirely preceding the encoder timestamp: each window is at most 5 ms wide, worst-case accel/gyro skew at most 15 ms, and age at most 35 ms. These are software acceptance limits, not a physical timing qualification. ESTIMATE_VALID describes the selected experiment estimate, not physical accuracy. Requires READY, exact v0.4.0 fusion capability and protocol 2.19. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_fusion_status() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_FUSION_STATUS, payload, 28);
    const sample = FusionStatus.decode(response);
    if (sample.mode > 2 || sample.health > 3 || sample.fault > 9 || sample.flags > 15) throw new Error('Invalid fusion status');
    return sample;
  }

  /** Read one compact experiment vector: 0 encoder pose (relative x,y,yaw), 1 encoder body twist (vx,vy,yaw rate), 2 fused pose, 3 fused body twist, 4 estimated bias (ax,ay,gyro z). Units are metres, seconds and radians. On outage recovery, the last fused-from-encoder world transform is reapplied to the current encoder pose. Returns SAMPLE_NOT_AVAILABLE when the requested estimate is invalid. Match sequence with GET_FUSION_STATUS to associate timestamp/health; different sequences are different snapshots. At most 28 payload bytes so the framed reply fits Arduino Wire32. Does not reset state or start motion. Requires READY, exact v0.4.0 fusion capability and protocol 2.19. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SAMPLE_NOT_AVAILABLE. */
  async get_fusion_vector(kind) {
    if (!Number.isInteger(kind) || kind < 0 || kind > 4) throw new RangeError('Invalid fusion vector kind');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, kind);
    const response = await this._request(GET_FUSION_VECTOR, payload, 28);
    const sample = FusionVector.decode(response);
    if (![sample.x, sample.y, sample.z].every(Number.isFinite)) throw new Error('Invalid fusion vector');
    return sample;
  }

  /** Read the volatile experiment mode and declared mounting yaw without changing state. Reset selects legacy encoder mode; SAVE_CONFIGURATION does not persist this experiment. Requires READY, exact v0.4.0 fusion capability and protocol 2.19. On protocol 2.23+, a configured physical mount takes precedence over legacy yaw. Use GET_BOARD_MOUNT on 2.24+ for PCB underside-center geometry. On 2.23 use GET_IMU_MOUNT for chip-reference geometry. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_fusion_configuration() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_FUSION_CONFIGURATION, payload, 9);
    const sample = FusionConfiguration.decode(response);
    if (sample.mode > 2 || !Number.isFinite(sample.mounting_yaw_rad) || Math.abs(sample.mounting_yaw_rad) > Math.PI) throw new Error('Invalid fusion configuration');
    return sample;
  }

  /** Control volatile IMU-only relative tracking. START=0, RESET=2 and RECALIBRATE=3 are accepted from any state with stationary_mount_confirmed=1 and finite yaw in [-pi,pi]; all discard prior bias and pose and begin full cold stationary calibration at a new relative origin. The caller confirms true zero velocity and the actual rigid installation. Without a configured physical mount, use a level sensor with +Z up at the tracking origin. Legacy yaw is the angle of sensor +X in chassis XY, counterclockwise about chassis +Z. The legacy sensor-to-chassis transform is Rz(yaw)*(x,y,z), axes forward/left/up. IMU stationarity checks cannot establish zero constant velocity. STOP=1 requires confirmation=0 and yaw=0 and stops integration. ACK confirms the action, not a valid estimate. Fault, expiry or interruption requires deliberate restart; no automatic recovery. Not saved to FRAM. Requires READY, exact model 1 hardware 0.4.0 with imu_tracking capability and protocol 2.20+. Independent of platform, encoders and fusion; never commands motion or changes control feedback. On protocol 2.23+, a configured physical mount takes precedence over legacy yaw. Use GET_BOARD_MOUNT on 2.24+ for PCB underside-center geometry. On 2.23 use GET_IMU_MOUNT for chip-reference geometry. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, BOARD_IDLE, DRIVERS_ASLEEP. */
  async set_imu_tracking(action, stationary_mount_confirmed, mounting_yaw_rad) {
    if (!Number.isInteger(action) || action < 0 || action > 3 || !Number.isInteger(stationary_mount_confirmed) || stationary_mount_confirmed < 0 || stationary_mount_confirmed > 1) throw new RangeError('Invalid IMU tracking action or confirmation');
    if (!Number.isFinite(mounting_yaw_rad) || Math.abs(mounting_yaw_rad) > Math.PI || (action === 1 ? stationary_mount_confirmed !== 0 || mounting_yaw_rad !== 0 : stationary_mount_confirmed !== 1)) throw new RangeError('Invalid IMU tracking mounting declaration');
    const payload = new ArrayBuffer(10);
    const requestView = new DataView(payload);
    requestView.setUint8(0, action);
    requestView.setUint8(1, stationary_mount_confirmed);
    requestView.setFloat64(2, mounting_yaw_rad, true);
    await this._request(SET_IMU_TRACKING, payload, 0);
  }

  /** Read IMU-only tracking state, fault, flags, sequence, last eligible joint sample-watermark timestamp, wall elapsed time since the source origin capped at window_us and separate accel/gyro ages in microseconds. UINT32_MAX age means unavailable. ESTIMATE_VALID is required for usable current estimates; timestamp and health are not physical accuracy guarantees. A delayed in-window source sample may remain readable briefly after the wall clock reaches the source end. Healthy tracking expires upon the first consumed source watermark at or beyond the end, or by the first serviced status/vector/configuration read at or after end + 50000 us. Missing, stale or invalid input may fault earlier. This is a serviced-read guarantee, not a hard real-time scheduling guarantee. Reads never start tracking. Status and vector sequences must match to combine separate reads. Requires READY, exact model 1 hardware 0.4.0 with imu_tracking capability and protocol 2.20+. Independent of platform, encoders and fusion; never commands motion or changes control feedback. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_imu_tracking_status() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_IMU_TRACKING_STATUS, payload, 28);
    const sample = ImuTrackingStatus.decode(response);
    if (sample.state > 4 || sample.fault > 9 || sample.flags > 15 || sample.reserved !== 0) throw new Error('Invalid IMU tracking status');
    return sample;
  }

  /** Read a compact IMU-only vector selected by kind: POSE=0 (relative metres,metres,radians), TWIST=1 (body metres/second,metres/second,radians/second), BIAS=2 (accel-X,accel-Y metres/second squared and gyro-Z radians/second). SAMPLE_NOT_AVAILABLE means the requested estimate is invalid. Match sequence with GET_IMU_TRACKING_STATUS; never combine mismatched snapshots. Relative integration drifts and has no absolute position or heading reference. Requires READY, exact model 1 hardware 0.4.0 with imu_tracking capability and protocol 2.20+. Independent of platform, encoders and fusion; never commands motion or changes control feedback. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SAMPLE_NOT_AVAILABLE. */
  async get_imu_tracking_vector(kind) {
    if (!Number.isInteger(kind) || kind < 0 || kind > 2) throw new RangeError('Invalid IMU tracking vector kind');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, kind);
    const response = await this._request(GET_IMU_TRACKING_VECTOR, payload, 28);
    const sample = ImuTrackingVector.decode(response);
    if (![sample.x, sample.y, sample.z].every(Number.isFinite)) throw new Error('Invalid IMU tracking vector');
    return sample;
  }

  /** Read mounting yaw and the actual bounded tracking horizon in microseconds. This v0.4 release reports 1000000 us for a one-second motion-onset diagnostic. Always use readback for the connected board horizon. The eligible source interval is [origin, origin + window_us); at 100 Hz it contains 100 source stamps including origin and excluding the end. No estimate at or beyond the source end is published. Reset clears volatile tracking state; reconnect does not start or re-anchor tracking. Requires READY, exact model 1 hardware 0.4.0 with imu_tracking capability and protocol 2.20+. Independent of platform, encoders and fusion; never commands motion or changes control feedback. On protocol 2.23+, a configured physical mount takes precedence over legacy yaw. Use GET_BOARD_MOUNT on 2.24+ for PCB underside-center geometry. On 2.23 use GET_IMU_MOUNT for chip-reference geometry. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_imu_tracking_configuration() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_IMU_TRACKING_CONFIGURATION, payload, 12);
    const sample = ImuTrackingConfiguration.decode(response);
    if (!Number.isFinite(sample.mounting_yaw_rad) || Math.abs(sample.mounting_yaw_rad) > Math.PI || sample.window_us === 0) throw new Error('Invalid IMU tracking configuration');
    return sample;
  }

  /** Choose the board-wide telemetry preference. A change requires stopped outputs, disarmed controllers and stationary observed encoders. An unchanged preference is idempotent. The selector never starts motion, wheel odometry, standalone IMU calibration or a controller. FUSED uses an independent passive instance of the release estimator when its explicit mount and encoder odometry are available. It anchors a new relative frame at the first available source sample serviced after a switch or producer restart. The existing SAVE_CONFIGURATION explicitly persists the preference alongside platform setup; cold restore never restores an origin, bias, stationary declaration or motion target. Requires READY and exact model 1 hardware 0.4.0 with feedback_source_selector and protocol 2.21 or newer. Selection only routes tracking telemetry. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SOURCE_SWITCH_UNSAFE. */
  async set_feedback_source(source) {
    if (!Number.isInteger(source) || source < 0 || source > 2) throw new RangeError('Invalid feedback source');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, source);
    await this._request(SET_FEEDBACK_SOURCE, payload, 0);
  }

  /** Get requested and active source, availability reason and producer detail. Invalid status reports active NONE; no fallback. While valid the sample sequence and monotonic timestamp identify the underlying producer publication. Inspect requested source diagnostics for acquisition ages and fault detail. The standalone IMU is a one-second relative motion-onset diagnostic; fused telemetry uses the existing experimental estimator. Reconnect reads live board state. Requires READY and exact model 1 hardware 0.4.0 with feedback_source_selector and protocol 2.21 or newer. Selection only routes tracking telemetry. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_feedback_source_status() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_FEEDBACK_SOURCE_STATUS, payload, 27);
    const sample = FeedbackSourceStatus.decode(response);
    if (sample.requested > 2 || sample.valid > 1 || sample.reason > 9 || (sample.valid ? sample.active !== sample.requested || sample.reason !== 0 || !sample.max_age_ms || sample.age_us > 1000 * sample.max_age_ms : sample.active !== 255 || sample.reason === 0 || sample.sequence !== 0 || sample.timestamp_us !== 0n || sample.age_us !== 0xffffffff)) throw new Error('Invalid feedback source status');
    return sample;
  }

  /** Get selector-relative pose (metres, metres, unwrapped radians) or body twist (metres/second, metres/second, radians/second), +X forward, +Y left, yaw CCW. Relative XY is rotated into the heading at the new anchor. First capture a valid status, then request both vectors with its exact origin_id and sequence. Eight distinct recent captures are retained for at most 50000 us after capture. Both keys and the current healthy source/frame must match. Selected historical sample age cannot exceed 50000 us for IMU-only, 60000 us for fused, or three configured encoder periods. Expiry or invalidation immediately rejects cached data. A final live status may naturally advance sequence and time; require the same valid requested/active source and origin, match both vector sequences to the original capture and retry on SAMPLE_NOT_AVAILABLE. Compare origins only within the same boot. Requires READY and exact model 1 hardware 0.4.0 with feedback_source_selector and protocol 2.21 or newer. Selection only routes tracking telemetry. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SAMPLE_NOT_AVAILABLE. */
  async get_feedback_source_vector(kind, origin_id, sequence) {
    if (!Number.isInteger(kind) || kind < 0 || kind > 1) throw new RangeError('Invalid feedback vector kind');
    if (![origin_id, sequence].every(value => Number.isInteger(value) && value >= 0 && value <= 0xffffffff)) throw new RangeError('Invalid feedback sample key');
    const payload = new ArrayBuffer(9);
    const requestView = new DataView(payload);
    requestView.setUint8(0, kind);
    requestView.setUint32(1, origin_id, true);
    requestView.setUint32(5, sequence, true);
    const response = await this._request(GET_FEEDBACK_SOURCE_VECTOR, payload, 28);
    const sample = FeedbackSourceVector.decode(response);
    if (![sample.x, sample.y, sample.z].every(Number.isFinite)) throw new Error('Invalid feedback vector');
    return sample;
  }

  /** Declare the legacy centered, level board orientation for passive fused telemetry, with finite board yaw in [-pi,pi]. Requires stopped outputs and disarmed controllers. Each successful command discards prior passive calibration and pose; the observer requires fresh stationary observations. This volatile setting applies only to passive telemetry. Requires READY, exact v0.4 and protocol 2.21+. On protocol 2.23+, a configured physical mount takes precedence over legacy yaw. Use GET_BOARD_MOUNT on 2.24+ for PCB underside-center geometry. On 2.23 use GET_IMU_MOUNT for chip-reference geometry. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SOURCE_SWITCH_UNSAFE. */
  async set_feedback_fusion_mount(mounting_yaw_rad) {
    if (!Number.isFinite(mounting_yaw_rad) || Math.abs(mounting_yaw_rad) > Math.PI) throw new RangeError('Invalid fusion mounting yaw');
    const payload = new ArrayBuffer(8);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, mounting_yaw_rad, true);
    await this._request(SET_FEEDBACK_FUSION_MOUNT, payload, 0);
  }

  /** Read the explicit volatile passive fusion mounting confirmation and board yaw. Reset clears confirmation. Requires READY, exact v0.4 and protocol 2.21+. On protocol 2.23+, a configured physical mount takes precedence over legacy yaw. Use GET_BOARD_MOUNT on 2.24+ for PCB underside-center geometry. On 2.23 use GET_IMU_MOUNT for chip-reference geometry. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_feedback_fusion_mount() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_FEEDBACK_FUSION_MOUNT, payload, 9);
    const sample = FeedbackFusionMount.decode(response);
    if (sample.confirmed > 1 || !Number.isFinite(sample.mounting_yaw_rad) || Math.abs(sample.mounting_yaw_rad) > Math.PI) throw new Error('Invalid feedback fusion mount');
    return sample;
  }

  /** Read producer health independently of selector and control. ENCODER is the running platform encoder batch, IMU_ONLY is physical BMI088 pair availability independent of the one-second estimate, FUSED is the passive fused estimate. Disagreement indicates conflicting observations without assigning sensor blame. HEALTHY means directly usable data. Comparability is separate. Historical provenance remains readable during failure. Reconnect reads board state. Requires READY, exact v0.4 and protocol 2.22+ with feedback_source_health. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_feedback_source_health(source) {
    if (!Number.isInteger(source) || source < 0 || source > 2) throw new RangeError('Invalid feedback source');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, source);
    const response = await this._request(GET_FEEDBACK_SOURCE_HEALTH, payload, 28);
    const sample = FeedbackSourceHealth.decode(response);
    if (sample.source !== source) throw new FeedbackSourceMismatchError(source, sample.source);
    if (sample.health > FeedbackSourceHealthState.INDETERMINATE || sample.reason > FeedbackSourceReason.MOUNT_REQUIRED || sample.detail > FusionFault.INHIBITED) throw new Error('Invalid feedback source health');
    return sample;
  }

  /** Read independent last observed accelerometer and gyro acquisition times in board uptime microseconds. A timestamp of zero and age UINT32_MAX indicate no observed acquisition. These are physical source observations, independent of the finite IMU-only tracking window. A pair must meet the 35000 us age and 15000 us skew limits. Requires READY, exact v0.4 and protocol 2.22+ with feedback_source_health. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_feedback_imu_channels() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_FEEDBACK_IMU_CHANNELS, payload, 24);
    const sample = FeedbackImuChannels.decode(response);
    if ((!sample.accel_timestamp_us && sample.accel_age_us !== 0xffffffff) || (!sample.gyro_timestamp_us && sample.gyro_age_us !== 0xffffffff)) throw new Error('Invalid feedback IMU channel provenance');
    return sample;
  }

  /** Legacy chip-reference API, deprecated for new installations. Set the complete rigid mount for IMU-only and fused tracking on a stopped, disarmed v0.4. The board-to-chassis rotation is Rz(yaw) Ry(pitch) Rx(roll). A changed mount requires fresh tracking initialization. SAVE_CONFIGURATION persists this geometry. Requires READY and protocol 2.23+ with imu_mounting. XYZ refers to the BMI088 chip. Use SET_BOARD_MOUNT for the PCB underside center. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SOURCE_SWITCH_UNSAFE. */
  async set_imu_mount(roll_cdeg, pitch_cdeg, yaw_cdeg, x_um, y_um, z_um) {
    if (!Number.isInteger(roll_cdeg) || roll_cdeg < -18000 || roll_cdeg > 18000) throw new RangeError('Invalid mount roll_cdeg');
    if (!Number.isInteger(pitch_cdeg) || pitch_cdeg < -9000 || pitch_cdeg > 9000) throw new RangeError('Invalid mount pitch_cdeg');
    if (!Number.isInteger(yaw_cdeg) || yaw_cdeg < -18000 || yaw_cdeg > 18000) throw new RangeError('Invalid mount yaw_cdeg');
    if (!Number.isInteger(x_um) || x_um < -10000000 || x_um > 10000000) throw new RangeError('Invalid mount x_um');
    if (!Number.isInteger(y_um) || y_um < -10000000 || y_um > 10000000) throw new RangeError('Invalid mount y_um');
    if (!Number.isInteger(z_um) || z_um < -10000000 || z_um > 10000000) throw new RangeError('Invalid mount z_um');
    const payload = new ArrayBuffer(18);
    const requestView = new DataView(payload);
    requestView.setInt16(0, roll_cdeg, true);
    requestView.setInt16(2, pitch_cdeg, true);
    requestView.setInt16(4, yaw_cdeg, true);
    requestView.setInt32(6, x_um, true);
    requestView.setInt32(10, y_um, true);
    requestView.setInt32(14, z_um, true);
    await this._request(SET_IMU_MOUNT, payload, 0);
  }

  /** Legacy chip-reference API, deprecated for new installations. Read the shared physical mount. When configured is false, IMU-only uses its legacy sensor yaw and fusion its legacy board yaw. Requires READY and protocol 2.23+ with imu_mounting. XYZ is the BMI088 chip position, including when derived from a PCB underside-center installation. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_imu_mount() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_IMU_MOUNT, payload, 19);
    return ImuMountConfiguration.decode(response);
  }

  /** Set the rigid mount on a stopped, disarmed Mini. XYZ is the displacement in chassis axes from the tracking origin to the geometric center of the PCB underside. Board-to-chassis rotation is Rz(yaw) Ry(pitch) Rx(roll). Firmware derives the chip offset. SAVE_CONFIGURATION persists the entered board pose. Requires READY, exact v0.4 imu_mounting and protocol 2.24+. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SOURCE_SWITCH_UNSAFE. */
  async set_board_mount(roll_cdeg, pitch_cdeg, yaw_cdeg, x_um, y_um, z_um) {
    if (!Number.isInteger(roll_cdeg) || roll_cdeg < -18000 || roll_cdeg > 18000) throw new RangeError('Invalid mount roll_cdeg');
    if (!Number.isInteger(pitch_cdeg) || pitch_cdeg < -9000 || pitch_cdeg > 9000) throw new RangeError('Invalid mount pitch_cdeg');
    if (!Number.isInteger(yaw_cdeg) || yaw_cdeg < -18000 || yaw_cdeg > 18000) throw new RangeError('Invalid mount yaw_cdeg');
    if (!Number.isInteger(x_um) || x_um < -10000000 || x_um > 10000000) throw new RangeError('Invalid mount x_um');
    if (!Number.isInteger(y_um) || y_um < -10000000 || y_um > 10000000) throw new RangeError('Invalid mount y_um');
    if (!Number.isInteger(z_um) || z_um < -10000000 || z_um > 10000000) throw new RangeError('Invalid mount z_um');
    const payload = new ArrayBuffer(18);
    const requestView = new DataView(payload);
    requestView.setInt16(0, roll_cdeg, true);
    requestView.setInt16(2, pitch_cdeg, true);
    requestView.setInt16(4, yaw_cdeg, true);
    requestView.setInt32(6, x_um, true);
    requestView.setInt32(10, y_um, true);
    requestView.setInt32(14, z_um, true);
    await this._request(SET_BOARD_MOUNT, payload, 0);
  }

  /** Read the applied board orientation and geometric PCB underside center in chassis coordinates. Legacy chip mounts are converted. When unconfigured all coordinates and angles are zero. Requires READY, exact v0.4 imu_mounting and protocol 2.24+. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_board_mount() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_BOARD_MOUNT, payload, 19);
    return BoardMountConfiguration.decode(response);
  }

  /** Initialize four mecanum wheels with an explicit 45-degree roller layout. Requires protocol 2.25 and a READY session. Motor/encoder indices 0, 1, 2, 3 are front right, rear right, rear left, front left. Length and width are positive front-to-rear and side-to-side wheel-center spacings in meters. STANDARD uses yaw lever (width + length)/2. MIRRORED uses (width - length)/2 and requires unequal spacings. Invalid orientation or geometry leaves the running setup unchanged. Errors: DRIVERS_ASLEEP, BOARD_IDLE, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY. */
  async initialize_mecanum_platform_oriented(is_reversed_0, is_reversed_1, is_reversed_2, is_reversed_3, is_encoder_reversed_0, is_encoder_reversed_1, is_encoder_reversed_2, is_encoder_reversed_3, length, width, wheels_diameter, encoder_resolution, roller_orientation) {
    if (![is_reversed_0, is_reversed_1, is_reversed_2, is_reversed_3, is_encoder_reversed_0, is_encoder_reversed_1, is_encoder_reversed_2, is_encoder_reversed_3].every(v => v === true || v === false || v === 0 || v === 1)) throw new RangeError('Invalid motor or encoder reversal');
    if (!Object.values(MecanumRollerOrientation).includes(roller_orientation)) throw new RangeError('Unknown mecanum roller arrangement');
    if (![length, width, wheels_diameter].every(v => Number.isFinite(v) && v > 0) || !Number.isFinite(encoder_resolution) || encoder_resolution < 0) throw new RangeError('Enter positive dimensions and nonnegative encoder resolution');
    const lever = width * 0.5 + (roller_orientation === MecanumRollerOrientation.MIRRORED ? -length : length) * 0.5;
    if (!Number.isFinite(1 / lever) || !Number.isFinite(2 / wheels_diameter)) throw new RangeError('Unusable mecanum geometry: check wheel diameter and wheel-center spacings. Mirrored rollers require unequal length and width for yaw');
    const payload = new ArrayBuffer(41);
    const requestView = new DataView(payload);
    requestView.setUint8(0, is_reversed_0);
    requestView.setUint8(1, is_reversed_1);
    requestView.setUint8(2, is_reversed_2);
    requestView.setUint8(3, is_reversed_3);
    requestView.setUint8(4, is_encoder_reversed_0);
    requestView.setUint8(5, is_encoder_reversed_1);
    requestView.setUint8(6, is_encoder_reversed_2);
    requestView.setUint8(7, is_encoder_reversed_3);
    requestView.setFloat64(8, length, true);
    requestView.setFloat64(16, width, true);
    requestView.setFloat64(24, wheels_diameter, true);
    requestView.setFloat64(32, encoder_resolution, true);
    requestView.setUint8(40, roller_orientation);
    await this._request(INITIALIZE_MECANUM_PLATFORM_ORIENTED, payload, 0);
  }

  /** Initialize a 120-degree, three-wheel Omni platform in the marked chassis frame (+X forward, +Y left, positive yaw counterclockwise). Requires READY and protocol 2.26. REAR places W0 front right, W1 front left and W2 rear. FRONT rotates the complete triangle 180 degrees: W0 rear left, W1 rear right and W2 front. Motor and encoder indices stay attached to those wheels, with independent reversal flags. Dimensions must be positive and encoder resolution nonnegative. Invalid requests leave the running setup unchanged. Errors: DRIVERS_ASLEEP, INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY. */
  async initialize_omni_platform_oriented(is_reversed_0, is_reversed_1, is_reversed_2, is_encoder_reversed_0, is_encoder_reversed_1, is_encoder_reversed_2, wheels_diameter, robot_radius, encoder_resolution, wheel_orientation) {
    if (![is_reversed_0, is_reversed_1, is_reversed_2, is_encoder_reversed_0, is_encoder_reversed_1, is_encoder_reversed_2].every(v => v === true || v === false || v === 0 || v === 1)) throw new RangeError('Invalid motor or encoder reversal');
    if (!Object.values(OmniWheelOrientation).includes(wheel_orientation)) throw new RangeError('Unknown omni wheel arrangement');
    if (![wheels_diameter, robot_radius].every(v => Number.isFinite(v) && v > 0) || !Number.isFinite(2 / wheels_diameter) || !Number.isFinite(1 / robot_radius) || !Number.isFinite(encoder_resolution) || encoder_resolution < 0) throw new RangeError('Enter positive dimensions and nonnegative encoder resolution');
    const payload = new ArrayBuffer(31);
    const requestView = new DataView(payload);
    requestView.setUint8(0, is_reversed_0);
    requestView.setUint8(1, is_reversed_1);
    requestView.setUint8(2, is_reversed_2);
    requestView.setUint8(3, is_encoder_reversed_0);
    requestView.setUint8(4, is_encoder_reversed_1);
    requestView.setUint8(5, is_encoder_reversed_2);
    requestView.setFloat64(6, wheels_diameter, true);
    requestView.setFloat64(14, robot_radius, true);
    requestView.setFloat64(22, encoder_resolution, true);
    requestView.setUint8(30, wheel_orientation);
    await this._request(INITIALIZE_OMNI_PLATFORM_ORIENTED, payload, 0);
  }
}
