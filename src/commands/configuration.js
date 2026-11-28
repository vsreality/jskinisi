import { MecanumRollerOrientation } from './kinisi_commands.js';
import { supportsMecanumOrientation } from './board_profile.js';

/** Field IDs for protocol 2.14 GET_CONFIGURATION_FIELD (values are scalars). */
export const ConfigurationField = Object.freeze({
  PLATFORM_TYPE: 0, WHEEL_DIAMETER: 1, TRACK_OR_LENGTH: 2, WIDTH_OR_RADIUS: 3,
  ENCODER_RESOLUTION: 4, ENCODER_REVERSED: 5, MOTOR_REVERSED: 6, MECANUM_ROLLER_ORIENTATION: 7,
});

const platforms = { 1: ['differential', 2], 2: ['omni', 3], 3: ['mecanum', 4] };

/** Field 7 is available on every protocol 2.25 controller with a running mecanum setup. */
export async function readMecanumRollerOrientation(controller) {
  const value = await controller.get_configuration_field(ConfigurationField.MECANUM_ROLLER_ORIENTATION, 0);
  if (!Object.values(MecanumRollerOrientation).includes(value)) throw new Error('Board returned an unknown mecanum roller arrangement');
  return value;
}

/** Read applied setup without initializing hardware, starting motion, or writing FRAM. */
export async function readRunningConfiguration(controller) {
  const read = (field, index = 0) => controller.get_configuration_field(field, index);
  const type = await read(ConfigurationField.PLATFORM_TYPE);
  if (type === 0) return null;
  if (!Object.hasOwn(platforms, type)) throw new Error('Board returned an unknown platform type. Update the client before saving.');
  const [platform, count] = platforms[type];
  const wheelDiameter = await read(ConfigurationField.WHEEL_DIAMETER);
  const trackOrLength = platform === 'omni' ? null : await read(ConfigurationField.TRACK_OR_LENGTH);
  const widthOrRadius = platform === 'differential' ? null : await read(ConfigurationField.WIDTH_OR_RADIUS);
  let rollerOrientation;
  if (platform === 'mecanum') rollerOrientation = supportsMecanumOrientation(controller.boardInfo)
    ? await readMecanumRollerOrientation(controller) : MecanumRollerOrientation.STANDARD;
  const encoders = [], motorReversed = [];
  // All four slots matter: an unused platform wheel may still have separately
  // applied motor/encoder setup. Zero resolution means no initialized encoder.
  for (let index = 0; index < 4; index++) {
    const resolution = await read(ConfigurationField.ENCODER_RESOLUTION, index);
    const reversed = await read(ConfigurationField.ENCODER_REVERSED, index);
    const motor = await read(ConfigurationField.MOTOR_REVERSED, index);
    if (!(Number.isFinite(resolution) && resolution >= 0) || ![0, 1].includes(reversed) || ![0, 1].includes(motor))
      throw new Error('Board returned invalid encoder or motor setup. Read again before saving.');
    encoders.push({ resolution, reversed: reversed === 1 });
    motorReversed.push(motor === 1);
  }
  const pwmHz = await controller.get_pwm_frequency();
  const dimensions = [wheelDiameter, trackOrLength, widthOrRadius].filter(value => value !== null);
  if (!dimensions.every(value => Number.isFinite(value) && value > 0) || !Number.isInteger(pwmHz) || pwmHz <= 0)
    throw new Error('Board returned invalid geometry or PWM frequency. Read again before saving.');
  return { platform, channelCount: count, wheelDiameter, trackOrLength, widthOrRadius, encoders, motorReversed, pwmHz, rollerOrientation };
}
