// Generated from tools/commands.json by tools/sdkgenerator.py. Do not edit.
export const SDK_VERSION = Object.freeze([2, 6, 0]);
export const PROTOCOL_VERSION = Object.freeze([2, 13, 0]);
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
});
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

  /** This command initializes a motor and prepares it for use. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels), so platform wheels are not reconfigured out from under the platform. Stops the motor velocity and position controllers before applying the command. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, INIT_REQUIRED. */
  async initialize_motor(motor_index, is_reversed) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setUint8(1, is_reversed);
    await this._request(INITIALIZE_MOTOR, payload, 0);
  }

  /** This command sets the speed of the specified motor in PWM. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels); use the platform velocity commands to drive platform wheels. Stops the motor velocity and position controllers before applying the command. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, MOTOR_NOT_INITIALIZED, INIT_REQUIRED. */
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

  /** Stops the motor's velocity and position controllers and applies a short brake, connecting both motor terminals to the same bridge rail to resist rotation. On dual-PWM boards both PWM control inputs are high. On V4 enable/direction boards DISABLE is low and EN duty is zero; direction does not affect braking. The command ID and payload are the same for all boards; firmware selects the hardware behavior from the board configuration. Short braking does not regulate or hold a specific position. A motor owned by an active platform is rejected with MOTOR_OWNED; use BRAKE_PLATFORM for platform wheels. Re-initialize the motor controller before using target-speed control again. Use STOP_MOTOR to coast instead. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED. */
  async brake_motor(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    await this._request(BRAKE_MOTOR, payload, 0);
  }

  /** This command sets the controller for the specified motor. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels), so it cannot create a competing controller on a platform wheel. Firmware 2.3.1 uses direct P+I+D PWM output with saturation anti-windup; retune gains from earlier builds. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, INIT_REQUIRED. */
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

  /** This command sets the target speed for the specified motor in radians. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels); use SET_PLATFORM_TARGET_VELOCITY to drive platform wheels. Suspends position mode; a new SET_MOTOR_POSITION reactivates it. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, CONTROLLER_NOT_INITIALIZED, INIT_REQUIRED. */
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

  /** This command initializes a mecanum (4-wheel) platform and prepares it for use. It uses motor and encoder indices 0, 1, 2 and 3 (one per wheel), which correspond to the is_reversed_0..3 and is_encoder_reversed_0..3 parameters. All four motor slots are occupied by this platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
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

  /** This command initializes an omni (3-wheel) platform and prepares it for use. It uses motor and encoder indices 0, 1 and 2 (one per wheel), which correspond to the is_reversed_0..2 and is_encoder_reversed_0..2 parameters. Motor index 3 is not used by this platform and stays free for other purposes. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
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

  /** This command initializes a differential (2-wheel) platform and prepares it for use. It uses motor and encoder index 0 for the left wheel and index 1 for the right wheel, which correspond to the is_reversed_0/1 and is_encoder_reversed_0/1 parameters. Motor indices 2 and 3 are not used by this platform and stay free for other purposes. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED. */
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

  /** This command sets the velocity for the platform in PWM. Stops platform velocity and position control before applying PWM. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, PLATFORM_NOT_INITIALIZED, INIT_REQUIRED. */
  async set_platform_velocity(x, y, t) {
    const payload = new ArrayBuffer(24);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, x, true);
    requestView.setFloat64(8, y, true);
    requestView.setFloat64(16, t, true);
    await this._request(SET_PLATFORM_VELOCITY, payload, 0);
  }

  /** This command sets the controller for the platform. Firmware 2.3.1 uses direct P+I+D PWM output with saturation anti-windup; retune gains from earlier builds. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, PLATFORM_NOT_INITIALIZED, INIT_REQUIRED. */
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

  /** This command set the target velocity for the platform in meters per second. Cancels platform position control; initialize it again before another pose target. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, PLATFORM_NOT_INITIALIZED, CONTROLLER_NOT_INITIALIZED, INIT_REQUIRED. */
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

  /** This command starts the odometry calculation for the platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY, PLATFORM_NOT_INITIALIZED. */
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

  /** Stops the platform velocity and position controllers and applies a short brake to this platform's wheel motors using the selected board's motor control model. Other motors are not affected. The brake resists motion until a new command is issued; it does not regulate or hold a specific position. Call START_PLATFORM_CONTROLLER again to resume closed-loop platform control. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
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

  /** Create or replace this connection's subscription for an odometry source. Requires READY, enabled heartbeat and running odometry. The interval must be at least twice the calculation period. Stop or reset pauses delivery until a fresh sample is available. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CLOCK_NOT_READY, ODOMETRY_NOT_INITIALIZED.
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

  /** Initialize a bounded proportional position loop over an already running motor velocity controller. Zero is the current encoder position; initially holds zero. Stop/delete/reinitialize of velocity control discards position tuning. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, MOTOR_OWNED. */
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

  /** Set an absolute multi-turn angle in radians relative to the last position initialization/reset. Requires initialized position and velocity controllers. Reactivates position mode after a velocity override. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, MOTOR_OWNED. */
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

  /** Initialize bounded pose control after START_PLATFORM_CONTROLLER. Starts odometry if needed, preserves its world frame and zeros velocity targets. No motion until SET_PLATFORM_POSITION. Supports omni, mecanum and differential bases. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, PLATFORM_NOT_INITIALIZED, ENCODER_NOT_INITIALIZED. */
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

  /** Set absolute (x,y,t) in the current odometry world frame: meters, meters, radians. Heading uses the shortest angular path. Requires initialized position control and fresh odometry. Differential bases approach the point before aligning final heading. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, PLATFORM_NOT_INITIALIZED, ODOMETRY_NOT_INITIALIZED, SAMPLE_NOT_AVAILABLE. */
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

  /** Initialize a position PID over the existing velocity controller. Initialize a bounded position PID loop over an already running motor velocity controller. Zero is the current encoder position; initially holds zero. Stop/delete/reinitialize of velocity control discards position tuning. Clears position PID history. Ki and Kd may be zero to disable I and D. Integral limits bound the integral velocity contribution. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, MOTOR_OWNED. */
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

  /** Initialize a position PID over the existing velocity controller. Initialize bounded pose control after START_PLATFORM_CONTROLLER. Starts odometry if needed, preserves its world frame and zeros velocity targets. No motion until SET_PLATFORM_POSITION. Supports omni, mecanum and differential bases. Clears position PID history. Ki and Kd may be zero to disable I and D. Integral limits bound the integral velocity contribution. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, INIT_REQUIRED, CONTROLLER_NOT_INITIALIZED, PLATFORM_NOT_INITIALIZED, ENCODER_NOT_INITIALIZED. */
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

  /** Create or replace this connection's subscription for a topic and resource. Requires READY and enabled heartbeat. Odometry must be running. The interval must meet the topic minimum and, for odometry, be at least twice the calculation period. Failed reads pause delivery until recovery. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, ODOMETRY_NOT_INITIALIZED, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SUBSCRIPTION_LIMIT, SAMPLE_OUT_OF_RANGE. */
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

  /** Create or replace this connection's subscription with a delivery mode. Requires READY and enabled heartbeat. The interval sets the sampling cadence and must meet the topic minimum; odometry also requires twice the calculation period. ON_CHANGE sends an initial snapshot and changed values, excluding timestamp and clock metadata. Failed reads pause delivery; recovery sends a fresh snapshot. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, ODOMETRY_NOT_INITIALIZED, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SUBSCRIPTION_LIMIT, SAMPLE_OUT_OF_RANGE. */
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

  /** Stop the initialized motor and its controller, clear latched driver faults, and return fresh diagnostics. Requires a ready connection. The motor remains stopped. Active conditions can remain reported. Platform-owned motors are rejected. Driver configuration is preserved; sleeping drivers are not woken. A failed clear or unreadable verification returns an error. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, SENSOR_NOT_AVAILABLE, MOTOR_OWNED, MOTOR_NOT_INITIALIZED, INTERNAL_ERROR, CLOCK_NOT_READY. */
  async clear_motor_faults(motor_index) {
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    const response = await this._request(CLEAR_MOTOR_FAULTS, payload, 10);
    return MotorFaultStatus.decode(response);
  }

  /** Read the applied hardware current-regulation setting in milliamps. Requires a ready connection and an initialized, awake motor driver. Does not change motor state. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, MOTOR_NOT_INITIALIZED, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR. */
  async get_motor_current_limit(motor_index) {
    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    const response = await this._request(GET_MOTOR_CURRENT_LIMIT, payload, 3);
    return MotorCurrentLimit.decode(response);
  }

  /** Stop the motor and its controller, apply and verify hardware current regulation, and return the applied setting. Requires a ready connection and an initialized, awake driver. Only board-supported thresholds are accepted. Platform-owned motors are rejected. The motor stays stopped. Settings are volatile; motor reinitialization applies board defaults. Driver power loss requires reinitialization. Overcurrent protection is unchanged. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, MOTOR_NOT_INITIALIZED, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, MOTOR_OWNED. */
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

  /** Create or replace a subscription with independent trigger and delivery settings. Send an initial snapshot. PERIODIC uses poll_interval_ms; ON_EVENT requires zero polling interval and an event-capable source. ON_CHANGE suppresses unchanged values, excluding timestamp and clock metadata; max_silence_ms requests fresh refreshes, or zero disables refreshes. Delivery is best effort and requires READY and heartbeat. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, ODOMETRY_NOT_INITIALIZED, SENSOR_NOT_AVAILABLE, INTERNAL_ERROR, SUBSCRIPTION_LIMIT, SAMPLE_OUT_OF_RANGE. */
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

  /** Stop all motors and motor/platform controllers, then set the board-wide PWM frequency. All motors remain stopped. The setting survives motor initialization and connection changes; reboot restores the board default. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INIT_REQUIRED, CLOCK_NOT_READY, INTERNAL_ERROR. */
  async set_pwm_frequency(frequency_hz) {
    if (!Object.values(PwmFrequency).includes(frequency_hz)) throw new RangeError('Invalid PWM frequency');
    const payload = new ArrayBuffer(4);
    const requestView = new DataView(payload);
    requestView.setUint32(0, frequency_hz, true);
    const response = await this._request(SET_PWM_FREQUENCY, payload, 4);
    const view = payloadView(response, 4);
    return view.getUint32(0, true);
  }
}
