import { Topic, TopicDefinitions } from './kinisi_commands.js';
import { getBoardProfile, hasBoardSensor, supportsMotorCurrent, supportsMotorFaults } from './board_profile.js';

export function supportsTelemetry(info) {
  return info?.protocol_major === 2 && info.protocol_minor >= 6;
}

/** Check static hardware availability; firmware validates runtime prerequisites. */
export function supportsTopic(info, topic, index = 0) {
  if (!supportsTelemetry(info) || !Number.isInteger(topic) || !Number.isInteger(index) ||
      index < 0 || !Object.hasOwn(TopicDefinitions, topic) || index > TopicDefinitions[topic].indexMax) return false;
  const profile = getBoardProfile(info);
  if (!profile) return false;
  switch (topic) {
    case Topic.ENCODER_ODOMETRY: return index < profile.resources.encoders;
    case Topic.PLATFORM_ODOMETRY: return true;
    case Topic.TEMPERATURE: return hasBoardSensor(info, 'temperature', index);
    case Topic.IMU: return hasBoardSensor(info, 'imu', index);
    case Topic.MOTOR_FAULTS: return supportsMotorFaults(info, index);
    case Topic.MOTOR_CURRENT: return supportsMotorCurrent(info, index);
    default: return false;
  }
}
