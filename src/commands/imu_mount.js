export const mountFields = [
  { key: 'roll_cdeg', label: 'Roll', scale: 100, max: 180 },
  { key: 'pitch_cdeg', label: 'Pitch', scale: 100, max: 90 },
  { key: 'yaw_cdeg', label: 'Yaw', scale: 100, max: 180 },
  { key: 'x_um', label: 'X · Forward', scale: 1000000, max: 10 },
  { key: 'y_um', label: 'Y · Left', scale: 1000000, max: 10 },
  { key: 'z_um', label: 'Z · Up', scale: 1000000, max: 10 },
];

export const mountPresets = [
  ['Flat · component side up', 0, 0, 0],
  ['Right wall · component side right', 90, 0, 0],
  ['Left wall · component side left', -90, 0, 0],
  ['Front wall · component side forward', 0, 90, 0],
  ['Rear wall · component side rearward', 0, -90, 0],
  ['Inverted · component side down', 180, 0, 0],
];

export function mountToWire(values) {
  return mountFields.map(({key, max, scale}, i) => {
    const value = values[i];
    if (!Number.isFinite(value) || Math.abs(value) > max) throw new RangeError(`Invalid mount ${key}`);
    return Math.sign(value) * Math.round(Math.abs(value) * scale);
  });
}

export function readMountDraft(values) {
  const wire = [];
  for (const [i, field] of mountFields.entries()) {
    if (String(values[i]).trim() === '') return null;
    const v = Number(values[i]);
    const scaled = v * field.scale;
    if (!Number.isFinite(v) || Math.abs(v) > field.max ||
        Math.abs(scaled - Math.round(scaled)) > 1e-8) return null;
    wire.push(Math.round(scaled));
  }
  return wire;
}

export function mountValues(mount) {
  return mountFields.map(({ key, scale }) => String(mount[key] / scale));
}

export function sameMount(a, b) {
  return Boolean(a && b && a.configured === b.configured && mountFields.every(({ key }) => a[key] === b[key]));
}

/** Check the operator's last displayed geometry immediately before a deliberate start. */
export async function verifyMount(controller, displayed) {
  if (!controller.supportsImuMounting?.()) return;
  const connection = controller.boardInfo;
  const actual = await controller.get_imu_mount();
  if (!controller.ready || connection !== controller.boardInfo || !sameMount(actual, displayed))
    throw new Error('Mounting changed or readback is unavailable. Read the mount again and confirm the installation.');
}
