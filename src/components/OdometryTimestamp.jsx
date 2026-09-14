// File: OdometryTimestamp.jsx
// Format acquisition time for display while preserving its microsecond precision.

/** Format Unix time as UTC, or controller uptime as an elapsed duration. */
function formatTimestamp(timestamp, clockMode) {
  const microseconds = BigInt(timestamp);
  const fraction = (microseconds % 1000000n).toString().padStart(6, '0');
  if (clockMode === 1) {
    const date = new Date(Number(microseconds / 1000n));
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, `.${fraction} UTC`);
    }
  } else if (clockMode === 0) {
    const seconds = microseconds / 1000000n;
    const days = seconds / 86400n;
    const hours = ((seconds / 3600n) % 24n).toString().padStart(2, '0');
    const minutes = ((seconds / 60n) % 60n).toString().padStart(2, '0');
    const remaining = (seconds % 60n).toString().padStart(2, '0');
    return `${days ? `${days}d ` : ''}${hours}:${minutes}:${remaining}.${fraction}`;
  }
  return `${microseconds} µs`;
}

/** Show the acquisition timestamp and the clock metadata belonging to this sample. */
export default function OdometryTimestamp({ sample }) {
  if (sample?.timestamp_us == null) return <div>Timestamp: No sample</div>;
  const mode = { 0: 'Controller uptime', 1: 'Unix time' }[sample.clock_mode] || 'Unknown';
  const quality = { 0: 'Not ready', 1: 'Valid', 2: 'Stale' }[sample.clock_quality] || 'Unknown';
  return (
    <div className="odometry-timestamp">
      <div>Timestamp: <output title={`${sample.timestamp_us} µs`}>{formatTimestamp(sample.timestamp_us, sample.clock_mode)}</output></div>
      <div>Clock: {mode} · {quality}</div>
    </div>
  );
}
