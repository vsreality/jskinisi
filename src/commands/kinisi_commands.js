// Generated from tools/commands.json by tools/sdkgenerator.py. Do not edit.
export const SDK_VERSION = Object.freeze([2, 0, 0]);
export const PROTOCOL_VERSION = Object.freeze([2, 0, 0]);
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
});
export const ErrorDescriptions = Object.freeze({
  1: "The requested protocol version is incompatible with this firmware.",
  2: "A field is invalid, out of range, or inconsistent with the pending request.",
  3: "The received command ID is not accepted by the controller.",
  4: "The complete message has an invalid header or payload length.",
  5: "The motor belongs to a platform; use the corresponding platform command.",
  6: "The controller could not execute or encode the operation.",
  7: "Initial clock setup is incomplete; wait for READY. Uptime mode also supports READY.",
  8: "Initial time sync exhausted its attempts without a valid sample.",
  9: "Odometry is not running; start odometry before requesting a measurement.",
  10: "Odometry is running but has no measurement yet, including immediately after reset; retry after an update.",
  11: "Initialize the encoder before reading it or starting encoder odometry.",
  12: "Initialize a platform before performing this operation.",
  13: "Initialize the motor before setting its speed.",
  14: "Start or initialize the closed-loop controller before setting its target.",
  15: "Send a valid INIT request before performing this connection-dependent operation.",
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

/** Generated user commands; session framing belongs to KinisiSession. */
export class Commands {
  /** Implemented by a transport session. */
  async _request(_command, _payload, _responseLength) { throw new Error("No protocol session"); }

  /** This command initializes a motor and prepares it for use. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels), so platform wheels are not reconfigured out from under the platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED. */
  async initialize_motor(motor_index, is_reversed) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setUint8(1, is_reversed);
    await this._request(INITIALIZE_MOTOR, payload, 0);
  }

  /** This command sets the speed of the specified motor in PWM. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels); use the platform velocity commands to drive platform wheels. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, MOTOR_NOT_INITIALIZED. */
  async set_motor_speed(motor_index, pwm) {
    const payload = new ArrayBuffer(9);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setFloat64(1, pwm, true);
    await this._request(SET_MOTOR_SPEED, payload, 0);
  }

  /** Coasts the motor to a stop: both H-bridge outputs are driven low, leaving the motor terminals open (high impedance) so it free-wheels and spins down gradually under its own friction. This also stops that motor's closed-loop speed controller if one is running (started via INITIALIZE_MOTOR_CONTROLLER), so the PID loop cannot re-drive the motor; to command the motor by target speed again you must re-initialize its controller. This is a single-motor command and is ignored if the motor is currently owned by an active platform (one of its wheels); to stop a platform, use STOP_PLATFORM_CONTROLLER, COAST_PLATFORM or BRAKE_PLATFORM instead. Use STOP_MOTOR for a soft, low-stress stop; use BRAKE_MOTOR when you need the motor to hold position and stop quickly. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED. */
  async stop_motor(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    await this._request(STOP_MOTOR, payload, 0);
  }

  /** Actively brakes the motor (short brake): both H-bridge outputs are driven high, shorting the motor terminals together so the motor's own back-EMF resists rotation and it stops quickly and holds position. This also stops that motor's closed-loop speed controller if one is running (started via INITIALIZE_MOTOR_CONTROLLER), so the PID loop cannot re-drive the motor; to command the motor by target speed again you must re-initialize its controller. This is a single-motor command and is ignored if the motor is currently owned by an active platform (one of its wheels); to brake a platform, use BRAKE_PLATFORM (or STOP_PLATFORM_CONTROLLER / COAST_PLATFORM) instead. Use BRAKE_MOTOR for a fast, holding stop; use STOP_MOTOR to let the motor coast freely instead. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED. */
  async brake_motor(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    await this._request(BRAKE_MOTOR, payload, 0);
  }

  /** This command sets the controller for the specified motor. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels), so it cannot create a competing controller on a platform wheel. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED. */
  async initialize_motor_controller(motor_index, is_reversed, encoder_index, is_encoder_reversed, encoder_resolution, kp, ki, kd, integral_limit) {
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

  /** This command sets the target speed for the specified motor in radians. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels); use SET_PLATFORM_TARGET_VELOCITY to drive platform wheels. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED, CONTROLLER_NOT_INITIALIZED. */
  async set_motor_target_speed(motor_index, speed) {
    const payload = new ArrayBuffer(9);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    requestView.setFloat64(1, speed, true);
    await this._request(SET_MOTOR_TARGET_SPEED, payload, 0);
  }

  /** This command resets the closed-loop controller for the specified motor: it clears the accumulated PID state (integrator windup, derivative history and internal output) and re-zeros the target speed, while keeping the controller running with its existing tuning (kp/ki/kd). Use it to recover from integrator windup or to bring a motor cleanly to a stop without deleting and re-initializing the controller. No effect if no controller is running for that motor, and ignored if the motor is currently owned by an active platform (one of its wheels). Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED. */
  async reset_motor_controller(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    await this._request(RESET_MOTOR_CONTROLLER, payload, 0);
  }

  /** This command gets the state of the controller for the specified motor. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async get_motor_controller_state(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    const response = await this._request(GET_MOTOR_CONTROLLER_STATE, payload, 57);
    return MotorControllerState.decode(response);
  }

  /** This command deletes the controller for the specified motor. Rejected with MOTOR_OWNED if the motor is currently owned by an active platform (one of its wheels); use STOP_PLATFORM_CONTROLLER to stop the platform controller instead. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, MOTOR_OWNED. */
  async delete_motor_controller(motor_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, motor_index);
    await this._request(DELETE_MOTOR_CONTROLLER, payload, 0);
  }

  /** This command sets the global update frequency (in Hz) of the closed-loop motor controller task. All motor controllers share a single control loop, so this frequency is global and affects every currently running controller as well as any created afterwards; the PID sampling time is updated to match. The requested value is clamped to the supported range of 1 to 1000 Hz (the 1000 Hz maximum is bounded by the 1 ms RTOS tick). The value is then quantized to the 1 ms RTOS tick (period_ms = 1000 / frequency), so effective frequencies are 1000/N Hz. A value of 0 is invalid and ignored. Defaults to 10 Hz (100 ms) at start-up. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async set_controller_frequency(frequency) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint16(0, frequency, true);
    await this._request(SET_CONTROLLER_FREQUENCY, payload, 0);
  }

  /** This command retrieves the current global update frequency (in Hz) of the closed-loop motor controller task. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async get_controller_frequency() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_CONTROLLER_FREQUENCY, payload, 2);
    const view = payloadView(response, 2);
    return view.getUint16(0, true);
  }

  /** This command initializes an encoder and prepares it for use. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async initialize_encoder(encoder_index, encoder_resolution, is_reversed) {
    const payload = new ArrayBuffer(10);
    const requestView = new DataView(payload);
    requestView.setUint8(0, encoder_index);
    requestView.setFloat64(1, encoder_resolution, true);
    requestView.setUint8(9, is_reversed);
    await this._request(INITIALIZE_ENCODER, payload, 0);
  }

  /** This command retrieves the current value of the encoder. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, ENCODER_NOT_INITIALIZED. */
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

  /** This command resets the odometry calculation for the specified encoder. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async reset_encoder_odometry(encoder_index) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, encoder_index);
    await this._request(RESET_ENCODER_ODOMETRY, payload, 0);
  }

  /** This command stops the odometry calculation for the specified encoder. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
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

  /** This command sets the global update frequency (in Hz) of the odometry task. A single odometry task integrates all encoder and platform odometry, so this frequency is global. The requested value is clamped to the supported range of 1 to 1000 Hz (the 1000 Hz maximum is bounded by the 1 ms RTOS tick). The value is then quantized to the 1 ms RTOS tick (period_ms = 1000 / frequency), so effective frequencies are 1000/N Hz. A value of 0 is invalid and ignored. Defaults to 20 Hz (50 ms) at start-up. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async set_odometry_frequency(frequency) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint16(0, frequency, true);
    await this._request(SET_ODOMETRY_FREQUENCY, payload, 0);
  }

  /** This command retrieves the current global update frequency (in Hz) of the odometry task. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async get_odometry_frequency() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_ODOMETRY_FREQUENCY, payload, 2);
    const view = payloadView(response, 2);
    return view.getUint16(0, true);
  }

  /** This command initializes a digital pin and prepares it for use. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async initialize_gpio_pin(pin_number, mode) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint8(0, pin_number);
    requestView.setUint8(1, mode);
    await this._request(INITIALIZE_GPIO_PIN, payload, 0);
  }

  /** This command sets the specified pin to a state. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async set_gpio_pin_state(pin_number, state) {
    const payload = new ArrayBuffer(2);
    const requestView = new DataView(payload);
    requestView.setUint8(0, pin_number);
    requestView.setUint8(1, state);
    await this._request(SET_GPIO_PIN_STATE, payload, 0);
  }

  /** This command gets the state of the specified pin. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async get_gpio_pin_state(pin_number) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, pin_number);
    const response = await this._request(GET_GPIO_PIN_STATE, payload, 1);
    const view = payloadView(response, 1);
    return view.getUint8(0);
  }

  /** This command toggles the specified pin. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async toggle_gpio_pin_state(pin_number) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, pin_number);
    await this._request(TOGGLE_GPIO_PIN_STATE, payload, 0);
  }

  /** This command sets the status LED to a state. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async set_status_led_state(state) {
    const payload = new ArrayBuffer(1);
    const requestView = new DataView(payload);
    requestView.setUint8(0, state);
    await this._request(SET_STATUS_LED_STATE, payload, 0);
  }

  /** This command toggles the status LED. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async toggle_status_led_state() {
    const payload = new ArrayBuffer(0);
    await this._request(TOGGLE_STATUS_LED_STATE, payload, 0);
  }

  /** This command initializes a mecanum (4-wheel) platform and prepares it for use. It uses motor and encoder indices 0, 1, 2 and 3 (one per wheel), which correspond to the is_reversed_0..3 and is_encoder_reversed_0..3 parameters. All four motor slots are occupied by this platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
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

  /** This command initializes an omni (3-wheel) platform and prepares it for use. It uses motor and encoder indices 0, 1 and 2 (one per wheel), which correspond to the is_reversed_0..2 and is_encoder_reversed_0..2 parameters. Motor index 3 is not used by this platform and stays free for other purposes. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
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

  /** This command initializes a differential (2-wheel) platform and prepares it for use. It uses motor and encoder index 0 for the left wheel and index 1 for the right wheel, which correspond to the is_reversed_0/1 and is_encoder_reversed_0/1 parameters. Motor indices 2 and 3 are not used by this platform and stay free for other purposes. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
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

  /** This command sets the velocity for the platform in PWM. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, PLATFORM_NOT_INITIALIZED. */
  async set_platform_velocity(x, y, t) {
    const payload = new ArrayBuffer(24);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, x, true);
    requestView.setFloat64(8, y, true);
    requestView.setFloat64(16, t, true);
    await this._request(SET_PLATFORM_VELOCITY, payload, 0);
  }

  /** This command sets the controller for the platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, PLATFORM_NOT_INITIALIZED. */
  async start_platform_controller(kp, ki, kd, integral_limit) {
    const payload = new ArrayBuffer(32);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, kp, true);
    requestView.setFloat64(8, ki, true);
    requestView.setFloat64(16, kd, true);
    requestView.setFloat64(24, integral_limit, true);
    await this._request(START_PLATFORM_CONTROLLER, payload, 0);
  }

  /** This command set the target velocity for the platform in meters per second. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR, PLATFORM_NOT_INITIALIZED, CONTROLLER_NOT_INITIALIZED. */
  async set_platform_target_velocity(x, y, t) {
    const payload = new ArrayBuffer(24);
    const requestView = new DataView(payload);
    requestView.setFloat64(0, x, true);
    requestView.setFloat64(8, y, true);
    requestView.setFloat64(16, t, true);
    await this._request(SET_PLATFORM_TARGET_VELOCITY, payload, 0);
  }

  /** This command gets the current velocity of the platform in meters per second. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
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

  /** This command resets the odometry calculation for the platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async reset_platform_odometry() {
    const payload = new ArrayBuffer(0);
    await this._request(RESET_PLATFORM_ODOMETRY, payload, 0);
  }

  /** This command stops the odometry calculation for the platform. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
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

  /** This command actively brakes all of this platform's wheel motors (short brake) so they resist motion and hold position, and stops the platform velocity controller if it is running (you must call START_PLATFORM_CONTROLLER again to resume closed-loop platform control). Motors used outside this platform are not affected. The motors resist motion until a new command is issued. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
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

  /** Read this connection's clock mode, quality, interval and age. Errors: INVALID_LENGTH, INVALID_ARGUMENT, INTERNAL_ERROR. */
  async get_time_status() {
    const payload = new ArrayBuffer(0);
    const response = await this._request(GET_TIME_STATUS, payload, 14);
    return TimeStatus.decode(response);
  }
}
